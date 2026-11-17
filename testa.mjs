// Testar om butikernas sajter går att skanna från en molnserver (GitHub Actions).
import { chromium } from "playwright";
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";

const SKRIPT = readFileSync(new URL("./scan-i-sidan.js", import.meta.url), "utf8");
const SAJTER = [
  ["ica", "https://www.ica.se/"],
  ["icaonline", "https://handlaprivatkund.ica.se/stores/1003855"],
  ["hemkop", "https://www.hemkop.se/"],
  ["lidl", "https://www.lidl.se/"],
];

const browser = await chromium.launch();
const context = await browser.newContext({
  locale: "sv-SE",
  timezoneId: "Europe/Stockholm",
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
});
const page = await context.newPage();
const resultat = {}, rader = [];

for (const [falt, url] of SAJTER) {
  let status = null, titel = "", r = null, fel = null;
  try {
    const svar = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    status = svar?.status() ?? null;
    await page.waitForTimeout(3000);
    titel = await page.title();
    r = await page.evaluate(SKRIPT);
  } catch (e) { fel = e.message.split("\n")[0]; }
  const antalSok = r ? Object.values(r.sok).reduce((n, l) => n + l.length, 0) : 0;
  const ok = !!r && (r.poster.length + antalSok) > 0;
  resultat[falt] = r ?? { kalla: url, poster: [], sok: {}, fel: [fel] };
  rader.push(`| ${falt} | ${ok ? "✅" : "❌"} | ${status ?? "–"} | ${r?.poster.length ?? 0} | ${antalSok} | ${(fel || r?.fel.join("; ") || titel).slice(0, 120)} |`);
  console.log(falt, ok ? "OK" : "MISSLYCKADES", status, r?.poster.length ?? 0, antalSok, fel || r?.fel || "");
}
await browser.close();

writeFileSync("resultat.json", JSON.stringify(resultat, null, 1));
const tabell = ["| Källa | Funkar | HTTP | Erbjudanden | Sökträffar | Kommentar |", "|---|---|---|---|---|---|", ...rader].join("\n");
console.log("\n" + tabell);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, "## Matdeals – molntest\n\n" + tabell + "\n");
