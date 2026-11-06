import { test, expect, type Page } from "@playwright/test";

const user = {
  id: 17, name: "Entry Test", username: "entry_test", email: "entry@example.test",
  email_verified_at: "2026-10-25T10:00:00Z", created_at: "2026-10-25T10:00:00Z",
  code: "HM-17", wallet_address: null,
};
async function session(page: Page, verified = true) {
  await page.route("**/api/legacy/flash", route => route.fulfill({ json: {} }));
  await page.route("**/api/account", route => route.fulfill({
    json: { data: { ...user, email_verified_at: verified ? user.email_verified_at : null } },
  }));
}

for (const path of ["/login", "/register"]) {
  test(`authenticated user opening ${path} goes to home`, async ({ page }) => {
    await session(page);
    await page.goto(path);
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.locator('[name="password"]')).toHaveCount(0);
  });
}

test("unverified existing session goes to verification", async ({ page }) => {
  await session(page, false);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/email\/verify$/);
  await expect(page.locator('[name="password"]')).toHaveCount(0);
});

for (const source of ["query", "storage"]) {
  test(`existing session resumes safe OAuth from ${source} without login`, async ({ page }) => {
    await session(page);
    const intended = "/oauth/authorize?client_id=17&response_type=code&state=keep-state";
    if (source === "storage") await page.addInitScript(({ value }) => { if (location.pathname === "/login") sessionStorage.setItem("sso:return_to", value); }, { value: intended });
    let documentNavigation = false;
    await page.route("**/oauth/authorize?**", route => {
      documentNavigation = route.request().isNavigationRequest();
      return route.fulfill({ contentType: "text/html", body: "<h1>OAuth resumed</h1>" });
    });
    await page.goto("/login" + (source === "query" ? "?return_to=" + encodeURIComponent(intended) : ""));
    await expect(page.getByRole("heading", { name: "OAuth resumed" })).toBeVisible();
    expect(documentNavigation).toBe(true);
    expect(new URL(page.url()).searchParams.get("state")).toBe("keep-state");
    expect(await page.evaluate(() => sessionStorage.getItem("sso:return_to"))).toBeNull();
  });
}

test("external return_to cannot redirect an authenticated user", async ({ page }) => {
  await session(page);
  await page.goto("/login?return_to=" + encodeURIComponent("https://untrusted.example/callback"));
  await expect(page).toHaveURL(url => url.pathname === "/home");
});

test("guest form waits for session lookup before becoming available", async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/account", async route => {
    await pending;
    await route.fulfill({ status: 401, json: { message: "Unauthenticated" } });
  });
  await page.goto("/login");
  await expect(page.locator('[name="password"]')).toHaveCount(0);
  release();
  await expect(page.locator('[name="password"]')).toBeVisible();
});

test("failed session lookup can be retried instead of assuming guest access", async ({ page }) => {
  let unavailable = true;
  await page.route("**/api/account", route => route.fulfill({
    status: unavailable ? 503 : 401,
    json: { message: unavailable ? "سرویس در دسترس نیست." : "Unauthenticated" },
  }));
  await page.goto("/login");
  await expect(page.locator('[name="password"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: /تلاش دوباره/ })).toBeVisible();
  unavailable = false;
  await page.getByRole("button", { name: /تلاش دوباره/ }).click();
  await expect(page.locator('[name="password"]')).toBeVisible();
});
