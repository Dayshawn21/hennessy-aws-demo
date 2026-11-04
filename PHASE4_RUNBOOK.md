# Phase 4 runbook: Cognito login, admin API, dashboard

Region us-east-2. Fake data only. Tick a box only when you did it. Never paste passwords here. Keep your account ID out of anything you send me.
Site URL below = `https://d3vxtn9s8u8bor.cloudfront.net`. API = `hennessy-demo-api`.

## A. Cognito user pool
- [ ] Search **Cognito** > **Create user pool**. If the console blocks this ("feature unavailable" or asks to upgrade), STOP and send me the exact text.
- [ ] Application type: **Single-page application (SPA)**. Name the app `hennessy-demo-admin-web`.
- [ ] Sign-in identifier: **Email** only. Self-registration: **turn OFF** (only you may create users). Required attributes: email.
- [ ] Return URL: `https://d3vxtn9s8u8bor.cloudfront.net/admin` . Create user directory.
- [ ] Open the pool > **App clients** > the client > confirm it has **no client secret** (SPA clients don't).
- [ ] App client > Login pages > Edit: add a second allowed callback URL `http://localhost:5173/admin`, and allowed sign-out URLs the same two. Allowed OAuth flows: **Authorization code grant**. Scopes: `openid`, `email`. Save.
- [ ] Note down (these are public values, safe to send me): the **Cognito domain** (Branding > Domain, looks like `https://xxxx.auth.us-east-2.amazoncognito.com`), the **App client ID**, and the **User pool ID** (looks like `us-east-2_xxxxxxxxx`).

## B. Admin group and your admin user
- [ ] Pool > **Groups** > Create group `admin`.
- [ ] Pool > **Users** > Create user: your email, "Send an email invitation", set a temporary password (you'll change it at first login).
- [ ] Open the user > **Add user to group** > `admin`.

## C. Admin Lambda
- [ ] `npm run build:api` (already done on this machine, `api/dist/admin.zip`).
- [ ] Lambda > Create function > `hennessy-demo-admin`, Node.js 24.x (or newest). Upload `api/dist/admin.zip`. Handler `index.handler`. Timeout 10 s.
- [ ] Environment variable `TABLE_NAME` = `hennessy-demo-inquiries`.
- [ ] Own role: IAM > Roles > Create role > Lambda > attach `AWSLambdaBasicExecutionRole` > name `hennessy-demo-admin-role`; then Lambda > Configuration > Permissions > Edit > use it.
- [ ] Add inline policy to that role (replace PASTE_TABLE_ARN):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["dynamodb:Scan", "dynamodb:GetItem", "dynamodb:UpdateItem"],
    "Resource": "PASTE_TABLE_ARN"
  }]
}
```

## D. JWT authorizer and routes
- [ ] API Gateway > `hennessy-demo-api` > **Authorization** > Manage authorizers > Create. Type **JWT**. Name `cognito-admin`. Issuer URL `https://cognito-idp.us-east-2.amazonaws.com/<USER_POOL_ID>`. Audience = your **App client ID**. Create.
- [ ] Routes > Create three routes, each with a new/reused Lambda integration for `hennessy-demo-admin`:
  - `GET /admin/overview`
  - `POST /admin/requests/{id}/confirm`
  - `POST /admin/requests/{id}/decline`
- [ ] Attach authorizer `cognito-admin` to **each of the three routes** (Authorization > select the route > Attach authorizer).
- [ ] CORS: allowed headers add `authorization` (keep `content-type`). Allowed methods: `GET`, `POST`, `OPTIONS`. Allowed origins: CloudFront URL, plus `http://localhost:5173` for local testing.
- [ ] Throttling stays on the stage.

## E. Check that signed-out visitors get 401
In CloudShell (or any terminal), with your API URL:
```
curl -i https://YOUR_API_ID.execute-api.us-east-2.amazonaws.com/admin/overview
```
Expect `HTTP/2 401`. Send me that line.

## F. Wire the site
Send me the Cognito domain, App client ID (public values). I add them to `.env.production`, build, and you upload `dist/client` and invalidate CloudFront the manual way (README "Deploying").
