# Connections Audit From Other Projects

## Source Project Found

- Project: `/Users/patu/Documents/CursorProjects/AItoolsSite`
- Reusable stack: Next.js + Supabase (`@supabase/ssr`, `@supabase/supabase-js`)

## Existing Connection Pattern

### Browser client

- File: `/Users/patu/Documents/CursorProjects/AItoolsSite/lib/supabase-client.ts`
- Uses:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Server client

- File: `/Users/patu/Documents/CursorProjects/AItoolsSite/lib/supabase-server.ts`
- Uses:
  - `createServerClient` from `@supabase/ssr`
  - Next.js cookies for auth session handling

### Admin client

- File: `/Users/patu/Documents/CursorProjects/AItoolsSite/lib/supabase.ts`
- Uses:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Reuse Decision for NurseApp

- Keep current MVP fully local and free (no external connection required).
- For cloud migration, adopt the same Supabase pattern to reduce setup risk and learning cost.
- Never expose service role key in browser code.
- Use row-level security with role/recipient-scoped policies for PHI-sensitive data.

## Migration Sequence (When Needed)

1. Introduce Supabase env vars in `.env.local`.
2. Add browser/server/admin clients matching existing pattern.
3. Move local state objects to Postgres tables.
4. Enable realtime subscriptions for task/chat/alert updates.
5. Add audit log table and role-based access policies.
