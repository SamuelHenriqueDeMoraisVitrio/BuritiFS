import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';
import { nodeExists, nodeExistsAs, checkIntegrity } from '../helpers/dataHelper';


describe('ExplorerTree.rename', () => {
  let tree: ExplorerTree;
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ tree, root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must rename a file', async () => {
      await root.newFile({ name: 'arquivo.txt' });

      const result = await tree.rename({ path: '/arquivo.txt', name: 'renomeado.txt' });
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);

      expect(await nodeExists('testeBanco', '/arquivo.txt')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/renomeado.txt', 'file')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must rename a folder', async () => {
      await root.newFolder({ name: 'pasta' });

      const result = await tree.rename({ path: '/pasta', name: 'renomeada' });
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/renomeada', 'folder')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must rename a folder and move all its children', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });
      await pasta.newFolder({ name: 'sub' });

      const result = await tree.rename({ path: '/pasta', name: 'renomeada' });
      expect(result.ok).toBe(true);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExists('testeBanco', '/pasta/arquivo.txt')).toBe(false);
      expect(await nodeExists('testeBanco', '/pasta/sub')).toBe(false);

      expect(await nodeExistsAs('testeBanco', '/renomeada', 'folder')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/renomeada/arquivo.txt', 'file')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/renomeada/sub', 'folder')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must rename a nested file', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });

      const result = await tree.rename({ path: '/pasta/arquivo.txt', name: 'novo.txt' });
      expect(result.ok).toBe(true);

      expect(await nodeExists('testeBanco', '/pasta/arquivo.txt')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/pasta/novo.txt', 'file')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });
  });

  describe('error', () => {
    it('must return error when path does not exist', async () => {
      const result = await tree.rename({ path: '/nonexistent', name: 'novo' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('must return error when trying to rename root', async () => {
      const result = await tree.rename({ path: '/', name: 'novo' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });

  describe('sanitization', () => {
    it('must accept path with trailing slash', async () => {
      await root.newFolder({ name: 'pasta' });

      const result = await tree.rename({ path: '/pasta/', name: 'renomeada' });
      expect(result.ok).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/renomeada', 'folder')).toBe(true);
    });

    it('must accept path without leading slash', async () => {
      await root.newFile({ name: 'arquivo.txt' });

      const result = await tree.rename({ path: 'arquivo.txt', name: 'renomeado.txt' });
      expect(result.ok).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/renomeado.txt', 'file')).toBe(true);
    });
  });
});
