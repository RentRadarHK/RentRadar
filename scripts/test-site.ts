/**
 * RentRadar live site end-to-end checks
 * Usage: npx tsx scripts/test-site.ts [--headed]
 */

import { chromium, type Browser, type Page, type ConsoleMessage } from "playwright";

const BASE = "https://rentradar.co";

/** Building with AI description on production (from Supabase: description IS NOT NULL) */
const KNOWN_BUILDING_ID = "hki-11-may-rd-valverde-central-western";

/** Landlord used for claim-form field checks (unclaimed seed profile) */
const KNOWN_LANDLORD_CLAIM_ID = "pacific-realty-holdings";

const HEADED = process.argv.includes("--headed");

interface CheckResult {
  name: string;
  passed: boolean;
  ms: number;
  detail?: string;
}

const results: CheckResult[] = [];
let consoleErrors: string[] = [];
let httpErrors: { url: string; status: number }[] = [];

function pad(name: string, width = 36): string {
  return name.length >= width ? name : name + " ".repeat(width - name.length);
}

async function check(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, ms: Date.now() - start });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, ms: Date.now() - start, detail: message });
  }
}

function attachListeners(page: Page) {
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (
      text.includes("favicon") ||
      (text.includes("404") && text.includes(".woff")) ||
      (text.includes("Failed to load resource") && text.includes("analytics")) ||
      text.includes("Failed to fetch RSC payload")
    ) {
      return;
    }
    consoleErrors.push(text);
  });

  page.on("response", (res) => {
    const status = res.status();
    const url = res.url();
    if (status === 404 || status >= 500) {
      if (url.includes("favicon") || url.includes("_next/image")) return;
      if (url.includes("/sign-in")) return; // reported separately
      httpErrors.push({ url, status });
    }
  });
}

async function waitForFonts(page: Page): Promise<void> {
  await page.waitForFunction(() => document.fonts.ready);
}

async function fillReviewStep2(page: Page): Promise<void> {
  await page.locator("select").first().selectOption({ index: 1 });
  await page.locator("select").nth(1).selectOption("current");
  await page.getByRole("button", { name: "Direct with landlord" }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "2 bed" }).click();
  await page.getByPlaceholder("e.g. 12/F or G/F").fill("7");
  await page.getByPlaceholder("e.g. Flat A, Unit 3, 12B").fill("A");
}

async function fillAllStarPickers(page: Page): Promise<void> {
  const section = page
    .getByRole("heading", { name: "Rate your experience" })
    .locator("xpath=ancestor::div[contains(@class,'rounded')][1]");
  const pickers = section.locator("div.flex.items-center.gap-1");
  const count = await pickers.count();
  for (let i = 0; i < count; i++) {
    await pickers.nth(i).locator("button").nth(3).click();
  }
}

