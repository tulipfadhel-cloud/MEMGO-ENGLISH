# MEMGO ENGLISH — Visual Vocabulary Quiz

Production-quality static Visual Vocabulary Quiz for MEMGO ENGLISH, built with native HTML, CSS and JavaScript modules. No runtime framework or third-party package is required.

## Local preview

Run the repository with any static development server. For example:

```bash
python -m http.server 5173
```

Then open `http://localhost:5173`.

## Content integration

- Official logo: replace the isolated temporary brand mark in `src/app.js` inside `logoMarkup()` when the official logo asset is supplied.
- Real vocabulary, sentences and answer images: update `src/quiz-data.js`.
- Quiz behavior: update `src/config.js`.

The current remote image URLs are temporary development placeholders only. They are not final MEMGO ENGLISH content.

## Architecture

- `src/quiz-data.js` — centralized quiz content
- `src/config.js` — Assessment/Practice mode, randomization, review and persistence
- `src/logic.js` — validation, non-mutating shuffle, scoring and sentence highlighting
- `src/persistence.js` — validated local active-attempt recovery
- `src/app.js` — quiz state and UI orchestration
- `src/styles.css` — responsive MEMGO ENGLISH design system

Correctness is always mapped with stable `correctImageId` values, never array position or filename.

## Implemented flow

Student Name → Start Quiz → Questions → Results → Optional Answer Review → Restart.

Includes inline name validation, safe question/image randomization, Assessment Mode by default, Practice Mode support, rapid-click protection, responsive image cards, loading/broken-image states, keyboard focus, reduced-motion support, score/percentage calculation, local refresh recovery and dataset validation.
