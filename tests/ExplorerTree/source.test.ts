import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import ExplorerFile from '../../src/core/Explorer/file';
import { nodeExistsAs, checkIntegrity } from '../helpers/dataHelper';
import { createTreeAndRoot } from '../helpers/fixtures';

describe('ExplorerTree.source', () => {
  let tree: ExplorerTree;

  beforeEach(async () => {
    ({ tree } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must return ExplorerFolder when path is a folder', async () => {
      const result = await tree.source({ path: '/' });
      expect(result).toBeInstanceOf(ExplorerFolder);

      expect(await nodeExistsAs('testeBanco', '/', 'folder')).toBe(true);
    });

    it('must return ExplorerFile when path is a file', async () => {
      const root = await tree.source({ path: '/' });
      if (!(root instanceof ExplorerFolder)) return;
      await root.newFile({ name: 'test.txt' });

      const result = await tree.source({ path: '/test.txt' });
      expect(result).toBeInstanceOf(ExplorerFile);

      expect(await nodeExistsAs('testeBanco', '/test.txt', 'file')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });
  });

  describe('error', () => {
    it('must return error object when path does not exist', async () => {
      const result = await tree.source({ path: '/nonexistent' });
      if (result instanceof ExplorerFolder || result instanceof ExplorerFile) return;
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });

  describe('sanitization', () => {
    it('must accept folder path with trailing slash', async () => {
      const root = await tree.source({ path: '/' });
      if (!(root instanceof ExplorerFolder)) return;
      await root.newFolder({ name: 'pasta' });

      const result = await tree.source({ path: '/pasta/' });
      expect(result).toBeInstanceOf(ExplorerFolder);
    });

    it('must accept file path without leading slash', async () => {
      const root = await tree.source({ path: '/' });
      if (!(root instanceof ExplorerFolder)) return;
      await root.newFile({ name: 'arquivo.txt' });

      const result = await tree.source({ path: 'arquivo.txt' });
      expect(result).toBeInstanceOf(ExplorerFile);
    });
  });
});
