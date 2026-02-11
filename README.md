# 📘 LoadRider Backend – Database Migrations & Seeders (Knex + Objection + TypeScript)

This project uses [Knex.js](https://knexjs.org/) and [Objection.js](https://vincit.github.io/objection.js/) with TypeScript for database schema management. Custom CLI via `src/knex.ts` is used to run migration and seeding commands.

---

## 📦 Prerequisites

- Node.js
- PostgreSQL
- A `.env` file containing the `DATABASE_URL`
- `ts-node` (installed globally or used via `npx`)

- Ensure you have `ts-node`, `knex`, and `typescript` installed.

- for env check .env.example file.

## 🚀 Available Commands

All commands are run using `ts-node src/knex.ts <command>`.

### 🔧 Run Migrations

```bash
npx knex --knexfile src/database/knexfile.ts migrate:latest

```

### 🛠 Command to Create a New Migration

Use the following command to create a new migration file:

```bash
npx knex --knexfile src/knexfile.ts migrate:make <migration_name>
```

### 📌 Additional Migration Commands

```bash

Action                   Command

Run                      Migrations npx knex --knexfile src/database/knexfile.ts migrate:latest
Rollback  Migration      npx knex --knexfile src/database/knexfile.ts migrate:rollback

📊 **Database Schema**

The complete database schema is available in [`schema.dbml`](./schema.dbml).  
You can visualize it easily using [dbdiagram.io](https://dbdiagram.io/d) — just upload the file or paste its contents