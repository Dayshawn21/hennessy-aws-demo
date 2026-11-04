import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = "http://127.0.0.1:4173";
const routes = ["/", "/sessions", "/business", "/work", "/about", "/contact"];
const viewports = [
  { name: "desktop", width: 1440, height: 1100 },
  { name: "tablet", width: 1024, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const browser = await chromium.launch({ channel: "msedge" });
const failures = [];

async function revealLazyImages(page) {
  await page.evaluate(async () => {
    const pause = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));
    for (let y = 0; y < document.documentElement.scrollHeight; y += Math.max(300, window.innerHeight * 0.75)) {
      window.scrollTo({ top: y, behavior: "instant" });
      await pause(120);
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
    await pause(600);
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(500);
}

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (message) => message.type() === "error" && consoleErrors.push(message.text()));
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));

  for (const route of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await revealLazyImages(page);
    // Every scroll reveal must finish and clean up, or content would stay hidden.
    await page.waitForFunction(() => document.querySelectorAll(".reveal").length === 0, null, { timeout: 5000 })
      .catch(() => failures.push(`${viewport.name} ${route} left content hidden behind a scroll reveal`));

    const metrics = await page.evaluate(() => ({
      title: document.title,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src),
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      mainCount: document.querySelectorAll("main").length,
    }));

    assert.ok(metrics.title.includes("Hennessy Williams"), `${route} title is missing`);
    assert.ok(metrics.overflow <= 1, `${viewport.name} ${route} overflows horizontally by ${metrics.overflow}px`);
    assert.deepEqual(metrics.brokenImages, [], `${viewport.name} ${route} has broken images`);
    assert.equal(metrics.mainCount, 1, `${route} should contain exactly one main landmark`);
    assert.equal(metrics.canonical, `https://www.hennessywilliamsphoto.com${route}`, `${route} canonical URL is incorrect`);

    if (viewport.name === "desktop" || (viewport.name === "mobile" && route === "/")) {
      // Chromium can stitch a fixed, off-canvas skip link into full-page captures.
      // Hide only its non-interactive screenshot artifact; production behavior is unchanged.
      await page.addStyleTag({ content: ".skip-link:not(:focus) { display: none !important; }" });
      await page.screenshot({ path: `qa/${route === "/" ? "home" : route.slice(1)}-${viewport.name}-final.png`, fullPage: true });
    }
  }

  if (viewport.name === "mobile") {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Menu" }).click();
    assert.equal(await page.getByRole("button", { name: "Close" }).getAttribute("aria-expanded"), "true", "mobile menu did not open");
    await page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("link", { name: "Contact", exact: true }).click();
    assert.equal(new URL(page.url()).pathname, "/contact", "mobile navigation did not change route");
  }

  await context.close();
  if (consoleErrors.length) failures.push(`${viewport.name} console errors:\n${consoleErrors.join("\n")}`);
  if (failedRequests.length) failures.push(`${viewport.name} failed requests:\n${failedRequests.join("\n")}`);
}

const interactionContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await interactionContext.newPage();
const writeRequests = [];
page.on("request", (request) => request.method() !== "GET" && writeRequests.push(`${request.method()} ${request.url()}`));

await page.goto(`${baseUrl}/work`, { waitUntil: "networkidle" });
const firstTile = page.locator(".work-tile").first();
await firstTile.click();
await page.getByRole("dialog", { name: /photo 1 of 25/ }).waitFor();
await page.keyboard.press("ArrowRight");
await page.getByRole("dialog", { name: /photo 2 of 25/ }).waitFor();
await page.keyboard.press("Escape");
await page.getByRole("dialog").waitFor({ state: "detached" });
assert.equal(await firstTile.evaluate((element) => element === document.activeElement), true, "work lightbox did not restore focus");
assert.equal(await page.getByRole("radio", { name: "Product" }).count(), 0, "single-photo categories should not get a filter");
await page.locator(".choice", { hasText: "Celebrations" }).click();
assert.equal(await page.locator(".work-tile").count(), 2, "work category filter is incorrect");
const rowSums = await page.locator(".work-tile").evaluateAll((tiles) => tiles.map((tile) => Number(getComputedStyle(tile).getPropertyValue("--span"))));
assert.equal(rowSums.reduce((sum, span) => sum + span, 0) % 12, 0, "work grid rows must fill all 12 columns");

await page.goto(`${baseUrl}/graduation`, { waitUntil: "networkidle" });
assert.equal(new URL(page.url()).pathname + new URL(page.url()).hash, "/sessions#graduation", "legacy /graduation should land on the Sessions graduation section");
await page.getByText("What to bring").waitFor();
await page.getByRole("link", { name: "See more in Families" }).click();
assert.equal(new URL(page.url()).search, "?filter=Families", "session work link should open the filtered Work page");
assert.equal(await page.getByRole("radio", { name: "Families" }).isChecked(), true, "work filter did not pre-select from the URL");

await page.goto(`${baseUrl}/contact?session=graduation&who=parent`, { waitUntil: "networkidle" });
assert.equal(await page.getByLabel("Session type").inputValue(), "graduation", "contact form did not pre-fill the session");
assert.equal(await page.getByRole("radio", { name: "My graduate" }).isChecked(), true, "contact form did not pre-fill who is booking");

await page.goto(`${baseUrl}/contact`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Send inquiry" }).click();
assert.equal(await page.locator(".field__error").count(), 4, "contact validation should expose four required-field errors");
await page.getByLabel("Your name").fill("Jordan Williams");
await page.getByLabel("Email").fill("jordan@example.com");
await page.getByLabel("Session type").selectOption("portraits");
await page.getByLabel("What are you planning?").fill("A polished graduation portrait session on campus.");
await page.getByRole("button", { name: "Send inquiry" }).click();
await page.getByText("nothing was sent").waitFor();

await page.goto(`${baseUrl}/portfolio`, { waitUntil: "networkidle" });
assert.equal(new URL(page.url()).pathname, "/work", "legacy /portfolio should redirect to /work");
await page.goto(`${baseUrl}/studio`, { waitUntil: "networkidle" });
assert.equal(new URL(page.url()).pathname, "/business", "legacy /studio should redirect to /business");
await page.goto(`${baseUrl}/not-a-page`, { waitUntil: "networkidle" });
await page.getByText("That page isn’t on the").waitFor();
assert.deepEqual(writeRequests, [], "the prototype form attempted a network write");

for (const selector of ['a[href="https://hennessywilliamsphoto54.pixieset.com/booking/"]', 'a[href="https://hennessywilliamsphoto54.pixieset.com/"]']) {
  assert.ok(await page.locator(selector).count() > 0, `missing external integration link: ${selector}`);
}

await interactionContext.close();
await browser.close();

if (failures.length) throw new Error(failures.join("\n\n"));
console.log("Browser QA passed: 6 routes × 3 viewports, mobile navigation, work lightbox/filter/grid, session work links, form pre-fill, simulated inquiry, legacy redirect, and 404.");
