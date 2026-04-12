import { defineConfig, devices } from "playwright/test";

const PORT = 3000;

export default defineConfig({
  testDir: "./playwright",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command:
      "NODE_ENV=development MOCK_MODE=true NEXT_PUBLIC_MOCK_MODE=true POSTGRES_URL= POSTGRES_PRISMA_URL= POSTGRES_URL_NON_POOLING= DATABASE_URL= APP_URL=http://localhost:3000 DATA_DIR=./data npx next dev -H 127.0.0.1 -p 3000",
    port: PORT,
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: String(PORT),
      NODE_ENV: "development",
      APP_URL: `http://localhost:${PORT}`,
      APP_NAME: "RelataUFSC",
      DATA_DIR: "./data",
      MOCK_MODE: "true",
      NEXT_PUBLIC_MOCK_MODE: "true",
      // keep defaults for the rest; mock mode bypasses external integrations
    },
  },
});
