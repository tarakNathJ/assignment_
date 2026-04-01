# QueryMind — Conversational BI Platform

A text-to-SQL platform that lets you connect your PostgreSQL database, ask questions in plain English, and get instant answers with auto-generated visualizations.

---

## Features

| Feature | Details |
|---|---|
| **Pre-seeded Demo DB** | Faker.js-generated e-commerce data — 10K+ orders, 12 months of history, ready to query |
| **Custom DB Connection** | Connect any PostgreSQL database via host/port/user/password/SSL |
| **Schema Introspection** | Auto-discovers tables, columns, data types, foreign keys, and sample values |
| **Natural Language Queries** | Ask in plain English — get SQL + results instantly |
| **Follow-up Context** | Conversation history fed to the LLM for contextual follow-up questions |
| **Auto Visualizations** | Bar, Line, Pie, Scatter, and Table views — chart type auto-selected per result |
| **Manual Chart Switching** | Switch chart types with a single click |
| **Ad-hoc Dashboards** | Save any result as a widget, build multi-widget dashboards |
| **Shareable Dashboards** | Every dashboard gets a public share link (read-only) |
| **Query Safety** | Blocks `DROP`, `DELETE`, `TRUNCATE`, `ALTER` etc. Row limit enforced |
| **Multi-LLM Support** | OpenAI, Anthropic, Google Gemini, Groq |
| **User-managed API Keys** | Keys stored in browser session — never sent to our servers |
| **Retry & Fallback** | Automatic 3-attempt retry with backoff for LLM failures |
| **Basic Auth** | Fixed username/password login with server-side sessions |

---

## Tech Stack

**Backend** — `Node.js / Express / TypeScript`  
**Frontend** — `React / TypeScript / Vite`  
**Database** — `PostgreSQL` (via `pg` / `node-postgres`)  
**Charts** — `Recharts`  
**LLMs** — OpenAI SDK, Anthropic SDK, Google AI SDK, Groq (OpenAI-compat)  
**Schema Seeding** — `@faker-js/faker`

---

## Quick Start

### Prerequisites

- Node.js 18+
- A PostgreSQL instance (local, Supabase, Neon, Railway, etc.)

### 1. Clone & Install

```bash
git clone <repo-url>
cd five

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Server Environment

Copy the example env file and fill in your values:

```bash
cd server
cp .env.example .env
```

`.env` variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | **Yes** | Demo database connection string (PostgreSQL) |
| `PORT` | No | Server port (default `3001`) |
| `NODE_ENV` | No | `development` or `production` |
| `SESSION_SECRET` | **Yes** | Random secret for session cookies |
| `CORS_ORIGIN` | **Yes** | Frontend URL, e.g. `http://localhost:5173` |
| `GROQ_API_KEY` | No | Optional — lets Groq work without UI key entry |
| `MAX_RESULT_ROWS` | No | Row cap per query (default `500`) |
| `QUERY_TIMEOUT_MS` | No | Query timeout in ms (default `10000`) |
| `DEMO_DB_URL` | **Yes** | Same as `DATABASE_URL` — used for the demo connection |

### 3. Seed the Demo Database

```bash
cd server

# Create schema (customers, products, orders, order_items, categories, reviews)
npm run db:schema

# Seed data (10K+ orders, 12 months of history via Faker.js)
npm run db:seed
```

> **Note:** Seeding takes ~30–60 seconds. It's idempotent — safe to run again.

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 3001)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

**Demo credentials:**
- Username: `admin`
- Password: `admin`

---

## Usage Guide

### 1. Connect a Database

On the **Connect** page, choose:
- **Demo Database** — one-click, instantly pre-seeded and ready
- **Custom PostgreSQL** — provide host, port, database, username, password, SSL toggle

### 2. Configure AI Provider

In the **Workspace**, click the ⚙️ Settings icon to set your LLM:

| Provider | Models |
|---|---|
| OpenAI | gpt-4o, gpt-4-turbo, gpt-3.5-turbo |
| Anthropic | claude-3-5-sonnet, claude-3-opus |
| Google Gemini | gemini-1.5-pro, gemini-1.5-flash |
| Groq | llama-3.3-70b-versatile, mixtral-8x7b |

Your API key is stored in browser `localStorage` only — never sent to our backend.

### 3. Ask Questions

Type natural language questions in the chat input:

```
"What were the top 5 products by revenue last month?"
"Show me order count by day for the past 30 days"
"Which customers placed more than 10 orders but never left a review?"
"Compare revenue by category this quarter vs last quarter"
"What is the average order value by customer segment?"
```

Results appear as tables or charts in the right panel.

