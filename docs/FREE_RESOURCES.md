# Free Resource Stack

Goal: keep development and early validation fully free.

## Local Development (No Cost)

- Runtime: Node.js (already available)
- Testing: Node built-in test runner (`node --test`)
- Local server: included `scripts/serve.mjs`
- Storage: browser localStorage (MVP)

## Free Cloud Path (Optional, after local validation)

- Frontend hosting: Cloudflare Pages (free tier) or Vercel Hobby
- Auth + DB + file storage + realtime: Supabase free tier
- Analytics: PostHog free tier
- Error monitoring: Sentry free tier
- Transactional email: Resend free tier

## Design and Product Research (Free)

- Market reports: publicly available executive summaries (NAC/AARP/BLS)
- Competitor tracking: public pricing + docs pages
- Rapid UI planning: Figma free tier or pen-and-paper wireframes

## Cost Guardrails

- Stay local-first until pilot users are ready.
- Avoid paid SMS in MVP unless strictly required.
- Use one codebase (mobile-first web) to avoid duplicate app costs.
- Keep media uploads image-only in MVP to control storage and complexity.
