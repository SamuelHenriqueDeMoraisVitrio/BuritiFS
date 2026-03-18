import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ExplorerTree from '../src/core/Explorer/ExplorerMain';

describe("NewExplorerTree", () => {
  let base: Exclude<Awaited<ReturnType<typeof ExplorerTree.create>>, { ok: false }>;

  beforeEach(async () => {
    const result = await ExplorerTree.create({ name: 'testeBanco' });
    if (result.ok === false) throw new Error(result.error);
    base = result;
  });

  afterEach(() => {
    ExplorerTree.close('testeBanco');
  });

  describe("newFolderSucess", () => {
    it("Must create a child folder", async () => {
      const pastaFilho = await base.newFolder('pastaFilho');
      expect(pastaFilho.ok).toBe(true);
      expect(pastaFilho.error).toBe(null);
    });
  });

  describe("newFileSucess", () => {
    it("Must create a child file", async () => {
      const arquivo = await base.newFile('arquivo.txt');
      expect(arquivo.ok).toBe(true);
      expect(arquivo.error).toBe(null);
    });
  });

  describe("newFolderErrors", () => {
    describe("newFolder", () => {
      it("must return error when path contains spaces", async () => {
        const result = await base.newFolder('invalid folder');
        expect(result.ok).toBe(false);
        expect(result.error).toBe('Path cannot contain spaces');
      });

      it("must return error when path contains double slashes", async () => {
        const result = await base.newFolder('//invalid///folder///');
        expect(result.ok).toBe(false);
        expect(result.error).toBe('Path cannot contain "//"');
      });

      it("must return error when parent does not exist", async () => {
        const result = await base.newFolder('nonexistent/child');
        expect(result.ok).toBe(false);
        expect(result.error).toContain('does not exist');
      });
    });

    describe("newFileErrors", () => {
      it("must return error when path contains spaces", async () => {
        const result = await base.newFile('invalid file.txt');
        expect(result.ok).toBe(false);
        expect(result.error).toBe('Path cannot contain spaces');
      });

      it("must return error when parent folder does not exist", async () => {
        const result = await base.newFile('nonexistent/file.txt');
        expect(result.ok).toBe(false);
        expect(result.error).toContain('does not exist');
      });

      it("must return error when path already exists as a folder", async () => {
        await base.newFolder('docs');
        const result = await base.newFile('docs');
        expect(result.ok).toBe(false);
        expect(result.error).toContain('already exists as a "folder"');
      });
    });
  });
});
