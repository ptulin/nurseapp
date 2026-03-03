export const PLAN_LIMITS = {
  free: {
    maxRecipients: 1,
    channels: ["inApp"],
    advancedEscalation: false,
  },
  pro: {
    maxRecipients: 10,
    channels: ["inApp", "email", "sms"],
    advancedEscalation: true,
  },
};

export function getPlanLimits(tier) {
  return PLAN_LIMITS[tier] || PLAN_LIMITS.free;
}

export function canAddRecipient(state) {
  const tier = state?.billing?.tier || "free";
  const limits = getPlanLimits(tier);
  return (state?.recipients?.length || 0) < limits.maxRecipients;
}

export function allowedChannelsForTier(tier) {
  return new Set(getPlanLimits(tier).channels);
}

export function sanitizeChannelsForTier(tier, channels) {
  const allowed = allowedChannelsForTier(tier);
  const next = {
    inApp: Boolean(channels?.inApp),
    email: Boolean(channels?.email),
    sms: Boolean(channels?.sms),
  };

  Object.keys(next).forEach((key) => {
    if (!allowed.has(key)) next[key] = false;
  });

  if (!next.inApp) next.inApp = true;
  return next;
}
