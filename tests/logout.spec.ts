import { test, expect } from "@playwright/test";

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
