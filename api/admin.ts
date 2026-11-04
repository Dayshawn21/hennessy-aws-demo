// Admin API, protected by a Cognito JWT authorizer on API Gateway (and re-checked here).
//   GET  /admin/overview                 -> booking requests + inquiries + counts
//   POST /admin/requests/{id}/confirm    -> request `requested` -> `booked`, slot -> `booked`
//   POST /admin/requests/{id}/decline    -> request `requested` -> `declined`, slot -> `open`
// Both status changes are DynamoDB transactions with conditions, so a request can only be
// decided once and the slot always matches the request. Demo only: fake data.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, ScanCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

type ApiEvent = {
  routeKey?: string;
  pathParameters?: Record<string, string | undefined> | null;
  requestContext?: { authorizer?: { jwt?: { claims?: Record<string, unknown> } } };
};
type ApiResult = { statusCode: number; headers: Record<string, string>; body: string };
type Item = Record<string, unknown>;

const table = process.env.TABLE_NAME ?? "";
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } });

const reply = (statusCode: number, body: unknown): ApiResult => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

// HTTP API passes list claims as a string such as "[admin]" or "[admin staff]".
export function groupsFromClaim(claim: unknown): string[] {
  if (Array.isArray(claim)) return claim.map(String);
  if (typeof claim !== "string") return [];
  return claim.replace(/^\[|\]$/g, "").split(/[\s,]+/).filter(Boolean);
}

async function scanPrefix(prefix: string): Promise<Item[]> {
  const items: Item[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const out = await db.send(
      new ScanCommand({
        TableName: table,
        FilterExpression: "begins_with(pk, :p)",
        ExpressionAttributeValues: { ":p": prefix },
        ExclusiveStartKey: startKey,
      }),
    );
    items.push(...((out.Items as Item[]) ?? []));
    startKey = out.LastEvaluatedKey;
  } while (startKey);
  return items;
}

const byNewest = (a: Item, b: Item) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));

async function overview(): Promise<ApiResult> {
  // A Scan is fine at demo size. With real volume I would add a GSI (status + createdAt).
  const [requests, inquiries] = await Promise.all([scanPrefix("REQ#"), scanPrefix("INQ#")]);
  return reply(200, {
    ok: true,
    requests: requests.sort(byNewest),
    inquiries: inquiries.sort(byNewest),
  });
}

async function decide(id: string, action: "confirm" | "decline", adminEmail: string): Promise<ApiResult> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return reply(400, { ok: false, error: "Bad request id." });
  const reqKey = { pk: `REQ#${id}`, sk: "META" };
  // Look up which slot this request holds.
  const found = (await db.send(new GetCommand({ TableName: table, Key: reqKey }))).Item;
  if (!found) return reply(404, { ok: false, error: "Request not found." });
  const slotKey = { pk: String(found.slotPk), sk: String(found.slotSk) };
  const now = new Date().toISOString();
  const newReqStatus = action === "confirm" ? "booked" : "declined";
  const newSlotStatus = action === "confirm" ? "booked" : "open";
  try {
    await db.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: table,
              Key: reqKey,
              UpdateExpression: "SET #s = :new, decidedAt = :at, decidedBy = :by",
              ConditionExpression: "#s = :requested",
              ExpressionAttributeNames: { "#s": "status" },
              ExpressionAttributeValues: { ":new": newReqStatus, ":requested": "requested", ":at": now, ":by": adminEmail },
            },
          },
          {
            Update: {
              TableName: table,
              Key: slotKey,
              UpdateExpression: action === "confirm" ? "SET #s = :slot" : "SET #s = :slot REMOVE requestId, requestedAt",
              ConditionExpression: "#s = :requested AND requestId = :id",
              ExpressionAttributeNames: { "#s": "status" },
              ExpressionAttributeValues: { ":slot": newSlotStatus, ":requested": "requested", ":id": id },
            },
          },
        ],
      }),
    );
  } catch (err) {
    if ((err as Error).name === "TransactionCanceledException") {
      return reply(409, { ok: false, error: "That request was already decided." });
    }
    console.error("decision failed", err);
    return reply(500, { ok: false, error: "Could not update the request." });
  }
  console.log("request decided", { id, action });
  return reply(200, { ok: true, id, status: newReqStatus });
}

export const handler = async (event: ApiEvent): Promise<ApiResult> => {
  try {
    const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
    // The JWT authorizer already rejected bad tokens; this checks the group too.
    if (!groupsFromClaim(claims["cognito:groups"]).includes("admin")) {
      return reply(403, { ok: false, error: "Admins only." });
    }
    const who = String(claims.email ?? claims.sub ?? "unknown");
    if (event.routeKey === "GET /admin/overview") return await overview();
    const id = event.pathParameters?.id ?? "";
    if (event.routeKey === "POST /admin/requests/{id}/confirm") return await decide(id, "confirm", who);
    if (event.routeKey === "POST /admin/requests/{id}/decline") return await decide(id, "decline", who);
    return reply(404, { ok: false, error: "Not found." });
  } catch (err) {
    console.error("unhandled", err);
    return reply(500, { ok: false, error: "Server error." });
  }
};
