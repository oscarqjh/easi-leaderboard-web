import { checkRateLimit, _resetRateLimitStore } from "./rate-limit";

const TWO_HOURS = 2 * 60 * 60 * 1000;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  PASS: ${message}`);
}

function runTests() {
  console.log("\n=== Rate Limiter Tests (Sliding Window) ===\n");

  // Test 1: First 5 submissions allowed
  console.log("Test 1: Allow first 5 submissions");
  _resetRateLimitStore();
  const t0 = 1000000000000; // fixed base time
  for (let i = 0; i < 5; i++) {
    const result = checkRateLimit("user-a", t0 + i * 1000);
    assert(result.allowed === true, `Submission ${i + 1} allowed`);
  }

  // Test 2: 6th submission blocked
  console.log("\nTest 2: Block 6th submission");
  const blocked = checkRateLimit("user-a", t0 + 5000);
  assert(blocked.allowed === false, "6th submission blocked");
  assert(typeof blocked.retryAfterMinutes === "number" && blocked.retryAfterMinutes > 0,
    `retryAfterMinutes is ${blocked.retryAfterMinutes}`);

  // Test 3: Different user independent
  console.log("\nTest 3: Different user is independent");
  assert(checkRateLimit("user-b", t0).allowed === true, "user-b allowed");

  // Test 4: Sliding window — after oldest expires, one slot opens
  console.log("\nTest 4: Sliding window — oldest expires, one slot opens");
  _resetRateLimitStore();
  // Submit 5 times, each 10 minutes apart
  const tenMin = 10 * 60 * 1000;
  for (let i = 0; i < 5; i++) {
    checkRateLimit("user-c", t0 + i * tenMin);
  }
  // At t0 + 50min: all 5 within window, blocked
  assert(checkRateLimit("user-c", t0 + 50 * 60 * 1000).allowed === false, "Blocked at t0+50min (all 5 within window)");

  // At t0 + 2hrs: first submission (t0) has expired, one slot opens
  assert(checkRateLimit("user-c", t0 + TWO_HOURS).allowed === true, "Allowed at t0+2hrs (first submission expired)");

  // But the next one is blocked (we now have 5 active again)
  assert(checkRateLimit("user-c", t0 + TWO_HOURS + 1000).allowed === false, "Blocked again (5 active submissions)");

  // At t0 + 2hrs + 10min: second submission (t0+10min) has expired
  assert(checkRateLimit("user-c", t0 + TWO_HOURS + tenMin).allowed === true, "Allowed at t0+2hrs+10min (second expired)");

  // Test 5: All 5 expire at different times
  console.log("\nTest 5: Gradual expiry of all submissions");
  _resetRateLimitStore();
  // Submit 5 at t0, t0+20m, t0+40m, t0+60m, t0+80m
  const twentyMin = 20 * 60 * 1000;
  for (let i = 0; i < 5; i++) {
    checkRateLimit("user-d", t0 + i * twentyMin);
  }
  // At t0+90min: still blocked (oldest is t0, expires at t0+2hrs)
  assert(checkRateLimit("user-d", t0 + 90 * 60 * 1000).allowed === false, "Blocked at t0+90min");

  // At t0+2hrs: oldest (t0) expired → 1 slot
  assert(checkRateLimit("user-d", t0 + TWO_HOURS).allowed === true, "1 slot at t0+2hrs");
  // At t0+2hrs+20min: second (t0+20m) expired → 1 slot
  assert(checkRateLimit("user-d", t0 + TWO_HOURS + twentyMin).allowed === true, "1 slot at t0+2hrs+20min");

  // Test 6: retryAfterMinutes reflects the oldest submission
  console.log("\nTest 6: retryAfterMinutes is accurate");
  _resetRateLimitStore();
  // Submit 5 at t0
  for (let i = 0; i < 5; i++) {
    checkRateLimit("user-e", t0);
  }
  // Check at t0 + 1hr → should say ~60 minutes
  const check = checkRateLimit("user-e", t0 + 60 * 60 * 1000);
  assert(check.allowed === false, "Blocked");
  assert(check.retryAfterMinutes === 60, `retryAfterMinutes is ${check.retryAfterMinutes} (expected 60)`);

  // Test 7: Burst then wait — full reset after all expire
  console.log("\nTest 7: Full reset after all submissions expire");
  _resetRateLimitStore();
  for (let i = 0; i < 5; i++) {
    checkRateLimit("user-f", t0);
  }
  // 2hrs + 1ms later: all expired, get full 5 again
  for (let i = 0; i < 5; i++) {
    assert(checkRateLimit("user-f", t0 + TWO_HOURS + 1 + i).allowed === true, `Fresh submission ${i + 1} after full expiry`);
  }
  assert(checkRateLimit("user-f", t0 + TWO_HOURS + 100).allowed === false, "Blocked again after 5 fresh submissions");

  console.log("\n=== All tests passed! ===\n");
}

runTests();
