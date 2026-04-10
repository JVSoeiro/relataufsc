import assert from "node:assert/strict";
import test from "node:test";

import { createModerationToken, readModerationToken } from "@/services/tokens";

test("moderation tokens validate the expected purpose", () => {
  const token = createModerationToken({
    complaintId: "cmp_test",
    purpose: "approve",
  });
  const result = readModerationToken(token, {
    expectedPurpose: "approve",
    expectedComplaintId: "cmp_test",
  });

  assert.equal(result.ok, true);
});

test("moderation tokens fail safely if tampered", () => {
  const token = createModerationToken({
    complaintId: "cmp_test",
    purpose: "approve",
  });
  const tamperedToken = `${token.slice(0, -1)}x`;
  const result = readModerationToken(tamperedToken, {
    expectedPurpose: "approve",
  });

  assert.deepEqual(result, {
    ok: false,
    reason: "invalid",
  });
});

test("moderation tokens expire", () => {
  const token = createModerationToken({
    complaintId: "cmp_test",
    purpose: "approve",
    expiresAt: Date.now() - 1_000,
  });
  const result = readModerationToken(token, {
    expectedPurpose: "approve",
  });

  assert.deepEqual(result, {
    ok: false,
    reason: "expired",
  });
});

test("preview tokens cannot be used as approval tokens", () => {
  const token = createModerationToken({
    complaintId: "cmp_test",
    purpose: "preview",
  });
  const result = readModerationToken(token, {
    expectedPurpose: "approve",
  });

  assert.deepEqual(result, {
    ok: false,
    reason: "invalid",
  });
});
