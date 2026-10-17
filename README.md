# MM VOICE

A Cloudflare Worker app for reading Burmese-language news, generating audio, and providing news feeds. Static files are served from `public/`, and data is stored in Cloudflare D1 through the `DB` binding.

## Requirements

- Node.js 22 and npm
- Wrangler CLI for local development (available through `npx wrangler`)
- A Cloudflare account and D1 database if you plan to deploy your own instance to Cloudflare
- The credentials required for the features you plan to use, such as Gemini, admin login, and social login

## Local setup

Run these commands from the project root:

```sh
npm ci
cp wrangler.example.toml wrangler.toml
cp .env.example .dev.vars
```

Fill in `.dev.vars` with your local values. In `wrangler.toml`, set `AUTH_PUBLIC_ORIGIN` to your local origin. If you use Firebase, configure the project ID and feature flags; otherwise, you can leave the sample flags set to `false`.

To apply the local D1 schema and migrations, run the tests, and start the Worker:

```sh
npx wrangler d1 migrations apply DB --local
npm test
npx wrangler dev
```

The D1 ID in `wrangler.example.toml` is a sample value for local use only. Replace it with your own database ID before deploying to your Cloudflare D1 database.

## Configuration and secrets

### Local development

`.env.example` is a template that lists the variable names you may need to set. The Cloudflare Worker runtime does not automatically read `.env` or `.env.example`. For local Wrangler development, copy `.env.example` to `.dev.vars` and put actual values only in `.dev.vars`. Do not add `.dev.vars` or `.env` to Git.

| Secret variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | A unique, long password for signing in to the admin panel |
| `GEMINI_API_KEY` | Gemini features in the news pipeline |
| `GEMINI_TTS_API_KEY` | Gemini TTS for Burmese audio generation |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google social login; both values are required to enable the provider |
| `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | Facebook social login; both values are required |
| `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET` | LINE Login; both values are required |

If you do not use the Gemini integration, you can leave its keys unset. A social login provider is enabled only when both its ID and secret are present. If you use one API key for both TTS and the news pipeline, make sure your Google/Gemini project has the required access for both.

### Public, non-secret settings

The following settings are non-secret app configuration values. Add them under `[vars]` in `wrangler.toml`:

- `AUTH_PUBLIC_ORIGIN` — the local or deployed origin used by the app
- `AUTH_FIREBASE_PROJECT_ID` — the Firebase project ID
- `AUTH_FIREBASE_EMAIL_ENABLED` — enable or disable Firebase email login (`"true"` or `"false"`)
- `AUTH_FIREBASE_GOOGLE_ENABLED` — enable or disable Firebase Google login (`"true"` or `"false"`)

Configure the callback URLs for Google, Facebook, and LINE OAuth in each provider's developer console to match your app's origin. Client IDs, App IDs, and Channel IDs are not API secrets, but the example files use placeholders only.

### Cloudflare Worker secrets and D1

The production Worker runtime does not automatically read an `.env` file uploaded to Cloudflare. Add secrets to the Worker's secret store instead. Configure `wrangler.toml` for your own account and app origin, then run the commands below one at a time. Enter each secret value when prompted.

```sh
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put GEMINI_TTS_API_KEY
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put FACEBOOK_APP_ID
npx wrangler secret put FACEBOOK_APP_SECRET
npx wrangler secret put LINE_CHANNEL_ID
npx wrangler secret put LINE_CHANNEL_SECRET
```

Set only the secrets required by the features and providers you intend to use. Never put secret values in `wrangler.toml`, `wrangler.example.toml`, source code, or Git commits.

D1 does not use a database password. The Worker connects through the `DB` binding configured under `[[d1_databases]]` in `wrangler.toml`. Local database state is stored in `.wrangler/`, which Git ignores. Create your own D1 database in Cloudflare and put the ID returned by Wrangler in `database_id`. Then review and apply migrations to your own database.

```sh
npx wrangler d1 create mm-voice
# Add the ID returned by the command above to wrangler.toml before continuing:
npx wrangler d1 migrations apply DB --remote
npx wrangler deploy
```

The `--remote` command changes Cloudflare D1. Verify that the database ID is correct before running it.

## Tests

```sh
npm test
```

## Git and secrets

`.gitignore` excludes `.env`, `.dev.vars`, `wrangler.toml`, Wrangler local state, dependencies, and production verification artifacts. `.env.example` and `wrangler.example.toml` contain placeholders only. Review the files you are about to add to Git before your initial commit. `.gitignore` cannot remove a file that was committed previously from the repository history. If a secret has ever entered public Git history, rotate the original key or password as well as removing the file.

## Open-source license

This project is distributed under the MIT License. See the [LICENSE](LICENSE) file for details.
