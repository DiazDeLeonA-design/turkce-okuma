# Türkçe Okuyucu – Turkish Reader (PWA)

Static, no-build web app for learning Turkish by reading free public-domain texts.

Features: library of 12 texts + paste-your-own · read-aloud (Web Speech, tr-TR) with sentence/word highlighting, speed 0.5–1.2×, prev/next, tap-a-sentence-to-play, remembered position · **word-by-word slow reading mode** · tap any word → translation (EN or ES), Wiktionary definition, root/lemma guess and **suffix breakdown** · save to vocabulary (search, edit, delete, CSV export) · flashcards (SM-2, both directions) + multiple-choice quiz · **Picture Words**: 9 illustrated scenes with tappable objects, speech, save-to-vocab and a **“Find it” listening game** · **daily streak & progress stats** · dark mode · installable, offline for bundled content.

## Features
Library of 12 public-domain books, reader with TTS, tap-a-word, vocab + SM-2 practice, Picture Words scenes with a Find-it game, Songs (traditional lyrics, tappable words, English toggle, YouTube embed, manual line sync, paste your own), streak/stats. Installable PWA.

## Run locally
    python3 -m http.server 8765      # then open http://localhost:8765
(Service workers need http://localhost or https.)

## Publish (GitHub Pages) — not done yet
Everything is relative-path, so it works from a repo subpath: push this folder (without `test/node_modules`) and enable Pages on the root of `main`.

## Tests
    cd test && npm i && node morph.test.mjs && node e2e.mjs && node extra.mjs
`e2e.mjs` uses playwright-core with the system Chrome, mocks the speech engine (headless has no Turkish voice) but calls the **live** Wiktionary/Google translation endpoints. Screenshots land in `shots/`.

## Rebuild the book data
    python3 build/fetch_books.py     # writes data/books.json

See `sources.md` for texts, licences and attribution.
