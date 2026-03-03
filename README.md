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
- `tests/core.test.js`: unit tests
- `docs/PRODUCT_PLAN.md`: market-informed plan and delivery roadmap
- `docs/FREE_RESOURCES.md`: free stack/options
- `docs/CONNECTIONS_AUDIT.md`: reusable connection patterns from other projects

## Notes

- This version is local-first and does not require external APIs.
- For cloud rollout, use the connection path documented in `docs/CONNECTIONS_AUDIT.md`.
