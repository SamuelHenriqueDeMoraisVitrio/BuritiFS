import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';


describe('ExplorerTree.exists', () => {
  let tree: ExplorerTree;
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ tree, root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must return true for root', async () => {
      expect(await tree.exists({ path: '/' })).toBe(true);
    });

    it('must return true for existing file', async () => {
      await root.newFile({ name: 'arquivo.txt' });
      expect(await tree.exists({ path: '/arquivo.txt' })).toBe(true);
    });

    it('must return true for existing folder', async () => {
      await root.newFolder({ name: 'pasta' });
      expect(await tree.exists({ path: '/pasta' })).toBe(true);
    });

    it('must return false for non-existing path', async () => {
      expect(await tree.exists({ path: '/naoexiste' })).toBe(false);
    });

    it('must return false after deleting a file', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof (await import('../../src/core/Explorer/file')).default)) throw new Error('setup failed');
      await tree.delete({ path: '/arquivo.txt' });
      expect(await tree.exists({ path: '/arquivo.txt' })).toBe(false);
    });

    it('must return false after deleting a folder', async () => {
      await root.newFolder({ name: 'pasta' });
      await tree.delete({ path: '/pasta' });
      expect(await tree.exists({ path: '/pasta' })).toBe(false);
    });

    it('must return true for nested path', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });
      expect(await tree.exists({ path: '/pasta/arquivo.txt' })).toBe(true);
    });

    it('must return false for nested path when parent does not exist', async () => {
      expect(await tree.exists({ path: '/pasta/arquivo.txt' })).toBe(false);
    });
  });

  describe('sanitization', () => {
    it('must accept path with trailing slash', async () => {
      await root.newFolder({ name: 'pasta' });
      expect(await tree.exists({ path: '/pasta/' })).toBe(true);
    });

    it('must accept path without leading slash', async () => {
      await root.newFolder({ name: 'pasta' });
      expect(await tree.exists({ path: 'pasta' })).toBe(true);
    });
  });
});
