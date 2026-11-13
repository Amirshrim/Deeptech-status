# Deep-Tech Reichman — Dietary Preferences

The Deep-Tech club at Reichman University (RUNI) uses this to collect members' dietary needs. Members fill in a short mobile-first form in Hebrew (RTL). Club admins see everything in a password-protected dashboard, then order food for events from it.

- **Stack:** Next.js 15 (App Router), TypeScript, Tailwind v4, PostgreSQL, Prisma 6, zod and jose. It is designed to deploy to **Vercel**, with Postgres from Neon.
- **Public form** at `/`: name, email, optional phone, dietary chips, allergy toggle with details and a life-threatening flag, notes, and consent. Each email has one record, so submitting again with the same email updates it.
- **Admin** at `/admin`:
  - Stat tiles, plus a member table you can search, filter and sort. On mobile the table turns into stacked cards.
  - Edit and delete members.
  - A catering summary (`/admin/summary`) with copy-as-text for WhatsApp and a print view.
  - CSV export (UTF-8 with a BOM, so Excel opens the Hebrew correctly).

---

## Local setup

Requirements: Node 20.9+ and a PostgreSQL database (local, Docker, or a free Neon branch).

```bash
npm install
cp .env.example .env          # then fill in the values (see below)
npm run hash-password         # prints ADMIN_PASSWORD_HASH (the .env-escaped line)
npx prisma migrate dev        # creates the tables
npm run db:seed               # optional: 8 fake members with Hebrew names
npm run dev                   # http://localhost:3000  ·  admin: /admin
```

Quick local Postgres with Docker:

```bash
docker run -d --name dt-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=deeptech_diet -p 5432:5432 postgres:16
```

## Environment variables

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string the app uses at runtime. Use the **pooled** URL on Vercel. |
| `DATABASE_URL_UNPOOLED` | yes | **Direct** (non-pooled) URL that `prisma migrate` uses. Locally it can be the same as `DATABASE_URL`. |
| `ADMIN_EMAILS` | yes | Comma-separated allowlist of admin emails, e.g. `amir@x.com,dana@y.com`. Removing an email revokes that admin's session right away. |
| `ADMIN_PASSWORD_HASH` | yes | bcrypt hash of the shared admin password, from `npm run hash-password`. |
| `SESSION_SECRET` | yes | 32+ random characters used to sign the session cookie. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `CLUB_CONTACT_EMAIL` | recommended | Shown in the privacy note as the address for deletion requests. |

### Creating the admin password hash

```bash
npm run hash-password
```

The command asks for the password twice (input is hidden) and prints two versions:

- **Raw hash**, e.g. `$2b$12$...`: paste this into the **Vercel dashboard** exactly as shown.
- **Escaped line**, e.g. `ADMIN_PASSWORD_HASH=\$2b\$12\$...`: paste this into your **local `.env`**. Next.js expands `$` in `.env` files, so every `$` has to be escaped there.

The app accepts either form, so pasting the escaped version into Vercel works too.

Every admin logs in with their own allowlisted email and the shared password.

## Deploying to Vercel

1. **Push to GitHub** (this folder is already a git repo):
   ```bash
   gh repo create deeptech-diet --private --source . --push
   ```
   Or create an empty repo on github.com and run:
   ```bash
   git remote add origin https://github.com/<you>/deeptech-diet.git
   git push -u origin main
   ```
2. **Import the repo in Vercel:** go to vercel.com/new and pick the repo. Leave the framework preset as Next.js and don't change the build command. Vercel automatically runs the `vercel-build` script, which is `prisma generate && prisma migrate deploy && next build`.
3. **Add a database:** in the project, open **Storage**, choose **Create Database**, then **Neon (Postgres)** and connect it to the project. The integration sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED` for you. With any other Postgres provider, set both variables yourself.
4. **Add the rest of the env vars** under **Settings → Environment Variables**: `ADMIN_EMAILS`, `ADMIN_PASSWORD_HASH` (raw), `SESSION_SECRET` and `CLUB_CONTACT_EMAIL`.
5. **Deploy**, or redeploy if the first deploy ran before the env vars existed. Migrations run during the build.
6. *Optional:* seed test data against the production database from your machine:
   ```bash
   DATABASE_URL="<neon url>" DATABASE_URL_UNPOOLED="<neon direct url>" npm run db:seed
   ```
   If you do this, delete the fake members afterwards from the dashboard.

Health check: `GET /api/health` returns `{ "ok": true }`.

### Changing the database schema later

```bash
# edit prisma/schema.prisma, then:
npx prisma migrate dev --name describe_change
git commit -am "..." && git push   # Vercel applies the migration on the next build
```

## Security & privacy notes

Allergies and celiac disease are health data, so the app is built to expose as little as possible:

- The public endpoint (`POST /api/members`) can only create or update a record, and it echoes back only what the submitter just sent. Member data can only be read through admin pages and `/api/admin/*`. Both require a valid session and are checked twice: once in `middleware.ts` and again in each page or route.
- **Session cookie:** a signed HS256 JWT. The cookie is `httpOnly`, `Secure` in production and `SameSite=Lax`, and expires after 7 days. Requests that change data also check the `Origin` header.
- **Rate limits** are stored in Postgres, so they hold across Vercel's serverless instances:
  - login: 5 per minute per IP;
  - form: 10 submissions per 10 minutes per IP.

  A hidden honeypot field also screens out bots.
- Login failures always show the same generic message. bcrypt runs even for emails that aren't on the allowlist, so response timing doesn't reveal who is.
- There is no analytics or tracking. Text fonts are self-hosted by `next/font`. The only third-party request is the Material Symbols icon stylesheet from Google Fonts.
- **CSV export:** cells starting with `= + - @` are escaped so spreadsheets don't run them as formulas. Phone numbers are wrapped as `="..."` so Excel keeps the leading `0` and `+`.
- **Known trade-off (part of the spec):** a record is keyed only by email, with no verification. Anyone who knows a member's email can overwrite that member's preferences. If that matters for you, add an email magic-link confirmation.

## Project structure

```
prisma/                 schema, migration, seed (+ seed-data.ts)
scripts/hash-password.mjs
src/middleware.ts       protects /admin/* and /api/admin/*
src/app/page.tsx        public form page
src/app/api/members     public upsert endpoint
src/app/api/admin/*     login, logout, members (GET/PATCH/DELETE), export (CSV)
src/app/admin/login     login screen
src/app/admin/(protected)/        dashboard + summary (catering)
src/components/         MemberForm, badges, header, icons
src/lib/                zod schemas, session, auth, rate limit, CSV, summary text
```

## Design

The design tokens match the RUEC CRM: navy `#223a8e` for entry screens, white cards with a 6px radius, flat UI with no shadows, and magenta only as an accent. The fonts are Assistant, Open Sans and IBM Plex Mono, with Material Symbols for icons. Layout uses logical CSS properties throughout, so RTL renders correctly. Badge text uses slightly darker shades of the good, warn and bad tokens so every text and background pair meets WCAG AA (4.5:1).

Replace `public/logo.svg` with the real Deep-Tech Reichman logo. It is displayed at 44×44 on navy backgrounds.
