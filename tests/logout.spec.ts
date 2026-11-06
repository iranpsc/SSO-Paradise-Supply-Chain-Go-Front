import { test, expect } from "@playwright/test";

test("an authenticated browser session is revoked by logout", async ({
  page,
}) => {
  await page.goto("/login");
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const registration = await page.request.post(
    "http://localhost:3100/api/register",
    {
      data: {
        username: `logout_${suffix}`,
        name: "Logout test user",
        email: `logout-${suffix}@example.com`,
        password: "SecurePass!2026",
        password_confirmation: "SecurePass!2026",
      },
    },
  );
  expect(registration.status()).toBe(201);
  expect((await page.request.get("http://localhost:3100/api/account")).status()).toBe(200);

  await page.goto("/email/verify");
  await expect(page).toHaveURL(/\/email\/verify$/);
  const logout = page.getByRole("button", { name: "خروج", exact: true });
  await expect(logout).toBeVisible();
  const logoutResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/logout") &&
      response.request().method() === "POST",
  );
  await logout.click();

  expect((await logoutResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("link", { name: "ورود", exact: true })).toBeVisible();
  expect((await page.request.get("http://localhost:3100/api/account")).status()).toBe(401);
});

test("an expired session during logout returns the user to login", async ({
  page,
}) => {
  const user = {
    id: 1,
    name: "Signed in user",
    username: "signed_in",
    email: "signed-in@example.com",
    code: "hm-2000001",
    wallet_address: null,
    email_verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  await page.route("**/api/account", (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ json: { data: user } })
      : route.fallback(),
  );
  await page.route("**/api/logout", (route) =>
    route.fulfill({ status: 401, json: { message: "Unauthenticated." } }),
  );

  await page.goto("/home");
  const logout = page.getByRole("button", { name: "خروج", exact: true });
  await expect(logout).toBeVisible();
  await logout.click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("link", { name: "ورود", exact: true })).toBeVisible();
});
