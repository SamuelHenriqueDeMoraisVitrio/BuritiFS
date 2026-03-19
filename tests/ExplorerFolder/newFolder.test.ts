import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';
import { nodeExistsAs, nodeExists, hasValidTimestamps, checkIntegrity } from '../helpers/dataHelper';

describe('ExplorerFolder.newFolder', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must create a child folder', async () => {
      const result = await root.newFolder({ name: 'pastaFilho' });
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
      expect(result).toBeInstanceOf(ExplorerFolder);

      expect(await nodeExistsAs('testeBanco', '/pastaFilho', 'folder')).toBe(true);
      expect(await hasValidTimestamps('testeBanco', '/pastaFilho')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });
  });

  describe('error', () => {
    it('must return error when path contains spaces', async () => {
      const result = await root.newFolder({ name: 'invalid folder' });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Path cannot contain spaces');

      expect(await nodeExists('testeBanco', '/invalid folder')).toBe(false);
    });

    it('must return error when path contains double slashes', async () => {
      const result = await root.newFolder({ name: '//invalid///folder///' });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Path cannot contain "//"');

      expect(await nodeExists('testeBanco', '///invalid///folder///')).toBe(false);
    });

    it('must return error when parent does not exist', async () => {
      const result = await root.newFolder({ name: 'nonexistent/child' });
      expect(result.ok).toBe(false);
      expect(result.error).toContain('does not exist');

      expect(await nodeExists('testeBanco', '/nonexistent/child')).toBe(false);
      expect(await nodeExists('testeBanco', '/nonexistent')).toBe(false);
    });

    it('must return error when name is empty', async () => {
      const result = await root.newFolder({ name: '' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');

      // path becomes '/' which is blocked by addNode
      expect(await nodeExists('testeBanco', '')).toBe(false);
    });

    it('must return error when parent path is a file, not a folder', async () => {
      await root.newFile({ name: 'arquivo.txt' });
      const result = await root.newFolder({ name: 'arquivo.txt/pasta' });
      expect(result.ok).toBe(false);
      expect(result.error).toContain('is not a folder');

      expect(await nodeExists('testeBanco', '/arquivo.txt/pasta')).toBe(false);
    });
  });
});
