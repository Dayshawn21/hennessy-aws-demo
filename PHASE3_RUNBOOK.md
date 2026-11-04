# Phase 3 runbook: slots and booking requests (conditional write)

Same region as before (us-east-2). Fake data only. Tick a box only when you did it.
Admin confirm/decline routes are NOT included: they need login, which comes with Cognito (Phase 4). Do not expose them without auth.

## A. Bookings Lambda
- [ ] On this machine run `npm run build:api`. It creates `api/dist/bookings.zip` (and `inquiries.zip`).
- [ ] Lambda > Create function > Author from scratch. Name `hennessy-demo-bookings`, Node.js 24.x (or newest). Leave the other options on defaults.
- [ ] Code tab > Upload from > .zip file > `api/dist/bookings.zip`. Runtime settings > Handler `index.handler`.
- [ ] Configuration > Environment variables: `TABLE_NAME` = `hennessy-demo-inquiries`. General configuration: timeout 10 seconds.
- [ ] Give it its own role (as in Phase 2): IAM > Roles > Create role > AWS service > Lambda > attach `AWSLambdaBasicExecutionRole` > name `hennessy-demo-bookings-role`. Then Lambda > Configuration > Permissions > Edit > use that role. (The default role the console assigns is too broad.)
- [ ] On the new role add an inline policy (replace PASTE_TABLE_ARN with the table's ARN):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["dynamodb:Query", "dynamodb:UpdateItem", "dynamodb:PutItem"],
    "Resource": "PASTE_TABLE_ARN"
  }]
}
```

## B. Routes on the existing API (hennessy-demo-api)
- [ ] API Gateway > hennessy-demo-api > Routes > Create: `GET /slots` and `POST /bookings`. Attach an integration to the Lambda `hennessy-demo-bookings` (create a new Lambda integration, reuse it for both routes).
- [ ] CORS: add `GET` to the allowed methods (keep `POST`, `OPTIONS`, header `content-type`, origin = your CloudFront URL).
- [ ] Throttling stays on the stage (rate 5, burst 10).

## C. Seed fake open slots (AWS CloudShell, same region)
Open CloudShell (bottom-left of the console) and paste both commands:

```
cat > slots.json <<'EOF'
{"hennessy-demo-inquiries":[{"PutRequest":{"Item":{"pk":{"S":"SLOT#2026-11-20"},"sk":{"S":"10:00"},"status":{"S":"open"}}}},{"PutRequest":{"Item":{"pk":{"S":"SLOT#2026-11-20"},"sk":{"S":"11:30"},"status":{"S":"open"}}}},{"PutRequest":{"Item":{"pk":{"S":"SLOT#2026-11-20"},"sk":{"S":"13:00"},"status":{"S":"open"}}}},{"PutRequest":{"Item":{"pk":{"S":"SLOT#2026-11-20"},"sk":{"S":"14:30"},"status":{"S":"open"}}}},{"PutRequest":{"Item":{"pk":{"S":"SLOT#2026-11-20"},"sk":{"S":"16:00"},"status":{"S":"open"}}}},{"PutRequest":{"Item":{"pk":{"S":"SLOT#2026-11-21"},"sk":{"S":"10:00"},"status":{"S":"open"}}}},{"PutRequest":{"Item":{"pk":{"S":"SLOT#2026-11-21"},"sk":{"S":"11:30"},"status":{"S":"open"}}}},{"PutRequest":{"Item":{"pk":{"S":"SLOT#2026-11-21"},"sk":{"S":"13:00"},"status":{"S":"open"}}}},{"PutRequest":{"Item":{"pk":{"S":"SLOT#2026-11-21"},"sk":{"S":"14:30"},"status":{"S":"open"}}}},{"PutRequest":{"Item":{"pk":{"S":"SLOT#2026-11-21"},"sk":{"S":"16:00"},"status":{"S":"open"}}}}]}
EOF
aws dynamodb batch-write-item --request-items file://slots.json
```

Expect `"UnprocessedItems": {}`. Then DynamoDB > Explore items: 10 slots (`SLOT#2026-11-20` and `SLOT#2026-11-21`, five times each, status `open`).

## D. Test
- [ ] Open `<Invoke URL>/slots?date=2026-11-20` in a browser. Expect JSON listing five times.
- [ ] Race test, from this repo (fake data): `node scripts/race-test.mjs <Invoke URL> 2026-11-20 10:00 6`
  Expect exactly one 201 and the rest 409. Any 429 means throttling kicked in (fine; rerun on a different time slot).
- [ ] `/slots?date=2026-11-20` no longer lists 10:00. In DynamoDB the 10:00 slot is `requested` and one `REQ#...` item exists.

## Talking points
- Conditional write: `status = open` is checked and flipped atomically, so two people cannot take one slot (no read-then-write race).
- The slot flip and the request record happen in one transaction.
- Admin confirm/decline waits for Cognito: no unauthenticated write access to bookings.
