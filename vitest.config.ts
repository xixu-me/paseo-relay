import { resolve } from "node:path";
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
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
    poolOptions: {
      workers: {
        wrangler: {
          configPath: "./wrangler.jsonc",
        },
      },
    },
  },
});
