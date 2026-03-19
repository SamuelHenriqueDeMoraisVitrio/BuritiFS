import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import ExplorerFile from '../../src/core/Explorer/file';
import { createTreeAndRoot } from '../helpers/fixtures';
import { nodeExists } from '../helpers/dataHelper';

describe('ExplorerFile.delete', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must delete the file', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await fileResult.delete();
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);

      expect(await nodeExists('testeBanco', '/arquivo.txt')).toBe(false);
    });
  });

  describe('error', () => {
    it('must return error when file was already deleted', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');

      await fileResult.delete();
      const result = await fileResult.delete();
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });
});
