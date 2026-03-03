import {
  shouldEscalate,
  validateTaskInput,
  withRole,
} from "./core.js";
import { runtimeConfig } from "./runtime-config.js";
import { createDataAdapter } from "./data/index.js";

const adapter = createDataAdapter(runtimeConfig);
let state = null;

function getActiveRecipient() {
  return state.recipients.find((r) => r.id === state.activeRecipientId) || state.recipients[0];
}

function tasksForActive() {
  const recipient = getActiveRecipient();
  return state.tasks
    .filter((t) => t.recipientId === recipient?.id)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
}

function formatTime(dt) {
  return new Date(dt).toLocaleString();
}

function renderRecipients() {
  const container = document.getElementById("recipientList");
  container.innerHTML = "";
  state.recipients.forEach((r) => {
    const btn = document.createElement("button");
    btn.className = `recipient-chip ${r.id === state.activeRecipientId ? "active" : ""}`;
    btn.style.background = r.color;
    btn.textContent = r.name;
    btn.onclick = () => {
      state.activeRecipientId = r.id;
      persistAndRender();
    };
    container.appendChild(btn);
  });
}

function renderTimeline() {
  const el = document.getElementById("timeline");
  el.innerHTML = "";
  const list = tasksForActive();
  if (list.length === 0) {
    el.textContent = "No tasks yet for this recipient.";
    return;
  }

  list.forEach((task) => {
    const row = document.createElement("div");
    row.className = "timeline-item";

    const statusClass = task.status === "done" ? "done" : task.status === "missed" ? "missed" : "";
    row.innerHTML = `
      <strong>${task.title}</strong>
      <div class="meta">${task.category} | ${task.type.toUpperCase()} | ${formatTime(task.dueAt)}</div>
      <div class="meta">High risk: ${task.highRisk ? "Yes" : "No"} | 2nd confirm: ${task.requiresSecondConfirm ? (task.confirmedBySecond ? "Done" : "Pending") : "N/A"}</div>
      <span class="status ${statusClass}">${task.status}</span>
    `;

    const actions = document.createElement("div");
    actions.className = "timeline-actions";

    const doneBtn = document.createElement("button");
    doneBtn.textContent = "Done + Evidence";
    doneBtn.onclick = () => {
      const note = window.prompt("Optional evidence note", "");
      const evidence = { note: note || null, at: new Date().toISOString() };
      task.status = "done";
      task.evidence = evidence;
      task.acknowledgedAt = new Date().toISOString();
      persistAndRender();
    };

    const missedBtn = document.createElement("button");
    missedBtn.className = "secondary";
    missedBtn.textContent = "Mark missed";
    missedBtn.onclick = () => {
      task.status = "missed";
      persistAndRender();
    };

    if (task.highRisk && task.requiresSecondConfirm && !task.confirmedBySecond) {
      const confirmBtn = document.createElement("button");
      confirmBtn.className = "secondary";
      confirmBtn.textContent = "2nd Confirm";
      confirmBtn.onclick = () => {
        task.confirmedBySecond = true;
        persistAndRender();
      };
      actions.appendChild(confirmBtn);
    }

    actions.appendChild(doneBtn);
    actions.appendChild(missedBtn);
    row.appendChild(actions);
    el.appendChild(row);
  });
}

function renderAlerts() {
  const el = document.getElementById("alerts");
  el.innerHTML = "";

  const now = new Date().toISOString();
  const active = tasksForActive().filter((task) => {
    const typeMinutes = task.type === "note"
      ? Number(state.settings.escalateNotesMinutes)
      : Number(state.settings.escalateTasksMinutes);

    return state.settings.alertsEnabled && shouldEscalate({
      isDone: task.status === "done",
      acknowledgedAt: task.acknowledgedAt,
      dueAt: task.dueAt,
      now,
      minutes: typeMinutes,
    });
  });

  if (active.length === 0) {
    el.textContent = "No escalated alerts.";
    return;
  }

  const primary = state.escalationChain.find((c) => c.isPrimary) || state.escalationChain[0];
  const backups = state.escalationChain.filter((c) => !c.isPrimary).map((c) => c.name).join(", ");

  active.forEach((task) => {
    const row = document.createElement("div");
    row.className = "alert-item high";
    row.innerHTML = `
      <strong>${task.title}</strong>
      <div class="meta">Escalated to: ${primary?.name || "Primary"} -> ${backups || "No backups"}</div>
      <div class="meta">Due: ${formatTime(task.dueAt)}</div>
    `;
    const ack = document.createElement("button");
    ack.textContent = "Acknowledge";
    ack.onclick = () => {
      task.acknowledgedAt = new Date().toISOString();
      persistAndRender();
    };
    row.appendChild(ack);
    el.appendChild(row);
  });
}

