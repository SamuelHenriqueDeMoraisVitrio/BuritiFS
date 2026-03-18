import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from './helpers';

describe('ExplorerFolder', () => {
  let tree: ExplorerTree;
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ tree, root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close('testeBanco');
  });

  describe('newFolderSuccess', () => {
    it('must create a child folder', async () => {
      const result = await root.newFolder('pastaFilho');
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
      expect(result).toBeInstanceOf(ExplorerFolder);
    });
  });

  describe('newFolderErrors', () => {
    it('must return error when path contains spaces', async () => {
      const result = await root.newFolder('invalid folder');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Path cannot contain spaces');
    });

    it('must return error when path contains double slashes', async () => {
      const result = await root.newFolder('//invalid///folder///');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Path cannot contain "//"');
    });

    it('must return error when parent does not exist', async () => {
      const result = await root.newFolder('nonexistent/child');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('does not exist');
    });
  });
});
