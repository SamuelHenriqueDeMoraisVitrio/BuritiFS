import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';


describe('ExplorerTree.size', () => {
  let tree: ExplorerTree;
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ tree, root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must return 0 for empty folder', async () => {
      await root.newFolder({ name: 'vazia' });

      const result = await tree.size({ path: '/vazia' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');
      expect(result.size).toBe(0);
    });

    it('must count direct children', async () => {
      await root.newFile({ name: 'a.txt' });
      await root.newFile({ name: 'b.txt' });
      await root.newFolder({ name: 'pasta' });

      const result = await tree.size({ path: '/' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');
      expect(result.size).toBe(3);
    });

    it('must not count grandchildren by default', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });

      const result = await tree.size({ path: '/' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');
      expect(result.size).toBe(1);
    });

    it('must count all descendants when recursive is true', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'a.txt' });
      const sub = await pasta.newFolder({ name: 'sub' });
      if (!(sub instanceof ExplorerFolder)) throw new Error('setup failed');
      await sub.newFile({ name: 'b.txt' });

      const result = await tree.size({ path: '/pasta', recursive: true });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');
      expect(result.size).toBe(3);
    });

    it('must apply filter function', async () => {
      await root.newFile({ name: 'a.txt' });
      await root.newFile({ name: 'b.txt' });
      await root.newFolder({ name: 'pasta' });

      const result = await tree.size({ path: '/', filter: item => item.type === 'file' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');
      expect(result.size).toBe(2);
    });

    it('must apply filter with recursive from subfolder', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'a.txt' });
      await pasta.newFolder({ name: 'sub' });

      const result = await tree.size({ path: '/pasta', recursive: true, filter: item => item.type === 'file' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');
      expect(result.size).toBe(1);
    });

    it('must count all descendants recursively from root', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'a.txt' });
      await pasta.newFolder({ name: 'sub' });
      await root.newFile({ name: 'b.txt' });

      const result = await tree.size({ path: '/', recursive: true });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');
      expect(result.size).toBe(4);
    });

    it('must apply filter recursively from root', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'a.txt' });
      await pasta.newFolder({ name: 'sub' });
      await root.newFile({ name: 'b.txt' });

      const result = await tree.size({ path: '/', recursive: true, filter: item => item.type === 'file' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');
      expect(result.size).toBe(2);
    });

    it('must return 0 when filter matches nothing', async () => {
      await root.newFile({ name: 'a.txt' });

      const result = await tree.size({ path: '/', filter: item => item.type === 'folder' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');
      expect(result.size).toBe(0);
    });
  });

  describe('error', () => {
    it('must return error when path does not exist', async () => {
      const result = await tree.size({ path: '/naoexiste' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('must return error when path is a file', async () => {
      await root.newFile({ name: 'arquivo.txt' });

      const result = await tree.size({ path: '/arquivo.txt' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });

  describe('sanitization', () => {
    it('must accept path with trailing slash', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'a.txt' });

      const result = await tree.size({ path: '/pasta/' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');
      expect(result.size).toBe(1);
    });

    it('must accept path without leading slash', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'a.txt' });

      const result = await tree.size({ path: 'pasta' });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('setup failed');
      expect(result.size).toBe(1);
    });
  });
});
