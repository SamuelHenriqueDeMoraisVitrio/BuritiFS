import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ExplorerTree from '../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../src/core/Explorer/folder';

describe("NewExplorerTree", () => {
  let tree: ExplorerTree;
  let root: ExplorerFolder;

  beforeEach(async () => {
    const result = await ExplorerTree.create({ name: 'testeBanco' });
    if (!(result instanceof ExplorerTree)) throw new Error(result.error);
    tree = result;

    const rootResult = await tree.source('/');
    if (rootResult.ok === false) throw new Error(rootResult.error);
    if(!(rootResult instanceof ExplorerFolder)) throw new Error('Expected a folder');
    root = rootResult;
  });

  afterEach(() => {
    ExplorerTree.close('testeBanco');
  });

  describe("newFolderSucess", () => {
    it("Must create a child folder", async () => {
      const pastaFilho = await root.newFolder('pastaFilho');
      expect(pastaFilho.ok).toBe(true);
      expect(pastaFilho.error).toBe(null);
    });
  });

  describe("newFileSucess", () => {
    it("Must create a child file", async () => {
      const arquivo = await root.newFile('arquivo.txt');
      expect(arquivo.ok).toBe(true);
      expect(arquivo.error).toBe(null);
    });
  });

  describe("newFolderErrors", () => {
    describe("newFolder", () => {
      it("must return error when path contains spaces", async () => {
        const result = await root.newFolder('invalid folder');
        expect(result.ok).toBe(false);
        expect(result.error).toBe('Path cannot contain spaces');
      });

      it("must return error when path contains double slashes", async () => {
        const result = await root.newFolder('//invalid///folder///');
        expect(result.ok).toBe(false);
        expect(result.error).toBe('Path cannot contain "//"');
      });

      it("must return error when parent does not exist", async () => {
        const result = await root.newFolder('nonexistent/child');
        expect(result.ok).toBe(false);
        expect(result.error).toContain('does not exist');
      });
    });

    describe("newFileErrors", () => {
      it("must return error when path contains spaces", async () => {
        const result = await root.newFile('invalid file.txt');
        expect(result.ok).toBe(false);
        expect(result.error).toBe('Path cannot contain spaces');
      });

      it("must return error when parent folder does not exist", async () => {
        const result = await root.newFile('nonexistent/file.txt');
        expect(result.ok).toBe(false);
        expect(result.error).toContain('does not exist');
      });

      it("must return error when path already exists as a folder", async () => {
        await root.newFolder('docs');
        const result = await root.newFile('docs');
        expect(result.ok).toBe(false);
        expect(result.error).toContain('already exists as a "folder"');
      });
    });
  });
});
