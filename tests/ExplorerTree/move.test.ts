import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';
import { nodeExists, nodeExistsAs, getNodeByPath, checkIntegrity } from '../helpers/dataHelper';


describe('ExplorerTree.move', () => {
  let tree: ExplorerTree;
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ tree, root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  // ─── File ────────────────────────────────────────────────────

  describe('success - file', () => {
    it('must move a file to a new path', async () => {
      await root.newFile({ name: 'arquivo.txt' });

      const result = await tree.move({ fromPath: '/arquivo.txt', toPath: '/movido.txt' });
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);

      expect(await nodeExists('testeBanco', '/arquivo.txt')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movido.txt', 'file')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must overwrite destination file when force is true', async () => {
      await root.newFile({ name: 'arquivo.txt' });
      await root.newFile({ name: 'movido.txt' });

      const result = await tree.move({ fromPath: '/arquivo.txt', toPath: '/movido.txt', force: true });
      expect(result.ok).toBe(true);

      expect(await nodeExists('testeBanco', '/arquivo.txt')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movido.txt', 'file')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });
  });

  // ─── Folder ──────────────────────────────────────────────────

  describe('success - folder', () => {
    it('must move an empty folder', async () => {
      await root.newFolder({ name: 'pasta' });

      const result = await tree.move({ fromPath: '/pasta', toPath: '/movida' });
      expect(result.ok).toBe(true);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movida', 'folder')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must move a folder with all its children', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });
      await pasta.newFolder({ name: 'sub' });

      const result = await tree.move({ fromPath: '/pasta', toPath: '/movida' });
      expect(result.ok).toBe(true);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExists('testeBanco', '/pasta/arquivo.txt')).toBe(false);
      expect(await nodeExists('testeBanco', '/pasta/sub')).toBe(false);

      expect(await nodeExistsAs('testeBanco', '/movida', 'folder')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/movida/arquivo.txt', 'file')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/movida/sub', 'folder')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must move nested children with correct parents', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      const sub = await pasta.newFolder({ name: 'sub' });
      if (!(sub instanceof ExplorerFolder)) throw new Error('setup failed');
      await sub.newFile({ name: 'deep.txt' });

      await tree.move({ fromPath: '/pasta', toPath: '/movida' });

      const node = await getNodeByPath('testeBanco', '/movida/sub/deep.txt');
      expect(node.ok).toBe(true);
      expect(node.ok && node.data?.parent).toBe('/movida/sub');
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must replace destination folder when force is true', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'fonte.txt' });

      const destino = await root.newFolder({ name: 'movida' });
      if (!(destino instanceof ExplorerFolder)) throw new Error('setup failed');
      await destino.newFile({ name: 'destino.txt' });

      const result = await tree.move({ fromPath: '/pasta', toPath: '/movida', force: true });
      expect(result.ok).toBe(true);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movida/fonte.txt', 'file')).toBe(true);
      expect(await nodeExists('testeBanco', '/movida/destino.txt')).toBe(false);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must replace a file with a folder when force is true', async () => {
      await root.newFolder({ name: 'pasta' });
      await root.newFile({ name: 'movida' });

      const result = await tree.move({ fromPath: '/pasta', toPath: '/movida', force: true });
      expect(result.ok).toBe(true);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movida', 'folder')).toBe(true);
    });
  });

  // ─── Error ───────────────────────────────────────────────────

  describe('error', () => {
    it('must return error when source does not exist', async () => {
      const result = await tree.move({ fromPath: '/nonexistent', toPath: '/movido' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('must return error when fromPath is root', async () => {
      const result = await tree.move({ fromPath: '/', toPath: '/movido' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('must return error when toPath is root', async () => {
      await root.newFile({ name: 'arquivo.txt' });
      const result = await tree.move({ fromPath: '/arquivo.txt', toPath: '/' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('must return error when moving to itself', async () => {
      await root.newFile({ name: 'arquivo.txt' });
      const result = await tree.move({ fromPath: '/arquivo.txt', toPath: '/arquivo.txt' });
      expect(result.ok).toBe(false);
      expect(result.error).toContain('itself');
    });

    it('must return error when moving a folder into one of its own descendants', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFolder({ name: 'sub' });

      const result = await tree.move({ fromPath: '/pasta', toPath: '/pasta/sub/movida' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('must return error when destination parent does not exist', async () => {
      await root.newFile({ name: 'arquivo.txt' });
      const result = await tree.move({ fromPath: '/arquivo.txt', toPath: '/nonexistent/movido.txt' });
      expect(result.ok).toBe(false);
      expect(result.error).toContain('does not exist');
    });

    it('must return error when destination exists and force is false', async () => {
      await root.newFile({ name: 'arquivo.txt' });
      await root.newFile({ name: 'movido.txt' });

      const result = await tree.move({ fromPath: '/arquivo.txt', toPath: '/movido.txt' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });

  // ─── Sanitization ────────────────────────────────────────────

  describe('sanitization', () => {
    it('must accept fromPath with trailing slash', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });

      const result = await tree.move({ fromPath: '/pasta/', toPath: '/movida' });
      expect(result.ok).toBe(true);
      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movida', 'folder')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/movida/arquivo.txt', 'file')).toBe(true);
    });

    it('must accept toPath without leading slash', async () => {
      await root.newFile({ name: 'arquivo.txt' });

      const result = await tree.move({ fromPath: '/arquivo.txt', toPath: 'movido.txt' });
      expect(result.ok).toBe(true);
      expect(await nodeExists('testeBanco', '/arquivo.txt')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movido.txt', 'file')).toBe(true);
    });
  });
});
