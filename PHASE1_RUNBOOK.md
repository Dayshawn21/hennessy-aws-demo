# Phase 1 runbook: S3 + CloudFront (do this in your own AWS console)

Region: this console defaults to **us-east-2** (Ohio) with no region picker, so use us-east-2 and keep every later resource in the same region. CloudFront is global.
Tick each box only when you have actually done it.

## A. Account safety (15 min, do first)
- [ ] Sign in to the AWS console as the root user once, turn on MFA for root (IAM > Security credentials), then stop using root.
- [ ] Budget alert: **not available on the Free plan** (Billing shows no Budgets). The plan cannot bill you; check "Credits remaining" on the Billing page after each phase and do not click Upgrade.
- [ ] Create an IAM Identity Center user or an IAM user with MFA for daily work. Do not create access keys unless you need the CLI (see section E).

## B. Private S3 bucket (5 min)
- [ ] S3 > Create bucket. Name: `hennessy-demo-<yourinitials>-<random>` (must be globally unique). Region us-east-1.
- [ ] Leave **Block all public access ON**. Leave ACLs disabled. Default encryption on.
- [ ] Upload the **contents** of `C:\dev\hennessy-aws-demo\dist\client` (drag the files and folders inside it, not the `client` folder itself) so `index.html` is at the bucket root.
  - Rebuild first if unsure: `npm run build` in this folder.

## C. CloudFront with Origin Access Control (10 min)
- [ ] CloudFront > Create distribution. Origin domain: pick your S3 bucket (the S3 REST endpoint, not the "website" endpoint).
- [ ] Origin access: **Origin access control settings (recommended)** > Create new OAC (defaults, sign requests).
- [ ] Default root object: `index.html`.
- [ ] Viewer protocol policy: Redirect HTTP to HTTPS. WAF: do not enable (costs money).
- [ ] Create. CloudFront shows a banner with a **bucket policy** to copy. Open the bucket > Permissions > Bucket policy and paste it. Bucket stays private.
- [ ] Distribution > Error pages > Create custom error response, twice:
  - HTTP 403 -> response page path `/index.html`, HTTP response code **200**
  - HTTP 404 -> response page path `/index.html`, HTTP response code **200**
  (This is why `/sessions` and `/work` survive a browser refresh.)

## D. Verify
- [ ] Wait until the distribution status is Deployed (a few minutes). Open `https://<id>.cloudfront.net`.
- [ ] Click Home, Sessions, Business, Work, About, Contact. Refresh on `/sessions` and `/work`: they must still load.
- [ ] Try `https://<id>.cloudfront.net/graduation`: it should redirect in the app to `/sessions#graduation`.
- [ ] Try the raw S3 object URL: it must be **Access Denied** (proves the bucket is private).
- [ ] Note: the contact form only simulates sending for now; there is no backend until Phase 2.

Once all of D is ticked you can truthfully say: "I deployed a React app to S3 and CloudFront with Origin Access Control."

## E. Optional: update by script later (Phase 5 replaces this with GitHub Actions)
Install AWS CLI v2, run `aws configure sso` (no long-lived keys), then:

```
npm run build
aws s3 sync dist/client s3://<bucket-name> --delete
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

## Interview talking points from this phase
- Private bucket + OAC: only CloudFront can read the objects.
- SPA fallback via 403/404 -> `/index.html` 200 custom error responses.
- Budget alert before building; fake data and placeholder images only.

## Teardown (when the demo is done)
Disable then delete the distribution (wait for Deployed), delete the OAC, empty then delete the bucket.
