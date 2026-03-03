import {
  shouldEscalate,
  validateTaskInput,
  validateImageFile,
  withRole,
} from "./core.js";
import { parseScheduleText } from "./importer.js";
import { runtimeConfig } from "./runtime-config.js";
import { createDataAdapter } from "./data/index.js";
import {
  getSession,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from "./auth/supabase-auth.js";

const adapter = createDataAdapter(runtimeConfig);
let state = null;
let importPreview = [];
let syncTimer = null;

function ensureStateDefaults(input) {
  return {
    ...input,
    audit: Array.isArray(input.audit) ? input.audit : [],
  };
}

function logAction(action, payload = {}) {
  state.audit.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    role: state.role,
    recipientId: getActiveRecipient()?.id || null,
    action,
    payload,
  });

  if (state.audit.length > 500) {
    state.audit = state.audit.slice(state.audit.length - 500);
  }
}

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

function dateTimeFromHHMM(time) {
  const [h, m] = (time || "00:00").split(":").map(Number);
  const dt = new Date();
  dt.setHours(Number.isNaN(h) ? 0 : h, Number.isNaN(m) ? 0 : m, 0, 0);
  return dt.toISOString();
}

function setAuthStatus(message) {
  const el = document.getElementById("authStatus");
  if (el) el.textContent = message;
}

function readAuthInputs() {
  return {
    email: document.getElementById("authEmail")?.value?.trim(),
    password: document.getElementById("authPassword")?.value || "",
  };
}

function startRealtimeSync() {
  if (syncTimer || adapter.mode !== "supabase") return;
  syncTimer = setInterval(async () => {
    try {
      if (!getSession()?.access_token) return;
      const remote = await adapter.loadState();
      if (!remote) return;
      state = withRole(ensureStateDefaults(remote), state.role || remote.role || "Family");
      renderAll();
    } catch {
      // Keep local UI active if cloud refresh fails.
    }
  }, 20000);
}

