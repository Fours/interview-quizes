# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

The app is a blank scaffold. Entry point is `src/main.tsx` → `src/App.tsx`. All application code lives under `src/`.

TypeScript is strict: `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` are enabled. `allowImportingTsExtensions` is on, so imports use `.tsx`/`.ts` extensions explicitly (e.g. `import App from './App.tsx'`).
