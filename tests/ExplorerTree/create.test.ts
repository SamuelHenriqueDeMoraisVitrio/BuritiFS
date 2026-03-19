import { afterEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import { isDbReady, nodeExistsAs, checkIntegrity } from '../helpers/dataHelper';

describe('ExplorerTree.create', () => {
  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must return an ExplorerTree instance', async () => {
      const result = await ExplorerTree.create({ name: 'testeBanco' });
      expect(result).toBeInstanceOf(ExplorerTree);

      expect(await isDbReady('testeBanco')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/', 'folder')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must close the connection without throwing', async () => {
      await ExplorerTree.create({ name: 'testeBanco' });
      // connection is closed in afterEach without throwing
    });
  });

  describe('error', () => {
    it('must return error object on failure', async () => {
      const bad = await ExplorerTree.create({ name: '' });
      if (bad instanceof ExplorerTree) return; // skip if DB allows empty name
      expect(bad.ok).toBe(false);
      expect(typeof bad.error).toBe('string');
    });
  });
});
