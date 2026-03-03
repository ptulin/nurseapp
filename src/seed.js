import { DEFAULT_SETTINGS } from "./core.js";

export function createSeedState() {
  const seedNow = new Date();
  seedNow.setMinutes(seedNow.getMinutes() - 20);

  const recipientId = crypto.randomUUID();

  return {
    role: "Family",
    recipients: [{ id: recipientId, name: "Recipient A", color: "#fee2e2" }],
    activeRecipientId: recipientId,
    tasks: [
      {
        id: crypto.randomUUID(),
        recipientId,
        title: "Morning medication",
        category: "Medication",
        type: "med",
        dueAt: seedNow.toISOString(),
        status: "pending",
        highRisk: true,
        requiresSecondConfirm: true,
        confirmedBySecond: false,
        createdAt: new Date().toISOString(),
        evidence: null,
        acknowledgedAt: null,
      },
    ],
    chat: [],
    settings: { ...DEFAULT_SETTINGS },
    escalationChain: [
      { id: "p1", name: "Primary Contact", isPrimary: true },
      { id: "b1", name: "Backup Contact", isPrimary: false },
    ],
  };
}
