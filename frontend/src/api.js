const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include", // send cookies
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// Auth
export const api = {
  testError: () => request("/test-error"),

  auth: {
    sendLink: (email) =>
      request("/auth/send-link", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    logout: () => request("/auth/logout", { method: "POST" }),
    me: () => request("/auth/me"),
  },

  stories: {
    list: () => request("/stories"),
    create: () => request("/stories", { method: "POST" }),
    get: (id) => request(`/stories/${id}`),
    delete: (id) => request(`/stories/${id}`, { method: "DELETE" }),
    sendMessage: (id, content) =>
      request(`/stories/${id}/message`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    debugObjective: (id, messageCount) =>
      request(`/stories/${id}/debug-objective`, {
        method: "POST",
        body: JSON.stringify({ messageCount }),
      }),
  },

  worlds: {
    list: () => request("/worlds"),
    create: () => request("/worlds", { method: "POST" }),
    get: (id) => request(`/worlds/${id}`),
    rename: (id, name) =>
      request(`/worlds/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    delete: (id) => request(`/worlds/${id}`, { method: "DELETE" }),
    codex: (id) => request(`/worlds/${id}/codex`),
    createStory: (worldId) =>
      request(`/worlds/${worldId}/stories`, { method: "POST" }),
    abandon: (worldId) =>
      request(`/worlds/${worldId}/abandon`, { method: "POST" }),
  },
};