function renderAuthStatus() {
  if (adapter.mode !== "supabase") {
    setAuthStatus("Auth disabled: current data mode is local.");
    return;
  }

  const session = getSession();
  if (!session?.access_token) {
    setAuthStatus("Not signed in.");
    return;
  }

  const email = session.user?.email || "authenticated";
  setAuthStatus(`Signed in as ${email}`);
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
      logAction("recipient.switch", { recipientId: r.id });
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
      logAction("task.done", { taskId: task.id, withEvidence: Boolean(note) });
      persistAndRender();
    };

    const missedBtn = document.createElement("button");
    missedBtn.className = "secondary";
    missedBtn.textContent = "Mark missed";
    missedBtn.onclick = () => {
      task.status = "missed";
      logAction("task.missed", { taskId: task.id });
      persistAndRender();
    };

    if (task.highRisk && task.requiresSecondConfirm && !task.confirmedBySecond) {
      const confirmBtn = document.createElement("button");
      confirmBtn.className = "secondary";
      confirmBtn.textContent = "2nd Confirm";
      confirmBtn.onclick = () => {
        task.confirmedBySecond = true;
        logAction("task.second_confirm", { taskId: task.id });
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
      : task.type === "med"
        ? Number(state.settings.escalateMedsMinutes)
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
      logAction("alert.ack", { taskId: task.id });
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

function renderImportPreview() {
  const el = document.getElementById("importPreview");
  el.innerHTML = "";

  if (!importPreview.length) {
    el.textContent = "No preview items yet.";
    return;
  }

  importPreview.forEach((item) => {
    const row = document.createElement("div");
    row.className = "import-item";
    row.innerHTML = `<strong>${item.title}</strong><div class="meta">${item.time} | ${item.category} | ${item.type}</div>`;
    el.appendChild(row);
  });
}

function renderRoleScreens() {
  const allowed = new Set(state.allowedScreens || []);
  const sections = document.querySelectorAll("[data-screen]");
  sections.forEach((section) => {
    const screen = section.getAttribute("data-screen");
    section.setAttribute("data-hidden", allowed.has(screen) ? "false" : "true");
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
  document.getElementById("auditCount").textContent = `Entries: ${state.audit.length}`;

  renderRoleScreens();
  renderRecipients();
  renderTimeline();
  renderAlerts();
  renderChat();
  renderImportPreview();
  renderAuthStatus();
}

function wireEvents() {
  document.getElementById("role").addEventListener("change", (e) => {
    state = withRole(state, e.target.value);
    logAction("role.switch", { role: state.role });
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
    logAction("recipient.add", { recipientId: recipient.id });
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

    const created = {
      id: crypto.randomUUID(),
      ...payload,
      status: "pending",
      createdAt: new Date().toISOString(),
      evidence: null,
      acknowledgedAt: null,
      confirmedBySecond: false,
    };

    state.tasks.push(created);
    logAction("task.add", { taskId: created.id });
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
      const msg = {
        id: crypto.randomUUID(),
        recipientId: getActiveRecipient()?.id,
        role: state.role,
        text,
        photo: photo || null,
        createdAt: new Date().toISOString(),
      };
      state.chat.push(msg);
      logAction("chat.send", { messageId: msg.id, withPhoto: Boolean(photo) });
      messageEl.value = "";
      fileEl.value = "";
      persistAndRender();
    };

    if (!file) {
      saveMessage(null);
      return;
    }
    const fileCheck = validateImageFile(file);
    if (!fileCheck.ok) {
      setAuthStatus(fileCheck.reason);
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
    logAction("settings.save", {
      alertsEnabled: state.settings.alertsEnabled,
      escalateTasksMinutes: state.settings.escalateTasksMinutes,
      escalateNotesMinutes: state.settings.escalateNotesMinutes,
    });
    persistAndRender();
  });

  document.getElementById("importForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = document.getElementById("importText").value;
    const imageFile = document.getElementById("importImage").files?.[0];
    const fileCheck = validateImageFile(imageFile);
    if (!fileCheck.ok) {
      setAuthStatus(fileCheck.reason);
      return;
    }
    importPreview = parseScheduleText(text);
    logAction("import.preview", { count: importPreview.length });
    renderImportPreview();
  });

  document.getElementById("applyImport").addEventListener("click", () => {
    const rid = getActiveRecipient()?.id;
    if (!rid || importPreview.length === 0) return;

    const created = importPreview.map((item) => ({
      id: crypto.randomUUID(),
      recipientId: rid,
      title: item.title,
      category: item.category,
      dueAt: dateTimeFromHHMM(item.time),
      type: item.type,
      highRisk: item.type === "med",
      requiresSecondConfirm: item.type === "med",
      status: "pending",
      createdAt: new Date().toISOString(),
      evidence: null,
      acknowledgedAt: null,
      confirmedBySecond: false,
    }));

    state.tasks.push(...created);
    logAction("import.apply", { count: created.length });
    importPreview = [];
    document.getElementById("importText").value = "";
    document.getElementById("importImage").value = "";
    persistAndRender();
  });

  document.getElementById("exportAudit").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state.audit, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nurseapp-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("signUpBtn").addEventListener("click", async () => {
    if (adapter.mode !== "supabase") {
      setAuthStatus("Switch runtime config to supabase mode first.");
      return;
    }
    const { email, password } = readAuthInputs();
    if (!email || !password) {
      setAuthStatus("Email and password are required.");
      return;
    }
    try {
      await signUpWithEmail({
        url: runtimeConfig.supabase.url,
        anonKey: runtimeConfig.supabase.anonKey,
        email,
        password,
      });
      logAction("auth.signup", { email });
      setAuthStatus("Sign-up successful. Check email if confirmation is required.");
      renderAuthStatus();
    } catch (error) {
      setAuthStatus(`Sign-up failed: ${error.message}`);
    }
  });

  document.getElementById("signInBtn").addEventListener("click", async () => {
    if (adapter.mode !== "supabase") {
      setAuthStatus("Switch runtime config to supabase mode first.");
      return;
    }
    const { email, password } = readAuthInputs();
    if (!email || !password) {
      setAuthStatus("Email and password are required.");
      return;
    }
    try {
      await signInWithEmail({
        url: runtimeConfig.supabase.url,
        anonKey: runtimeConfig.supabase.anonKey,
        email,
        password,
      });
      logAction("auth.signin", { email });
      setAuthStatus("Signed in.");
      renderAuthStatus();
      const loaded = await adapter.loadState();
      state = withRole(ensureStateDefaults(loaded), loaded.role || state.role || "Family");
      await adapter.saveState(state);
      renderAll();
    } catch (error) {
      setAuthStatus(`Sign-in failed: ${error.message}`);
    }
  });

  document.getElementById("signOutBtn").addEventListener("click", async () => {
    if (adapter.mode !== "supabase") {
      setAuthStatus("Already local mode.");
      return;
    }
    try {
      await signOut({
        url: runtimeConfig.supabase.url,
        anonKey: runtimeConfig.supabase.anonKey,
      });
      logAction("auth.signout", {});
      setAuthStatus("Signed out.");
      renderAuthStatus();
    } catch (error) {
      setAuthStatus(`Sign-out failed: ${error.message}`);
    }
  });

  document.getElementById("bootstrapBtn").addEventListener("click", async () => {
    if (adapter.mode !== "supabase") {
      setAuthStatus("Bootstrap requires supabase mode.");
      return;
    }
    const name = document.getElementById("householdName")?.value?.trim() || "My Household";
    try {
      const householdId = await adapter.bootstrapHousehold(name);
      runtimeConfig.supabase.householdId = householdId;
      setAuthStatus(`Household ready: ${householdId}`);
      logAction("auth.bootstrap_household", { householdId, householdName: name });
      await adapter.saveState(state);
    } catch (error) {
      setAuthStatus(`Bootstrap failed: ${error.message}`);
    }
  });
}

async function init() {
  const loaded = await adapter.loadState();
  state = withRole(ensureStateDefaults(loaded), loaded.role || "Family");
  wireEvents();
  startRealtimeSync();
  renderAll();
}

init();
