# Metabolismo 3D — Galilei
Creato dal prof. Andrea Bertelli.

## GitHub
Estrai questo ZIP. Crea un repository privato e carica nella sua radice la cartella dist e i file vercel.json e README.md usando Add file → Upload files.

## Vercel
Importa il repository con Add New → Project.
Root Directory alla radice del repository.
Framework Preset Other.
Output Directory dist.
Build Command vuoto.
Il file vercel.json include la configurazione statica.

La privacy del repository GitHub e quella del sito online sono configurazioni distinte. Imposta Deployment Protection in Vercel prima di usare un URL riservato. Consulta https://vercel.com/docs/deployment-protection per i limiti del tuo piano.

## Anteprima locale
Con Python 3 installato, dalla cartella estratta esegui:
python3 -m http.server --bind 127.0.0.1 --directory dist 8000
Apri http://127.0.0.1:8000

## Modifiche
dist/index.html contiene pagina e approfondimenti.
dist/style.css definisce layout e colori.
dist/phases.js contiene spiegazioni delle fasi.
dist/scene.js disegna le scene tridimensionali.
dist/app.js gestisce i controlli.
