CREATE TABLE IF NOT EXISTS kortdatum (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  butik TEXT NOT NULL,
  tidpunkt TEXT NOT NULL,
  veckodag TEXT,
  timme INTEGER,
  vara TEXT NOT NULL,
  varumarke TEXT,
  mangd TEXT,
  pris REAL,
  ordinarie_pris REAL,
  rabatt_procent INTEGER,
  kr_per_kg REAL,
  bast_fore TEXT,
  typ TEXT,
  protein_per_100g REAL,
  animaliskt INTEGER
);
CREATE INDEX IF NOT EXISTS kortdatum_tidpunkt ON kortdatum (tidpunkt);
