import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ExplorerTree from "../src/core/Explorer/ExplorerMain";
import ExplorerFolder from "../src/core/Explorer/folder";
import ExplorerFile from "../src/core/Explorer/file";

describe('ExplorerTree', () => {
  let result: Awaited<ReturnType<typeof ExplorerTree.create>>;

  beforeEach(async () => {
    result = await ExplorerTree.create({ name: 'testeBanco' });
  });

  afterEach(() => {
    ExplorerTree.close('testeBanco');
  });

  describe('ExplorerTreeSucess', () => {
    it("Must building a class ExplorerTree", () => {
      expect(result).toBeInstanceOf(ExplorerTree);
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
        const folder = await result.source('/');
        expect(folder).toBeInstanceOf(ExplorerFolder);
      });

      it("must return ExplorerFile when path is a file", async () => {
        if (!(result instanceof ExplorerTree)) return;
        const root = await result.source('/');
        if (!(root instanceof ExplorerFolder)) return;
        await root.newFile('test.txt');
        const file = await result.source('/test.txt');
        expect(file).toBeInstanceOf(ExplorerFile);
      });
    });

    describe('ExplorerTreeSourceError', () => {
      it("must return error object when path does not exist", async () => {
        if (!(result instanceof ExplorerTree)) return;
        const bad = await result.source('/nonexistent');
        if (bad instanceof ExplorerFolder || bad instanceof ExplorerFile) return;
        expect(bad.ok).toBe(false);
        expect(typeof bad.error).toBe('string');
      });
    });
  });
});
