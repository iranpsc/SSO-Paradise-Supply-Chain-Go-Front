import { test, expect } from "@playwright/test";

const user = {
  id: 1,
  name: "Test member",
  username: "member",
  email: "member@example.com",
  code: null,
  wallet_address: null,
  email_verified_at: null,
  created_at: "2026-10-01T00:00:00Z",
};

test("verification reload never sends email and manual resend keeps its cooldown", async ({
  page,
}) => {
  await page.clock.install();
  await page.route("**/api/account", (route) =>
    route.fulfill({ json: { data: user } }),
  );
  let sent = 0;
  await page.route("**/api/email/verification-notification", (route) => {
    sent++;
    return route.fulfill({ json: { message: "پیوند تأیید ارسال شد." } });
  });
  await page.goto("/email/verify");
  const resend = page.getByRole("button", { name: /ارسال مجدد تا/ });
  await expect(resend).toBeDisabled();
  await page.reload();
  await expect(resend).toBeDisabled();
  expect(sent).toBe(0);
  await page.clock.fastForward(61_000);
  await page.getByRole("button", { name: "ارسال دوبارهٔ پیوند تأیید" }).click();
  await expect(page.getByRole("status")).toContainText("پیوند تأیید ارسال شد");
  expect(sent).toBe(1);
  await expect(resend).toBeDisabled();
  await page.reload();
  await expect(resend).toBeDisabled();
  expect(sent).toBe(1);
});

for (const approve of [true, false]) {
  test(`OAuth consent ${approve ? "approval" : "denial"} uses the stored request token`, async ({
    page,
  }) => {
    await page.route("**/api/account", (route) =>
      route.fulfill({ json: { data: user } }),
    );
    let decision: unknown;
    await page.route("**/api/oauth/consent", (route) => {
      if (route.request().method() === "GET")
        return route.fulfill({
          json: {
            client: {
              name: "External client",
              redirect_uris: ["http://localhost:3100/password/reset"],
            },
            scopes: [],
            auth_token: "stored-token",
          },
        });
      decision = route.request().postDataJSON();
      return route.fulfill({
        json: {
          redirect: `http://localhost:3100/password/reset?${approve ? "code=approved" : "error=access_denied"}`,
        },
      });
    });
    await page.goto("/authorize");
    await expect(page.getByText(/External client/)).toBeVisible();
    await page
      .getByRole("button", { name: approve ? "تأیید دسترسی" : "رد درخواست" })
      .click();
    await expect(page).toHaveURL(
      approve ? /code=approved/ : /error=access_denied/,
    );
    expect(decision).toEqual({ auth_token: "stored-token", approve });
  });
}
