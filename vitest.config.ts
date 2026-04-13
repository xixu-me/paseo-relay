import { resolve } from "node:path";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: "./wrangler.jsonc",
      },
    }),
  ],
  resolve: {
    alias: {
      "@getpaseo/relay/cloudflare": resolve(
        __dirname,
        "./node_modules/@getpaseo/relay/dist/cloudflare-adapter.js",
      ),
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
    pool: "@cloudflare/vitest-pool-workers",
  },
});
