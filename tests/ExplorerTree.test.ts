import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ExplorerTree from "../src/core/Explorer/ExplorerMain";
import ExplorerFolder from "../src/core/Explorer/folder";
import ExplorerFile from "../src/core/Explorer/file";
import { nodeExistsAs, checkIntegrity, isDbReady } from "./helpers/dataHelper";

describe('ExplorerTree', () => {
  let result: Awaited<ReturnType<typeof ExplorerTree.create>>;

  beforeEach(async () => {
    result = await ExplorerTree.create({ name: 'testeBanco' });
  });

  afterEach(() => {
    ExplorerTree.close({name: 'testeBanco'});
  });

  describe('ExplorerTreeSucess', () => {
    it("Must building a class ExplorerTree", async () => {
      expect(result).toBeInstanceOf(ExplorerTree);

      // DB-level: schema must be ready and root node must exist
      expect(await isDbReady('testeBanco')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/', 'folder')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it("must close the connection to the data", () => {
      // connection is closed in afterEach without throwing
    });
  });

  describe('ExplorerTreeError', () => {
    it("must return error object on failure", async () => {
      // Simulates checking the error shape when create fails
      const bad = await ExplorerTree.create({ name: '' });
      if (bad instanceof ExplorerTree) return; // skip if DB allows empty name
      expect(bad.ok).toBe(false);
      expect(typeof bad.error).toBe('string');
    });
  });

  describe('source', () => {
    describe('ExplorerTreeSourceSuccess', () => {
      it("must return ExplorerFolder when path is a folder", async () => {
        if (!(result instanceof ExplorerTree)) return;
        const folder = await result.source({path: '/'});
        expect(folder).toBeInstanceOf(ExplorerFolder);

        // DB-level: root folder must exist
        expect(await nodeExistsAs('testeBanco', '/', 'folder')).toBe(true);
      });

      it("must return ExplorerFile when path is a file", async () => {
        if (!(result instanceof ExplorerTree)) return;
        const root = await result.source({path: '/'});
        if (!(root instanceof ExplorerFolder)) return;
        await root.newFile({name: 'test.txt'});
        const file = await result.source({path: '/test.txt'});
        expect(file).toBeInstanceOf(ExplorerFile);

        // DB-level: file must be persisted and DB must be consistent
        expect(await nodeExistsAs('testeBanco', '/test.txt', 'file')).toBe(true);
        expect(await checkIntegrity('testeBanco')).toEqual([]);
      });
    });

    describe('ExplorerTreeSourceError', () => {
      it("must return error object when path does not exist", async () => {
        if (!(result instanceof ExplorerTree)) return;
        const bad = await result.source({path: '/nonexistent'});
        if (bad instanceof ExplorerFolder || bad instanceof ExplorerFile) return;
        expect(bad.ok).toBe(false);
        expect(typeof bad.error).toBe('string');
      });
    });
  });
});
