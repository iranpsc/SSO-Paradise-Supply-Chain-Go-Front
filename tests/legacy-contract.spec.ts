import { test, expect } from "@playwright/test";

test("legacy endpoints reach Go through the independent frontend", async ({ request }) => {
  const nonce = await request.get(`/web3/nonce?address=0x${"a".repeat(40)}`);
  expect(nonce.status()).toBe(200);
  expect((await nonce.json()).nonce).toContain("Sign in to Laravel at localhost.");
  const csrf = await request.get("/sanctum/csrf-cookie");
  expect(csrf.status()).toBe(204);
  expect(csrf.headersArray().some((header) => header.name.toLowerCase() === "set-cookie" && header.value.startsWith("XSRF-TOKEN="))).toBe(true);
  const denied = await request.post("/web3/verify", { data: { address: `0x${"a".repeat(40)}`, signature: `0x${"b".repeat(130)}` }, headers: { Accept: "application/json" } });
  expect(denied.status()).toBe(419);
  const login = await request.post("/api/login", { form: { email: "nobody@example.com", password: "wrong", unknown: "ignored" } });
  expect(login.status()).toBe(401);
  expect(await login.json()).toEqual({ message: "Invalid credentials" });
  const action = await request.post("/account", { form: { _method: "PATCH", name: "Test", email: "nobody@example.com" }, headers: { "Sec-Fetch-Site": "same-origin", Accept: "application/json" } });
  expect(action.status()).toBe(401);
  expect(await action.json()).toEqual({ message: "Unauthenticated." });
});

test("Laravel forgot-password page retains its original address", async ({ page }) => {
  await page.goto("/password/reset");
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toHaveCount(0);
  await expect(page).toHaveURL(/\/password\/reset$/);
});
