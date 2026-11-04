// GET /slots?date=YYYY-MM-DD  -> open times for that day
// POST /bookings              -> request a slot. The slot flips open -> requested with a
//                                DynamoDB conditional write, so two people can never take one slot.
// Demo only: fake data, no real client information.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";

type ApiEvent = {
  routeKey?: string;
  body?: string | null;
  isBase64Encoded?: boolean;
  queryStringParameters?: Record<string, string | undefined> | null;
};
type ApiResult = { statusCode: number; headers: Record<string, string>; body: string };

const SESSIONS = ["graduation", "portraits", "families", "celebrations", "weddings", "studio", "product", "realEstate"] as const;
const table = process.env.TABLE_NAME ?? "";
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } });

const reply = (statusCode: number, body: unknown): ApiResult => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
const text = (value: unknown, max: number): string => (typeof value === "string" ? value.trim().slice(0, max) : "");
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

async function listSlots(date: string): Promise<ApiResult> {
  if (!DATE.test(date)) return reply(400, { ok: false, error: "Use ?date=YYYY-MM-DD." });
  const out = await db.send(
    new QueryCommand({
      TableName: table,
      KeyConditionExpression: "pk = :pk",
      FilterExpression: "#s = :open",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":pk": `SLOT#${date}`, ":open": "open" },
    }),
  );
  return reply(200, { ok: true, date, times: (out.Items ?? []).map((item) => item.sk as string).sort() });
}

async function requestBooking(event: ApiEvent): Promise<ApiResult> {
  let input: Record<string, unknown>;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body ?? "", "base64").toString("utf8") : (event.body ?? "");
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("not an object");
    input = parsed as Record<string, unknown>;
  } catch {
    return reply(400, { ok: false, error: "Send a JSON body." });
  }

  if (text(input.company, 200)) return reply(200, { ok: true }); // honeypot

  const date = text(input.date, 10);
  const time = text(input.time, 5);
  const name = text(input.name, 120);
  const email = text(input.email, 200);
  const sessionType = text(input.sessionType, 40);
  const message = text(input.message, 1000);

  const errors: Record<string, string> = {};
  if (!DATE.test(date)) errors.date = "Use YYYY-MM-DD.";
  if (!TIME.test(time)) errors.time = "Use HH:MM (24h).";
  if (!name) errors.name = "Name is required.";
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "A valid email is required.";
  if (!(SESSIONS as readonly string[]).includes(sessionType)) errors.sessionType = "Choose a session type.";
  if (Object.keys(errors).length) return reply(400, { ok: false, errors });

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  try {
    // One transaction: flip the slot only if it is still open, and record the request.
    await db.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: table,
              Key: { pk: `SLOT#${date}`, sk: time },
              UpdateExpression: "SET #s = :requested, requestId = :id, requestedAt = :at",
              ConditionExpression: "attribute_exists(pk) AND #s = :open",
              ExpressionAttributeNames: { "#s": "status" },
              ExpressionAttributeValues: { ":requested": "requested", ":open": "open", ":id": id, ":at": createdAt },
            },
          },
          {
            Put: {
              TableName: table,
              Item: {
                pk: `REQ#${id}`,
                sk: "META",
                id,
                slotPk: `SLOT#${date}`,
                slotSk: time,
                name,
                email,
                sessionType,
                message: message || undefined,
                status: "requested",
                createdAt,
              },
            },
          },
        ],
      }),
    );
  } catch (err) {
    const reasons = (err as { CancellationReasons?: { Code?: string }[] }).CancellationReasons;
    if ((err as Error).name === "TransactionCanceledException") {
      // ConditionalCheckFailed: the slot is not open (taken, or does not exist).
      // TransactionConflict: another request is changing the same slot right now.
      // Either way this caller did not get the slot.
      console.log("slot not granted", { date, time, reasons: reasons?.map((r) => r.Code) });
      if (reasons?.some((r) => r.Code === "ConditionalCheckFailed")) {
        return reply(409, { ok: false, error: "That time was just taken. Please pick another." });
      }
      if (reasons?.some((r) => r.Code === "TransactionConflict")) {
        return reply(409, { ok: false, error: "That time is being booked right now. Please try again or pick another." });
      }
    }
    console.error("booking write failed", err);
    return reply(500, { ok: false, error: "Could not save your request." });
  }
  console.log("booking requested", { id, date, time, sessionType });
  return reply(201, { ok: true, id });
}

export const handler = async (event: ApiEvent): Promise<ApiResult> => {
  try {
    if (event.routeKey === "GET /slots") return await listSlots(event.queryStringParameters?.date ?? "");
    if (event.routeKey === "POST /bookings") return await requestBooking(event);
    return reply(404, { ok: false, error: "Not found." });
  } catch (err) {
    console.error("unhandled", err);
    return reply(500, { ok: false, error: "Server error." });
  }
};
