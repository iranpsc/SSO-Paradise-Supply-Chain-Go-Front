import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

for (const verified of [true, false]) {
  test(`OAuth returns to its client after login (verified=${verified})`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    if (!/^paradise_e2e_\d+_\d+$/.test(process.env.MYSQL_DATABASE ?? ""))
      throw new Error("OAuth fixtures require an isolated test database");
    const callback = "http://localhost:3201/callback?existing=1";
    const client = JSON.parse(
      execFileSync(
        "go",
        [
          "run",
          "./cmd/manage",
          "client:create",
          "--name",
          "OAuth browser regression",
          "--redirect-uri",
          callback,
          "--public",
        ],
        {
          cwd: path.resolve(
            process.env.SSO_BACKEND_DIR ?? "../SSO-Paradise-Supply-Chain-Go",
          ),
          env: process.env,
          encoding: "utf8",
        },
      ),
    );
    const email = `oauth-${Date.now()}@example.com`;
    const password = "SecurePass!2026";
    const registered = await page.request.post("/api/register", {
      headers: { Origin: "http://localhost:3100" },
      data: {
        username: `oauth_${Date.now()}`,
        name: "OAuth Test",
        email,
        password,
        password_confirmation: password,
      },
    });
    expect(registered.ok()).toBeTruthy();
    let verification = "";
    for (const file of await readdir(process.env.TEST_MAIL_DIRECTORY!)) {
      const content = await readFile(
        path.join(process.env.TEST_MAIL_DIRECTORY!, file),
        "utf8",
      );
      if (content.includes(`To: ${email}`) && content.includes("/email/verify"))
        verification = content.match(/http:\/\/localhost:3100\/[^\s]+/)![0];
    }
    expect(verification).not.toBe("");
    if (verified) await page.request.get(verification);
    await page.context().clearCookies();
    const verifier = "v".repeat(43);
    const state = "origin-state&encoded=+value";
    const intended =
      "/oauth/authorize?" +
      new URLSearchParams({
        response_type: "code",
        client_id: String(client.client_id),
        redirect_uri: callback,
        state,
        code_challenge: createHash("sha256")
          .update(verifier)
          .digest("base64url"),
        code_challenge_method: "S256",
      });
    await page.route("http://localhost:3201/callback?*", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<h1>Callback received</h1>",
      }),
    );
    await page.goto("http://127.0.0.1:8180" + intended);
    await expect(page).toHaveURL(/localhost:3100\/login\?/);
    expect(new URL(page.url()).searchParams.get("return_to")).toBe(intended);
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill(password);
    await page
      .getByRole("button", { name: "ورود به حساب", exact: true })
      .click();
    if (!verified) {
      await expect(page).toHaveURL(/\/email\/verify/);
      await page.goto(verification);
    }
    await expect(page).toHaveURL(/\/authorize$/);
    await page
      .getByRole("button", { name: "تأیید دسترسی", exact: true })
      .click();
    await expect(page).toHaveURL(/localhost:3201\/callback\?/);
    const returned = new URL(page.url());
    expect(returned.searchParams.get("state")).toBe(state);
    expect(returned.searchParams.get("existing")).toBe("1");
    expect(returned.searchParams.get("code")).toBeTruthy();
    const token = await page.request.post("http://127.0.0.1:8180/oauth/token", {
      form: {
        grant_type: "authorization_code",
        client_id: String(client.client_id),
        code: returned.searchParams.get("code")!,
        redirect_uri: callback,
        code_verifier: verifier,
      },
    });
    expect(token.status()).toBe(200);
    expect((await token.json()).access_token).toBeTruthy();
  });
}
