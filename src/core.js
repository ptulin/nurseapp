export const DEFAULT_SETTINGS = {
  alertsEnabled: true,
  escalateMedsMinutes: 15,
  escalateTasksMinutes: 15,
  escalateNotesMinutes: 30,
};

export const ROLE_SCREENS = {
  Family: ["today", "overview", "missed", "chat", "settings"],
  Caregiver: ["today", "chat", "settings"],
  Admin: ["overview", "today", "settings"],
};

export function shouldEscalate({ isDone, acknowledgedAt, dueAt, now, minutes }) {
  if (isDone || acknowledgedAt) return false;
  if (!dueAt || !now || minutes < 1) return false;
  const dueMs = new Date(dueAt).getTime();
  const nowMs = new Date(now).getTime();
  if (Number.isNaN(dueMs) || Number.isNaN(nowMs) || nowMs < dueMs) return false;
  return nowMs - dueMs >= minutes * 60 * 1000;
}

export function withRole(baseState, role) {
  return {
    ...baseState,
    role,
    allowedScreens: ROLE_SCREENS[role] || ROLE_SCREENS.Family,
  };
}

export function validateTaskInput(input) {
  const errors = [];
  if (!input?.recipientId) errors.push("recipientId is required");
  if (!input?.title || !input.title.trim()) errors.push("title is required");
  if (!input?.category || !input.category.trim()) errors.push("category is required");
  if (!input?.dueAt) errors.push("dueAt is required");
  return {
    ok: errors.length === 0,
    errors,
  };
}

export function buildEscalationContact(chain, primaryId) {
  const primary = chain.find((c) => c.id === primaryId);
  const backups = chain.filter((c) => c.id !== primaryId);
  return {
    primary: primary || chain[0] || null,
    backups,
  };
}
