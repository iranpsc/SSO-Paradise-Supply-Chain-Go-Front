import { test, expect } from "@playwright/test";

test("login validates fields, blocks invalid submission and locks while sending", async ({
  page,
}) => {
  await page.route("**/api/account", (route) =>
    route.fulfill({ status: 401, json: { message: "Unauthenticated" } }),
  );
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route("**/api/login", async (route) => {
    const payload = route.request().postDataJSON();
    expect(payload.email).toBe("member@example.com");
    expect(payload.password).toBe("existing-password");
    expect(payload.login).toBeUndefined();
    requests++;
    await pending;
    await route.fulfill({
      status: 422,
      json: {
        message: "اطلاعات معتبر نیست.",
        errors: { email: "ایمیل معتبر وارد کنید." },
      },
    });
  });
  await page.goto("/login");
  const submit = page.locator('button[type="submit"]');
  const email = page.locator('[name="email"]');
  const password = page.locator('[name="password"]');
  await expect(page.locator('[name="username"]')).toHaveCount(0);
  await expect(page.locator('[name="name"], [name="password_confirmation"]')).toHaveCount(0);
  await expect(submit).toBeDisabled();
  await expect(page.locator("#email-error")).toHaveCount(0);
  await email.click();
  await password.click();
  await expect(page.locator("#email-error")).toBeVisible();
  await email.fill("invalid name");
  await password.fill("existing-password");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(submit).toBeDisabled();
  await email.fill("member@example.com");
  await expect(page.locator("#email-error")).toHaveCount(0);
  await expect(submit).toBeEnabled();
  await expect(page.locator("#password-requirements")).toHaveCount(0);
  await password.fill("");
  await expect(page.locator("#password-error")).toBeVisible();
  await expect(password).toHaveCSS("border-top-color", "rgb(220, 38, 38)");
  await expect(submit).toBeDisabled();
  await password.fill("existing-password");
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(page.locator(".submit-spinner")).toBeVisible();
  await expect(email).toBeDisabled();
  release();
  await expect(page.locator("#email-error")).toContainText("ایمیل معتبر");
  await expect(submit).toBeDisabled();
  await email.fill("other@example.com");
  await expect(submit).toBeEnabled();
  expect(requests).toBe(1);
});
