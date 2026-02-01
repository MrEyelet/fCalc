# fCalc — Magic Calculator (web)

Krótkie info:
- "fCalc" to webowa aplikacja-kalkulator z "magicznego" przyciskiem minus: po wpisaniu wyrażenia i naciśnięciu "-" aplikacja oblicza X tak, aby wynik równania (random − X) był równy ustawionemu *force number*.
- Aplikacja jest przygotowana jako PWA (manifest + service worker) — po dodaniu na ekran główny w trybie "display: standalone" uruchamia się bez paska adresu.

Uruchomienie lokalne:
1. npm install
2. npm run dev
3. Otwórz: $BROWSER http://localhost:5173

Budowanie i test PWA:
1. npm run build
2. npm run preview
3. Otwórz stronę na urządzeniu mobilnym i użyj "Add to Home screen" żeby przetestować uruchamianie bez paska URL.

Pliki kluczowe:
- `src/` — kod aplikacji (React + TypeScript)
- `public/manifest.json` — manifest PWA (display: standalone)
- `public/sw.js` — prosty service worker

Jeśli chcesz, mogę teraz zrobić commit z wiadomością "feat: scaffold fCalc PWA" i uruchomić `npm install` + `npm run dev` w tym środowisku.
