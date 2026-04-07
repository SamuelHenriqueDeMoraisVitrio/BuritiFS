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

## Publishing to npm

BuritiFS uses **semantic-release** to automate versioning, changelog generation, and publishing. Every push to `main` triggers the release pipeline automatically via GitHub Actions.

### How it works

Semantic-release analyzes commit messages since the last release and determines the next version automatically:

| Commit prefix | Example | Version bump |
|---|---|---|
| `fix:` | `fix(core): correct path normalization` | Patch (0.0.1 → 0.0.2) |
| `feat:` | `feat(react): add useFile hook` | Minor (0.0.1 → 0.1.0) |
| `feat!:` or `BREAKING CHANGE:` | `feat!: rename ExplorerTree.create` | Major (0.0.1 → 1.0.0) |

### What happens on each push to main

1. GitHub Actions runs the full test suite.
2. Runs the build.
3. Semantic-release analyzes commits since the last release.
4. If there are releasable commits: bumps `package.json` version, generates `CHANGELOG.md`, publishes to npm, creates a GitHub Release.
5. If there are no releasable commits (e.g., only `chore:` or `docs:` commits): nothing is published.

### Required secrets

| Secret | Where to get it |
|---|---|
| `NPMJS_TOKEN` | npmjs.com → Access Tokens → Granular Access Token with publish permission |
| `GITHUB_TOKEN` | Provided automatically by GitHub Actions — no setup needed |

### Triggering a release manually

Just push to `main` with the right commit message. No manual tagging or `npm publish` needed:
```bash
git commit -m "feat: add useFile hook"
git push origin main
# GitHub Actions handles the rest
```

### Commit message convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) spec:
```
<type>(<scope>): <description>

Types that trigger a release:
  fix      → patch release
  feat     → minor release
  feat!    → major release (breaking change)

Types that do NOT trigger a release:
  chore    → maintenance
  docs     → documentation only
  test     → tests only
  refactor → no behavior change
  style    → formatting
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
