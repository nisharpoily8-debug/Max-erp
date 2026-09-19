# Maxerp — Hostinger Node.js Deployment & Supabase PostgreSQL Guide

Production-ready enterprise resource planning (ERP) platform designed for modern small-and-medium businesses, fully optimized for **Hostinger Node.js Web Apps Hosting** backed by **Supabase PostgreSQL**.

---

## 1. Architecture Overview

- **Hosting Environment**: Hostinger Cloud / VPS / Web Apps (Node.js Application Manager)
- **Runtime**: Node.js 20.x or 22.x LTS
- **Server Entry Point**: Single self-contained bundle compiled with `esbuild` to `dist/server.cjs`
- **Database**: PostgreSQL hosted on **Supabase** (direct pooled connection or REST API)
- **Port Management**: Dynamic binding via `process.env.PORT` on host `0.0.0.0`
- **Security**: Strict zero-credential storage in source code; all secrets loaded from environment variables
- **Frontend**: React 19 + Tailwind CSS + Vite SPA

---

## 2. Supabase PostgreSQL Setup

1. Log in to [Supabase](https://supabase.com/) and create a new project.
2. In your Supabase Project Dashboard, navigate to **SQL Editor** -> **New query**.
3. Open `server/schema.sql` from this repository, copy its entire contents, paste it into the editor, and click **Run**. This provisions:
   - `erp_snapshots`: JSONB table for atomic, persistent ERP state synchronization.
   - `erp_sync_events`: Immutable audit trail for all synchronization events.
   - Automatic `updated_at` timestamp triggers and Row Level Security (RLS) policies.
4. Obtain your credentials:
   - **Database Connection String**: Navigate to **Project Settings** -> **Database** -> **Connection string** (select **URI** or **Transaction pooler**, port 6543 or 5432).
   - **API Credentials**: Navigate to **Project Settings** -> **API** to copy the **Project URL** and **anon / service_role** keys.

---

## 3. Hostinger Node.js Web Apps Hosting Configuration

### Step 1: Create the Node.js App in Hostinger
1. Log in to **Hostinger hPanel**.
2. Go to **Websites** -> Select your domain -> **Node.js** (or **Application Manager**).
3. Configure the application settings:
   - **Node.js Version**: `20.x` or `22.x` (LTS recommended)
   - **Application Mode**: `Production`
   - **Application Root**: `public_html` (or your chosen subfolder)
   - **Application Startup File**: `dist/server.cjs`
4. Click **Create** or **Save**.

### Step 2: Upload or Deploy the Repository
You can deploy using Git integration in Hostinger or by uploading a ZIP archive:
- **Via Git**: Connect your Git repository in Hostinger hPanel and trigger a pull.
- **Via File Manager / FTP**: Upload the repository files into your application root directory.

### Step 3: Configure Environment Variables in Hostinger
In your Hostinger Node.js management panel, find **Environment Variables** (or create a `.env` file in the application root with restricted permissions `600`):

```env
NODE_ENV=production
PORT=3000

# Supabase PostgreSQL connection
DATABASE_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# AI Bill Scanner (Optional)
GEMINI_API_KEY=your_gemini_api_key_here

# Domain URL
APP_URL=https://your-domain.com
```

> **Security Note**: Never commit actual database passwords or API keys to Git. Keep your `.env` file in `.gitignore`.

### Step 4: Install Dependencies and Build
In Hostinger's **Terminal** / **SSH** or via the **Run NPM Scripts** UI:

```bash
# 1. Install production and build dependencies
npm install

# 2. Build both frontend (Vite) and backend (esbuild bundle to dist/server.cjs)
npm run build
```

This single build command:
1. Compiles frontend assets into `dist/`.
2. Bundles the Express server into `dist/server.cjs` (CommonJS), cleanly resolving all ESM path imports and dependencies.

### Step 5: Start or Restart the Application
Click **Restart** in Hostinger's Node.js Application Manager, or run:

```bash
npm start
```

---

## 4. Verifying Production Deployment

Once running, verify that your server and database connection are active:

1. **System Health Check**:
   Visit `https://your-domain.com/api/health` in your browser. Expected response:
   ```json
   {
     "status": "ok",
     "service": "Maxerp Business Platform",
     "environment": "production",
     "port": 3000,
     "database": {
       "configured": true,
       "type": "postgres_direct",
       "connected": true,
       "message": "Connected to PostgreSQL database: postgres"
     }
   }
   ```

2. **Database Diagnostics**:
   Visit `https://your-domain.com/api/db/status`. It will safely verify connectivity without exposing credentials.

3. **Front-End Application**:
   Open `https://your-domain.com` to access the full Maxerp interface.

---

## 5. Troubleshooting on Hostinger

- **503 / 502 Bad Gateway**:
  Ensure the application startup file in Hostinger is set to `dist/server.cjs` and that `npm run build` completed successfully.
- **Port Conflict**:
  The server code automatically respects `process.env.PORT` provided by Hostinger's Passenger / reverse proxy. Do not hardcode a port number.
- **PostgreSQL SSL Error**:
  Supabase requires SSL. Ensure your `DATABASE_URL` includes `?sslmode=require`. The server is configured with `ssl: { rejectUnauthorized: false }` for Supabase transaction poolers.
