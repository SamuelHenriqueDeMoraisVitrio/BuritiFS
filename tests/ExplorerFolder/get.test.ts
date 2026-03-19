import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import ExplorerFile from '../../src/core/Explorer/file';
import { createTreeAndRoot } from '../helpers/fixtures';

describe('ExplorerFolder.get', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must return an ExplorerFolder when name points to a folder', async () => {
      await root.newFolder({ name: 'pasta' });
      const result = await root.get({ name: 'pasta' });

      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
      expect(result).toBeInstanceOf(ExplorerFolder);
    });

    it('must return an ExplorerFile when name points to a file', async () => {
      await root.newFile({ name: 'arquivo.txt' });
      const result = await root.get({ name: 'arquivo.txt' });

      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
      expect(result).toBeInstanceOf(ExplorerFile);
    });
  });

  describe('error', () => {
    it('must return error when name does not exist', async () => {
      const result = await root.get({ name: 'nonexistent' });

      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });

  describe('sanitization', () => {
    it('must accept folder name with trailing slash', async () => {
      await root.newFolder({ name: 'pasta' });
      const result = await root.get({ name: 'pasta/' });
      expect(result).toBeInstanceOf(ExplorerFolder);
    });

    it('must accept file name with trailing slash', async () => {
      await root.newFile({ name: 'arquivo.txt' });
      const result = await root.get({ name: 'arquivo.txt/' });
      expect(result).toBeInstanceOf(ExplorerFile);
    });
  });
});
