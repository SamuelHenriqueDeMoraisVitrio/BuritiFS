# Build and Publishing

This document explains how BuritiFS is built and how to publish a new version to npm.

---

## Build Tool

BuritiFS uses [tsup](https://tsup.egoist.dev/) — a zero-config TypeScript bundler built on esbuild. The configuration lives in `tsup.config.ts`.

---

## Build Configuration

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',         // Core: ExplorerTree, ExplorerFolder, ExplorerFile
    'react/index': 'src/react/index.ts', // React hooks: useExplorer, useFolder, useAction
  },
  format: ['cjs', 'esm'],
  dts: true,         // Generate .d.ts TypeScript declarations
  sourcemap: true,   // Generate source maps
  clean: true,       // Delete dist/ before each build
  external: ['react'], // React is a peer dependency, not bundled
});
```

---

## Running the Build

```bash
npm run build
```

Output in `dist/`:

```
dist/
├── index.js          # ESM — import { ExplorerTree } from 'buritifs'
├── index.cjs         # CJS — require('buritifs')
├── index.d.ts        # TypeScript declarations (core)
├── index.js.map      # Source map
├── react/
│   ├── index.js      # ESM — import { useExplorer } from 'buritifs/react'
│   ├── index.cjs     # CJS — require('buritifs/react')
│   ├── index.d.ts    # TypeScript declarations (hooks)
│   └── index.js.map  # Source map
```

---

## Package Entry Points

The `package.json` `exports` field maps import paths to the correct built files:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./react": {
      "import": "./dist/react/index.js",
      "require": "./dist/react/index.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

This means:
- `import { ExplorerTree } from 'buritifs'` → `dist/index.js` (ESM)
- `require('buritifs')` → `dist/index.cjs` (CJS)
- `import { useExplorer } from 'buritifs/react'` → `dist/react/index.js` (ESM)
- `require('buritifs/react')` → `dist/react/index.cjs` (CJS)

---

## TypeScript Declarations

`dts: true` in `tsup.config.ts` instructs tsup to generate `.d.ts` files alongside the JavaScript output. Consumers of the library get full type information without needing the source TypeScript files.

The `types` field in `package.json` points to `./dist/index.d.ts` for the core entry point. For the `./react` subpath, bundlers resolve declarations from `./dist/react/index.d.ts` via the `exports` map.

---

## Tree Shaking

`"sideEffects": false` in `package.json` tells bundlers (Webpack, Rollup, Vite) that importing from BuritiFS has no side effects, so unused exports can be safely removed. This means a project that imports only `useExplorer` from `buritifs/react` will not bundle the core classes unless they are also imported.

If you add any module-level side effects (global registrations, polyfills, etc.), update `sideEffects` accordingly.

---

## Pre-publish Checklist

Before running `npm publish`, go through this checklist:

```
[ ] Run the full test suite: npm test
    All tests must pass.

[ ] Run the build: npm run build
    Check that dist/ contains:
      - index.js, index.cjs, index.d.ts (core)
      - react/index.js, react/index.cjs, react/index.d.ts (hooks)

[ ] Verify exports work correctly:
    node -e "const b = require('./dist/index.cjs'); console.log(typeof b.ExplorerTree)"
    # Should print "function"

[ ] Bump the version in package.json following semver:
    - Patch (0.0.x): bug fixes, no API changes
    - Minor (0.x.0): new features, backwards-compatible
    - Major (x.0.0): breaking API changes

[ ] Update the CHANGELOG or release notes.

[ ] Commit and tag the release:
    git add .
    git commit -m "chore: release vX.Y.Z"
    git tag vX.Y.Z
    git push && git push --tags
```

---

## Publishing to npm

The `prepublishOnly` script in `package.json` automatically runs the build and tests before publishing:

```json
{
  "scripts": {
    "prepublishOnly": "npm run build && npm test"
  }
}
```

To publish:

```bash
npm publish
```

To publish a pre-release (e.g., beta):

```bash
npm publish --tag beta
```

Consumers can install a beta with:

```bash
npm install buritifs@beta
```

---

## Verifying the Published Package

After publishing, verify the package is correct:

```bash
# Check the registry entry
npm view buritifs

# Install in a temp project and verify imports
mkdir /tmp/test-buritifs && cd /tmp/test-buritifs
npm init -y
npm install buritifs
node -e "const { ExplorerTree } = require('buritifs'); console.log(typeof ExplorerTree);"
# Should print "function"
```
