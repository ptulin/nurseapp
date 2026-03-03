# NurseApp Product Plan (U.S., Family-First Hybrid)

## 1. Outcome

Build a care coordination web app that solves family visibility gaps first, while supporting professional caregivers and admins through role switching.

## 2. Problem Statement

Current coordination is fragmented across paper schedules, text threads, and ad hoc reminders. Families lack reliable real-time visibility into what was done, what was missed, and who is accountable next.

## 3. User Roles

- Family: monitor, receive alerts, acknowledge escalations, review notes.
- Caregiver: execute plan-driven tasks/meds, submit evidence, update notes.
- Admin: configure categories, team permissions, escalation policy.

## 4. MVP Requirements (Locked)

- Plan-driven tasks with required care category.
- Timeline visibility: today > overview > missed.
- Immediate missed alerts with configurable off switch.
- Escalation by alert type (default: meds/tasks 15 min, notes 30 min).
- Optional second confirmation for high-risk medications.
- Multi-care-recipient support with clear separation.
- Chat in context of recipient (text + photo).
- HIPAA-ready technical posture (audit/access/encryption foundations).

## 5. Competitive Positioning

- Better visibility/escalation discipline than lightweight helper calendars.
- Simpler and cheaper than agency-heavy home care software.
- Stronger care-plan specificity than generic family organizer apps.

## 6. Monetization

- Hybrid model.
- Segment 1: families (first paying users).
- Target paid tier: $9-15/month.
- Free tier at launch for acquisition.

## 7. 8-12 Week Build Plan (You + AI)

### Week 1-2

- Finalize PRD and user flows.
- Lock data model and role permissions.
- Build mobile-first UI architecture.

### Week 3-5

- Implement recipients, care plans, timeline, task states.
- Add missed detection, immediate alerts, escalation workflow.
- Add optional second confirmation and evidence flow.

### Week 6-7

- Add recipient-scoped chat (text/photo).
- Add OCR-assisted import scaffold (review-before-save).

### Week 8-9

- Security hardening and audit logs.
- Settings and reliability improvements.

### Week 10-12

- Pilot with first families.
- Track adherence/visibility metrics.
- Launch paid + free plans.

## 8. KPIs

- Daily active families.
- On-time completion rate (tasks/meds).
- Missed-item acknowledgment time.
- Escalation resolution rate.
- Week-4 family retention.
