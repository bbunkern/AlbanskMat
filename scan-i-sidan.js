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
};
const VEGO = /vego|vegan|växtbaserad|oumph|quorn|anamma|planti|hälsans kök|green ?deli|sojafärs|sojabit|sojastrim/;
const PROTEIN = [
  [/tofu/,13,false],[/tempeh/,19,false],[/seitan/,25,false],[VEGO,15,false],
  [/edamame|sojabön/,11,false],[/jordnötssmör|peanut butter/,25,false],[/pumpakärn/,30,false],
  [/solrosfrö|hampafrö/,22,false],[/jordnöt/,25,false],[/mandel|mandlar/,21,false],
  [/cashew|valnöt|hasselnöt|nötmix|nötter/,15,false],[/linser|kikärt|bönor/,null,false],
  [/havregryn|müsli|granola/,12,false],
  [/matvete|^vete\b|bulgur|couscous|quinoa|pasta|spaghetti|makaroner|penne|fusilli|nudlar/,12,false],
  [/kycklingbröst|kycklingfil|innerfil|bröstfil/,23,true],[/kycklinglår|lårfil/,18,true],
  [/kycklingkorv/,12,true],[/kyckling/,18,true],[/kalkon/,21,true],[/tonfisk/,24,true],
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
  [/olivolja|rapsolja|solrosolja|matolja|(^|[^a-zåäö])olja/,880],[/smör|bregott/,720],
  [/jordnötssmör|peanut butter/,600],[/mandel|mandlar|cashew|valnöt|hasselnöt|nötmix|nötter|jordnöt/,600],
  [/solrosfrö|pumpakärn|hampafrö/,570],[/knäckebröd|knäcke/,350],
  [/havregryn|müsli|granola/,370],[/matvete|^vete\b|bulgur|couscous|quinoa|(^|[^a-zåäö])ris($|[^a-zåäö])|jasminris|basmatiris|fullkornsris/,350],
  [/pasta|spaghetti|makaroner|penne|fusilli|nudlar/,355],[/(linser|kikärt|bönor).*(kokt|burk|tetra|i vatten|i tomat)|(kokt|burk|tetra).*(linser|kikärt|bönor)/,110],
  [/linser|kikärt|bönor/,340],[/edamame|sojabön/,120],[/tofu/,120],[/tempeh/,190],[/seitan/,120],
  [/vego|vegan|växtbaserad|oumph|quorn|sojafärs|sojabit/,170],
  [/sötpotatis/,85],[/potatis/,75],[/bröd|limpa|baguette|fralla|frallor|tortilla/,250],
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
  "havregryn","matvete","pasta","bulgur","quinoa"];
