import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import ExplorerFile from '../../src/core/Explorer/file';
import { createTreeAndRoot } from './helpers';
import { nodeExistsAs, nodeExists, hasValidTimestamps, checkIntegrity } from '../dataHelper';

describe('ExplorerFile', () => {
  let tree: ExplorerTree;
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ tree, root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({name: 'testeBanco'});
  });

  describe('newFileSuccess', () => {
    it('must create a child file', async () => {
      const result = await root.newFile({name: 'arquivo.txt'});
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
      expect(result).toBeInstanceOf(ExplorerFile);

      // DB-level: node must be persisted as file
      expect(await nodeExistsAs('testeBanco', '/arquivo.txt', 'file')).toBe(true);
      expect(await hasValidTimestamps('testeBanco', '/arquivo.txt')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });
  });

  describe('newFileErrors', () => {
    it('must return error when path contains spaces', async () => {
      const result = await root.newFile({name: 'invalid file.txt'});
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Path cannot contain spaces');

      // DB-level: no node must have been persisted
      expect(await nodeExists('testeBanco', '/invalid file.txt')).toBe(false);
    });

    it('must return error when parent folder does not exist', async () => {
      const result = await root.newFile({name: 'nonexistent/file.txt'});
      expect(result.ok).toBe(false);
      expect(result.error).toContain('does not exist');

      // DB-level: no node must have been persisted
      expect(await nodeExists('testeBanco', '/nonexistent/file.txt')).toBe(false);
      expect(await nodeExists('testeBanco', '/nonexistent')).toBe(false);
    });

    it('must return error when path already exists as a folder', async () => {
      await root.newFolder({name: 'docs'});
      const result = await root.newFile({name: 'docs'});
      expect(result.ok).toBe(false);
      expect(result.error).toContain('already exists as a "folder"');

      // DB-level: /docs must still be a folder and not have been overwritten
      expect(await nodeExistsAs('testeBanco', '/docs', 'folder')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/docs', 'file')).toBe(false);
    });
  });
});
