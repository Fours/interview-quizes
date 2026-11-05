# Deploying

The site is a static build (`dist/`) hosted on **S3 behind CloudFront**:

- **Bucket:** `kylewillett.com`, objects under the `quiz/` prefix (`s3://kylewillett.com/quiz/`)
- **Region:** `us-east-1`
- **Served at a subdomain root** (e.g. `quiz.kylewillett.com`). CloudFront's
  **Origin Path** is set to `/quiz`, so the app sees itself at `/`. That's
  why Vite's `base` stays the default `/` and no path rewriting is needed.
- Bucket stays **private**; CloudFront reads it via an **Origin Access Control (OAC)**.

## One-time setup

1. **Install & configure the AWS CLI** with credentials that can deploy:
   ```bash
   aws configure
   ```
   The credentials need: `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on the
   bucket, and `cloudfront:CreateInvalidation` on the distribution. A ready-to-use
   least-privilege policy is in [`deploy/iam-policy.json`](deploy/iam-policy.json).
   See [IAM permissions](#iam-permissions) below.

2. **Provide your CloudFront distribution ID.** Copy the example config and fill it in
   (the real file is gitignored, so the ID never gets committed):
   ```bash
   cp scripts/deploy.config.local.example scripts/deploy.config.local
   # edit scripts/deploy.config.local and set CLOUDFRONT_DISTRIBUTION_ID
   ```
   Alternatively, export it in your shell instead of using the file:
   ```bash
   export CLOUDFRONT_DISTRIBUTION_ID=EXXXXXXXXXXXXX
   ```

3. **PostHog (optional).** `VITE_PUBLIC_POSTHOG_KEY` is baked in at build time, so make
   sure `.env.local` is set up on the machine you deploy from (see `.env.example`).
   Without it the deployed site simply runs without analytics.

## Deploy

```bash
npm run deploy
```

That runs [`scripts/deploy.sh`](scripts/deploy.sh), which:

1. **Builds** the site (`npm run build` → `dist/`).
2. **Syncs `assets/`** to `s3://kylewillett.com/quiz/assets/` with a 1-year immutable
   cache. Vite content-hashes these filenames, so they can be cached forever;
   `--delete` prunes old bundles.
3. **Syncs everything else from `public/`** (quiz `data/*.json`, `icons/*.svg`) with
   `Cache-Control: no-cache`. Their filenames never change, so caching them would
   hide quiz edits. `--delete` removes quizzes/icons you've deleted locally.
4. **Uploads `index.html`** with `Cache-Control: no-cache` so new deploys are
   picked up immediately.
5. **Invalidates CloudFront** (`/*`) so edge caches serve the new files.

## Config overrides

The script reads these from the environment or `scripts/deploy.config.local`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `CLOUDFRONT_DISTRIBUTION_ID` | *(required)* | Distribution to invalidate |
| `DEPLOY_BUCKET` | `kylewillett.com` | Target bucket |
| `DEPLOY_PREFIX` | `quiz` | Key prefix within the bucket |
| `DEPLOY_REGION` | `us-east-1` | Bucket region |

## IAM permissions

Give the deploying identity only what the script needs. Don't use your root
account or an admin/`AmazonS3FullAccess` identity. For a human deploying from a
laptop, **IAM Identity Center (SSO)** is preferred (short-lived credentials, no
stored secret key). A dedicated IAM user with access keys also works if you scope
it tightly and rotate the key periodically.

The least-privilege policy is in [`deploy/iam-policy.json`](deploy/iam-policy.json).
Before attaching it, replace the placeholders in the CloudFront statement:

- `ACCOUNT_ID`: your 12-digit AWS account ID
- `DIST_ID`: the CloudFront distribution ID (same one as `CLOUDFRONT_DISTRIBUTION_ID`)

It grants exactly what `scripts/deploy.sh` calls:

- `s3:ListBucket` on `kylewillett.com`, limited to the `quiz/` prefix (so `s3 sync` can diff)
- `s3:PutObject` / `s3:DeleteObject` under `quiz/*`
- `cloudfront:CreateInvalidation` on the one distribution

If `s3 sync` ever reports a permission error, add `s3:GetObject` on
`arn:aws:s3:::kylewillett.com/quiz/*`, since some sync comparisons use it.

**Tip:** attach it to a named profile rather than your shell default, e.g.
`aws configure --profile quiz-deploy`, then deploy with
`AWS_PROFILE=quiz-deploy npm run deploy`, so this limited identity isn't your
default credentials.

## Notes

- **If you ever serve the site under a URL path** (e.g. `kylewillett.com/quiz/`
  instead of a subdomain root), set `base: '/quiz/'` in `vite.config.ts` and
  rebuild. Otherwise the hashed assets will 404. (Quiz data and icon URLs in
  `src/quizData.ts` already follow `base` via `import.meta.env.BASE_URL`.)
- The CloudFront invalidation uses `/*`. Unlike the portfolio, narrowing it to
  `/index.html` isn't enough here, since the quiz `data/` and `icons/` files also
  change between deploys.
