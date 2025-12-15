import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile() {
  const explicitEnvFile = process.env.PLAYWRIGHT_ENV_FILE?.trim();
  const candidateFiles = [explicitEnvFile, ".env.e2e", ".env.test", ".env"].filter(Boolean) as string[];

  for (const relativeFile of candidateFiles) {
    const absoluteFile = path.resolve(__dirname, relativeFile);
    if (!fs.existsSync(absoluteFile)) continue;
    dotenv.config({ path: absoluteFile, override: false });
    // Only load the first env file found to keep precedence predictable.
    break;
  }
}

loadEnvFile();

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 2 * 60 * 1000,
  },
});
