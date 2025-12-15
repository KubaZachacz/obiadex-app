## Running E2E locally

- **Install browsers**: `npm run test:e2e:install`
- **Create local env**: copy `env.e2e.example` to `.env.e2e` and fill values
- **Run headless**: `npm run test:e2e`
- **Run headed**: `npm run test:e2e:headed`
- **Open UI runner**: `npm run test:e2e:ui`

## Environment variables

Playwright loads the first existing file from:

- `PLAYWRIGHT_ENV_FILE` (if set)
- `.env.e2e`
- `.env.test`
- `.env`

You can also provide everything via the environment (e.g. GitHub Actions secrets).
