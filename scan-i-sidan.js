(async () => {
const ICA_BUTIKER = { "ICA Roslagstull": "ica-nara-roslagstull-1003482", "ICA Vanadis": "ica-supermarket-vanadis-1003855" };
const ICA_EHANDEL = { "ICA Vanadis": "1003855" };
const HEMKOP_BUTIKER = { "Hemköp Birger Jarl": "4150", "Hemköp Matglädjen": "4785" };
const LIDL = "Lidl";
const MIN_RABATT = 20;
const MAX_DEALS = 25;
const SOK = {
  "Lax": { q: "lax", ord: /^(färsk |fryst |svensk |norsk |hel )?lax|laxfil|laxsida|laxbit|laxrygg|(kallrökt|gravad|varmrökt) lax/i, utom: ["sås","färs","burgare","pastej","kaviar","rom ","sallad","smörgås","kex","spread","röra","pudding","yoghurt","månader","år)","för ugn","mos","couscous","krydd","paj"] },
  "Potatis": { q: "potatis", ord: /potatis/i, utom: ["chips","mos","gratäng","pulver","klyft","pommes","rösti","sallad","bullar","wedges","kroket","gnocchi","sötpotatis","bröd","pizza","soppa","lefse","stomp","dip","ost"] },
  "Matvete": { q: "matvete", ord: /matvete|^vete\b|vetekärn/i, utom: ["mjöl","sallad","bulgur"] },
  "Kvarg": { q: "kvarg", ord: /kvarg/i, utom: ["pudding","dessert","glass","bar"] },
  "Köttfärs": { q: "köttfärs", ord: /köttfärs|blandfärs|fläsk ?(&|och) ?nötfärs/i, utom: ["soppa","vego","veg ","soja","växt","oumph","quorn","burgare","biff","bullar","lasagne","sås","pirog","färdig","gratäng","pasta","kycklingfärs","fiskfärs","laxfärs","kryddmix","mix","tacos","bolognese","paj"] },
  "Nötfärs": { q: "nötfärs", ord: /nötfärs/i, utom: ["fläsk","soppa","vego","veg ","soja","växt","burgare","biff","bullar","lasagne","sås","pirog","färdig","gratäng","pasta","kryddmix","mix","tacos","bolognese","paj"] },
};
const VEGO = /vego|vegan|växtbaserad|oumph|quorn|anamma|planti|hälsans kök|green ?deli|sojafärs|sojabit|sojastrim/;
const PROTEIN = [
  [/potatis/,2,false],
  [/tofu/,13,false],[/tempeh/,19,false],[/seitan/,25,false],[VEGO,15,false],
  [/edamame|sojabön/,11,false],[/jordnötssmör|peanut butter/,25,false],[/pumpakärn/,30,false],
  [/solrosfrö|hampafrö/,22,false],[/jordnöt/,25,false],[/mandel|mandlar/,21,false],
  [/cashew|valnöt|hasselnöt|nötmix|nötter/,15,false],[/linser|kikärt|bönor/,null,false],
  [/havregryn|müsli|granola/,12,false],
  [/matvete|^vete\b|bulgur|couscous|quinoa|pasta|spaghetti|makaroner|penne|fusilli|nudlar/,12,false],
  [/kycklingbröst|kycklingfil|innerfil|bröstfil/,23,true],[/kycklinglår|lårfil/,18,true],
  [/kycklingkorv/,12,true],[/kycklingklubb|kycklingben|kycklingving|hel kyckling|kyckling hel|majskyckling hel|kycklinglår(?!fil)/,19,true],[/kyckling/,18,true],[/kalkon/,21,true],[/tonfisk/,24,true],
  [/kallrökt lax|gravad lax|varmrökt lax|lax.*(kallrökt|gravad|varmrökt)/,21,true],
  [/laxfärs/,15,true],[/\blax|^lax/,20,true],[/torsk|sej|kolja|pollock|fiskfil/,17,true],
  [/räk/,18,true],[/fish ?& ?crisp|fiskpinn|panerad/,12,true],
  [/ryggbiff|entrecôte|entrecote|biff|oxfil|fransyska|högrev|nötstek|nötkött/,21,true],
  [/fläskfil|ytterfil|kotlett|karré/,21,true],[/nötfärs/,19,true],[/blandfärs/,18,true],
  [/fläskfärs/,17,true],[/chorizo|salsiccia|färskkorv/,15,true],[/färs/,17,true],
  [/fläsklägg|sidfläsk|fläskkött|fläskbog/,18,true],[/bacon/,13,true],[/skinka|kassler/,18,true],
  [/korv/,11,true],[/(^|[^a-zåäö])ägg($|[^a-zåäö])/,12.5,true],[/skyr/,11,true],[/kvarg/,10,true],
  [/keso|cottage/,12,true],[/protein(pudding|kvarg)/,10,true],
  [/parmesan|grana padano/,33,true],
  [/herrgård|präst|grevé|cheddar|maasdam|gouda|edamer|hushållsost|riven ost|västerbotten|svecia/,26,true],
  [/halloumi/,21,true],[/mozzarella/,18,true],[/paneer/,18,true],[/ost i saltlag|feta|vitost/,15,true],
  [/(^|[^a-zåäö])ost($|[^a-zåäö])/,25,true],
];
// Ungefärliga kalorier per 100 g (eller 100 ml). Första träffen vinner.
const KCAL = [
  [/sötpotatis/,85],[/potatis/,75],
  [/olivolja|rapsolja|solrosolja|matolja|(^|[^a-zåäö])olja/,880],[/smör|bregott/,720],
  [/jordnötssmör|peanut butter/,600],[/mandel|mandlar|cashew|valnöt|hasselnöt|nötmix|nötter|jordnöt/,600],
  [/solrosfrö|pumpakärn|hampafrö/,570],[/knäckebröd|knäcke/,350],
  [/havregryn|müsli|granola/,370],[/matvete|^vete\b|bulgur|couscous|quinoa|(^|[^a-zåäö])ris($|[^a-zåäö])|jasminris|basmatiris|fullkornsris/,350],
  [/pasta|spaghetti|makaroner|penne|fusilli|nudlar/,355],[/(linser|kikärt|bönor).*(kokt|burk|tetra|i vatten|i tomat)|(kokt|burk|tetra).*(linser|kikärt|bönor)/,110],
  [/linser|kikärt|bönor/,340],[/edamame|sojabön/,120],[/tofu/,120],[/tempeh/,190],[/seitan/,120],
  [/vego|vegan|växtbaserad|oumph|quorn|sojafärs|sojabit/,170],
  [/bröd|limpa|baguette|fralla|frallor|tortilla/,250],
  [/bacon/,330],[/chorizo|salsiccia|färskkorv/,270],[/korv/,250],[/skinka|kassler/,120],
  [/kycklingbröst|kycklingfil|innerfil|bröstfil/,110],[/kycklinglår|lårfil/,170],[/kyckling/,160],[/kalkon/,110],
  [/kallrökt lax|gravad lax|varmrökt lax|lax.*(kallrökt|gravad|varmrökt)/,190],[/\blax|^lax/,200],
  [/makrill|sill/,200],[/tonfisk/,110],[/torsk|sej|kolja|pollock|fiskfil/,80],[/räk/,90],
  [/fish ?& ?crisp|fiskpinn|panerad/,220],
  [/ryggbiff|entrecôte|entrecote|biff|oxfil|fransyska|högrev|nötstek|nötkött/,160],
  [/fläskfil|ytterfil/,120],[/kotlett|karré/,200],[/nötfärs/,220],[/blandfärs/,230],[/fläskfärs/,250],[/färs/,230],
  [/fläsklägg|sidfläsk|fläskkött|fläskbog/,250],
  [/(^|[^a-zåäö])ägg($|[^a-zåäö])/,140],[/skyr/,60],[/kvarg/,60],[/keso|cottage/,90],
  [/parmesan|grana padano/,400],[/halloumi/,320],[/mozzarella/,250],[/ost i saltlag|feta|vitost/,260],
  [/herrgård|präst|grevé|cheddar|maasdam|gouda|edamer|hushållsost|riven ost|västerbotten|svecia/,360],
  [/(^|[^a-zåäö])ost($|[^a-zåäö])/,350],
  [/yoghurt|fil($|[^a-zåäö])|filmjölk/,60],[/mjölk(?!choklad)/,50],
];
// Hela sortimentet (ordinarie priser) söks med de här orden – inte bara veckans erbjudanden.
const SORTIMENT = ["kyckling","kycklingfilé","kycklinglår","kalkon","nötfärs","blandfärs","fläskfärs","fläskfilé","fläskkarré","kotlett","biff","högrev","skinka","korv","bacon",
  "lax","torsk","sej","tonfisk","räkor","makrill","ägg","kvarg","keso","cottage cheese","skyr","proteinyoghurt","ost","mozzarella","halloumi","fetaost",
  "tofu","tempeh","sojafärs","vegofärs","linser","kikärtor","bönor","edamame","jordnötssmör","jordnötter","mandlar","solrosfrön","pumpakärnor",
  "havregryn","matvete","pasta","bulgur","quinoa",
  // Kolhydrater
  "potatis","ris","jasminris","basmatiris","spaghetti","makaroner","penne","nudlar","couscous","bröd","knäckebröd","tortilla","gnocchi"];
const KOLHYDRAT = /potatis|(^|[^a-zåäö])ris($|[^a-zåäö])|jasminris|basmatiris|fullkornsris|långkornigt|pasta|spaghetti|makaroner|penne|fusilli|tagliatelle|farfalle|lasagneplattor|nudlar|bulgur|couscous|quinoa|havregryn|matvete|^vete\b|knäckebröd|knäcke|(^|[^a-zåäö])bröd|limpa|tortilla|polenta|gnocchi/;
const INTE_KOLHYDRAT = /chips|mos|gratäng|pommes|klyft|rösti|kroket|sallad|färdig|sås|kex|kakor|bullar|kanel|vetebröd|rån|dessert|glass|sötpotatis|pizza|soppa|krutong|ströbröd|smörgås|toast skagen|dip|risifrutti|risgrynsgröt|ris à la|rismjölk|riskaka|risdryck|mellanmål|puffar/;
const arKolhydrat = namn => { const n = namn.toLowerCase(); return KOLHYDRAT.test(n) && !INTE_KOLHYDRAT.test(n) && !INTE_MAT.test(n); };
const MAX_KOLHYDRAT = 200;
const MAX_PROTEIN = 400;
const INTE_MAT = /chips|glass|sås|dressing|godis|choklad|katt|hund|foder|snacks|smoothie|juice|(^|[^f])läsk|kakor|(^|[^a-zåäö])kex|toalett|tvätt|blöj|deo|påsar/;
const r2 = x => (x == null || isNaN(x)) ? null : Math.round(x * 100) / 100;
function tal(t) { if (t == null) return null; if (typeof t === "number") return t; const m = String(t).match(/\d+(?:[.,:]\d+)?/g); return m ? Math.min(...m.map(s => parseFloat(s.replace(/[,:]/, ".")))) : null; }
function vikt(t) { if (!t) return null; t = String(t).toLowerCase().replace(/,/g, "."); let m = t.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l)\b/), n = 1, q, u; if (m) { n = +m[1]; q = +m[2]; u = m[3]; } else { m = t.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l)\b/); if (!m) return null; q = +m[1]; u = m[2]; } const kg = n * q * { kg: 1, l: 1, g: .001, ml: .001, cl: .01 }[u]; return kg > 0 ? kg : null; }
function jamfor(t) { if (!t) return [null, null]; t = String(t).toLowerCase(); const p = tal(t.split("/")[0]); if (/\/\s*(kg|l\b|liter)/.test(t)) return [p, "kg"]; if (t.includes("/st")) return [p, "st"]; return [p, null]; }
// Baljväxter: torkade ≈ 21 g protein/100 g, kokta/konserverade ≈ 7 g, färdiga bruna bönor i lag ≈ 5 g.
// Konserver känns igen på ord (burk, saltlag, sås …) och typiska konservvikter (380/410/420/540/560 g).
function baljvaxt(n) {
  if (!/linser|kikärt|bönor/.test(n) || /edamame|sojabön/.test(n)) return null;
  if (/fryst|frysta|djupfryst/.test(n)) return 7;
  if (/bruna bönor/.test(n) && !/torkad|torr|svenskodlad/.test(n)) return 5;
  if (/kokt|burk|tetra|i vatten|i tomat|saltlag|(^|[^a-zåäö])lag($|[^a-zåäö])|sås|sirap|färdig|baked|gryta|soppa|röra|hummus|durra/.test(n)) return 7;
  const m = n.match(/(\d{3})\s*g\b/); if (m && [230, 240, 250, 380, 390, 410, 420, 480, 540, 560].includes(+m[1]) && !/torkad|torr/.test(n)) return 7;
  return 21;
}
function protein(namn) { const n = namn.toLowerCase(); if (INTE_MAT.test(n)) return null; const bv = baljvaxt(n); if (bv != null) return bv >= 5 ? [bv, false] : null; for (const [re, g0, anim] of PROTEIN) { if (re.test(n)) { const g = g0 ?? (/kokt|burk|tetra|i vatten|i tomat/.test(n) ? 7 : 21); return g >= 5 ? [g, anim] : null; } } return null; }
// Näringsvärden på etiketten gäller 100 g ätlig del (utan ben), men kilopriset gäller hela vikten med ben.
// Andel ätlig del för rått kött med ben (ungefärliga standardvärden).
function atligDel(text) {
  const n = String(text || "").toLowerCase();
  if (/benfri|urben|utan ben|filé|file\b|fil\b|innerfil|bröst|strimla|färs(?!k)|lever|hjärta|bitar/.test(n)) return 1;
  if (/kycklingving|vingar/.test(n) && /kyckling/.test(n)) return 0.55;
  if (/kycklingklubb|klubba|kycklingben|trumstick|drumstick/.test(n)) return 0.70;
  if (/kycklinglår|kycklinghalv|lår med (del av )?ryggben/.test(n)) return 0.72;
  if (/hel kyckling|kyckling hel|majskyckling hel|hel majskyckling|grillkyckling|minikalkon|hel kalkon|kalkon hel/.test(n)) return 0.68;
  if (/fläsklägg/.test(n)) return 0.65;
  if (/kotlett|karré med ben|med ben/.test(n)) return 0.82;
  return 1;
}
function kalorier(namn) { const n = namn.toLowerCase(); if (INTE_MAT.test(n)) return null; const bv = baljvaxt(n); if (bv != null) return bv === 21 ? 340 : bv === 5 ? 100 : 110; for (const [re, k] of KCAL) if (re.test(n)) return k; return null; }
function post(v, e, p, o, kg, st, b, g = "", i = "") { const r = p && o && o > p ? Math.round(100 * (1 - p / o)) : 0; const pr = protein(v); let pk = null, a = null; if (pr) { if (kg) pk = pr[0] * 10 / kg; else if (st && /ägg/i.test(v)) pk = 7.5 / st; if (pk) a = pr[1]; } const kc = kalorier(v); let kk = null; if (kc) { if (kg) kk = kc * 10 / kg; else if (st && /ägg/i.test(v)) kk = 84 / st; } const ad = atligDel(v); let lake = null; if (ad < 1) { if (/kyckling/i.test(v) && /fryst/i.test(v)) lake = 0.87; const f = ad * (lake || 1); if (pk) pk *= f; if (kk) kk *= f; } return { v, e, p: r2(p), o: r2(o), r, kg: r2(kg), b, g, i, pk: r2(pk), a, kk: kk == null ? null : Math.round(kk), c: arKolhydrat(v) ? 1 : null, ad: ad < 1 ? ad : null, lake }; }
// Näringsvärden från etiketten (cache: "kalla:id" -> [protein per 100 g, kcal per 100 g]).
const NARING = (typeof window !== "undefined" && window.__NARING) || await fetch("https://raw.githubusercontent.com/bbunkern/AlbanskMat/main/data/naring.json?t=" + Date.now()).then(r => r.ok ? r.json() : {}).catch(() => ({}));
const nyNaring = {};
const rensa = t => String(t || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const harInfo = v => Array.isArray(v) && v[2] && typeof v[2] === "object";
function satNaring(x, varde) {
  if (!x || !varde || !x.kg) return x;
  let [prot, kcal] = varde;
  // Rimlighetskontroll: vissa etiketter anger kJ som kcal (t.ex. 1515 "kcal" per 100 g).
  if (kcal != null && kcal > 900) kcal = kcal / 4.184 <= 900 ? Math.round(kcal / 4.184) : null;
  if (prot != null && (prot < 0 || prot > 95)) prot = null;
  // Kött med ben: märkena räknar etiketten på olika sätt. Jämför med typvärdet R för rent kött och välj närmaste grund:
  //   bara köttet ≈ R  → × kött-% (saltlake) × ätlig del
  //   kött + saltlake, utan ben ≈ R × kött-%  → × ätlig del
  //   varan som den säljs (med ben) ≈ R × kött-% × ätlig del  → ingen omräkning
  const ingr = varde[2]?.i || "";
  const ad = atligDel(x.v + " " + ingr);
  let faktor = 1;
  x.ad = null; x.lake = null; x.grund = null;
  if (ad < 1) {
    const m = ingr.match(/(?:kyckling\w*|klubb\w*|ben|lår\w*|vingar|fläsk\w*|kotlett|karré)[^,]*?\(?\s*(\d{2,3}(?:[,.]\d+)?)\s*%/i);
    const L0 = m ? parseFloat(m[1].replace(",", ".")) / 100 : 1;
    const L = L0 > 0.5 && L0 < 1 ? L0 : 1;
    const R = /kyckling|kalkon/i.test(x.v + " " + ingr) ? 18.5 : 19.5;
    x.ad = ad; x.lake = L < 1 ? L : null;
    if (prot != null) {
      // Kalorierna avgör vilka grunder som är rimliga: omräknat till rent kött ska det bli 100–260 kcal/100 g
      // (rå kycklingklubba m. skinn 198 kcal enligt Livsmedelsverket). Ex. Eldorado klubba 190 kcal kan inte gälla varan med ben (= 312 kcal kött).
      const kottKcal = { kott: 1, "kott+lake": 1 / L, saljs: 1 / (L * ad) };
      let grunder = [["kott", R, L * ad], ["kott+lake", R * L, ad], ["saljs", R * L * ad, 1]].filter((g, i) => !(L === 1 && i === 1));
      if (kcal != null) { const rimliga = grunder.filter(g => { const kk = kcal * kottKcal[g[0]]; return kk >= 100 && kk <= 260; }); if (rimliga.length) grunder = rimliga; }
      const [namn, , f] = grunder.reduce((bast, g) => Math.abs(prot - g[1]) < Math.abs(prot - bast[1]) ? g : bast);
      faktor = f; x.grund = namn;
    } else faktor = L * ad;
  }
  if (prot != null) { x.pk = r2(prot * faktor * 10 / x.kg); x.n = 1; if (x.a == null) x.a = protein(x.v)?.[1] ?? null; if (prot < 5) { x.pk = null; } }
  if (kcal != null) { x.kk = Math.round(kcal * faktor * 10 / x.kg); if (x.c) x.n = 1; }
  return x;
}
function slaIhop(lista) { const m = new Map(); for (const x of lista) { const k = [x.v.toLowerCase(), x.e, x.p].join("|"); if (m.has(k)) { if (!m.get(k).b.includes(x.b)) m.get(k).b += " · " + x.b; } else m.set(k, { ...x }); } return [...m.values()]; }
const FALT = ["v", "e", "p", "o", "r", "kg", "b", "g", "i", "pk", "a", "kk", "u", "n", "c", "k", "ur", "ad", "lake", "grund"];
const packa = lista => lista.map(x => FALT.map(f => x[f] ?? null));
function behall(lista) { const prot = lista.filter(x => x.pk).sort((a, b) => b.pk - a.pk).slice(0, MAX_PROTEIN); const kolh = lista.filter(x => x.c && x.kk && !x.pk).sort((a, b) => b.kk - a.kk).slice(0, MAX_KOLHYDRAT); prot.push(...kolh); const ovr = lista.filter(x => !x.pk && x.r >= MIN_RABATT).sort((a, b) => b.r - a.r).slice(0, MAX_DEALS); return packa([...prot, ...ovr]); }
function sokTraffar(lista, s) { const DJURMAT = ["katt", "hund", "foder", "djur"]; return lista.filter(x => x.kg && s.ord.test(x.v) && ![...s.utom, ...DJURMAT].some(u => x.v.toLowerCase().includes(u))).sort((a, b) => a.kg - b.kg).slice(0, 5).map(x => FALT.map(f => x[f] ?? null)); }
function grab(h, key) { const i = h.indexOf('"' + key + '":') + key.length + 3; let d = 0, s = false, esc = false; for (let k = i; k < h.length; k++) { const c = h[k]; if (s) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') s = false; continue; } if (c === '"') s = true; else if (c === "[" || c === "{") d++; else if (c === "]" || c === "}") { d--; if (d === 0) return fixJson(h.slice(i, k + 1)); } } }
function utanDubbletter(erbj, sort) { const namn = new Set(erbj.map(x => x.v.toLowerCase())); const sedda = new Set(); return sort.filter(x => { const k = x.v.toLowerCase(); if (namn.has(k) || sedda.has(k)) return false; sedda.add(k); return true; }); }
async function iGrupper(lista, n, fn) { const ut = []; for (let i = 0; i < lista.length; i += n) ut.push(...(await Promise.all(lista.slice(i, i + n).map(fn)))); return ut; }
const fixJson = t => JSON.parse(t.replace(/:\s*undefined(\s*[,}\]])/g, ":null$1"));
const kr = x => x.toFixed(2).replace(".", ",") + " kr";
const ut = { kalla: location.hostname, poster: [], sok: {}, fel: [], naring: nyNaring };
function aterskapa(rad) {
  const o = Object.fromEntries(FALT.map((f, i) => [f, rad[i] ?? null]));
  const x = post(o.v, o.e, o.p, o.o, o.kg, null, o.b, o.g || "", o.i || "");
  x.u = o.u; x.k = o.k; x.ur = o.ur; x.id = o.k ? String(o.k).split(":")[1] : null;
  return satNaring(x, o.k ? (NARING[o.k] || nyNaring[o.k]) : null);
}
// Omräkningsläge (används av molnet för ICA Handla-data som skannats tidigare)
if (typeof window !== "undefined" && Array.isArray(window.__OMRAKNA)) return { poster: behall(window.__OMRAKNA.map(aterskapa)), sok: {}, fel: [] };
async function forsok(namn, fn) { try { await fn(); } catch (e) { ut.fel.push(namn + ": " + e.message); } }
if (location.hostname === "www.ica.se") {
  const alla = [];
  for (const [butik, slug] of Object.entries(ICA_BUTIKER)) await forsok(butik, async () => {
    const h = await fetch(`/erbjudanden/${slug}/`).then(r => r.text());
    for (const o of grab(h, "weeklyOffers")) {
      const d = o.details, m = o.parsedMechanics || {};
      let p = tal(m.value2); if (p != null) p /= (m.quantity || 1);
      const ord = tal((o.stores || [{}])[0].regularPrice);
      let [jp, enh] = jamfor(o.comparisonPrice), kg = enh === "kg" ? jp : null, st = enh === "st" ? jp : null;
      if (!kg && (m.value4 || "").includes("/kg")) kg = p;
      if (!kg && p && vikt(d.packageInformation)) kg = p / vikt(d.packageInformation);
      let namn = d.name + (d.brand ? ` (${d.brand})` : "") + (d.packageInformation ? `, ${d.packageInformation}` : "");
      let info = (o.traits || []).filter(t => ["Stammis", "Klipp", "Superklipp"].includes(t)).join(", ");
      if (info.includes("Stammis")) info += " – kräver ICA-kort";
      const x = post(namn, d.mechanicInfo || "", p, ord, kg, st, butik, (o.validTo || "").slice(0, 10), info);
      x.u = "https://handlaprivatkund.ica.se/stores/1003855/search?q=" + encodeURIComponent(d.name);
      alla.push(x);
    }
  });
  ut.poster = behall(slaIhop(alla));
}
if (location.hostname === "handlaprivatkund.ica.se") {
  // ICA:s bot-kontroll slår till efter ca 44 anrop per körning, oavsett takt. Därför högst ~40 anrop:
  // 1) etiketter för de bästa varorna som saknar etikett, 2) de bevakade sökorden, 3) en roterande del av sortimentet.
  // Varor från tidigare körningar ligger kvar (räknas om) tills de söks fram igen.
  const PAUS_MS = 6000, MAX_ANROP = 40, MAX_ETIKETTER = 14, SORT_PER_DAG = 18;
  let anrop = 0, stopp = false;
  const bot = h => !h.includes("__INITIAL_STATE__") && !h.includes("Näringsvärde") && /Human Verification|confirm you are human|awsWafCookieDomainList/i.test(h);
  async function hamtaSida(url) {
    if (stopp || anrop >= MAX_ANROP) return null;
    anrop++;
    const h = await fetch(url).then(r => r.text());
    await new Promise(r => setTimeout(r, PAUS_MS));
    if (bot(h)) { stopp = true; ut.fel.push(`ICA Handla: bot-kontroll efter ${anrop} anrop – avbröt (resten tas nästa dag)`); return null; }
    return h;
  }
  function icaPost(p, butik) { const pris = tal(p.price?.current?.amount); if (!pris) return null; const ord = tal(p.price?.original?.amount); const lbl = p.price?.unit?.label || ""; const kg = /kg|liter/.test(lbl) ? tal(p.price?.unit?.current?.amount) : null; const x = post(p.name, kr(pris), pris, ord, kg, null, butik + " (online)"); x.id = p.retailerProductId; x.k = "ica:" + p.retailerProductId; x.ur = p.countryOfOrigin || null; x.u = `https://handlaprivatkund.ica.se/stores/${ICA_EHANDEL[butik]}/products/${encodeURIComponent(p.name.toLowerCase().replace(/[^a-z0-9åäö]+/g, "-"))}/${p.retailerProductId}`; return satNaring(x, NARING[x.k]); }
  function icaNaring(h) {
    const tal1 = re => { const m = h.match(re); return m ? parseFloat(m[1].replace(",", ".")) : null; };
    const prot = tal1(/<td>Protein<\/td><td>([\d.,]+)\s*g/i), kcal = tal1(/<td>Energi \(kcal\)<\/td><td>([\d.,]+)\s*kcal/i);
    const sektion = rubrik => { const m = h.match(new RegExp("<h2[^>]*>" + rubrik + "</h2><div[^>]*>([\\s\\S]*?)</div></div>", "i")); return m ? m[1] : ""; };
    const ingr = rensa(sektion("Ingredienser")).slice(0, 1500);
    const tabell = sektion("Näringsdeklaration");
    const rader = [...tabell.matchAll(/<tr><td>([^<]+)<\/td><td>([^<]*)<\/td>/gi)].map(m => [rensa(m[1]), rensa(m[2])]).filter(r => r[1]);
    if (prot == null && kcal == null && !ingr && !rader.length) return null;
    return [prot, kcal, { i: ingr || null, t: rader, b: (tabell.match(/<th>Näringsvärde<\/th><th>([^<]+)<\/th>/i) || [])[1] || "100 g" }];
  }
  // Tidigare varor (från förra körningen) som utgångsläge
  const forra = await fetch("https://raw.githubusercontent.com/bbunkern/AlbanskMat/main/data/icaonline.json?t=" + Date.now()).then(r => r.ok ? r.json() : null).catch(() => null);
  const karta = new Map();
  for (const rad of forra?.icaonline?.poster || []) { const x = aterskapa(rad); if (x.k) karta.set(x.k, x); }
  const forraSok = forra?.icaonline?.sok || {};

  // 1) Etiketter för de bästa kandidaterna
  const kandidater = [...karta.values()].filter(x => (x.pk || (x.c && x.kk)) && x.id && !harInfo(NARING[x.k])).sort((a, b) => (b.pk || b.kk / 100) - (a.pk || a.kk / 100)).slice(0, MAX_ETIKETTER);
  for (const x of kandidater) {
    try {
      const h = await hamtaSida(x.u); if (!h) break;
      const v = icaNaring(h);
      if (v) { nyNaring[x.k] = v; satNaring(x, v); }
    } catch (e) { ut.fel.push("ICA Handla näring: " + e.message); }
  }
  // 2) Bevakade sökord + 3) roterande del av sortimentet
  const dag = Math.floor(Date.now() / 86400000), sortOrd = SORTIMENT.filter(q => !Object.values(SOK).some(s => s.q === q));
  const start = (dag * SORT_PER_DAG) % sortOrd.length;
  const idag = [...Object.values(SOK).map(s => s.q), ...[...sortOrd, ...sortOrd].slice(start, start + SORT_PER_DAG)];
  const perOrd = {};
  for (const [butik, id] of Object.entries(ICA_EHANDEL)) for (const q of idag) {
    try {
      const h = await hamtaSida(`/stores/${id}/search?q=${encodeURIComponent(q)}`); if (!h) break;
      const a = h.indexOf("window.__INITIAL_STATE__=");
      if (a < 0) continue;
      const st = fixJson(h.slice(a + 25, h.indexOf("</script>", a + 25)).trim().replace(/;$/, ""));
      perOrd[q] = [];
      for (const p of Object.values(st.data?.products?.productEntities || {})) { const x = icaPost(p, butik); if (x) { karta.set(x.k, x); perOrd[q].push(x); } }
    } catch (e) { ut.fel.push("ICA Handla " + q + ": " + e.message); }
  }
  ut.poster = behall([...karta.values()]);
  for (const [rubrik, s] of Object.entries(SOK)) ut.sok[rubrik] = perOrd[s.q] ? sokTraffar(perOrd[s.q], s) : (forraSok[rubrik] || []);
  ut.anrop = anrop;
}
if (location.hostname === "www.hemkop.se") {
  const alla = [];
  for (const [butik, id] of Object.entries(HEMKOP_BUTIKER)) await forsok(butik, async () => {
    const j = await fetch(`/search/campaigns/offline?q=${id}&type=PERSONAL_GENERAL&page=0&size=500`).then(r => r.json());
    for (const p of j.results || []) for (const k of p.potentialPromotions || []) {
      let pris = tal(k.price); if (pris != null) pris /= (k.qualifyingCount || 1);
      let ord = tal(p.price);
      let [jp, enh] = jamfor(k.comparePrice), kg = enh === "kg" ? jp : null, st = enh === "st" ? jp : null;
      if ((k.cartLabel || "").includes("kg") || (ord && pris && pris > ord)) { pris = jp; ord = tal(p.promotionProductOrdinaryComparePrice); }
      if (!kg && pris && vikt(p.displayVolume)) kg = pris / vikt(p.displayVolume);
      const namn = p.name + (p.manufacturer ? ` (${p.manufacturer})` : "") + (p.displayVolume ? `, ${p.displayVolume}` : "");
      let info = k.description || "";
      if (k.campaignType === "LOYALTY") info = ("Klubbpris " + info).trim();
      const x = post(namn, k.cartLabel || "", pris, ord, kg, st, butik, k.endDate || "", info);
      x.id = p.code; x.k = "hemkop:" + p.code; x.u = "https://www.hemkop.se/produkt/" + p.code; alla.push(x);
    }
  });
  let sortiment = [];
  await forsok("Hemköp sortiment", async () => {
    const svar = await iGrupper(SORTIMENT, 6, async q => { try { return await fetch(`/search?q=${encodeURIComponent(q)}&page=0&size=100`).then(r => r.json()); } catch (e) { ut.fel.push("Hemköp sortiment " + q + ": " + e.message); return null; } });
    for (const j of svar) for (const p of j?.results || []) {
      const pris = tal(p.priceValue ?? p.price); if (!pris) continue;
      const kg = ["kg", "l"].includes(p.comparePriceUnit) ? tal(p.comparePrice) : null;
      const namn = p.name + (p.manufacturer ? ` (${p.manufacturer})` : "") + (p.displayVolume ? `, ${p.displayVolume}` : "");
      const x = post(namn, kr(pris), pris, null, kg, null, "Hemköp (online)");
      x.id = p.code; x.k = "hemkop:" + p.code; x.u = "https://www.hemkop.se/produkt/" + p.code; sortiment.push(x);
    }
  });
  const hemAlla = [...slaIhop(alla), ...utanDubbletter(slaIhop(alla), sortiment)];
  // Sökorden först (få anrop), sedan etiketter för proteinkandidaterna – bäst först, lugnt, avbryt om Hemköp börjar blockera.
  for (const [rubrik, s] of Object.entries(SOK)) await forsok("Hemköp-sök " + s.q, async () => {
    const j = await fetch(`/search?q=${encodeURIComponent(s.q)}&page=0&size=100`).then(r => r.json());
    const lista = (j.results || []).map(p => { const pris = tal(p.priceValue ?? p.price); const kg = ["kg", "l"].includes(p.comparePriceUnit) ? tal(p.comparePrice) : null; const namn = p.name + (p.manufacturer ? ` (${p.manufacturer})` : "") + (p.displayVolume ? `, ${p.displayVolume}` : ""); if (!pris) return null; const x = post(namn, kr(pris), pris, null, kg, null, "Hemköp (online)"); x.k = "hemkop:" + p.code; x.u = "https://www.hemkop.se/produkt/" + p.code; return satNaring(x, NARING["hemkop:" + p.code]); }).filter(Boolean);
    ut.sok[rubrik] = sokTraffar(lista, s);
  });
  await forsok("Hemköp näring", async () => {
    const MAX_NYA = 250;
    const sett = new Set(), koder = [];
    for (const x of hemAlla.filter(x => (x.pk || (x.c && x.kk)) && x.id && !harInfo(NARING["hemkop:" + x.id])).sort((a, b) => (b.pk || b.kk / 100) - (a.pk || a.kk / 100))) if (!sett.has(x.id)) { sett.add(x.id); koder.push(x.id); }
    let blockerad = false, hamtade = 0;
    await iGrupper(koder.slice(0, MAX_NYA), 2, async kod => {
      if (blockerad) return;
      try {
        const r = await fetch("/axfood/rest/p/" + encodeURIComponent(kod));
        if (!(r.headers.get("content-type") || "").includes("json")) { blockerad = true; return; }
        const d = await r.json(); hamtade++;
        const det = (d.nutrientHeaders || []).flatMap(h => h.nutrientDetails || []);
        const hitta = (typ, enh) => { const n = det.find(x => x.nutrientTypeCode?.toLowerCase() === typ && (!enh || x.measurementUnitCode === enh)); return n ? parseFloat(String(n.quantityContained).replace(",", ".")) : null; };
        const ENHET = { gram: "g", kilojoule: "kJ", kilokalori: "kcal", milligram: "mg", mikrogram: "µg", milliliter: "ml" };
        const rader = det.map(n => [n.nutrientTypeCode ? n.nutrientTypeCode[0].toUpperCase() + n.nutrientTypeCode.slice(1) : "", `${["<", ">"].includes(n.measurementPrecisionCode) ? n.measurementPrecisionCode + " " : ""}${String(n.quantityContained ?? "").replace(".", ",")} ${ENHET[n.measurementUnitCode] || n.measurementUnitCode || ""}`.trim()]).filter(r => r[0] && r[1]);
        const ingr = rensa(d.ingredients).replace(/^ingredienser:\s*/i, "").slice(0, 1500);
        const v = [hitta("protein"), hitta("energi", "kilokalori"), { i: ingr || null, t: rader, b: d.nutritionDescription || "100 g", u: rensa(d.countryOfOriginStatement || d.tradeItemCountryOfOrigin || "").slice(0, 120) || null }];
        if (v[0] != null || v[1] != null || ingr || rader.length) nyNaring["hemkop:" + kod] = v;
      } catch (e) {}
      await new Promise(r => setTimeout(r, 400));
    });
    if (blockerad) ut.fel.push(`Hemköp: slutade hämta etiketter efter ${hamtade} st (för många anrop) – fortsätter i morgon`);
    for (const x of hemAlla) { const v = NARING["hemkop:" + x.id] || nyNaring["hemkop:" + x.id]; satNaring(x, v); if (v?.[2]?.u) x.ur = v[2].u; }
  });
  ut.poster = behall(hemAlla);
}
if (location.hostname === "www.lidl.se") {
  function lidlPost(d, kravRabatt) {
    // Lidl Plus-varor har priset i d.lidlPlus i stället för d.price. Ta Lidl Plus-priset när det saknas vanligt pris eller när det är lägre.
    let p = d.price || {}, plus = false, ordPlus = null;
    const lp = Array.isArray(d.lidlPlus) ? d.lidlPlus.find(x => tal(x?.price?.price)) : null;
    if (lp && (!tal(p.price) || tal(lp.price.price) < tal(p.price))) {
      ordPlus = tal(p.price) || tal(lp.price.oldPrice) || tal(((d.keyfacts?.description || "").match(/30-dgrs pris:\s*([\d.,]+)/) || [])[1]);
      p = { ...lp.price, oldPrice: ordPlus }; plus = true;
    }
    if (kravRabatt && (!p.discount || !p.oldPrice)) return null; const pris = tal(p.price); if (!pris) return null; const forp = p.packaging?.text || "", bas = (p.basePrice?.text || "").trim(); let kg = null; if (bas.startsWith("/kg")) kg = pris; else if (vikt(forp)) kg = pris / vikt(forp); else if (/kr\/(kg|l)\b/.test(bas)) kg = tal(bas); const e = kr(pris) + (forp ? " / " + forp : "") + (bas.startsWith("/kg") ? "/kg" : ""); const badge = [plus ? "Lidl Plus" : "", d.stockAvailability?.badgeInfo?.badges?.[0]?.text || ""].filter(Boolean).join(" · "); const x = post(d.fullTitle || d.title || "", e, pris, tal(p.oldPrice), kg, null, LIDL, badge); if (d.canonicalPath) x.u = "https://www.lidl.se" + d.canonicalPath; { // productOrigin innehåller ofta skräp ("progress_event"); Lidl skriver ursprunget i faktarutan: "Ursprung: Sverige".
      const kf = (d.keyfacts?.description || "").replace(/<[^>]+>/g, " ").replace(/&ouml;/g, "ö").replace(/&auml;/g, "ä").replace(/&aring;/g, "å");
      const m = kf.match(/Ursprung:\s*([^\n]+?)\s*(?=$|  )/i), po = typeof d.productOrigin === "string" ? d.productOrigin : d.productOrigin?.name;
      x.ur = m && !/se förp/i.test(m[1]) ? m[1].trim() : po && !/_/.test(po) ? po : null; } return x; }
  async function lidlSok(param, krav) { const lista = []; let off = 0, tot = 1; while (off < tot && off < 600) { const j = await fetch(`/q/api/search?assortment=SE&locale=sv_SE&version=v2.0.0&fetchsize=60&offset=${off}&${param}`).then(r => r.json()); tot = j.numFound || 0; if (!j.items?.length) break; off += j.items.length; for (const it of j.items) { const x = lidlPost(it.gridbox?.data || {}, krav); if (x) lista.push(x); } } return lista; }
  await forsok(LIDL, async () => { ut.poster = behall(await lidlSok("category.id=10068374", false)); });
  for (const [rubrik, s] of Object.entries(SOK)) await forsok("Lidl-sök " + s.q, async () => { ut.sok[rubrik] = sokTraffar(await lidlSok("q=" + encodeURIComponent(s.q), false), s); });
}
return ut;
})()
