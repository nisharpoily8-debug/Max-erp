var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");

// server/supabase.ts
var import_supabase_js = require("@supabase/supabase-js");
var import_pg = __toESM(require("pg"), 1);
var { Pool } = import_pg.default;
var supabaseClient = null;
var pgPool = null;
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = (0, import_supabase_js.createClient)(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return supabaseClient;
}
function getPgPool() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    return null;
  }
  if (!pgPool) {
    pgPool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
        // Required for Supabase SSL connections
      },
      max: 10,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 5e3
    });
    pgPool.on("error", (err) => {
      console.error("[PostgreSQL Pool Error]:", err.message);
    });
  }
  return pgPool;
}
async function checkDatabaseHealth() {
  const pool = getPgPool();
  if (pool) {
    try {
      const client = await pool.connect();
      try {
        const res = await client.query("SELECT current_database(), version()");
        return {
          configured: true,
          type: "postgres_direct",
          connected: true,
          message: `Connected to PostgreSQL database: ${res.rows[0]?.current_database || "supabase"}`
        };
      } finally {
        client.release();
      }
    } catch (err) {
      return {
        configured: true,
        type: "postgres_direct",
        connected: false,
        message: `PostgreSQL connection error: ${err.message}`
      };
    }
  }
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from("erp_snapshots").select("id").limit(1);
      if (error && error.code !== "PGRST116" && !error.message.includes("does not exist")) {
        return {
          configured: true,
          type: "supabase_rest",
          connected: false,
          message: `Supabase query error: ${error.message}`
        };
      }
      return {
        configured: true,
        type: "supabase_rest",
        connected: true,
        message: "Supabase REST API connected successfully."
      };
    } catch (err) {
      return {
        configured: true,
        type: "supabase_rest",
        connected: false,
        message: `Supabase connection error: ${err.message}`
      };
    }
  }
  return {
    configured: false,
    type: "none",
    connected: false,
    message: "Database not yet configured. Set SUPABASE_URL & SUPABASE_ANON_KEY or DATABASE_URL in environment variables."
  };
}
async function initializeDatabaseTables() {
  const pool = getPgPool();
  if (!pool) {
    return {
      success: false,
      message: "Direct PostgreSQL pool is not available. Please provide DATABASE_URL in environment variables."
    };
  }
  const initSql = `
    CREATE TABLE IF NOT EXISTS erp_snapshots (
      id VARCHAR(64) PRIMARY KEY DEFAULT 'default_org',
      company_data JSONB NOT NULL,
      partners JSONB NOT NULL DEFAULT '[]'::jsonb,
      products JSONB NOT NULL DEFAULT '[]'::jsonb,
      sales_orders JSONB NOT NULL DEFAULT '[]'::jsonb,
      purchase_orders JSONB NOT NULL DEFAULT '[]'::jsonb,
      inventory_movements JSONB NOT NULL DEFAULT '[]'::jsonb,
      journal_entries JSONB NOT NULL DEFAULT '[]'::jsonb,
      delivery_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
      audit_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS erp_sync_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(64) NOT NULL,
      entity_id VARCHAR(128),
      payload JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    const client = await pool.connect();
    try {
      await client.query(initSql);
      return {
        success: true,
        message: "Database tables verified and initialized successfully in Supabase PostgreSQL."
      };
    } finally {
      client.release();
    }
  } catch (err) {
    return {
      success: false,
      message: `Failed to initialize tables: ${err.message}`
    };
  }
}

// server.ts
import_dotenv.default.config();
var PORT = process.env.APPLET_ID ? 3e3 : Number(process.env.PORT) || 3e3;
var HOST = "0.0.0.0";
var aiClient = null;
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new import_genai.GoogleGenAI({ apiKey });
  }
  return aiClient;
}
async function startServer() {
  const app = (0, import_express.default)();
  const httpServer = import_http.default.createServer(app);
  app.use(import_express.default.json({ limit: "25mb" }));
  app.use(import_express.default.urlencoded({ extended: true, limit: "25mb" }));
  if (process.env.NODE_ENV !== "production") {
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) {
        console.log(`[API] ${req.method} ${req.path}`);
      }
      next();
    });
  }
  app.get("/api/health", async (req, res) => {
    const dbHealth = await checkDatabaseHealth();
    res.json({
      status: "ok",
      service: "Maxerp Business Platform",
      environment: process.env.NODE_ENV || "development",
      port: PORT,
      database: dbHealth,
      aiAvailable: Boolean(process.env.GEMINI_API_KEY),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime()
    });
  });
  app.get("/api/db/status", async (req, res) => {
    try {
      const status = await checkDatabaseHealth();
      res.json({
        success: status.connected,
        status
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  app.post("/api/db/init", async (req, res) => {
    try {
      const result = await initializeDatabaseTables();
      res.json(result);
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  app.get("/api/erp/snapshot", async (req, res) => {
    const pool = getPgPool();
    const supabase = getSupabase();
    if (pool) {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(
            "SELECT * FROM erp_snapshots WHERE id = $1 LIMIT 1",
            ["default_org"]
          );
          if (result.rows.length > 0) {
            return res.json({ success: true, snapshot: result.rows[0] });
          }
          return res.json({ success: true, snapshot: null, message: "No snapshot recorded yet." });
        } finally {
          client.release();
        }
      } catch (err) {
        console.error("[PostgreSQL Snapshot Read Error]:", err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
    } else if (supabase) {
      try {
        const { data, error } = await supabase.from("erp_snapshots").select("*").eq("id", "default_org").single();
        if (error && error.code !== "PGRST116") {
          return res.status(500).json({ success: false, error: error.message });
        }
        return res.json({ success: true, snapshot: data || null });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    } else {
      return res.status(503).json({
        success: false,
        message: "Supabase PostgreSQL database is not configured. Set DATABASE_URL or SUPABASE_URL in environment."
      });
    }
  });
  app.post("/api/erp/sync", async (req, res) => {
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
      actor
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
            JSON.stringify(auditLogs || [])
          ]);
          await client.query(
            "INSERT INTO erp_sync_events (event_type, actor_id, actor_name, payload) VALUES ($1, $2, $3, $4)",
            [
              "ERP_STATE_SYNCED",
              actor?.id || "system",
              actor?.name || "Sync Agent",
              JSON.stringify({
                orderCount: salesOrders?.length || 0,
                productCount: products?.length || 0,
                partnerCount: partners?.length || 0
              })
            ]
          );
          return res.json({
            success: true,
            updatedAt: result.rows[0]?.updated_at,
            message: "Synced successfully to Supabase PostgreSQL database."
          });
        } finally {
          client.release();
        }
      } catch (err) {
        console.error("[PostgreSQL Snapshot Sync Error]:", err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
    } else if (supabase) {
      try {
        const payload = {
          id: "default_org",
          company_data: company || {},
          partners: partners || [],
          products: products || [],
          sales_orders: salesOrders || [],
          purchase_orders: purchaseOrders || [],
          inventory_movements: movements || [],
          journal_entries: journalEntries || [],
          delivery_notes: deliveryNotes || [],
          audit_logs: auditLogs || [],
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        const { error } = await supabase.from("erp_snapshots").upsert(payload, { onConflict: "id" });
        if (error) {
          return res.status(500).json({ success: false, error: error.message });
        }
        return res.json({
          success: true,
          updatedAt: payload.updated_at,
          message: "Synced successfully to Supabase via REST API."
        });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    } else {
      return res.status(503).json({
        success: false,
        message: "Supabase PostgreSQL database is not configured. Set DATABASE_URL or SUPABASE_URL in environment."
      });
    }
  });
  app.post("/api/ai/scan-bill", async (req, res) => {
    try {
      const ai = getAIClient();
      if (!ai) {
        return res.status(503).json({
          success: false,
          error: "GEMINI_API_KEY is not configured on the server."
        });
      }
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({
          success: false,
          error: "Image data is required."
        });
      }
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
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
                Return ONLY the raw JSON object without markdown formatting.`
              },
              {
                inlineData: {
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
                  mimeType: mimeType || "image/jpeg"
                }
              }
            ]
          }
        ]
      });
      const text = response.text || "";
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      return res.json({ success: true, data: parsed });
    } catch (err) {
      console.error("[AI Bill Scan Error]:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await (0, import_vite.createServer)({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  httpServer.listen(PORT, HOST, () => {
    console.log(`=========================================`);
    console.log(`Maxerp Server running on http://${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Binding: ${HOST}:${PORT} (process.env.PORT = ${process.env.PORT || "default 3000"})`);
    console.log(`=========================================`);
  });
}
startServer().catch((err) => {
  console.error("Fatal Server Startup Error:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