function renderChat() {
  const log = document.getElementById("chatLog");
  log.innerHTML = "";
  const rid = getActiveRecipient()?.id;
  const msgs = state.chat.filter((m) => m.recipientId === rid);

  if (msgs.length === 0) {
    log.textContent = "No messages yet.";
    return;
  }

  msgs.forEach((msg) => {
    const row = document.createElement("div");
    row.className = "chat-item";
    row.innerHTML = `<strong>${msg.role}</strong><div class="meta">${formatTime(msg.createdAt)}</div><p>${msg.text || ""}</p>`;
    if (msg.photo) {
      const img = document.createElement("img");
      img.src = msg.photo;
      img.alt = "Chat upload";
      row.appendChild(img);
    }
    log.appendChild(row);
  });
}

async function persistAndRender() {
  await adapter.saveState(state);
  renderAll();
}

function renderAll() {
  document.getElementById("dataMode").textContent = `Data mode: ${adapter.mode}`;
  document.getElementById("role").value = state.role;
  document.getElementById("alertsEnabled").checked = state.settings.alertsEnabled;
  document.getElementById("medTaskMins").value = state.settings.escalateTasksMinutes;
  document.getElementById("noteMins").value = state.settings.escalateNotesMinutes;

  renderRecipients();
  renderTimeline();
  renderAlerts();
  renderChat();
}

function wireEvents() {
  document.getElementById("role").addEventListener("change", (e) => {
    state = withRole(state, e.target.value);
    persistAndRender();
  });

  document.getElementById("recipientForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("recipientName");
    const name = input.value.trim();
    if (!name) return;
    const color = `hsl(${Math.floor(Math.random() * 360)}, 85%, 90%)`;
    const recipient = { id: crypto.randomUUID(), name, color };
    state.recipients.push(recipient);
    state.activeRecipientId = recipient.id;
    input.value = "";
    persistAndRender();
  });

  document.getElementById("taskForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
      recipientId: getActiveRecipient()?.id,
      title: document.getElementById("taskTitle").value,
      category: document.getElementById("taskCategory").value,
      dueAt: document.getElementById("taskDueAt").value,
      type: document.getElementById("taskType").value,
      highRisk: document.getElementById("highRisk").checked,
      requiresSecondConfirm: document.getElementById("highRisk").checked,
    };

    const check = validateTaskInput(payload);
    if (!check.ok) {
      window.alert(check.errors.join("\n"));
      return;
    }

    state.tasks.push({
      id: crypto.randomUUID(),
      ...payload,
      status: "pending",
      createdAt: new Date().toISOString(),
      evidence: null,
      acknowledgedAt: null,
      confirmedBySecond: false,
    });
    e.target.reset();
    persistAndRender();
  });

  document.getElementById("chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const messageEl = document.getElementById("chatMessage");
    const fileEl = document.getElementById("chatPhoto");
    const text = messageEl.value.trim();
    const file = fileEl.files?.[0];

    const saveMessage = (photo) => {
      if (!text && !photo) return;
      state.chat.push({
        id: crypto.randomUUID(),
        recipientId: getActiveRecipient()?.id,
        role: state.role,
        text,
        photo: photo || null,
        createdAt: new Date().toISOString(),
      });
      messageEl.value = "";
      fileEl.value = "";
      persistAndRender();
    };

    if (!file) {
      saveMessage(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => saveMessage(reader.result);
    reader.readAsDataURL(file);
  });

  document.getElementById("saveSettings").addEventListener("click", () => {
    state.settings.alertsEnabled = document.getElementById("alertsEnabled").checked;
    state.settings.escalateTasksMinutes = Number(document.getElementById("medTaskMins").value) || 15;
    state.settings.escalateMedsMinutes = state.settings.escalateTasksMinutes;
    state.settings.escalateNotesMinutes = Number(document.getElementById("noteMins").value) || 30;
    persistAndRender();
  });
}

async function init() {
  const loaded = await adapter.loadState();
  state = withRole(loaded, loaded.role || "Family");
  wireEvents();
  renderAll();
}

init();
