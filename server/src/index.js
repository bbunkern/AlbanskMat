// AlbanskMat – server för fliken Kortdatum (Cloudflare Worker + D1 + Workers AI).
// Alla anrop kräver lösenordet (hemligheten LOSENORD) i headern "X-Losen".

const MODELL = "@cf/meta/llama-4-scout-17b-16e-instruct";
const TILLATNA_URSPRUNG = ["https://albanskmat.pages.dev", "https://bbunkern.github.io","http://localhost:8765", "http://127.0.0.1:8765"];
const FALT = ["vara", "varumarke", "mangd", "pris", "ordinarie_pris", "rabatt_procent", "kr_per_kg", "bast_fore", "typ", "protein_per_100g", "animaliskt"];
const TYPER = ["kortdatum", "hyllpris", "erbjudande"];

const PROMPT = `Du läser av foton från svenska matbutiker: kortdatumetiketter (t.ex. "-30%", "Kort datum", "Bäst före"), hyllkantsetiketter och erbjudandeskyltar.
Svara ENDAST med JSON, utan förklaringar och utan markdown, på formen:
{"varor":[{"vara":"","varumärke":"","mängd":"","pris":0,"ordinarie_pris":null,"rabatt_procent":null,"kr_per_kg":null,"bäst_före":null,"typ":"kortdatum","protein_per_100g":null,"animaliskt":null}]}
Regler:
- En post per vara som syns tydligt. Hittar du inget: {"varor":[]}.
- pris, ordinarie_pris och kr_per_kg är tal i kronor (punkt som decimaltecken). Okänt = null.
- rabatt_procent är ett heltal. Räkna ut det från pris och ordinarie pris om det inte står.
- kr_per_kg: jämförpris per kg eller liter om det står, annars räkna ut från mängd om möjligt.
- bäst_före som ÅÅÅÅ-MM-DD om det syns, annars null.
- typ: "kortdatum" om det är en nedsatt vara pga datum, "erbjudande" om det är ett vanligt erbjudande, annars "hyllpris".
- protein_per_100g: typiskt värde för varutypen (t.ex. kycklingfilé 23, kvarg 10). animaliskt: true/false.
- Hitta inte på varor eller priser som inte syns i bilden.`;

function cors(req) {
  const o = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": TILLATNA_URSPRUNG.includes(o) ? o : TILLATNA_URSPRUNG[0],
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Losen",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
const svar = (req, data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors(req) } });

