// Prints a DynamoDB batch-write JSON with fake open slots, to paste into AWS CloudShell.
// Usage: node scripts/make-slots.mjs 2026-11-20 2026-11-21 > slots.json
const dates = process.argv.slice(2);
if (!dates.length || dates.some((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d))) {
  console.error("Usage: node scripts/make-slots.mjs YYYY-MM-DD [YYYY-MM-DD ...]");
  process.exit(1);
}
const times = ["10:00", "11:30", "13:00", "14:30", "16:00"];
const requests = dates.flatMap((date) =>
  times.map((time) => ({
    PutRequest: { Item: { pk: { S: `SLOT#${date}` }, sk: { S: time }, status: { S: "open" } } },
  })),
);
if (requests.length > 25) {
  console.error("A batch holds at most 25 items: use 5 dates or fewer.");
  process.exit(1);
}
console.log(JSON.stringify({ "hennessy-demo-inquiries": requests }, null, 2));
