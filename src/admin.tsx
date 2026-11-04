// Admin dashboard: Cognito hosted UI (authorization code + PKCE), then calls the protected API.
// Tokens live in sessionStorage only. No client secret exists (SPA app client). Demo data only.
import { useCallback, useEffect, useState } from "react";

const apiUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const cognitoDomain = (import.meta.env.VITE_COGNITO_DOMAIN ?? "").replace(/\/$/, "");
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID ?? "";
const redirectUri = `${window.location.origin}/admin`;
const TOKEN_KEY = "admin.idToken";

type Row = Record<string, any>;
type Overview = { requests: Row[]; inquiries: Row[] };

const b64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const randomString = () => b64url(crypto.getRandomValues(new Uint8Array(32)));

function readToken(): { token: string; email: string; groups: string[] } | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const claims = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (claims.exp * 1000 < Date.now()) return null;
    return { token, email: claims.email ?? "", groups: claims["cognito:groups"] ?? [] };
  } catch {
    return null;
  }
}

async function signIn() {
  const verifier = randomString();
  const state = randomString();
  sessionStorage.setItem("admin.verifier", verifier);
  sessionStorage.setItem("admin.state", state);
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const query = new URLSearchParams({
    response_type: "code", client_id: clientId, redirect_uri: redirectUri,
    scope: "openid email", state, code_challenge: challenge, code_challenge_method: "S256",
  });
  window.location.assign(`${cognitoDomain}/oauth2/authorize?${query}`);
}

async function finishSignIn(code: string, state: string) {
  const verifier = sessionStorage.getItem("admin.verifier");
  if (!verifier || state !== sessionStorage.getItem("admin.state")) throw new Error("Sign-in state did not match. Try again.");
  const response = await fetch(`${cognitoDomain}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, code, redirect_uri: redirectUri, code_verifier: verifier }),
  });
  if (!response.ok) throw new Error("Sign-in failed.");
  sessionStorage.setItem(TOKEN_KEY, (await response.json()).id_token);
  sessionStorage.removeItem("admin.verifier");
  sessionStorage.removeItem("admin.state");
}

function signOut() {
  sessionStorage.removeItem(TOKEN_KEY);
  window.location.assign(`${cognitoDomain}/logout?${new URLSearchParams({ client_id: clientId, logout_uri: redirectUri })}`);
}

function count(rows: Row[], key: string): [string, number][] {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const label = String(row[key] ?? "unknown");
    out[label] = (out[label] ?? 0) + 1;
  }
  return Object.entries(out).sort((a, b) => b[1] - a[1]);
}

function Bars({ title, entries }: { title: string; entries: [string, number][] }) {
  const max = Math.max(1, ...entries.map(([, n]) => n));
  return (
    <section className="admin-card">
      <h3>{title}</h3>
      {entries.length === 0 && <p>No data yet.</p>}
      <ul className="admin-bars">
        {entries.map(([label, n]) => (
          <li key={label}>
            <span>{label}</span>
            <span className="admin-bars__bar" style={{ width: `${(n / max) * 100}%` }} />
            <b>{n}</b>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function AdminPage() {
  const [session, setSession] = useState(readToken);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  // Hosted UI sends the browser back here with ?code=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    finishSignIn(code, params.get("state") ?? "")
      .then(() => { window.history.replaceState({}, "", "/admin"); setSession(readToken()); })
      .catch((e) => setError(e.message));
  }, []);

  const call = useCallback(async (path: string, method = "GET") => {
    const current = readToken();
    if (!current) { setSession(null); throw new Error("Session expired. Sign in again."); }
    const response = await fetch(`${apiUrl}${path}`, { method, headers: { authorization: `Bearer ${current.token}` } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status}).`);
    return body;
  }, []);

  const load = useCallback(() => {
    setError("");
    call("/admin/overview").then(setData).catch((e) => setError(e.message));
  }, [call]);

  useEffect(() => { if (session) load(); }, [session, load]);

  async function decide(id: string, action: "confirm" | "decline") {
    setBusy(id);
    setError("");
    try { await call(`/admin/requests/${id}/${action}`, "POST"); load(); }
    catch (e) { setError((e as Error).message); load(); }
    finally { setBusy(""); }
  }

  if (!cognitoDomain || !clientId) {
    return <main className="admin"><h1>Admin</h1><p>Admin login is not configured in this build.</p></main>;
  }
  if (!session) {
    return (
      <main className="admin">
        <h1>Admin</h1>
        <p>Sign in to see inquiries and booking requests. This is a demo with fake data.</p>
        {error && <p role="alert" className="admin-error">{error}</p>}
        <button type="button" className="admin-btn" onClick={signIn}>Sign in</button>
      </main>
    );
  }

  const requests = data?.requests ?? [];
  const inquiries = data?.inquiries ?? [];
  return (
    <main className="admin">
      <div className="admin-top">
        <h1>Admin</h1>
        <span>{session.email} <button type="button" className="admin-btn admin-btn--quiet" onClick={signOut}>Sign out</button></span>
      </div>
      {error && <p role="alert" className="admin-error">{error}</p>}
      <div className="admin-grid">
        <Bars title="Inquiries by session type" entries={count(inquiries, "sessionType")} />
        <Bars title="Graduate vs parent" entries={count(inquiries, "booker")} />
        <Bars title="Booking requests by status" entries={count(requests, "status")} />
      </div>
      <h2>Booking requests</h2>
      {requests.length === 0 ? <p>No requests yet.</p> : (
        <table className="admin-table">
          <thead><tr><th>When</th><th>Name</th><th>Session</th><th>Slot</th><th>Status</th><th /></tr></thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{String(r.createdAt ?? "").slice(0, 16).replace("T", " ")}</td>
                <td>{r.name}<br /><small>{r.email}</small></td>
                <td>{r.sessionType}</td>
                <td>{String(r.slotPk ?? "").replace("SLOT#", "")} {r.slotSk}</td>
                <td>{r.status}</td>
                <td>
                  {r.status === "requested" && (
                    <>
                      <button type="button" className="admin-btn" disabled={busy === r.id} onClick={() => decide(r.id, "confirm")}>Confirm</button>{" "}
                      <button type="button" className="admin-btn admin-btn--quiet" disabled={busy === r.id} onClick={() => decide(r.id, "decline")}>Decline</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h2>Inquiries</h2>
      {inquiries.length === 0 ? <p>No inquiries yet.</p> : (
        <table className="admin-table">
          <thead><tr><th>When</th><th>Name</th><th>Session</th><th>Booker</th><th>Message</th></tr></thead>
          <tbody>
            {inquiries.map((i) => (
              <tr key={i.id ?? i.pk}>
                <td>{String(i.createdAt ?? "").slice(0, 16).replace("T", " ")}</td>
                <td>{i.name}<br /><small>{i.email}</small></td>
                <td>{i.sessionType}</td>
                <td>{i.booker}</td>
                <td>{i.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
