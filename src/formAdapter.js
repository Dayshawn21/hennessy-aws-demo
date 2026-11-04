// Demo copy: posts the inquiry to the AWS HTTP API when VITE_API_URL is set at build time,
// otherwise falls back to the original prototype simulation.
const apiUrl = import.meta.env.VITE_API_URL;

export async function submitInquiry(payload) {
  if (payload.company) return { ok: true };

  if (apiUrl) {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/inquiries`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Inquiry API returned ${response.status}`);
    return { ok: true, mode: "api" };
  }

  await new Promise((resolve) => window.setTimeout(resolve, 850));
  if (payload.message.toLowerCase().includes("[simulate-error]")) throw new Error("Prototype delivery simulation failed.");
  return { ok: true, mode: "prototype" };
}
