import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';


describe('ExplorerTree.list', () => {
  let tree: ExplorerTree;
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ tree, root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must list direct children of a folder', async () => {
      await root.newFile({ name: 'arquivo.txt' });
      await root.newFolder({ name: 'pasta' });

      const result = await tree.list({ path: '/' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(2);
      const paths = result.items.map(i => i.path);
      expect(paths).toContain('/arquivo.txt');
      expect(paths).toContain('/pasta');
    });

    it('must list only direct children and not grandchildren by default', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });

      const result = await tree.list({ path: '/' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].path).toBe('/pasta');
    });

    it('must list all descendants when recursive is true', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });
      const sub = await pasta.newFolder({ name: 'sub' });
      if (!(sub instanceof ExplorerFolder)) throw new Error('setup failed');
      await sub.newFile({ name: 'deep.txt' });

      const result = await tree.list({ path: '/pasta', recursive: true });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(3);
      const paths = result.items.map(i => i.path);
      expect(paths).toContain('/pasta/arquivo.txt');
      expect(paths).toContain('/pasta/sub');
      expect(paths).toContain('/pasta/sub/deep.txt');
    });

    it('must list all descendants recursively from root', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });
      await root.newFile({ name: 'raiz.txt' });

      const result = await tree.list({ path: '/', recursive: true });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(3);
      const paths = result.items.map(i => i.path);
      expect(paths).toContain('/pasta');
      expect(paths).toContain('/pasta/arquivo.txt');
      expect(paths).toContain('/raiz.txt');
    });

    it('must return correct item shape', async () => {
      await root.newFile({ name: 'arquivo.txt' });

      const result = await tree.list({ path: '/' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      const item = result.items[0];
      expect(item).toHaveProperty('path');
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
      expect(typeof item.createdAt).toBe('number');
      expect(typeof item.updatedAt).toBe('number');
    });

    it('must return empty array for empty folder', async () => {
      await root.newFolder({ name: 'vazia' });

      const result = await tree.list({ path: '/vazia' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(0);
    });

    it('must limit results with limit option', async () => {
      await root.newFile({ name: 'a.txt' });
      await root.newFile({ name: 'b.txt' });
      await root.newFile({ name: 'c.txt' });

      const result = await tree.list({ path: '/', limit: 2 });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(2);
    });

    it('must paginate results with limit and page options', async () => {
      await root.newFile({ name: 'a.txt' });
      await root.newFile({ name: 'b.txt' });
      await root.newFile({ name: 'c.txt' });

      const page0 = await tree.list({ path: '/', limit: 2, page: 0 });
      const page1 = await tree.list({ path: '/', limit: 2, page: 1 });

      expect(page0.ok).toBe(true);
      expect(page1.ok).toBe(true);
      if (!page0.ok || !page1.ok) throw new Error('setup failed');

      expect(page0.items).toHaveLength(2);
      expect(page1.items).toHaveLength(1);

      const allPaths = [...page0.items, ...page1.items].map(i => i.path);
      expect(allPaths).toContain('/a.txt');
      expect(allPaths).toContain('/b.txt');
      expect(allPaths).toContain('/c.txt');
    });

    it('must filter results with filter function', async () => {
      await root.newFile({ name: 'arquivo.txt' });
      await root.newFolder({ name: 'pasta' });

      const result = await tree.list({ path: '/', filter: item => item.type === 'file' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe('file');
    });

    it('must filter and paginate together', async () => {
      await root.newFile({ name: 'a.txt' });
      await root.newFile({ name: 'b.txt' });
      await root.newFolder({ name: 'pasta' });

      const result = await tree.list({ path: '/', filter: item => item.type === 'file', limit: 1, page: 0 });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe('file');
    });
  });

  describe('error', () => {
    it('must return error when path does not exist', async () => {
      const result = await tree.list({ path: '/nonexistent' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('must return error when path is a file', async () => {
      await root.newFile({ name: 'arquivo.txt' });

      const result = await tree.list({ path: '/arquivo.txt' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });

  describe('sanitization', () => {
    it('must accept path with trailing slash', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });

      const result = await tree.list({ path: '/pasta/' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');
      expect(result.items).toHaveLength(1);
    });

    it('must accept path without leading slash', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });

      const result = await tree.list({ path: 'pasta' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(1);
    });
  });
});
