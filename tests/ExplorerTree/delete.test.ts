import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';
import { nodeExists } from '../helpers/dataHelper';

describe('ExplorerTree.delete', () => {
  let tree: ExplorerTree;
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ tree, root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must delete a file', async () => {
      await root.newFile({ name: 'arquivo.txt' });

      const result = await tree.delete({ path: '/arquivo.txt' });
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);

      expect(await nodeExists('testeBanco', '/arquivo.txt')).toBe(false);
    });

    it('must delete a folder and its children', async () => {
      const folderResult = await root.newFolder({ name: 'pasta' });
      if (!(folderResult instanceof ExplorerFolder)) throw new Error('setup failed');

      await folderResult.newFile({ name: 'arquivo.txt' });
      await folderResult.newFolder({ name: 'subpasta' });

      const result = await tree.delete({ path: '/pasta' });
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExists('testeBanco', '/pasta/arquivo.txt')).toBe(false);
      expect(await nodeExists('testeBanco', '/pasta/subpasta')).toBe(false);
    });
  });

  describe('error', () => {
    it('must return error when path does not exist', async () => {
      const result = await tree.delete({ path: '/nonexistent' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });

  describe('sanitization', () => {
    it('must accept folder path with trailing slash', async () => {
      await root.newFolder({ name: 'pasta' });

      const result = await tree.delete({ path: '/pasta/' });
      expect(result.ok).toBe(true);
      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
    });

    it('must accept path without leading slash', async () => {
      await root.newFile({ name: 'arquivo.txt' });

      const result = await tree.delete({ path: 'arquivo.txt' });
      expect(result.ok).toBe(true);
      expect(await nodeExists('testeBanco', '/arquivo.txt')).toBe(false);
    });
  });
});
