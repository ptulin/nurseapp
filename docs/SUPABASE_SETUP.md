# Supabase Free-Tier Setup (Optional)

Local mode works without cloud. Use this when you want shared family/caregiver data.

## 1. Create project (free tier)

- Create Supabase project.
- Copy Project URL and anon key.

## 2. Apply SQL migrations

Run in Supabase SQL editor in order:

1. `supabase/migrations/001_init.sql`
2. `supabase/migrations/002_rls.sql`

## 3. Configure app runtime

Edit `src/runtime-config.js`:

```js
export const runtimeConfig = {
  dataMode: "supabase",
  supabase: {
    url: "https://YOUR_PROJECT.supabase.co",
    anonKey: "YOUR_ANON_KEY",
    householdId: "demo-household",
  },
};
```

## 4. Security notes

- Never put `service_role` keys in browser code.
- Keep RLS enabled for all PHI tables.
- Use authenticated users and household membership policies.

## 5. Fallback behavior

If Supabase is unavailable or misconfigured, app automatically falls back to local mode for continuity.
