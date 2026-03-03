const SESSION_KEY = "nurseapp_supabase_session_v1";

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  const slim = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user: session.user,
    expires_at: session.expires_at,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(slim));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function authRequest(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: body.apikey,
    },
    body: JSON.stringify(body.payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data?.msg || data?.error_description || data?.error || "Auth failed";
    throw new Error(msg);
  }
  return data;
}

export async function signUpWithEmail({ url, anonKey, email, password }) {
  const data = await authRequest(`${url}/auth/v1/signup`, {
    apikey: anonKey,
    payload: { email, password },
  });
  if (data.access_token) saveSession(data);
  return data;
}

export async function signInWithEmail({ url, anonKey, email, password }) {
  const data = await authRequest(`${url}/auth/v1/token?grant_type=password`, {
    apikey: anonKey,
    payload: { email, password },
  });
  saveSession(data);
  return data;
}

export async function signOut({ url, anonKey }) {
  const session = getSession();
  if (!session?.access_token) {
    clearSession();
    return;
  }

  await fetch(`${url}/auth/v1/logout`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  clearSession();
}
