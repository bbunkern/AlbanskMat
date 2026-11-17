// Daglig skanning från molnet (GitHub Actions): ica, hemkop, lidl.
// icaonline stoppas av ICA:s bot-kontroll i molnet och skannas från Macen (data/icaonline.json).
import { chromium } from "playwright";
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, readdirSync } from "node:fs";

const SKRIPT = readFileSync(new URL("./scan-i-sidan.js", import.meta.url), "utf8");
const SAJTER = [
  ["ica", "https://www.ica.se/"],
  ["hemkop", "https://www.hemkop.se/"],
  ["lidl", "https://www.lidl.se/"],
];

const nu = new Date();
const datum = nu.toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" });
const tid = nu.toLocaleTimeString("sv-SE", { timeZone: "Europe/Stockholm", hour: "2-digit", minute: "2-digit" });

const browser = await chromium.launch();
const context = await browser.newContext({
  locale: "sv-SE",
  timezoneId: "Europe/Stockholm",
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
});
const page = await context.newPage();
const skann = { datum, tid, kalla: "moln" }, rader = [];
let antalOk = 0;

for (const [falt, url] of SAJTER) {
  let r = null, fel = null;
  for (let forsok = 1; forsok <= 2 && !r; forsok++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(3000);
      r = await page.evaluate(SKRIPT);
    } catch (e) { fel = e.message.split("\n")[0]; }
  }
  const antalSok = r ? Object.values(r.sok).reduce((n, l) => n + l.length, 0) : 0;
  const ok = !!r && (r.poster.length + antalSok) > 0;
  if (ok) antalOk++;
  skann[falt] = r ?? { kalla: url, poster: [], sok: {}, fel: [fel] };
  rader.push(`| ${falt} | ${ok ? "✅" : "❌"} | ${r?.poster.length ?? 0} | ${antalSok} | ${(fel || r?.fel.join("; ") || "").slice(0, 150)} |`);
}
await browser.close();

const tabell = ["| Källa | Funkar | Erbjudanden | Sökträffar | Fel |", "|---|---|---|---|---|", ...rader].join("\n");
console.log(tabell);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Matdeals ${datum} ${tid}\n\n${tabell}\n`);

// Skriv bara över senaste skannen om minst en källa gav data.
if (antalOk === 0) { console.error("Ingen källa gav data – senaste.json lämnas orörd."); process.exit(1); }
mkdirSync("data/historik", { recursive: true });
const json = JSON.stringify(skann);
writeFileSync("data/senaste.json", json);
writeFileSync(`data/historik/${datum}.json`, json);
// Lista över alla dagar så att sidan kan visa en datumväljare.
const dagar = readdirSync("data/historik").filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map(f => f.slice(0, 10)).sort().reverse();
writeFileSync("data/historik/index.json", JSON.stringify(dagar));
