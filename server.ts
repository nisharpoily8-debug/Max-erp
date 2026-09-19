import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  getSupabase,
  getPgPool,
  checkDatabaseHealth,
  initializeDatabaseTables,
} from './server/supabase.js';

// Load environment variables from .env if present
dotenv.config();

// Port configuration: Hostinger Node.js dynamically sets process.env.PORT.
// In the AI Studio container environment (where APPLET_ID is present and NGINX routes to port 3000),
// port 3000 is strictly required. In production environments like Hostinger, process.env.PORT is used.
const PORT = process.env.APPLET_ID
  ? 3000
  : (Number(process.env.PORT) || 3000);
const HOST = '0.0.0.0';

// Lazy Gemini AI instance
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Basic middleware
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Request logger in non-production
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        console.log(`[API] ${req.method} ${req.path}`);
      }
      next();
    });
  }

  // =========================================================================
  // API Routes
  // =========================================================================

  // 1. Health & Environment Status Check
  app.get('/api/health', async (req, res) => {
    const dbHealth = await checkDatabaseHealth();
    res.json({
      status: 'ok',
      service: 'Maxerp Business Platform',
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      database: dbHealth,
      aiAvailable: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // 2. Database Status Endpoint (Safe for diagnostics, no passwords leaked)
  app.get('/api/db/status', async (req, res) => {
    try {
      const status = await checkDatabaseHealth();
      res.json({
        success: status.connected,
        status,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  });

  // 3. Initialize PostgreSQL Tables in Supabase
  app.post('/api/db/init', async (req, res) => {
    try {
      const result = await initializeDatabaseTables();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  });

  // 4. Retrieve ERP Snapshot from Supabase PostgreSQL
  app.get('/api/erp/snapshot', async (req, res) => {
    const pool = getPgPool();
    const supabase = getSupabase();

    if (pool) {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(
            'SELECT * FROM erp_snapshots WHERE id = $1 LIMIT 1',
            ['default_org']
          );
          if (result.rows.length > 0) {
            return res.json({ success: true, snapshot: result.rows[0] });
          }
          return res.json({ success: true, snapshot: null, message: 'No snapshot recorded yet.' });
        } finally {
          client.release();
        }
      } catch (err: any) {
        console.error('[PostgreSQL Snapshot Read Error]:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
    } else if (supabase) {
      try {
        const { data, error } = await supabase
          .from('erp_snapshots')
          .select('*')
          .eq('id', 'default_org')
          .single();

        if (error && error.code !== 'PGRST116') {
          return res.status(500).json({ success: false, error: error.message });
        }
        return res.json({ success: true, snapshot: data || null });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    } else {
      return res.status(503).json({
        success: false,
        message: 'Supabase PostgreSQL database is not configured. Set DATABASE_URL or SUPABASE_URL in environment.',
      });
    }
  });

  // 5. Sync / Persist ERP Snapshot to Supabase PostgreSQL
  app.post('/api/erp/sync', async (req, res) => {
    const {
      company,
      partners,
      products,
      salesOrders,
      purchaseOrders,
      movements,
      journalEntries,
      deliveryNotes,
      auditLogs,
      actor,
    } = req.body;

    const pool = getPgPool();
    const supabase = getSupabase();

    if (pool) {
      try {
        const client = await pool.connect();
        try {
          const upsertSql = `
            INSERT INTO erp_snapshots (
              id, company_data, partners, products, sales_orders,
              purchase_orders, inventory_movements, journal_entries,
              delivery_notes, audit_logs, updated_at
            ) VALUES (
              'default_org', $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
              company_data = EXCLUDED.company_data,
              partners = EXCLUDED.partners,
              products = EXCLUDED.products,
              sales_orders = EXCLUDED.sales_orders,
              purchase_orders = EXCLUDED.purchase_orders,
              inventory_movements = EXCLUDED.inventory_movements,
              journal_entries = EXCLUDED.journal_entries,
              delivery_notes = EXCLUDED.delivery_notes,
              audit_logs = EXCLUDED.audit_logs,
              updated_at = CURRENT_TIMESTAMP
            RETURNING updated_at;
          `;

          const result = await client.query(upsertSql, [
            JSON.stringify(company || {}),
            JSON.stringify(partners || []),
            JSON.stringify(products || []),
            JSON.stringify(salesOrders || []),
            JSON.stringify(purchaseOrders || []),
            JSON.stringify(movements || []),
            JSON.stringify(journalEntries || []),
            JSON.stringify(deliveryNotes || []),
            JSON.stringify(auditLogs || []),
          ]);

          // Record sync event
          await client.query(
            'INSERT INTO erp_sync_events (event_type, actor_id, actor_name, payload) VALUES ($1, $2, $3, $4)',
            [
              'ERP_STATE_SYNCED',
              actor?.id || 'system',
              actor?.name || 'Sync Agent',
              JSON.stringify({
                orderCount: salesOrders?.length || 0,
                productCount: products?.length || 0,
                partnerCount: partners?.length || 0,
              }),
            ]
          );

          return res.json({
            success: true,
            updatedAt: result.rows[0]?.updated_at,
            message: 'Synced successfully to Supabase PostgreSQL database.',
          });
        } finally {
          client.release();
        }
      } catch (err: any) {
        console.error('[PostgreSQL Snapshot Sync Error]:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
    } else if (supabase) {
      try {
        const payload = {
          id: 'default_org',
          company_data: company || {},
          partners: partners || [],
          products: products || [],
          sales_orders: salesOrders || [],
          purchase_orders: purchaseOrders || [],
          inventory_movements: movements || [],
          journal_entries: journalEntries || [],
          delivery_notes: deliveryNotes || [],
          audit_logs: auditLogs || [],
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('erp_snapshots')
          .upsert(payload, { onConflict: 'id' });

        if (error) {
          return res.status(500).json({ success: false, error: error.message });
        }

        return res.json({
          success: true,
          updatedAt: payload.updated_at,
          message: 'Synced successfully to Supabase via REST API.',
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    } else {
      return res.status(503).json({
        success: false,
        message: 'Supabase PostgreSQL database is not configured. Set DATABASE_URL or SUPABASE_URL in environment.',
      });
    }
  });

  // 6. Gemini Server-Side OCR and Document Processing
  app.post('/api/ai/scan-bill', async (req, res) => {
    try {
      const ai = getAIClient();
      if (!ai) {
        return res.status(503).json({
          success: false,
          error: 'GEMINI_API_KEY is not configured on the server.',
        });
      }

      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({
          success: false,
          error: 'Image data is required.',
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are an expert ERP invoice/bill optical parser. Analyze this vendor document and extract key fields in valid JSON matching this schema:
                {
                  "vendorName": string,
                  "billNumber": string,
                  "billDate": string (YYYY-MM-DD),
                  "dueDate": string (YYYY-MM-DD),
                  "subtotal": number,
                  "taxAmount": number,
                  "totalAmount": number,
                  "notes": string,
                  "items": [
                    { "description": string, "quantity": number, "unitPrice": number, "total": number }
                  ]
                }
                Return ONLY the raw JSON object without markdown formatting.`,
              },
              {
                inlineData: {
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                  mimeType: mimeType || 'image/jpeg',
                },
              },
            ],
          },
        ],
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error('[AI Bill Scan Error]:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // Frontend Serving / Vite Integration
  // =========================================================================

  if (process.env.NODE_ENV !== 'production') {
    // Development mode: Use Vite as middleware
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve pre-built static assets from /dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start HTTP Server
  httpServer.listen(PORT, HOST, () => {
    console.log(`=========================================`);
    console.log(`Maxerp Server running on http://${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Binding: ${HOST}:${PORT} (process.env.PORT = ${process.env.PORT || 'default 3000'})`);
    console.log(`=========================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
