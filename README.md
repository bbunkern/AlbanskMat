# AlbanskMat

Daglig skanning av veckoerbjudanden och sökpriser från ICA, Hemköp och Lidl i Stockholm, rankade efter **protein per krona** och rabatt.

- `scan-i-sidan.js` – körs inne i respektive butiks webbsida och returnerar erbjudanden och sökträffar.
- `skanna.mjs` + `.github/workflows/skanna.yml` – daglig skanning i GitHub Actions, skriver `data/senaste.json` och `data/historik/`.
- `data/icaonline.json` – ICA Handla-priser som skannas separat.
- `index.html` – den publika sidan (GitHub Pages).

Proteinvärden är schabloner per 100 g. Kontrollera alltid pris och villkor i butiken.
