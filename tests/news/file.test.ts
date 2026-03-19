import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import ExplorerFile from '../../src/core/Explorer/file';
import { createTreeAndRoot } from './helpers';

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
    });
  });

  describe('newFileErrors', () => {
    it('must return error when path contains spaces', async () => {
      const result = await root.newFile({name: 'invalid file.txt'});
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Path cannot contain spaces');
    });

    it('must return error when parent folder does not exist', async () => {
      const result = await root.newFile({name: 'nonexistent/file.txt'});
      expect(result.ok).toBe(false);
      expect(result.error).toContain('does not exist');
    });

    it('must return error when path already exists as a folder', async () => {
      await root.newFolder({name: 'docs'});
      const result = await root.newFile({name: 'docs'});
      expect(result.ok).toBe(false);
      expect(result.error).toContain('already exists as a "folder"');
    });
  });
});
