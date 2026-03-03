function toMs(value) {
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export function computeDashboardMetrics(state) {
  const tasks = Array.isArray(state?.tasks) ? state.tasks : [];
  const alerts = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");
  const missed = tasks.filter((t) => t.status === "missed");

  const doneRate = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
  const missedRate = tasks.length ? Math.round((missed.length / tasks.length) * 100) : 0;

  const ackDurations = tasks
    .filter((t) => t.acknowledgedAt && t.dueAt)
    .map((t) => {
      const due = toMs(t.dueAt);
      const ack = toMs(t.acknowledgedAt);
      if (due === null || ack === null || ack < due) return null;
      return ack - due;
    })
    .filter((v) => v !== null);

  const avgAckMin = ackDurations.length
    ? Math.round(ackDurations.reduce((a, b) => a + b, 0) / ackDurations.length / 60000)
    : 0;

  const roleSwitches = (state.audit || []).filter((a) => a.action === "role.switch").length;

  return {
    totalTasks: tasks.length,
    openTasks: alerts.length,
    doneRate,
    missedRate,
    avgAckMin,
    roleSwitches,
  };
}
