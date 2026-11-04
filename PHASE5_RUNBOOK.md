# Phase 5 runbook: GitHub Actions deploy (OIDC) and a CloudWatch alarm

Region us-east-2. Replace `ACCOUNT_ID` with your 12-digit AWS account ID (find it under your name, top right of the console). Never commit it. Tick a box only when you did it.

## A. IAM: identity provider for GitHub
- [ ] IAM > Identity providers > Add provider.
- [ ] Provider type: OpenID Connect. Provider URL: `https://token.actions.githubusercontent.com`. Audience: `sts.amazonaws.com`. Add provider.
  (If it says the provider already exists, skip this step.)

## B. IAM: deploy role
- [ ] IAM > Roles > Create role > Web identity.
- [ ] Identity provider: `token.actions.githubusercontent.com`. Audience: `sts.amazonaws.com`. Next. (The wizard may also ask for GitHub org/repo/branch: org `Dayshawn21`, repo `hennessy-aws-demo`, branch `main`. We replace the trust policy next anyway.) Skip permissions for now, name the role `hennessy-demo-github-deploy`, Create role.
- [ ] Open the role > Trust relationships > Edit trust policy > paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:Dayshawn21/hennessy-aws-demo:ref:refs/heads/main"
      }
    }
  }]
}
```

- [ ] Permissions tab > Add permissions > Create inline policy > JSON > paste (replace `ACCOUNT_ID`), name it `deploy-site`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::hennessy-demo-dt-48213"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::hennessy-demo-dt-48213/*"
    },
    {
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/EMU8N0CEG5PZL"
    }
  ]
}
```

- [ ] Copy the role ARN from the role's summary (`arn:aws:iam::ACCOUNT_ID:role/hennessy-demo-github-deploy`).

## C. GitHub: store the role ARN
The ARN contains your account ID, so use a secret (masked in logs), not a variable.
- [ ] github.com/Dayshawn21/hennessy-aws-demo > Settings > Secrets and variables > Actions > New repository secret.
- [ ] Name `AWS_DEPLOY_ROLE_ARN`, value = the role ARN. Add secret.
(This is not an AWS key; it is only the name of the role GitHub may assume.)

## D. Push the workflow, run it
- [ ] Tell me when ready; I will ask before pushing `.github/workflows/deploy.yml` to the public repo.
- [ ] GitHub > Actions tab > "Deploy to AWS" > Run workflow > branch `main` > Run.
- [ ] Open the run and paste the failing step's exact error text here if it goes red. Do not paste the account ID.
- [ ] After green: open https://d3vxtn9s8u8bor.cloudfront.net, hard refresh, click a route, refresh on `/sessions` to check it still loads.
- [ ] Once one run succeeds, we add `push: branches: [main]` to the workflow.

Common failures:
- `Not authorized to perform sts:AssumeRoleWithWebIdentity`: trust policy `sub` or provider ARN is wrong, or the run was not on `main`.
- `Credentials could not be loaded`: secret name misspelled or missing.
- `AccessDenied` on S3 or CloudFront: policy resource typo or `ACCOUNT_ID` left in.

## E. CloudWatch alarms (one per Lambda)
Do this twice: for `hennessy-demo-create-inquiry` and `hennessy-demo-bookings`.
- [ ] (Once, optional email) SNS > Topics > Create topic > Standard > name `hennessy-demo-alerts` > Create. Then Create subscription > Protocol Email > your address > Create. Open the confirmation email and click Confirm.
- [ ] CloudWatch > Alarms > All alarms > Create alarm > Select metric > Lambda > By Function Name > tick `Errors` for the function > Select metric.
- [ ] Statistic `Sum`, period `5 minutes`. Next.
- [ ] Conditions: Static, Greater/Equal, threshold `1`. Next.
- [ ] Notification: In alarm > select existing SNS topic `hennessy-demo-alerts` (or remove the notification to skip email). Next.
- [ ] Name `hennessy-demo-create-inquiry-errors` (second: `hennessy-demo-bookings-errors`). Create alarm.
- [ ] Missing data treatment: leave default or choose "Treat missing data as good" (no invocations = no data = fine).
- [ ] Optional test: Lambda > Test with an event that makes it throw, or send a malformed request; the metric can take a few minutes to show. A validation 400 is not a Lambda error, so it will not trigger the alarm.