const MAX_PROTEIN = 400;
const INTE_MAT = /chips|glass|sås|dressing|godis|choklad|katt|hund|foder|snacks|smoothie|juice|(^|[^f])läsk|kakor|(^|[^a-zåäö])kex|toalett|tvätt|blöj|deo|påsar/;
const r2 = x => (x == null || isNaN(x)) ? null : Math.round(x * 100) / 100;
function tal(t) { if (t == null) return null; if (typeof t === "number") return t; const m = String(t).match(/\d+(?:[.,:]\d+)?/g); return m ? Math.min(...m.map(s => parseFloat(s.replace(/[,:]/, ".")))) : null; }
function vikt(t) { if (!t) return null; t = String(t).toLowerCase().replace(/,/g, "."); let m = t.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l)\b/), n = 1, q, u; if (m) { n = +m[1]; q = +m[2]; u = m[3]; } else { m = t.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l)\b/); if (!m) return null; q = +m[1]; u = m[2]; } const kg = n * q * { kg: 1, l: 1, g: .001, ml: .001, cl: .01 }[u]; return kg > 0 ? kg : null; }
function jamfor(t) { if (!t) return [null, null]; t = String(t).toLowerCase(); const p = tal(t.split("/")[0]); if (/\/\s*(kg|l\b|liter)/.test(t)) return [p, "kg"]; if (t.includes("/st")) return [p, "st"]; return [p, null]; }
function protein(namn) { const n = namn.toLowerCase(); if (INTE_MAT.test(n)) return null; for (const [re, g0, anim] of PROTEIN) { if (re.test(n)) { const g = g0 ?? (/kokt|burk|tetra|i vatten|i tomat/.test(n) ? 7 : 21); return g >= 5 ? [g, anim] : null; } } return null; }
function kalorier(namn) { const n = namn.toLowerCase(); if (INTE_MAT.test(n)) return null; for (const [re, k] of KCAL) if (re.test(n)) return k; return null; }
function post(v, e, p, o, kg, st, b, g = "", i = "") { const r = p && o && o > p ? Math.round(100 * (1 - p / o)) : 0; const pr = protein(v); let pk = null, a = null; if (pr) { if (kg) pk = pr[0] * 10 / kg; else if (st && /ägg/i.test(v)) pk = 7.5 / st; if (pk) a = pr[1]; } const kc = kalorier(v); let kk = null; if (kc) { if (kg) kk = kc * 10 / kg; else if (st && /ägg/i.test(v)) kk = 84 / st; } return { v, e, p: r2(p), o: r2(o), r, kg: r2(kg), b, g, i, pk: r2(pk), a, kk: kk == null ? null : Math.round(kk) }; }
function slaIhop(lista) { const m = new Map(); for (const x of lista) { const k = [x.v.toLowerCase(), x.e, x.p].join("|"); if (m.has(k)) { if (!m.get(k).b.includes(x.b)) m.get(k).b += " · " + x.b; } else m.set(k, { ...x }); } return [...m.values()]; }
const FALT = ["v", "e", "p", "o", "r", "kg", "b", "g", "i", "pk", "a", "kk"];
const packa = lista => lista.map(x => FALT.map(f => x[f] ?? null));
function behall(lista) { const prot = lista.filter(x => x.pk).sort((a, b) => b.pk - a.pk).slice(0, MAX_PROTEIN); const ovr = lista.filter(x => !x.pk && x.r >= MIN_RABATT).sort((a, b) => b.r - a.r).slice(0, MAX_DEALS); return packa([...prot, ...ovr]); }
function sokTraffar(lista, s) { const DJURMAT = ["katt", "hund", "foder", "djur"]; return lista.filter(x => x.kg && s.ord.test(x.v) && ![...s.utom, ...DJURMAT].some(u => x.v.toLowerCase().includes(u))).sort((a, b) => a.kg - b.kg).slice(0, 5).map(x => FALT.map(f => x[f] ?? null)); }
function grab(h, key) { const i = h.indexOf('"' + key + '":') + key.length + 3; let d = 0, s = false, esc = false; for (let k = i; k < h.length; k++) { const c = h[k]; if (s) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') s = false; continue; } if (c === '"') s = true; else if (c === "[" || c === "{") d++; else if (c === "]" || c === "}") { d--; if (d === 0) return fixJson(h.slice(i, k + 1)); } } }
function utanDubbletter(erbj, sort) { const namn = new Set(erbj.map(x => x.v.toLowerCase())); const sedda = new Set(); return sort.filter(x => { const k = x.v.toLowerCase(); if (namn.has(k) || sedda.has(k)) return false; sedda.add(k); return true; }); }
async function iGrupper(lista, n, fn) { const ut = []; for (let i = 0; i < lista.length; i += n) ut.push(...(await Promise.all(lista.slice(i, i + n).map(fn)))); return ut; }
const fixJson = t => JSON.parse(t.replace(/:\s*undefined(\s*[,}\]])/g, ":null$1"));
const kr = x => x.toFixed(2).replace(".", ",") + " kr";
const ut = { kalla: location.hostname, poster: [], sok: {}, fel: [] };
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
      alla.push(post(namn, d.mechanicInfo || "", p, ord, kg, st, butik, (o.validTo || "").slice(0, 10), info));
    }
  });
  ut.poster = behall(slaIhop(alla));
}
if (location.hostname === "handlaprivatkund.ica.se") {
  function icaSida(h) { const a = h.indexOf("window.__INITIAL_STATE__=") + 25, b = h.indexOf("</script>", a); if (a < 25) throw new Error("ingen produktdata (bot-kontroll?)"); return fixJson(h.slice(a, b).trim().replace(/;$/, "")); }
  function icaPost(p, butik) { const pris = tal(p.price?.current?.amount); if (!pris) return null; const ord = tal(p.price?.original?.amount); const lbl = p.price?.unit?.label || ""; const kg = /kg|liter/.test(lbl) ? tal(p.price?.unit?.current?.amount) : null; return post(p.name, kr(pris), pris, ord, kg, null, butik + " (online)"); }
  await forsok("ICA Handla sortiment", async () => {
    const alla = [];
    for (const [butik, id] of Object.entries(ICA_EHANDEL)) {
      const sidor = await iGrupper(SORTIMENT, 4, async q => { try { return icaSida(await fetch(`/stores/${id}/search?q=${encodeURIComponent(q)}`).then(r => r.text())); } catch (e) { ut.fel.push("ICA Handla " + q + ": " + e.message); return null; } });
      for (const st of sidor) if (st) for (const p of Object.values(st.data?.products?.productEntities || {})) { const x = icaPost(p, butik); if (x) alla.push(x); }
    }
    ut.poster = behall(utanDubbletter([], alla));
  });
  for (const [rubrik, s] of Object.entries(SOK)) await forsok("ICA-sök " + s.q, async () => {
    const lista = [];
    for (const [butik, id] of Object.entries(ICA_EHANDEL)) {
      const h = await fetch(`/stores/${id}/search?q=${encodeURIComponent(s.q)}`).then(r => r.text());
      const a = h.indexOf("window.__INITIAL_STATE__=") + 25, b = h.indexOf("</script>", a);
      const st = fixJson(h.slice(a, b).trim().replace(/;$/, ""));
      for (const p of Object.values(st.data.products.productEntities)) {
        const pris = tal(p.price?.current?.amount);
        const lbl = p.price?.unit?.label || "";
        const kg = /kg|liter/.test(lbl) ? tal(p.price?.unit?.current?.amount) : null;
        if (pris) lista.push(post(p.name, kr(pris), pris, null, kg, null, butik + " (online)"));
      }
    }
    ut.sok[rubrik] = sokTraffar(lista, s);
  });
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
      alla.push(post(namn, k.cartLabel || "", pris, ord, kg, st, butik, k.endDate || "", info));
    }
  });
  let sortiment = [];
  await forsok("Hemköp sortiment", async () => {
    const svar = await iGrupper(SORTIMENT, 6, async q => { try { return await fetch(`/search?q=${encodeURIComponent(q)}&page=0&size=100`).then(r => r.json()); } catch (e) { ut.fel.push("Hemköp sortiment " + q + ": " + e.message); return null; } });
    for (const j of svar) for (const p of j?.results || []) {
      const pris = tal(p.priceValue ?? p.price); if (!pris) continue;
      const kg = ["kg", "l"].includes(p.comparePriceUnit) ? tal(p.comparePrice) : null;
      const namn = p.name + (p.manufacturer ? ` (${p.manufacturer})` : "") + (p.displayVolume ? `, ${p.displayVolume}` : "");
      sortiment.push(post(namn, kr(pris), pris, null, kg, null, "Hemköp (online)"));
    }
  });
  ut.poster = behall([...slaIhop(alla), ...utanDubbletter(slaIhop(alla), sortiment)]);
  for (const [rubrik, s] of Object.entries(SOK)) await forsok("Hemköp-sök " + s.q, async () => {
    const j = await fetch(`/search?q=${encodeURIComponent(s.q)}&page=0&size=100`).then(r => r.json());
    const lista = (j.results || []).map(p => { const pris = tal(p.priceValue ?? p.price); const kg = ["kg", "l"].includes(p.comparePriceUnit) ? tal(p.comparePrice) : null; const namn = p.name + (p.manufacturer ? ` (${p.manufacturer})` : "") + (p.displayVolume ? `, ${p.displayVolume}` : ""); return pris ? post(namn, kr(pris), pris, null, kg, null, "Hemköp (online)") : null; }).filter(Boolean);
    ut.sok[rubrik] = sokTraffar(lista, s);
  });
}
if (location.hostname === "www.lidl.se") {
  function lidlPost(d, kravRabatt) { const p = d.price || {}; if (kravRabatt && (!p.discount || !p.oldPrice)) return null; const pris = tal(p.price); if (!pris) return null; const forp = p.packaging?.text || "", bas = (p.basePrice?.text || "").trim(); let kg = null; if (bas.startsWith("/kg")) kg = pris; else if (vikt(forp)) kg = pris / vikt(forp); else if (/kr\/(kg|l)\b/.test(bas)) kg = tal(bas); const e = kr(pris) + (forp ? " / " + forp : "") + (bas.startsWith("/kg") ? "/kg" : ""); const badge = d.stockAvailability?.badgeInfo?.badges?.[0]?.text || ""; return post(d.fullTitle || d.title || "", e, pris, tal(p.oldPrice), kg, null, LIDL, badge); }
  async function lidlSok(param, krav) { const lista = []; let off = 0, tot = 1; while (off < tot && off < 600) { const j = await fetch(`/q/api/search?assortment=SE&locale=sv_SE&version=v2.0.0&fetchsize=60&offset=${off}&${param}`).then(r => r.json()); tot = j.numFound || 0; if (!j.items?.length) break; off += j.items.length; for (const it of j.items) { const x = lidlPost(it.gridbox?.data || {}, krav); if (x) lista.push(x); } } return lista; }
  await forsok(LIDL, async () => { ut.poster = behall(await lidlSok("category.id=10068374", false)); });
  for (const [rubrik, s] of Object.entries(SOK)) await forsok("Lidl-sök " + s.q, async () => { ut.sok[rubrik] = sokTraffar(await lidlSok("q=" + encodeURIComponent(s.q), false), s); });
}
return ut;
})()