async function lika(a, b) {
  // Jämförelse i konstant tid via hash.
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let d = 0; for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

const tal = v => { if (v == null || v === "") return null; const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", ".").replace(/[^\d.-]/g, "")); return Number.isFinite(n) ? n : null; };
const text = (v, max = 120) => v == null ? null : String(v).trim().slice(0, max) || null;

function stada(v) {
  const vara = text(v.vara ?? v.namn, 160);
  if (!vara) return null;
  const pris = tal(v.pris), ord = tal(v.ordinarie_pris);
  let rabatt = tal(v.rabatt_procent ?? v["rabatt_procent"]);
  if (rabatt == null && pris && ord && ord > pris) rabatt = Math.round(100 * (1 - pris / ord));
  const bf = text(v.bast_fore ?? v["bäst_före"], 10);
  const typ = TYPER.includes(v.typ) ? v.typ : (rabatt ? "erbjudande" : "hyllpris");
  const anim = v.animaliskt === true || v.animaliskt === "true" ? 1 : v.animaliskt === false || v.animaliskt === "false" ? 0 : null;
  return {
    vara, varumarke: text(v.varumarke ?? v["varumärke"]), mangd: text(v.mangd ?? v["mängd"], 40),
    pris, ordinarie_pris: ord, rabatt_procent: rabatt == null ? null : Math.round(rabatt),
    kr_per_kg: tal(v.kr_per_kg), bast_fore: bf && /^\d{4}-\d{2}-\d{2}$/.test(bf) ? bf : null,
    typ, protein_per_100g: tal(v.protein_per_100g), animaliskt: anim,
  };
}

function plockaJson(t) {
  if (t && typeof t === "object") return t;
  t = String(t || "").replace(/```(?:json)?/gi, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}

async function lasAv(env, bild) {
  const r = await env.AI.run(MODELL, {
    messages: [
      { role: "system", content: PROMPT },
      { role: "user", content: [
        { type: "text", text: "Läs av alla varor och priser i bilden. Svara bara med JSON." },
        { type: "image_url", image_url: { url: bild } },
      ] },
    ],
    max_tokens: 2048,
    temperature: 0.1,
  });
  const j = plockaJson(r?.response ?? r);
  if (!j) return { varor: [], fel: "Kunde inte tolka svaret från AI:n." };
  const lista = Array.isArray(j) ? j : Array.isArray(j.varor) ? j.varor : [];
  return { varor: lista.map(stada).filter(Boolean).map(v => ({ ...v, animaliskt: v.animaliskt == null ? null : !!v.animaliskt })) };
}

function stockholmsTid(d = new Date()) {
  const f = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm", weekday: "long", hour: "2-digit", hourCycle: "h23" }).formatToParts(d);
  return { veckodag: f.find(p => p.type === "weekday").value, timme: parseInt(f.find(p => p.type === "hour").value, 10) };
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
    const url = new URL(req.url);
    if (!env.LOSENORD) return svar(req, { fel: "Servern saknar lösenord (LOSENORD)." }, 500);
    if (!(await lika(req.headers.get("X-Losen") || "", env.LOSENORD))) return svar(req, { fel: "Fel lösenord." }, 401);

    try {
      if (url.pathname === "/ping") return svar(req, { ok: true });

      if (url.pathname === "/las" && req.method === "POST") {
        const { bild } = await req.json();
        if (typeof bild !== "string" || !bild.startsWith("data:image/")) return svar(req, { fel: "Ingen bild." }, 400);
        if (bild.length > 3_000_000) return svar(req, { fel: "Bilden är för stor." }, 413);
        return svar(req, await lasAv(env, bild));
      }

      if (url.pathname === "/fynd" && req.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM kortdatum ORDER BY tidpunkt DESC LIMIT 1000").all();
        return svar(req, { fynd: results.map(r => ({ ...r, animaliskt: r.animaliskt == null ? null : !!r.animaliskt })) });
      }

      if (url.pathname === "/fynd" && req.method === "POST") {
        const { butik, varor } = await req.json();
        const b = text(butik, 60);
        if (!b) return svar(req, { fel: "Välj butik." }, 400);
        const rena = (Array.isArray(varor) ? varor : []).slice(0, 50).map(stada).filter(Boolean);
        if (!rena.length) return svar(req, { fel: "Inga varor att spara." }, 400);
        const nu = new Date(), { veckodag, timme } = stockholmsTid(nu);
        const sql = `INSERT INTO kortdatum (butik, tidpunkt, veckodag, timme, ${FALT.join(", ")}) VALUES (?, ?, ?, ?, ${FALT.map(() => "?").join(", ")})`;
        await env.DB.batch(rena.map(v => env.DB.prepare(sql).bind(b, nu.toISOString(), veckodag, timme, ...FALT.map(f => v[f]))));
        return svar(req, { sparade: rena.length });
      }

      const m = url.pathname.match(/^\/fynd\/(\d+)$/);
      if (m && req.method === "DELETE") {
        await env.DB.prepare("DELETE FROM kortdatum WHERE id = ?").bind(Number(m[1])).run();
        return svar(req, { raderad: Number(m[1]) });
      }

      return svar(req, { fel: "Finns inte." }, 404);
    } catch (e) {
      return svar(req, { fel: "Serverfel: " + (e?.message || e) }, 500);
    }
  },
};
