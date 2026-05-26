/**
 * api.js
 * -------
 * Thin wrapper around fetch for all API calls.
 * All errors are normalized to a readable string and logged via console.error
 * with the endpoint that failed (so devs can find them in the browser console).
 */

import { API_URL } from "./AuthContext";

function _logError(endpoint, err) {
  // Surfacing endpoint + error so failed calls are searchable in DevTools
  // eslint-disable-next-line no-console
  console.error(`[Lifebote API] ${endpoint} failed:`, err);
}

function _friendly(detail, fallback) {
  if (typeof detail === "string" && detail) return detail;
  return fallback;
}

export async function apiPost(endpoint, body, token) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = _friendly(data.detail, "Something went wrong. Please try again.");
      _logError(endpoint, msg);
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    if (err instanceof Error && !err.message.startsWith("Something went")) _logError(endpoint, err);
    throw err;
  }
}

export async function apiGet(endpoint, token) {
  try {
    const res  = await fetch(`${API_URL}${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = _friendly(data.detail, "Request failed.");
      _logError(endpoint, msg);
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    _logError(endpoint, err);
    throw err;
  }
}

export async function apiPatch(endpoint, body, token) {
  try {
    const res  = await fetch(`${API_URL}${endpoint}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = _friendly(data.detail, "Update failed.");
      _logError(endpoint, msg);
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    _logError(endpoint, err);
    throw err;
  }
}

export async function apiDelete(endpoint, token) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) _logError(endpoint, `status ${res.status}`);
  return res.ok;
}

// ── Multipart upload ─────────────────────────────────────────────────────────
// Used by the DropZone component on Resume AI / Job Search / Auto Apply tabs.
export async function apiUpload(endpoint, file, token) {
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = _friendly(data.detail, "Could not read that file. Try a different one.");
      _logError(endpoint, msg);
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    _logError(endpoint, err);
    throw err;
  }
}

// ── Binary download (PDF / DOCX export) ──────────────────────────────────────
// Posts JSON, receives a blob, triggers a browser save with the server-provided
// filename when available.
export async function apiDownload(endpoint, body, token, fallbackName = "download") {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // Server may have returned JSON error
      let msg = "Download failed. Please try again.";
      try { const j = await res.json(); if (j.detail) msg = j.detail; } catch (_) {}
      _logError(endpoint, msg);
      throw new Error(msg);
    }
    const blob = await res.blob();
    // Pull filename from Content-Disposition when present
    let filename = fallbackName;
    const cd = res.headers.get("Content-Disposition") || "";
    const match = cd.match(/filename="?([^";]+)"?/i);
    if (match) filename = match[1];

    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    _logError(endpoint, err);
    throw err;
  }
}
