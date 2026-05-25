/**
 * api.js
 * -------
 * Thin wrapper around fetch for all API calls.
 * All errors are normalized to a readable string.
 */

import { API_URL } from "./AuthContext";

export async function apiPost(endpoint, body, token) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Something went wrong. Please try again.");
  return data;
}

export async function apiGet(endpoint, token) {
  const res  = await fetch(`${API_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Request failed.");
  return data;
}

export async function apiPatch(endpoint, body, token) {
  const res  = await fetch(`${API_URL}${endpoint}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Update failed.");
  return data;
}

export async function apiDelete(endpoint, token) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.ok;
}
