import { readLimitedBody } from "./read-limited-body.ts";

Deno.test("reads a request body within the byte limit", async () => {
  const request = new Request("https://example.test", {
    method: "POST",
    body: "small payload",
  });
  const result = await readLimitedBody(request, 32);
  if (result !== "small payload") throw new Error("Expected body content to be preserved");
});

Deno.test("counts UTF-8 bytes rather than JavaScript characters", async () => {
  const request = new Request("https://example.test", {
    method: "POST",
    body: "বাংলা",
  });
  const result = await readLimitedBody(request, 15);
  if (result !== "বাংলা") throw new Error("Expected multibyte UTF-8 body to fit");
});

Deno.test("rejects an oversized streamed body before buffering it completely", async () => {
  const encoder = new TextEncoder();
  const request = new Request("https://example.test", {
    method: "POST",
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("123456"));
        controller.enqueue(encoder.encode("789012"));
        controller.close();
      },
    }),
  });
  const result = await readLimitedBody(request, 10);
  if (result !== null) throw new Error("Expected oversized body to be rejected");
});

Deno.test("rejects a declared oversized body before reading", async () => {
  let pulled = false;
  const request = new Request("https://example.test", {
    method: "POST",
    headers: { "content-length": "100" },
    body: new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled = true;
        controller.enqueue(new TextEncoder().encode("ok"));
        controller.close();
      },
    }),
  });
  const result = await readLimitedBody(request, 10);
  if (result !== null) throw new Error("Expected declared oversized body to be rejected");
  if (pulled) throw new Error("Expected the body stream not to be read");
});

Deno.test("returns an empty string when a request has no body", async () => {
  const request = new Request("https://example.test", { method: "POST" });
  const result = await readLimitedBody(request, 10);
  if (result !== "") throw new Error("Expected an empty body");
});