async function runTests(browser: Browser): Promise<void> {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "RentRadarSiteTest/1.0 (Playwright; +https://rentradar.co)",
  });
  const page = await context.newPage();
  attachListeners(page);

  let searchBuildingUrl = `${BASE}/building/${KNOWN_BUILDING_ID}`;

  // ── 1. HOMEPAGE ───────────────────────────────────────────────────────────
  await check("Homepage loads (200)", async () => {
    const res = await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!res || res.status() >= 400) {
      throw new Error(`Expected 200, got ${res?.status() ?? "no response"}`);
    }
  });

  await check("Title contains RentRadar", async () => {
    const title = await page.title();
    if (!/RentRadar/i.test(title)) {
      throw new Error(`Title was "${title}"`);
    }
  });

  await check("Hero heading visible", async () => {
    const h1 = page.getByRole("heading", { name: /Know your rental/i });
    if (!(await h1.isVisible())) {
      throw new Error('Expected heading containing "Know your rental"');
    }
  });

  await check("Search input accepts text", async () => {
    const input = page.getByRole("textbox", {
      name: /Search landlord, building, or address/i,
    });
    await input.fill("Robinson");
    const val = await input.inputValue();
    if (!val.includes("Robinson")) {
      throw new Error("Search input did not retain typed text");
    }
  });

  await check("Navbar links present", async () => {
    const nav = page.locator("header nav");
    for (const label of ["How it works", "Search", "About", "For Landlords", "Write a Review"]) {
      if (!(await nav.getByRole("link", { name: label }).count())) {
        throw new Error(`Missing nav link: ${label}`);
      }
    }
  });

  await check("Outfit font loaded", async () => {
    await waitForFonts(page);
    const hasOutfit = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].some((f) => /outfit/i.test(f.family));
    });
    if (!hasOutfit) {
      throw new Error("document.fonts does not include Outfit");
    }
  });

  await check("CSS token --rr-sage is #4d8b6f", async () => {
    const sage = await page.evaluate(() => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--rr-sage")
        .trim();
      return v.toLowerCase();
    });
    if (sage !== "#4d8b6f") {
      throw new Error(`--rr-sage was "${sage}", expected #4d8b6f`);
    }
  });

  await check("Background colour is #f5f0e8", async () => {
    const bg = await page.evaluate(() => {
      const body = getComputedStyle(document.body).backgroundColor;
      const html = getComputedStyle(document.documentElement).backgroundColor;
      return body !== "rgba(0, 0, 0, 0)" ? body : html;
    });
    const rgb = bg.match(/\d+/g)?.map(Number) ?? [];
    const hex =
      rgb.length >= 3
        ? `#${rgb
            .slice(0, 3)
            .map((n) => n.toString(16).padStart(2, "0"))
            .join("")}`
        : bg;
    if (hex !== "#f5f0e8") {
      throw new Error(`Background was ${bg} (${hex}), expected #f5f0e8`);
    }
  });

  // ── 2. SEARCH ─────────────────────────────────────────────────────────────
  await check("Search dropdown appears", async () => {
    const input = page.getByRole("textbox", {
      name: /Search landlord, building, or address/i,
    });
    await input.fill("Robinson");
    const dropdown = page.locator("a[href*='/building/'], a[href*='/landlord/']").first();
    await dropdown.waitFor({ state: "visible", timeout: 5000 });
  });

  await check("Search results mention Robinson", async () => {
    const text = await page.locator("body").innerText();
    if (!/Robinson/i.test(text)) {
      throw new Error("No search result text contained Robinson");
    }
  });

  await check("Search navigates to building profile", async () => {
    const link = page.locator("a[href*='/building/']").first();
    const href = await link.getAttribute("href");
    if (!href) throw new Error("No building link in dropdown");
    await link.click();
    await page.waitForURL(/\/building\//, { timeout: 10000 });
    searchBuildingUrl = page.url();
    if (!/\/building\//.test(searchBuildingUrl)) {
      throw new Error(`Expected /building/[id], got ${searchBuildingUrl}`);
    }
  });

  // ── 3. BUILDING PROFILE ───────────────────────────────────────────────────
  await check("Building profile (known ID) loads", async () => {
    const res = await page.goto(`${BASE}/building/${KNOWN_BUILDING_ID}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    if (!res || res.status() >= 400) {
      throw new Error(`Status ${res?.status() ?? "unknown"}`);
    }
  });

  await check('"About this building" label visible', async () => {
    if (!(await page.getByText("About this building").first().isVisible())) {
      throw new Error("Label not found");
    }
  });

  await check("Building description not empty", async () => {
    const container = page.getByText("About this building").first().locator("xpath=..");
    const desc = (await container.locator("> div").last().textContent())?.trim() ?? "";
    if (desc.length < 40 || desc === "Detailed building profile coming soon.") {
      throw new Error(`Description missing or placeholder (${desc.length} chars)`);
    }
  });

  await check("Overview tab active by default", async () => {
    const overview = page.getByRole("button", { name: "Overview" });
    const style = await overview.evaluate((el) => getComputedStyle(el).backgroundColor);
    if (style === "rgba(0, 0, 0, 0)" || style === "transparent") {
      throw new Error("Overview tab does not appear active");
    }
  });

  await check("Price Guide tab clickable", async () => {
    await page.getByRole("button", { name: "Price Guide" }).click();
    await page.waitForTimeout(500);
    const priceGuide = page.getByText(/Area price guide|Price guide/i).first();
    if (!(await priceGuide.isVisible({ timeout: 5000 }).catch(() => false))) {
      throw new Error("Price Guide content did not appear");
    }
    await page.getByRole("button", { name: "Overview" }).click();
  });

  await check('"Write a Review" button present', async () => {
    const btn = page.getByRole("link", { name: "Write a Review" }).first();
    if (!(await btn.isVisible())) {
      throw new Error("Write a Review link not found");
    }
  });

  await check("Official Records collapsible present", async () => {
    if (!(await page.getByText("Official Records").isVisible())) {
      throw new Error("Official Records section not found");
    }
  });

  await check("No broken images on building page", async () => {
    const broken = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll("img")];
      return imgs
        .filter((img) => img.naturalWidth === 0 && img.src && !img.src.startsWith("data:"))
        .map((img) => img.src);
    });
    if (broken.length > 0) {
      throw new Error(`Broken images: ${broken.slice(0, 3).join(", ")}`);
    }
  });

  // ── 4. REVIEW FORM ────────────────────────────────────────────────────────
  await check("Review page loads without redirect", async () => {
    const res = await page.goto(`${BASE}/review`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    if (!res || res.status() >= 400) {
      throw new Error(`Status ${res?.status()}`);
    }
    if (!page.url().includes("/review")) {
      throw new Error(`Redirected to ${page.url()}`);
    }
  });

  await check("Review step 1 search input present", async () => {
    if (!(await page.getByText("Which property are you reviewing?").isVisible())) {
      throw new Error("Step 1 heading not found");
    }
    const input = page.getByPlaceholder(/Harbour View Tower/i);
    if (!(await input.isVisible())) {
      throw new Error("Property search input not found");
    }
  });

  await check("Review step 2 tenancy fields present", async () => {
    await page.getByPlaceholder(/Harbour View Tower/i).fill("Robinson");
    const result = page.locator("button").filter({ hasText: /Robinson/i }).first();
    await result.waitFor({ state: "visible", timeout: 8000 });
    await result.click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByText("Tell us about your tenancy").waitFor({ timeout: 5000 });
    if (!(await page.getByText("When did you rent there?").isVisible())) {
      throw new Error("Tenancy date fields missing");
    }
    if (!(await page.getByText("Unit type").isVisible())) {
      throw new Error("Unit type field missing");
    }
    if (!(await page.getByText(/Which floor were you on/i).isVisible())) {
      throw new Error("Floor number field missing");
    }
  });

  await check("Review step 3 star ratings present", async () => {
    await fillReviewStep2(page);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("heading", { name: "Rate your experience" }).waitFor({ timeout: 8000 });
    if (!(await page.getByText("Overall rating").isVisible())) {
      throw new Error("Overall rating section missing");
    }
    const starButtons = page
      .getByRole("heading", { name: "Rate your experience" })
      .locator("xpath=ancestor::div[contains(@class,'rounded')][1]//button");
    if ((await starButtons.count()) < 5) {
      throw new Error("Star rating buttons not found");
    }
  });

  await check("Review step 4 text prompts present", async () => {
    await fillAllStarPickers(page);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("heading", { name: "About the building" }).waitFor({ timeout: 5000 });
    if (!(await page.getByText("What was the building like day-to-day?").isVisible())) {
      throw new Error("Building day-to-day prompt missing");
    }
    if (!(await page.getByText(/landlord/i).first().isVisible())) {
      throw new Error("Landlord prompts missing on step 4");
    }
  });

  // ── 5. HOW IT WORKS ───────────────────────────────────────────────────────
  await check("How it works page loads (200)", async () => {
    const res = await page.goto(`${BASE}/how-it-works`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    if (!res || res.status() >= 400) {
      throw new Error(`Status ${res?.status()}`);
    }
  });

  await check("How it works mentions building profiles", async () => {
    const text = await page.locator("body").innerText();
    if (!/detailed profile|building description|About this building/i.test(text)) {
      throw new Error("Expected building profile/description copy on page");
    }
  });

  await check("How it works has content sections", async () => {
    const headings = await page.locator("h2, h3").count();
    if (headings < 3) {
      throw new Error(`Only ${headings} headings found — possible empty layout`);
    }
  });

  // ── 6. ABOUT ──────────────────────────────────────────────────────────────
  await check("About page loads (200)", async () => {
    const res = await page.goto(`${BASE}/about`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    if (!res || res.status() >= 400) {
      throw new Error(`Status ${res?.status()}`);
    }
  });

  await check("About page mentions 6,600+ buildings", async () => {
    const text = await page.locator("body").innerText();
    if (!/6[,.]6\d{2}|6,611/.test(text)) {
      throw new Error('Expected "6,611" or "6,600" building count');
    }
  });

  await check('About page has no "51,000" reference', async () => {
    const text = await page.locator("body").innerText();
    if (/51[,.]?000/.test(text)) {
      throw new Error('Found outdated "51,000" buildings reference');
    }
  });

  // ── 7. FOR LANDLORDS ──────────────────────────────────────────────────────
  await check("For landlords page loads (200)", async () => {
    const res = await page.goto(`${BASE}/for-landlords`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    if (!res || res.status() >= 400) {
      throw new Error(`Status ${res?.status()}`);
    }
  });

  await check("For landlords search input present", async () => {
    const input = page.getByLabel(/Search for your building or landlord name/i);
    if (!(await input.isVisible())) {
      throw new Error("Landlord search input not found");
    }
  });

  await check('For landlords mentions "Claim"', async () => {
    const text = await page.locator("body").innerText();
    if (!/claim/i.test(text)) {
      throw new Error('Expected "Claim" on for-landlords page');
    }
  });

  await check("For landlords three benefit cards", async () => {
    const cards = [
      "Respond to reviews",
      "Get verified",
      "Edit your profile",
    ];
    for (const title of cards) {
      if (!(await page.getByRole("heading", { name: title }).first().isVisible())) {
        throw new Error(`Benefit card missing: ${title}`);
      }
    }
  });

  // ── 8. LANDLORD CLAIM ─────────────────────────────────────────────────────
  await check("Landlord claim page loads (200)", async () => {
    const res = await page.goto(`${BASE}/landlord/claim`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    if (!res || res.status() >= 400) {
      throw new Error(`Status ${res?.status()}`);
    }
  });

  await check("Landlord claim step 1 / search visible", async () => {
    const text = await page.locator("body").innerText();
    if (!/Claim your landlord profile|Which landlord profile/i.test(text)) {
      throw new Error("Claim page intro or search step not visible");
    }
  });

  await check("Landlord claim form fields (with profile id)", async () => {
    const claimIds = ["lam-ching-yee", KNOWN_LANDLORD_CLAIM_ID];
    let found = false;

    for (const id of claimIds) {
      await page.goto(`${BASE}/landlord/claim?id=${id}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      const body = await page.locator("body").innerText();
      if (/Already claimed|under review/i.test(body)) continue;

      const fullName = page
        .getByPlaceholder(/legal full name/i)
        .or(page.locator('input').filter({ has: page.getByText("Full name") }));
      const email = page.getByPlaceholder(/email/i).first();

      if (await fullName.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        if (await email.isVisible()) {
          found = true;
          break;
        }
      }
    }

    if (!found) {
      // Fallback: search flow on claim page
      await page.goto(`${BASE}/landlord/claim`, { waitUntil: "domcontentloaded" });
      await page.getByPlaceholder("Search landlord name...").fill("Lam");
      const result = page.locator("button").filter({ hasText: /Lam/i }).first();
      await result.waitFor({ state: "visible", timeout: 8000 });
      await result.click();
      const fullName = page.getByPlaceholder(/legal full name/i);
      if (!(await fullName.isVisible({ timeout: 5000 }))) {
        throw new Error("Full name field not found after landlord search");
      }
      if (!(await page.getByPlaceholder(/email/i).first().isVisible())) {
        throw new Error("Contact email field not found after landlord search");
      }
    }
  });

  // ── 9. SIGN IN ────────────────────────────────────────────────────────────
  await check("Sign-in page loads without error", async () => {
    const res = await page.goto(`${BASE}/sign-in`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    const status = res?.status() ?? 0;
    if (status >= 500) {
      throw new Error(`Server error ${status}`);
    }
    if (status === 404) {
      throw new Error("/sign-in returned 404 — app may use /signup instead");
    }
  });

  await check("Google OAuth button present on sign-in", async () => {
    const google = page.getByRole("button", { name: /Google/i });
    if (!(await google.isVisible({ timeout: 3000 }).catch(() => false))) {
      throw new Error("Google OAuth button not found on /sign-in");
    }
  });

  await check("Email input present on sign-in", async () => {
    const email = page.locator('input[type="email"]');
    if (!(await email.first().isVisible({ timeout: 3000 }).catch(() => false))) {
      throw new Error("Email input not found on /sign-in");
    }
  });

  // ── 10. MOBILE ───────────────────────────────────────────────────────────
  await check("Mobile homepage loads", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    const res = await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!res || res.status() >= 400) {
      throw new Error(`Status ${res?.status()}`);
    }
  });

  await check("Mobile hamburger menu present", async () => {
    const menu = page.getByRole("button", { name: /Toggle menu/i });
    if (!(await menu.isVisible())) {
      throw new Error("Mobile menu toggle not found");
    }
    await menu.click();
    const drawerLink = page.locator("header").getByRole("link", { name: "How it works" });
    if (!(await drawerLink.isVisible())) {
      throw new Error("Mobile nav drawer did not open");
    }
  });

  await check("Mobile search bar usable", async () => {
    const input = page.getByRole("textbox", {
      name: /Search landlord, building, or address/i,
    });
    await input.scrollIntoViewIfNeeded();
    await input.fill("Harbour");
    if ((await input.inputValue()).length < 3) {
      throw new Error("Mobile search input not usable");
    }
  });

  await check("Mobile hero text not overflowing", async () => {
    const overflow = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return "no h1";
      const rect = h1.getBoundingClientRect();
      return rect.width > window.innerWidth + 2 ? `h1 width ${rect.width}px > viewport` : null;
    });
    if (overflow) throw new Error(overflow);
  });

  await page.setViewportSize({ width: 1280, height: 800 });

  // ── 11. PERFORMANCE ───────────────────────────────────────────────────────
  await check("Homepage loads in under 4s", async () => {
    const start = Date.now();
    await page.goto(BASE, { waitUntil: "load", timeout: 30000 });
    const ms = Date.now() - start;
    if (ms > 4000) {
      throw new Error(`Took ${ms}ms`);
    }
  });

  await check("Building profile loads in under 4s", async () => {
    const start = Date.now();
    await page.goto(`${BASE}/building/${KNOWN_BUILDING_ID}`, {
      waitUntil: "load",
      timeout: 30000,
    });
    const ms = Date.now() - start;
    if (ms > 4000) {
      throw new Error(`Took ${ms}ms`);
    }
  });

  await check("No 404 errors on tested pages", async () => {
    const fourOhFours = httpErrors.filter((e) => e.status === 404);
    if (fourOhFours.length > 0) {
      throw new Error(
        fourOhFours
          .slice(0, 3)
          .map((e) => `${e.status} ${e.url}`)
          .join("; ")
      );
    }
  });

  await check("No 500 errors on tested pages", async () => {
    const fiveHundreds = httpErrors.filter((e) => e.status >= 500);
    if (fiveHundreds.length > 0) {
      throw new Error(
        fiveHundreds
          .slice(0, 3)
          .map((e) => `${e.status} ${e.url}`)
          .join("; ")
      );
    }
  });

  await check("No console errors on homepage", async () => {
    consoleErrors = [];
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    if (consoleErrors.length > 0) {
      throw new Error(consoleErrors.slice(0, 2).join(" | "));
    }
  });

  await context.close();
}

function printReport(startedAt: number): number {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`\nRentRadar Site Test — ${timestamp}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (const r of results) {
    const icon = r.passed ? "✓" : "✗";
    console.log(`${icon} ${pad(r.name)} [${r.ms}ms]`);
    if (!r.passed && r.detail) {
      console.log(`    → ${r.detail}`);
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const duration = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log("\nSUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}`);
  console.log(`Duration: ${duration}s\n`);

  return failed;
}

async function main() {
  const startedAt = Date.now();
  const browser = await chromium.launch({ headless: !HEADED });

  try {
    await runTests(browser);
  } finally {
    await browser.close();
  }

  const failed = printReport(startedAt);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
