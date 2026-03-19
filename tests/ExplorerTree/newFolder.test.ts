import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';
import { nodeExistsAs, nodeExists, hasValidTimestamps, checkIntegrity } from '../helpers/dataHelper';

describe('ExplorerTree.newFolder', () => {
  let tree: ExplorerTree;

  beforeEach(async () => {
    ({ tree } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must create a folder and return ExplorerFolder', async () => {
      const result = await tree.newFolder({ path: '/pasta' });
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
      expect(result).toBeInstanceOf(ExplorerFolder);

      expect(await nodeExistsAs('testeBanco', '/pasta', 'folder')).toBe(true);
      expect(await hasValidTimestamps('testeBanco', '/pasta')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });
  });

  describe('error', () => {
    it('must return error when path contains spaces', async () => {
      const result = await tree.newFolder({ path: '/invalid folder' });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Path cannot contain spaces');

      expect(await nodeExists('testeBanco', '/invalid folder')).toBe(false);
    });

    it('must return error when path contains double slashes', async () => {
      const result = await tree.newFolder({ path: '//invalid///folder///' });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Path cannot contain "//"');

      expect(await nodeExists('testeBanco', '//invalid///folder///')).toBe(false);
    });

    it('must return error when parent does not exist', async () => {
      const result = await tree.newFolder({ path: '/nonexistent/child' });
      expect(result.ok).toBe(false);
      expect(result.error).toContain('does not exist');

      expect(await nodeExists('testeBanco', '/nonexistent/child')).toBe(false);
      expect(await nodeExists('testeBanco', '/nonexistent')).toBe(false);
    });

    it('must return error when parent path is a file, not a folder', async () => {
      await tree.newFile({ path: '/arquivo.txt' });
      const result = await tree.newFolder({ path: '/arquivo.txt/pasta' });
      expect(result.ok).toBe(false);
      expect(result.error).toContain('is not a folder');

      expect(await nodeExists('testeBanco', '/arquivo.txt/pasta')).toBe(false);
    });

    it('must return error when path is root', async () => {
      const result = await tree.newFolder({ path: '/' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });

  describe('sanitization', () => {
    it('must accept path without leading slash', async () => {
      const result = await tree.newFolder({ path: 'pasta' });
      expect(result).toBeInstanceOf(ExplorerFolder);
      expect(await nodeExistsAs('testeBanco', '/pasta', 'folder')).toBe(true);
    });

    it('must accept path with trailing slash', async () => {
      const result = await tree.newFolder({ path: '/pasta/' });
      expect(result).toBeInstanceOf(ExplorerFolder);
      expect(await nodeExistsAs('testeBanco', '/pasta', 'folder')).toBe(true);
    });

    it('must accept path without leading slash and with trailing slash', async () => {
      const result = await tree.newFolder({ path: 'pasta/' });
      expect(result).toBeInstanceOf(ExplorerFolder);
      expect(await nodeExistsAs('testeBanco', '/pasta', 'folder')).toBe(true);
    });
  });
});
