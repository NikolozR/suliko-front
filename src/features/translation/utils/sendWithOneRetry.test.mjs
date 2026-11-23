import test from "node:test";
import assert from "node:assert/strict";
import { sendWithOneRetry } from "./sendWithOneRetry.ts";

const res = (status) => ({ status });
const script = (...steps) => {
  let calls = 0;
  const send = async () => {
    const step = steps[Math.min(calls++, steps.length - 1)];
    if (step instanceof Error) throw step;
    return res(step);
  };
  return { send, calls: () => calls };
};

test("a good answer is returned at once", async () => {
  const s = script(200);
  assert.equal((await sendWithOneRetry(s.send, "t", undefined, 1)).status, 200);
  assert.equal(s.calls(), 1);
});

test("a network error is retried once and the second answer is used", async () => {
  const s = script(new TypeError("Failed to fetch"), 200);
  assert.equal((await sendWithOneRetry(s.send, "t", undefined, 1)).status, 200);
  assert.equal(s.calls(), 2);
});

test("a 503 is retried once, then the second answer is returned even if it is bad again", async () => {
  const s = script(503, 503);
  assert.equal((await sendWithOneRetry(s.send, "t", undefined, 1)).status, 503);
  assert.equal(s.calls(), 2);
});

test("a rejected request (400) is not repeated", async () => {
  const s = script(400);
  assert.equal((await sendWithOneRetry(s.send, "t", undefined, 1)).status, 400);
  assert.equal(s.calls(), 1);
});

test("a request cancelled on purpose is not repeated", async () => {
  const abort = Object.assign(new Error("aborted"), { name: "AbortError" });
  const s = script(abort, 200);
  await assert.rejects(() => sendWithOneRetry(s.send, "t", undefined, 1), { name: "AbortError" });
  assert.equal(s.calls(), 1);
});

test("cancelling during the pause stops the retry", async () => {
  const controller = new AbortController();
  const s = script(new TypeError("Failed to fetch"), 200);
  const pending = sendWithOneRetry(s.send, "t", controller.signal, 20);
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(s.calls(), 1);
});
