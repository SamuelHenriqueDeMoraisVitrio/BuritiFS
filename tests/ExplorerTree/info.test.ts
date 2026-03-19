import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';
import { getNodeByPath } from '../helpers/dataHelper';

describe('ExplorerTree.info', () => {
  let tree: ExplorerTree;
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ tree, root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must return info for a folder and match the database', async () => {
      await root.newFolder({ name: 'pasta' });

      const info = await tree.info({ path: '/pasta' });
      const raw = await getNodeByPath('testeBanco', '/pasta');

      expect(info.ok).toBe(true);
      expect(info.error).toBe(null);
      if (!info.ok || !raw.ok || !raw.data) throw new Error('setup failed');

      expect(info.path).toBe(raw.data.path);
      expect(info.createdAt).toBe(raw.data.createdAt);
      expect(info.updatedAt).toBe(raw.data.updatedAt);
      expect(info.extension).toBeUndefined();
    });

    it('must return info for a file and match the database', async () => {
      await root.newFile({ name: 'arquivo.txt' });

      const info = await tree.info({ path: '/arquivo.txt' });
      const raw = await getNodeByPath('testeBanco', '/arquivo.txt');

      expect(info.ok).toBe(true);
      if (!info.ok || !raw.ok || !raw.data) throw new Error('setup failed');

      expect(info.path).toBe(raw.data.path);
      expect(info.createdAt).toBe(raw.data.createdAt);
      expect(info.updatedAt).toBe(raw.data.updatedAt);
    });

    it('must return info for root', async () => {
      const info = await tree.info({ path: '/' });
      const raw = await getNodeByPath('testeBanco', '/');

      expect(info.ok).toBe(true);
      if (!info.ok || !raw.ok || !raw.data) throw new Error('setup failed');

      expect(info.path).toBe('/');
      expect(info.createdAt).toBe(raw.data.createdAt);
      expect(info.updatedAt).toBe(raw.data.updatedAt);
    });

    it('must not expose parent or type', async () => {
      await root.newFile({ name: 'arquivo.txt' });

      const info = await tree.info({ path: '/arquivo.txt' });
      expect(info.ok).toBe(true);

      expect(info).not.toHaveProperty('parent');
      expect(info).not.toHaveProperty('type');
    });

    it('must reflect updatedAt after a rename', async () => {
      await root.newFile({ name: 'arquivo.txt' });

      const before = await tree.info({ path: '/arquivo.txt' });
      if (!before.ok) throw new Error('setup failed');

      await new Promise(r => setTimeout(r, 2));
      await tree.rename({ path: '/arquivo.txt', name: 'novo.txt' });

      const after = await tree.info({ path: '/novo.txt' });
      if (!after.ok) throw new Error('setup failed');

      expect(after.updatedAt).toBeGreaterThanOrEqual(before.updatedAt);
    });
  });

  describe('error', () => {
    it('must return error when path does not exist', async () => {
      const info = await tree.info({ path: '/nonexistent' });
      expect(info.ok).toBe(false);
      expect(typeof info.error).toBe('string');
    });
  });

  describe('sanitization', () => {
    it('must accept path with trailing slash', async () => {
      await root.newFolder({ name: 'pasta' });

      const info = await tree.info({ path: '/pasta/' });
      expect(info.ok).toBe(true);
      if (!info.ok) throw new Error('setup failed');
      expect(info.path).toBe('/pasta');
    });

    it('must accept path without leading slash', async () => {
      await root.newFolder({ name: 'pasta' });

      const info = await tree.info({ path: 'pasta' });
      expect(info.ok).toBe(true);
      if (!info.ok) throw new Error('setup failed');
      expect(info.path).toBe('/pasta');
    });
  });
});
