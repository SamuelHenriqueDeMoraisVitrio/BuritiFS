import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../src/core/Explorer/folder';
import { createTreeAndRoot } from './helpers/fixtures';
import { nodeExistsAs, nodeExists, hasValidTimestamps, checkIntegrity } from './helpers/dataHelper';

describe('ExplorerFolder', () => {
  let tree: ExplorerTree;
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ tree, root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({name: 'testeBanco'});
  });

  describe('newFolderSuccess', () => {
    it('must create a child folder', async () => {
      const result = await root.newFolder({name: 'pastaFilho'});
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
      expect(result).toBeInstanceOf(ExplorerFolder);

      // DB-level: node must be persisted as folder
      expect(await nodeExistsAs('testeBanco', '/pastaFilho', 'folder')).toBe(true);
      expect(await hasValidTimestamps('testeBanco', '/pastaFilho')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });
  });

  describe('newFolderErrors', () => {
    it('must return error when path contains spaces', async () => {
      const result = await root.newFolder({name: 'invalid folder'});
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Path cannot contain spaces');

      // DB-level: no node must have been persisted
      expect(await nodeExists('testeBanco', '/invalid folder')).toBe(false);
    });

    it('must return error when path contains double slashes', async () => {
      const result = await root.newFolder({name: '//invalid///folder///'});
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Path cannot contain "//"');

      // DB-level: no node must have been persisted
      expect(await nodeExists('testeBanco', '///invalid///folder///')).toBe(false);
    });

    it('must return error when parent does not exist', async () => {
      const result = await root.newFolder({name: 'nonexistent/child'});
      expect(result.ok).toBe(false);
      expect(result.error).toContain('does not exist');

      // DB-level: neither the child nor a ghost parent must exist
      expect(await nodeExists('testeBanco', '/nonexistent/child')).toBe(false);
      expect(await nodeExists('testeBanco', '/nonexistent')).toBe(false);
    });
  });
});
