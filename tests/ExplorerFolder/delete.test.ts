import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';
import { nodeExists } from '../helpers/dataHelper';

describe('ExplorerFolder.delete', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must delete the folder', async () => {
      const folderResult = await root.newFolder({ name: 'pasta' });
      if (!(folderResult instanceof ExplorerFolder)) throw new Error('setup failed');

      const result = await folderResult.delete();
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
    });

    it('must delete the folder and its children', async () => {
      const folderResult = await root.newFolder({ name: 'pasta' });
      if (!(folderResult instanceof ExplorerFolder)) throw new Error('setup failed');

      await folderResult.newFile({ name: 'arquivo.txt' });
      await folderResult.newFolder({ name: 'subpasta' });

      const result = await folderResult.delete();
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExists('testeBanco', '/pasta/arquivo.txt')).toBe(false);
      expect(await nodeExists('testeBanco', '/pasta/subpasta')).toBe(false);
    });
  });

  describe('error', () => {
    it('must return error when trying to delete root', async () => {
      const result = await root.delete();
      expect(result.ok).toBe(false);
      expect(result.error).toContain('root');
    });
  });
});
