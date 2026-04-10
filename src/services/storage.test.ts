import assert from "node:assert/strict";
import test from "node:test";

import {
  createPublicMediaUrl,
  resolveStoredMediaPath,
} from "@/services/storage";

test("stored media paths stay inside the configured pending/public buckets", () => {
  const pendingPath = resolveStoredMediaPath("pending/2026/04/example.jpg");
  const publicPath = resolveStoredMediaPath("public/2026/04/example.jpg");

  assert.match(pendingPath, /pending/);
  assert.match(publicPath, /public/);
});

test("stored media path resolution rejects traversal attempts", () => {
  assert.throws(
    () => resolveStoredMediaPath("public/../../secrets.txt"),
    /Invalid storage path|Unsafe storage path|Invalid storage bucket/,
  );
});

test("only public media can receive a public URL", () => {
  assert.equal(
    createPublicMediaUrl("public/2026/04/example.jpg"),
    "/media/public/2026/04/example.jpg",
  );

  assert.throws(
    () => createPublicMediaUrl("pending/2026/04/example.jpg"),
    /Only public media can be exposed/,
  );
});