### 4. Save to Dashboard

1. After running a query, click **"Save to Dashboard"**
2. Choose an existing dashboard or create a new one
3. The result is saved as a widget
4. Navigate to **Dashboards** to view and arrange widgets

### 5. Share Dashboards

From the Dashboards page, click the **⋮** menu → **Share** to get a shareable read-only link.

---

## Project Structure

```
five/
├── client/                    # React + TypeScript frontend
│   └── src/
│       ├── api/               # API client functions
│       ├── components/
│       │   ├── charts/        # ChartRenderer (Recharts)
│       │   ├── dashboard/     # Widget grid, widget card
│       │   ├── layout/        # AppShell, Sidebar, TopNav
│       │   ├── query/         # ResultTable, ChartToolbar
│       │   ├── schema/        # SchemaTree
│       │   └── ui/            # Button, Input, Badge, Modals
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── ConnectPage.tsx
│       │   ├── WorkspacePage.tsx
│       │   ├── DashboardListPage.tsx
│       │   ├── DashboardEditorPage.tsx
│       │   └── SharePage.tsx
│       ├── lib/               # LLM settings helpers
│       ├── styles/            # global.css (Tailwind v4 + CSS vars)
│       └── types/             # Domain type definitions
│
└── server/                    # Express + TypeScript backend
    └── src/
        ├── config/            # env.ts (Zod-validated env vars)
        ├── db/
        │   ├── schema.ts      # CREATE TABLE migrations
        │   └── seed.ts        # Faker.js data seeder
        ├── handlers/          # Express route handlers
        ├── middleware/        # Auth guard, error handler
        ├── routes/            # Route definitions
        ├── services/
        │   ├── llm/           # LLM providers + router + prompt builders
        │   ├── chart-suggestion.ts
        │   ├── connection-registry.ts
        │   ├── dashboard-store.ts
        │   ├── query-runner.ts
        │   ├── schema-cache.ts
        │   ├── schema-introspection.ts
        │   └── sql-guard.ts   # Security: block destructive SQL
        └── types/             # Server-side type definitions
```

---

## Demo Database Schema

Seeded via `Faker.js` — 6 tables, ~10K orders spanning 12 months:

```
customers      (id, name, email, phone, address, city, state, zip, country, segment)
categories     (id, name, description)
products       (id, category_id, name, sku, price, cost, description, inventory)
orders         (id, customer_id, status, total, shipping_state, created_at, delivered_at)
order_items    (id, order_id, product_id, quantity, unit_price)
reviews        (id, customer_id, product_id, rating, title, body, created_at)
```

---

## Security

- All incoming SQL is validated by `sql-guard.ts` — blocks `INSERT`, `UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, `ALTER`, `GRANT`, `REVOKE`, `COPY`, `VACUUM` and more
- Only `SELECT` and `WITH ... SELECT` queries are allowed
- Row cap enforced via `LIMIT` injection (configurable, default 500)
- Query timeout enforced at the DB connection level
- LLM API keys stored client-side only — never persisted server-side

---

## Assignment Compliance

| Requirement | Status |
|---|---|
| Pre-seeded demo database (Faker.js, 10K+ orders, 12 months) | ✅ |
| Custom PostgreSQL connection | ✅ |
| One-click schema analysis | ✅ |
| Natural language queries | ✅ |
| Follow-up questions with context | ✅ |
| Auto-generated visualizations (bar, line, pie, scatter, table) | ✅ |
| Manual chart type switching | ✅ |
| Ad-hoc dashboards — save widgets | ✅ |
| Shareable dashboard links | ✅ |
| Query safety (no destructive SQL) | ✅ |
| Row limit enforcement | ✅ |
| Query timeout | ✅ |
| Basic authentication | ✅ |
| LLM: OpenAI | ✅ |
| LLM: Anthropic | ✅ |
| LLM: Google Gemini | ✅ |
| LLM: Groq | ✅ |
| User-provided API keys (no backend storage) | ✅ |
| Retry and fallback for LLM errors | ✅ |
| No Vanna AI / managed text-to-SQL services | ✅ |
| No Metabase / Superset embedding | ✅ |
| Raw LLM calls for SQL generation | ✅ |
| PostgreSQL only | ✅ |

---

## Deployment

### Vercel (Frontend)

```bash
cd client
npm run build
# deploy dist/ to Vercel
```

### Railway / Render (Backend)

Set environment variables, then:

```bash
cd server
npm run build
npm start
```

Use a managed PostgreSQL (Supabase, Neon, Railway) for the demo database. Run `npm run db:schema && npm run db:seed` once on the hosted DB.
