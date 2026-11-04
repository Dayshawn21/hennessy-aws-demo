# AWS demo plan: inquiry and booking-request dashboard (portfolio demo only)

Scope decided Nov 3, 2026: **demo only**. Hennessy said it is fine not to use Pixieset, and this demo does not change the live site. `AGENTS.md` still records Pixieset as the real booking and gallery system, so it stays as is.

This file is a plan. Nothing in `site/` is changed by it.

## Ground rules
- **Work on a separate copy** of the site, for example `C:\dev\hennessy-aws-demo`. Do not edit this folder's `site/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs` and `tests/sites-worker.test.mjs` intact here so the Sites handoff keeps working.
- **Fake data only.** Seed fake inquiries and bookings. Never put a real client's name, email or phone in the demo or in a public repo.
- **Photos belong to Hennessy.** Use placeholder images in any public repo or live demo, unless Hennessy agrees in writing.
- **No payments, no galleries.** Out of scope.
- **Billing alert first.** Create an AWS budget alert before building anything. Delete resources when the demo is done.
- **Claim only what you finish.** Add to your CV only what is deployed and working.

## Architecture
React site (S3 + CloudFront) -> API Gateway (HTTP API) -> Lambda (Node.js, TypeScript) -> DynamoDB. Cognito protects the admin routes. CloudWatch holds Lambda logs. GitHub Actions deploys.

## Phase 0: make the copy (30 min)
1. Copy the project to `C:\dev\hennessy-aws-demo` and open it in a new git repo.
2. Run `npm install` and `npm run build` inside `site/`. Per `AGENTS.md`, the build leaves `dist/client/index.html`.
3. Replace real photos with placeholders if the repo will be public.

## Phase 1: host the site on S3 + CloudFront (Thursday goal)
1. Create a private S3 bucket. Upload the contents of `dist/client`.
2. Create a CloudFront distribution with the bucket as origin, using Origin Access Control so the bucket stays private.
3. Add custom error responses so 403 and 404 return `/index.html` with status 200. The site has routes like `/sessions` and `/work`, and they break on refresh without this.
4. Open the CloudFront URL and click through every route.
You can now truthfully say: "I deployed a React app to S3 and CloudFront."

## Phase 2: inquiry API
1. Create a DynamoDB table (on-demand). Partition key `pk`, sort key `sk`. Inquiry item: `pk = INQ#<id>`, `sk = META`, plus fields for name, email, service, who is booking (graduate or parent), message, status (`new`), created time.
2. Write a Lambda in TypeScript: validate the body, keep the existing honeypot idea (`company` field must be empty), write the item.
3. Put it behind an API Gateway HTTP API route `POST /inquiries`, with CORS for your CloudFront domain and throttling on.
4. In the demo copy only, change `src/formAdapter.js` to call that URL instead of simulating.
5. Check the item appears in DynamoDB and the logs appear in CloudWatch.

## Phase 3: availability and booking requests
1. Slot items: `pk = SLOT#<date>`, `sk = <time>`, `status = open`.
2. Booking request Lambda: a **conditional write** that flips a slot from `open` to `requested` only if it is still `open`. If it fails, return a clear "that time was just taken" message. This is your no-double-booking story.
3. Admin Lambda routes: list requests, confirm (`booked`) or decline (back to `open`).
4. Test with two parallel requests for one slot. Exactly one should succeed.

## Phase 4: Cognito and the admin dashboard
1. Create a Cognito user pool with groups: `admin`.
2. Add a JWT authorizer on the admin API routes.
3. Add `/admin` routes in the React app, written in TypeScript. Sign in with the Cognito hosted UI (authorization code with PKCE) or an Auth library.
4. Dashboard: inquiry and booking list, status changes, notes, and simple charts (inquiries by service, by city, graduate vs parent). Chart.js is fine.
5. Confirm a signed-out visitor gets 401 on admin routes.

## Phase 5: deploy and observe
1. GitHub Actions: build and sync `dist/client` to S3, then invalidate CloudFront. Use GitHub OIDC with an AWS IAM role, not long-lived keys.
2. CloudWatch: a log group per Lambda and one alarm on Lambda errors.
3. Optional later: move to AWS SAM or CDK so the stack is code. Do the console version first to learn the pieces.

## Phase 6: finish
1. README with an architecture diagram, the list of AWS services, how to run it, and a screenshot.
2. Seed script for fake inquiries and slots.
3. Teardown notes. Delete resources afterward to avoid charges.

## What to add to your CV and profile, only once built
- Hosted a React app on AWS (S3, CloudFront).
- Built a TypeScript Lambda API with DynamoDB, including conditional writes to prevent double booking.
- Added Cognito authentication with an admin dashboard.
- Deployed with GitHub Actions and monitored with CloudWatch.
Tell the assistant what is actually deployed and it will add exactly that.

## Interview talking points
- Why DynamoDB conditional writes: two people cannot take one slot.
- Why a private bucket behind CloudFront.
- Why OIDC for GitHub Actions instead of stored keys.
- How you kept real client data out of the demo.
- What you would add for a live version: payments through a hosted checkout, galleries, and Hennessy's sign-off.

## Thursday (Nov 5): realistic scope
Phase 0 and Phase 1 only, plus the start of Phase 2 if there is time. The rest comes after the interview.
