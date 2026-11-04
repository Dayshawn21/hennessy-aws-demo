// POST /inquiries: validate the contact-form body and store it in DynamoDB.
// Demo only: fake data, no real client information.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";

type ApiEvent = { body?: string | null; isBase64Encoded?: boolean };
type ApiResult = { statusCode: number; headers: Record<string, string>; body: string };

const SESSIONS = ["graduation", "portraits", "families", "celebrations", "weddings", "studio", "product", "realEstate"] as const;
const BOOKERS = ["self", "parent", "business"] as const;

const table = process.env.TABLE_NAME ?? "";
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } });

const reply = (statusCode: number, body: unknown): ApiResult => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

const text = (value: unknown, max: number): string => (typeof value === "string" ? value.trim().slice(0, max) : "");

export const handler = async (event: ApiEvent): Promise<ApiResult> => {
  let input: Record<string, unknown>;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body ?? "", "base64").toString("utf8") : (event.body ?? "");
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("not an object");
    input = parsed as Record<string, unknown>;
  } catch {
    return reply(400, { ok: false, error: "Send a JSON body." });
  }

  // Honeypot: bots fill the hidden "company" field. Pretend success, store nothing.
  if (text(input.company, 200)) return reply(200, { ok: true });

  const name = text(input.name, 120);
  const email = text(input.email, 200);
  const sessionType = text(input.sessionType, 40);
  const booker = text(input.booker, 20) || "self";
  const message = text(input.message, 2000);
  const phone = text(input.phone, 40);
  const preferredDate = text(input.preferredDate, 10);

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Name is required.";
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "A valid email is required.";
  if (!(SESSIONS as readonly string[]).includes(sessionType)) errors.sessionType = "Choose a session type.";
  if (!(BOOKERS as readonly string[]).includes(booker)) errors.booker = "Invalid value.";
  if (message.length < 12) errors.message = "Message must be at least 12 characters.";
  if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) errors.preferredDate = "Use YYYY-MM-DD.";
  if (Object.keys(errors).length) return reply(400, { ok: false, errors });

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  try {
    await db.send(
      new PutCommand({
        TableName: table,
        Item: {
          pk: `INQ#${id}`,
          sk: "META",
          id,
          name,
          email,
          phone: phone || undefined,
          sessionType,
          booker,
          preferredDate: preferredDate || undefined,
          message,
          status: "new",
          createdAt,
        },
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
  } catch (err) {
    console.error("inquiry write failed", err);
    return reply(500, { ok: false, error: "Could not save your inquiry." });
  }
  console.log("inquiry stored", { id, sessionType, booker });
  return reply(201, { ok: true, id });
};
