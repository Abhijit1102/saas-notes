# Notes SaaS — Multi-tenant Notes App

## 🚀 Summary
This is a **multi-tenant SaaS Notes application** built with **Next.js App Router** + **Prisma** + **PostgreSQL**.  
It uses **shared-schema multi-tenancy** with role-based access and subscription gating:

- **Free plan** → up to 3 notes per tenant
- **Pro plan** → unlimited notes
- **Admin users** can manage tenant plans
- **Member users** can create and manage their own notes

Designed for easy **local development** and **deployment to Vercel**.

---

## 🏗 Multi-Tenancy Model
- **Approach**: Shared schema — every `User`, `Note`, etc. row has a `tenantId`.
- **Why**: Simpler queries, easier seeding, good fit for hackathons/tests.

---

## 👥 Predefined Tenants & Accounts
Seeded with two tenants and demo users:

### Tenant: `acme`
- **Admin** → `admin@acme.test` / `password`
- **Member** → `user@acme.test` / `password`

### Tenant: `globex`
- **Admin** → `admin@globex.test` / `password`
- **Member** → `user@globex.test` / `password`

All passwords are hashed with **bcrypt**.

---

## 🔌 API Endpoints
All APIs are exposed at **root paths** for simplicity:

### Health
- `GET /health`  
  → `{ "status": "ok" }`

### Authentication
- `POST /auth/login`  
  Body: `{ "email": "...", "password": "..." }`  
  → `{ token, user }`  
  (Use `Authorization: Bearer <token>` for all subsequent calls)

### Notes
- `GET /notes` → list all notes for caller’s tenant
- `POST /notes` → create note (fails if tenant plan = FREE and already has 3 notes)
- `GET /notes/:id` → get note by ID (tenant-isolated)
- `PUT /notes/:id` → update note
- `DELETE /notes/:id` → delete note

### Tenant Management
- `POST /tenants/:slug/upgrade` → Admin only, upgrades tenant to **Pro** (removes note limit)

---

## 📦 Run Locally

1. Clone repo and install deps:
   ```bash
   npm install
  ```
2. Create .env:
   ```bash
   DATABASE_URL="postgresql://user:pass@localhost:5432/notesdb"
   JWT_SECRET="supersecret123"
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

4. Seed database:
   ```bash
  npx prisma migrate dev --name init
   ```

5. Start dev server:
   ```bash
   npm run dev
   ```
6. `Visit: http://localhost:3000`

## 🔒 Security Notes

- Passwords stored using bcrypt (10 salt rounds).

- JWT signed with JWT_SECRET (use long random string in production).

- CORS currently set to * for testing; restrict origins in production.

## ✅ Validation Checklist

Automated tests will check:

- GET /health returns ok

- Can log in with each predefined account

- Tenant isolation enforced (cannot read others’ notes)

- Free tenant limited to 3 notes

- After `/tenants/:slug/upgrade`, tenant can create unlimited notes

- Non-admin cannot upgrade tenant.

## 🗂 Project Structure

/saas-notes
 ├── /prisma
 │    ├── schema.prisma          # Prisma schema
 │    └── seed.ts                # Seeds tenants, users, notes
 ├── /src
 │    ├── /app
 │    │    ├── page.tsx          # Login/dashboard UI
 │    │    ├── api
 │    │    │    ├── auth
 │    │    │    │    └── login/route.ts
 │    │    │    ├── notes
 │    │    │    │    ├── route.ts
 │    │    │    │    └── [id]/route.ts
 │    │    │    ├── tenants
 │    │    │    │    └── [slug]/upgrade/route.ts
 │    │    │    └── health/route.ts
 │    │    └── components        # Reusable UI components
 │    └── /lib
 │         ├── auth.ts           # JWT helpers
 │         └── prisma.ts         # Prisma client
 ├── package.json
 ├── tsconfig.json
 └── README.md

## 🧪 Example Requests
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.test","password":"password"}'

```

## Create Note

```bash
curl -X POST http://localhost:3000/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Hello","content":"World"}'

```

---
      

   


