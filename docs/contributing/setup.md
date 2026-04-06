# Development Setup

This guide explains how to clone the project, install dependencies, run tests, and build the library.

---

## Prerequisites

- **Node.js 18+** — required for the test runner and build tools.
- **npm 9+** (comes with Node 18).
- A modern browser for manual integration testing (Chrome 86+, Edge 86+, or Safari 15.2+).

---

## Clone and Install

```bash
git clone https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS.git
cd BuritiFS
npm install
```

---

## Project Structure

```
BuritiFS/
├── src/
│   ├── index.ts                  # Core entry point — exports ExplorerTree, ExplorerFolder, ExplorerFile
│   ├── core/
│   │   ├── Explorer/
│   │   │   ├── ExplorerMain.ts   # ExplorerTree — public API and event bus
│   │   │   ├── folder.ts         # ExplorerFolder — folder façade
│   │   │   └── file.ts           # ExplorerFile — file façade
│   │   ├── storage/
│   │   │   ├── idb-setup.ts      # IndexedDB init, registry, WAL helper
│   │   │   ├── opfs-storage.ts   # OPFS read/write/delete
│   │   │   ├── idb-nodes.ts      # Add/remove individual nodes
│   │   │   ├── idb-query.ts      # list, exists, size queries
│   │   │   ├── idb-refactor.ts   # copy, move, rename
│   │   │   └── storage-init.ts   # Initialization orchestration + recovery
│   │   ├── types/
│   │   │   └── general.ts        # All TypeScript types and interfaces
│   │   └── utils.ts              # Path validation and normalization
│   └── react/
│       ├── index.ts              # React entry point — exports hooks
│       ├── explorerTree.ts       # useExplorer hook
│       ├── useFolder.ts          # useFolder hook
│       └── useAction.ts          # useAction hook
├── tests/
│   ├── helpers/
│   │   ├── opfs-mock.ts          # Custom OPFS mock for Node.js test environment
│   │   ├── dataHelper.ts         # Direct IDB inspection for test assertions
│   │   └── fixtures.ts           # createTreeAndRoot() — shared test setup
│   ├── ExplorerTree/             # Tests for ExplorerTree methods
│   ├── ExplorerFolder/           # Tests for ExplorerFolder methods
│   ├── ExplorerFile/             # Tests for ExplorerFile methods
│   └── react/                    # Tests for React hooks (happy-dom environment)
├── dist/                         # Build output (generated, not committed)
├── package.json
├── tsup.config.ts                # Build configuration
├── tsconfig.json
└── vitest.config.ts              # Test configuration with two projects
```

---

## Running Tests

```bash
npm test
```

This runs the full test suite using [Vitest](https://vitest.dev/) with two separate project environments:

| Project | Environment | What it tests |
|---|---|---|
| `node` | Node.js | Core: ExplorerTree, ExplorerFolder, ExplorerFile |
| `happy-dom` | happy-dom (DOM emulation) | React hooks: useExplorer, useFolder, useAction |

The core tests use `fake-indexeddb` for a fully in-memory IDB implementation and a custom OPFS mock (`tests/helpers/opfs-mock.ts`) that simulates the OPFS API in Node.js.

### Run a specific test file

```bash
# Run a specific file
npx vitest run tests/ExplorerTree/newFile.test.ts

# Run all tests for a specific class
npx vitest run tests/ExplorerFolder/

# Run only the React tests
npx vitest run tests/react/
```

### Run in watch mode

```bash
npx vitest
```

Vitest will re-run affected tests on file save.

### Run with coverage

```bash
npx vitest run --coverage
```

---

## Building the Library

```bash
npm run build
```

This runs `tsup` and produces:

```
dist/
├── index.js          # ESM (core)
├── index.cjs         # CJS (core)
├── index.d.ts        # TypeScript declarations (core)
├── index.js.map      # Source map (core)
├── react/
│   ├── index.js      # ESM (React hooks)
│   ├── index.cjs     # CJS (React hooks)
│   ├── index.d.ts    # TypeScript declarations (React hooks)
│   └── index.js.map  # Source map (React hooks)
```

The build is clean on each run (`clean: true` in `tsup.config.ts`) — stale output is removed before generating new files.

---

## Before Submitting a Pull Request

1. Run the full test suite: `npm test`
2. Run the build: `npm run build`
3. Check that `dist/` contains both ESM and CJS output and declarations.
4. Verify your changes are covered by tests.

See [Testing Guide](testing.md) for how to add new tests and [Build Guide](build.md) for build configuration details.
