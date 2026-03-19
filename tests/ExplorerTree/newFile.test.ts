import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFile from '../../src/core/Explorer/file';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';
import { nodeExistsAs, nodeExists, hasValidTimestamps, checkIntegrity } from '../helpers/dataHelper';

describe('ExplorerTree.newFile', () => {
  let tree: ExplorerTree;

  beforeEach(async () => {
    ({ tree } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must create a file and return ExplorerFile', async () => {
      const result = await tree.newFile({ path: '/arquivo.txt' });
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
      expect(result).toBeInstanceOf(ExplorerFile);

      expect(await nodeExistsAs('testeBanco', '/arquivo.txt', 'file')).toBe(true);
      expect(await hasValidTimestamps('testeBanco', '/arquivo.txt')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });
  });

  describe('error', () => {
    it('must return error when path contains spaces', async () => {
      const result = await tree.newFile({ path: '/invalid file.txt' });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Path cannot contain spaces');

      expect(await nodeExists('testeBanco', '/invalid file.txt')).toBe(false);
    });

    it('must return error when parent folder does not exist', async () => {
      const result = await tree.newFile({ path: '/nonexistent/file.txt' });
      expect(result.ok).toBe(false);
      expect(result.error).toContain('does not exist');

      expect(await nodeExists('testeBanco', '/nonexistent/file.txt')).toBe(false);
      expect(await nodeExists('testeBanco', '/nonexistent')).toBe(false);
    });

    it('must return error when path already exists as a folder', async () => {
      await tree.newFolder({ path: '/docs' });
      const result = await tree.newFile({ path: '/docs' });
      expect(result.ok).toBe(false);
      expect(result.error).toContain('already exists as a "folder"');

      expect(await nodeExistsAs('testeBanco', '/docs', 'folder')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/docs', 'file')).toBe(false);
    });

    it('must return error when parent path is a file, not a folder', async () => {
      await tree.newFile({ path: '/arquivo.txt' });
      const result = await tree.newFile({ path: '/arquivo.txt/outro.txt' });
      expect(result.ok).toBe(false);
      expect(result.error).toContain('is not a folder');

      expect(await nodeExists('testeBanco', '/arquivo.txt/outro.txt')).toBe(false);
    });

    it('must return error when path is root', async () => {
      const result = await tree.newFile({ path: '/' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });

  describe('sanitization', () => {
    it('must accept path without leading slash', async () => {
      const result = await tree.newFile({ path: 'arquivo.txt' });
      expect(result).toBeInstanceOf(ExplorerFile);
      expect(await nodeExistsAs('testeBanco', '/arquivo.txt', 'file')).toBe(true);
    });

    it('must accept path with trailing slash', async () => {
      const result = await tree.newFile({ path: '/arquivo.txt/' });
      expect(result).toBeInstanceOf(ExplorerFile);
      expect(await nodeExistsAs('testeBanco', '/arquivo.txt', 'file')).toBe(true);
    });

    it('must accept path without leading slash and with trailing slash', async () => {
      const result = await tree.newFile({ path: 'arquivo.txt/' });
      expect(result).toBeInstanceOf(ExplorerFile);
      expect(await nodeExistsAs('testeBanco', '/arquivo.txt', 'file')).toBe(true);
    });
  });
});
