# NurseApp (MVP)

Mobile-first web app for caregiver-family coordination.

## MVP Scope

- Multi-role switch: Family, Caregiver, Admin
- Multi-recipient support with clear separation
- Care-plan-driven tasks with required category
- Timeline with done/missed states
- Immediate alerts + configurable escalation windows
- Optional evidence on completion
- Optional second confirmation for high-risk meds
- In-app chat: text + photo
- OCR-text import scaffold (preview and apply)
- Local audit log with JSON export
- Supabase auth scaffold (email/password + household bootstrap)
- Supabase realtime refresh scaffold (polling)
- Image guardrails (image-only, 2MB max upload)
- Alert delivery center with channel tracking + acknowledgement
- Free/Pro plan model with recipient/channel feature gates
- Local-first mode (no paid services required)

## Run Locally (Free)

```bash
npm test
npm start
```

Open `http://127.0.0.1:8788`.

## Project Structure

- `index.html`, `styles.css`, `src/app.js`: MVP UI and behavior
- `src/core.js`: testable core rules (alerts/validation/roles)
- `src/auth/supabase-auth.js`: lightweight Supabase auth helpers
- `src/importer.js`: OCR-text parsing utility for schedule import
- `src/data/*`: data adapters (`local` + `supabase` with local fallback)
- `src/runtime-config.js`: runtime mode selection
- `tests/core.test.js`: unit tests
- `docs/PRODUCT_PLAN.md`: market-informed plan and delivery roadmap
- `docs/FREE_RESOURCES.md`: free stack/options
- `docs/CONNECTIONS_AUDIT.md`: reusable connection patterns from other projects
- `docs/SUPABASE_SETUP.md`: optional free-tier shared cloud setup
- `docs/PILOT_PLAYBOOK.md`: pilot execution framework
- `docs/LAUNCH_CHECKLIST.md`: launch readiness checklist
- `supabase/migrations/*.sql`: schema and starter RLS policies

## Notes

- This version is local-first and does not require external APIs.
- For cloud rollout, use the connection path documented in `docs/CONNECTIONS_AUDIT.md`.
