// Fires parallel booking requests for ONE slot and counts the outcomes.
// Exactly one should return 201; the rest should return 409 (taken).
// Usage: node scripts/race-test.mjs <apiUrl> <YYYY-MM-DD> <HH:MM> [count]
// Fake data only. Needs Node 18+ (global fetch).
const [apiUrl, date, time, countArg] = process.argv.slice(2);
if (!apiUrl || !date || !time) {
  console.error("Usage: node scripts/race-test.mjs <apiUrl> <YYYY-MM-DD> <HH:MM> [count]");
  process.exit(1);
}
const count = Number(countArg ?? 6); // the API is throttled to burst 10, so keep this small

const results = await Promise.all(
  Array.from({ length: count }, (_, i) =>
    fetch(`${apiUrl.replace(/\/$/, "")}/bookings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        date,
        time,
        name: `Race Tester ${i + 1}`,
        email: `race${i + 1}@example.com`,
        sessionType: "portraits",
      }),
    }).then((r) => r.status),
  ),
);

const tally = results.reduce((acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }), {});
console.log("Status counts:", tally);
const others = results.filter((s) => s !== 201);
const pass = tally[201] === 1 && others.every((s) => s === 409 || s === 429);
console.log(pass ? "PASS: exactly one 201; every other request got 409 (or 429 from throttling)." : "FAIL: expected exactly one 201 and only 409/429 for the rest.");
