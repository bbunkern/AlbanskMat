// Diagnos: vad får ICA Handla-söket tillbaka från en molnserver?
import { chromium } from "playwright";
import { writeFileSync, appendFileSync } from "node:fs";
const URL_SOK = "https://handlaprivatkund.ica.se/stores/1003855/search?q=lax";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const rapport = [];
const logg = (...a) => { const s = a.join(" "); console.log(s); rapport.push(s); };
function analys(namn, h) {
  logg(`### ${namn}`);
  logg(`storlek: ${h.length}`);
  logg(`markörer: ${(h.match(/window\.__[A-Z_]+__/g) || []).join(", ") || "inga"}`);
  logg(`title: ${(h.match(/<title>[^<]*/) || [""])[0]}`);
  logg("```\n" + h.slice(0, 1500).replace(/```/g, "'''") + "\n```");
}
// 1. Ren HTTP-hämtning utan webbläsare
try {
  const r = await fetch(URL_SOK, { headers: { "user-agent": UA, "accept-language": "sv-SE" }, redirect: "follow" });
  logg(`## Node fetch: HTTP ${r.status}, slut-URL ${r.url}`);
  analys("Node fetch", await r.text());
} catch (e) { logg("Node fetch fel: " + e.message); }
// 2. Via webbläsaren, som i testa.mjs
const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: "sv-SE", timezoneId: "Europe/Stockholm", userAgent: UA });
const page = await ctx.newPage();
const svar = await page.goto("https://handlaprivatkund.ica.se/stores/1003855", { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(4000);
logg(`## Startsida: HTTP ${svar?.status()}, slut-URL ${page.url()}, title "${await page.title()}"`);
await page.screenshot({ path: "startsida.png" });
const r = await page.evaluate(async (u) => { const x = await fetch(u); return { status: x.status, url: x.url, text: await x.text() }; }, "/stores/1003855/search?q=lax");
logg(`## fetch i sidan: HTTP ${r.status}, slut-URL ${r.url}`);
analys("fetch i sidan", r.text);
writeFileSync("sok.html", r.text);
await page.goto(URL_SOK, { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(4000);
logg(`## Sök-sidan direkt: slut-URL ${page.url()}, title "${await page.title()}"`);
await page.screenshot({ path: "soksida.png" });
const st = await page.evaluate(() => typeof window.__INITIAL_STATE__ === "object" ? Object.keys(window.__INITIAL_STATE__?.data?.products?.productEntities || {}).length : "saknas");
logg(`__INITIAL_STATE__ produkter: ${st}`);
await browser.close();
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, "## Diagnos ICA Handla\n\n" + rapport.join("\n\n") + "\n");
