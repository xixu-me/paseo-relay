import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("paseo relay worker", () => {
  it("returns health status from /health", async () => {
    const response = await SELF.fetch("http://example.com/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });

  it("returns 404 for unknown paths", async () => {
    const response = await SELF.fetch("http://example.com/missing");

    expect(response.status).toBe(404);
  });

  it("rejects websocket requests without a serverId", async () => {
    const response = await SELF.fetch("http://example.com/ws?role=server&v=1");

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toContain("Missing serverId");
  });

  it("rejects websocket requests with an invalid relay version", async () => {
    const response = await SELF.fetch(
      "http://example.com/ws?role=server&serverId=daemon-1&v=999",
    );

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toContain("Invalid v parameter");
  });

  it("rejects non-websocket upgrades at the durable object relay endpoint", async () => {
    const response = await SELF.fetch(
      "http://example.com/ws?role=server&serverId=daemon-1&v=1",
    );

    expect(response.status).toBe(426);
    await expect(response.text()).resolves.toContain("Expected WebSocket upgrade");
  });

  it("upgrades a valid websocket relay request", async () => {
    const response = await SELF.fetch("http://example.com/ws?role=server&serverId=daemon-1&v=1", {
      headers: {
        Upgrade: "websocket",
      },
    });

    expect(response.status).toBe(101);
    expect(response.webSocket).toBeDefined();
  });

  it("upgrades a valid websocket relay v2 control request", async () => {
    const response = await SELF.fetch("http://example.com/ws?role=server&serverId=daemon-1&v=2", {
      headers: {
        Upgrade: "websocket",
      },
    });

    expect(response.status).toBe(101);
    expect(response.webSocket).toBeDefined();
  });
});
