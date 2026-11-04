# Phase 2 runbook: inquiry API (DynamoDB + Lambda + HTTP API)

Region: same as Phase 1 (us-east-2). Fake data only. Tick a box only when you did it.

## A. DynamoDB table
- [ ] DynamoDB > Create table. Name `hennessy-demo-inquiries`. Partition key `pk` (String), sort key `sk` (String).
- [ ] Table settings: **Customize settings** > capacity mode **On-demand**. Create.

## B. Lambda function
- [ ] On this machine run `npm run build:api`. It creates `api/dist/inquiries.zip`.
- [ ] Lambda > Create function > Author from scratch. Name `hennessy-demo-create-inquiry`. Runtime **Node.js 22.x** (or newest Node offered). Architecture arm64. Create.
- [ ] Code tab > Upload from > .zip file > choose `api/dist/inquiries.zip`.
- [ ] Runtime settings > Edit > Handler: `index.handler`.
- [ ] Configuration > Environment variables: `TABLE_NAME` = `hennessy-demo-inquiries`.
- [ ] Configuration > General: timeout 10 seconds.
- [ ] Configuration > Permissions > click the execution role. Add permissions > Create inline policy > JSON, allowing only `dynamodb:PutItem` on this table's ARN (least privilege, no `*`):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "dynamodb:PutItem",
    "Resource": "arn:aws:dynamodb:us-east-2:<ACCOUNT_ID>:table/hennessy-demo-inquiries"
  }]
}
```
- [ ] Test tab: use this fake event, run it, expect statusCode 201:

```json
{ "body": "{\"name\":\"Test Person\",\"email\":\"test@example.com\",\"sessionType\":\"graduation\",\"booker\":\"self\",\"message\":\"Fake inquiry for the demo.\"}" }
```
- [ ] DynamoDB > table > Explore items: the item is there. Lambda > Monitor > View CloudWatch logs: "inquiry stored" is logged.

## C. HTTP API
- [ ] API Gateway > Create API > **HTTP API** > Build. Integration: Lambda `hennessy-demo-create-inquiry`. Name `hennessy-demo-api`.
- [ ] Route: method `POST`, path `/inquiries`. Stage `$default`, auto-deploy on.
- [ ] CORS (API > CORS > Configure): allow origin `https://d3vxtn9s8u8bor.cloudfront.net` (also `http://localhost:5173` for local dev), methods `POST, OPTIONS`, headers `content-type`.
- [ ] Throttling (Stages > $default > Edit throttling): rate 5, burst 10.
- [ ] Copy the **Invoke URL**. The endpoint is `<Invoke URL>/inquiries`.

## D. Wire the form (next step with Claude)
Give Claude the Invoke URL. It changes `src/formAdapter.js` in this demo copy only, using a `VITE_API_URL` setting, rebuilds, and you re-upload `dist/client` to S3 and invalidate CloudFront (Invalidations tab > `/*`).

## Verify
- [ ] Submit the contact form on the CloudFront URL with fake data. The success message shows.
- [ ] The item appears in DynamoDB; logs appear in CloudWatch.
