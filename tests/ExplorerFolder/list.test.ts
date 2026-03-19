import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';


describe('ExplorerFolder.list', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must list direct children', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });
      await pasta.newFolder({ name: 'sub' });

      const result = await pasta.list();
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(2);
      const paths = result.items.map(i => i.path);
      expect(paths).toContain('/pasta/arquivo.txt');
      expect(paths).toContain('/pasta/sub');
    });

    it('must return empty array for empty folder', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      const result = await pasta.list();
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(0);
    });

    it('must not include grandchildren by default', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      const sub = await pasta.newFolder({ name: 'sub' });
      if (!(sub instanceof ExplorerFolder)) throw new Error('setup failed');
      await sub.newFile({ name: 'deep.txt' });

      const result = await pasta.list();
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].path).toBe('/pasta/sub');
    });

    it('must list all descendants when recursive is true', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      const sub = await pasta.newFolder({ name: 'sub' });
      if (!(sub instanceof ExplorerFolder)) throw new Error('setup failed');
      await sub.newFile({ name: 'deep.txt' });

      const result = await pasta.list({ recursive: true });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(2);
      const paths = result.items.map(i => i.path);
      expect(paths).toContain('/pasta/sub');
      expect(paths).toContain('/pasta/sub/deep.txt');
    });

    it('must return correct item shape', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });

      const result = await pasta.list();
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

    it('must limit results with limit option', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'a.txt' });
      await pasta.newFile({ name: 'b.txt' });
      await pasta.newFile({ name: 'c.txt' });

      const result = await pasta.list({ limit: 2 });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(2);
    });

    it('must paginate results with limit and page options', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'a.txt' });
      await pasta.newFile({ name: 'b.txt' });
      await pasta.newFile({ name: 'c.txt' });

      const page0 = await pasta.list({ limit: 2, page: 0 });
      const page1 = await pasta.list({ limit: 2, page: 1 });

      expect(page0.ok).toBe(true);
      expect(page1.ok).toBe(true);
      if (!page0.ok || !page1.ok) throw new Error('setup failed');

      expect(page0.items).toHaveLength(2);
      expect(page1.items).toHaveLength(1);

      const allPaths = [...page0.items, ...page1.items].map(i => i.path);
      expect(allPaths).toContain('/pasta/a.txt');
      expect(allPaths).toContain('/pasta/b.txt');
      expect(allPaths).toContain('/pasta/c.txt');
    });

    it('must filter results with filter function', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });
      await pasta.newFolder({ name: 'sub' });

      const result = await pasta.list({ filter: item => item.type === 'folder' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe('folder');
    });

    it('must use updated path after rename when listing', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });
      await pasta.rename({ name: 'renomeada' });

      const result = await pasta.list();
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].path).toBe('/renomeada/arquivo.txt');
    });
  });

  describe('error', () => {
    it('must return error after folder is deleted', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      await pasta.delete();
      const result = await pasta.list();
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });
});
