# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

This is a simple online quiz taking app. It features a main page which lists all the available quizes and the user's progress and score. Clicking on a quiz on the main page takes you to that quiz. Each quiz is 10 multiple-choice questions. Each question (and answers) is presented one at a time. The answers are displayed in a random order when they are displayed. When the user chooses an answer, it is scored as correct/incorrect immediately and the explanation is shown in a box underneath the question. The data for quizes is stored as JSON files in `public/data` and loaded asynchronously with `fetch`. The data for the user (progress, score) is saved in local storage.

## Design

The design features large font sizes and a light mode theme for readability, san-serif fonts, uppercase labels, and an overall sleek and modern style. The main accent color is a bright blue.

## Quizes

When creating a new quiz, come up with 10 new interview questions for a senior software engineer who specializes in Typescript (and Javascript), node.js, and React. Each question should be accompanied by 4 multiple choice answers, one of which is correct. Each question also has a "explanation" property which provides extra information about why the correct answer is correct. The questions and answers may be complex and long (may be a paragraph or more). The questions and answers support markdown so a code block can be included and will be displayed correctly by the front-end. 

Some topics which should be covered by the quizes are:
- Kubernetes
- Docker
- Security (back-end and front-end)
- System Design
- SQL
- NoSQL patterns
- Typescript
- Javascript
- OOP (object oriented programming)
- Functional Programming
- Node.js
- React
- Software Architecture

When creating a new quiz question, make sure its not a duplicate by reviewing the existing quiz questions.

### Technical Quiz Specs

Quiz data lives in `public/data/` and is fetched at runtime (see `src/quizData.ts` for the types and fetch helpers):

- `public/data/index.json` — the list of quizzes shown on the main page, loaded when the site loads. Shape: `[ { "id": "typescript", "name": "TypeScript" } ]`
- `public/data/<id>.json` — one file per quiz, named by the quiz `id`, loaded when the user opens that quiz. Shape: `{ "id": "typescript", "name": "TypeScript", "questions": [ { "question": "", "explanation": "", "answers": [ { "answer": "", "isCorrect": true } ] } ] }`

When adding a quiz, create its `<id>.json` file AND add an entry to `index.json`. Keep the `name` in both files in sync. Strings are JSON, so newlines in markdown (e.g. code blocks) must be escaped as `\n`.

Each quiz has a unique, stable `id` (a kebab-case slug) that is used as the JSON filename and the local storage key for the user's progress. Quiz names can change freely, but never change or reuse an existing `id`, or saved progress will be lost or attached to the wrong quiz.

## Commands

```bash
npm run dev        # start Vite dev server (hot reload)
npm run build      # type-check with tsc, then bundle with Vite
npm run lint       # ESLint across all TS/TSX files
npm run preview    # serve the production build locally
```

There are no tests configured yet.

## Stack

- React 19 + TypeScript 6, bundled by Vite 8
- No routing, state management, or UI library installed — all to be added

## Architecture

Entry point is `src/main.tsx` → `src/App.tsx`. All application code lives under `src/`.

- `src/App.tsx` — main page (fetches `index.json`) and `QuizPage`, which fetches the selected quiz's JSON and renders `QuizView`
- `src/QuizView.tsx` — one-question-at-a-time quiz UI
- `src/quizData.ts` — quiz types and `fetchQuizIndex` / `fetchQuiz`
- `src/useFetch.ts` — small hook tracking loading/success/error state for async loads
- `src/storage.ts` — local storage progress, keyed by quiz `id`. The main page reads the question total from saved progress (`totalQuestions`), falling back to `QUESTIONS_PER_QUIZ`

TypeScript is strict: `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` are enabled. `allowImportingTsExtensions` is on, so imports use `.tsx`/`.ts` extensions explicitly (e.g. `import App from './App.tsx'`).
