import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';
import { nodeExists, nodeExistsAs, getNodeByPath, checkIntegrity } from '../helpers/dataHelper';

describe('ExplorerTree.copy', () => {
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
    it('must copy a file to a new path', async () => {
      await root.newFile({ name: 'arquivo.txt' });

      const result = await tree.copy({ fromPath: '/arquivo.txt', toPath: '/copia.txt' });
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);

      expect(await nodeExistsAs('testeBanco', '/arquivo.txt', 'file')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/copia.txt', 'file')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must overwrite destination file when priority is source', async () => {
      await root.newFile({ name: 'arquivo.txt' });
      await root.newFile({ name: 'copia.txt' });

      const result = await tree.copy({ fromPath: '/arquivo.txt', toPath: '/copia.txt', priority: 'source' });
      expect(result.ok).toBe(true);

      expect(await nodeExistsAs('testeBanco', '/copia.txt', 'file')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must keep destination file when priority is destination and it exists', async () => {
      await root.newFile({ name: 'arquivo.txt' });
      await root.newFile({ name: 'copia.txt' });

      const destinoBefore = await getNodeByPath('testeBanco', '/copia.txt');

      const result = await tree.copy({ fromPath: '/arquivo.txt', toPath: '/copia.txt', priority: 'destination' });
      expect(result.ok).toBe(true);

      const destinoAfter = await getNodeByPath('testeBanco', '/copia.txt');
      expect(destinoBefore).toEqual(destinoAfter);
    });

    it('must copy file when priority is destination and destination does not exist', async () => {
      await root.newFile({ name: 'arquivo.txt' });

      const result = await tree.copy({ fromPath: '/arquivo.txt', toPath: '/copia.txt', priority: 'destination' });
      expect(result.ok).toBe(true);

      expect(await nodeExistsAs('testeBanco', '/copia.txt', 'file')).toBe(true);
    });
  });

  // ─── Folder ──────────────────────────────────────────────────

  describe('success - folder', () => {
    it('must copy an empty folder', async () => {
      await root.newFolder({ name: 'pasta' });

      const result = await tree.copy({ fromPath: '/pasta', toPath: '/copia' });
      expect(result.ok).toBe(true);

      expect(await nodeExistsAs('testeBanco', '/pasta', 'folder')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/copia', 'folder')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must copy a folder with all its children', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });
      await pasta.newFolder({ name: 'subpasta' });

      const result = await tree.copy({ fromPath: '/pasta', toPath: '/copia' });
      expect(result.ok).toBe(true);

      expect(await nodeExistsAs('testeBanco', '/copia', 'folder')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/copia/arquivo.txt', 'file')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/copia/subpasta', 'folder')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must copy nested children with correct parents', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      const sub = await pasta.newFolder({ name: 'sub' });
      if (!(sub instanceof ExplorerFolder)) throw new Error('setup failed');
      await sub.newFile({ name: 'deep.txt' });

      await tree.copy({ fromPath: '/pasta', toPath: '/copia' });

      const node = await getNodeByPath('testeBanco', '/copia/sub/deep.txt');
      expect(node.ok).toBe(true);
      expect(node.ok && node.data?.parent).toBe('/copia/sub');
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must replace destination folder when merge is false and priority is source', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'fonte.txt' });

      const copia = await root.newFolder({ name: 'copia' });
      if (!(copia instanceof ExplorerFolder)) throw new Error('setup failed');
      await copia.newFile({ name: 'destino.txt' });

      const result = await tree.copy({ fromPath: '/pasta', toPath: '/copia', merge: false, priority: 'source' });
      expect(result.ok).toBe(true);

      expect(await nodeExistsAs('testeBanco', '/copia/fonte.txt', 'file')).toBe(true);
      expect(await nodeExists('testeBanco', '/copia/destino.txt')).toBe(false);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must keep destination folder when merge is false and priority is destination and it exists', async () => {
      await root.newFolder({ name: 'pasta' });
      const copia = await root.newFolder({ name: 'copia' });
      if (!(copia instanceof ExplorerFolder)) throw new Error('setup failed');
      await copia.newFile({ name: 'destino.txt' });

      const result = await tree.copy({ fromPath: '/pasta', toPath: '/copia', merge: false, priority: 'destination' });
      expect(result.ok).toBe(true);

      expect(await nodeExistsAs('testeBanco', '/copia/destino.txt', 'file')).toBe(true);
    });

    it('must copy folder when merge is false and priority is destination but destination does not exist', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });

      const result = await tree.copy({ fromPath: '/pasta', toPath: '/copia', merge: false, priority: 'destination' });
      expect(result.ok).toBe(true);

      expect(await nodeExistsAs('testeBanco', '/copia', 'folder')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/copia/arquivo.txt', 'file')).toBe(true);
    });

    it('must merge and source wins on conflict when merge is true and priority is source', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'comum.txt' });
      await pasta.newFile({ name: 'so-fonte.txt' });

      const copia = await root.newFolder({ name: 'copia' });
      if (!(copia instanceof ExplorerFolder)) throw new Error('setup failed');
      await copia.newFile({ name: 'comum.txt' });
      await copia.newFile({ name: 'so-destino.txt' });

      const result = await tree.copy({ fromPath: '/pasta', toPath: '/copia', merge: true, priority: 'source' });
      expect(result.ok).toBe(true);

      expect(await nodeExistsAs('testeBanco', '/copia/comum.txt', 'file')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/copia/so-fonte.txt', 'file')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/copia/so-destino.txt', 'file')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must merge and destination wins on conflict when merge is true and priority is destination', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'comum.txt' });
      await pasta.newFile({ name: 'so-fonte.txt' });

      const copia = await root.newFolder({ name: 'copia' });
      if (!(copia instanceof ExplorerFolder)) throw new Error('setup failed');
      await copia.newFile({ name: 'comum.txt' });
      await copia.newFile({ name: 'so-destino.txt' });

      const destinoBefore = await getNodeByPath('testeBanco', '/copia/comum.txt');

      const result = await tree.copy({ fromPath: '/pasta', toPath: '/copia', merge: true, priority: 'destination' });
      expect(result.ok).toBe(true);

      const destinoAfter = await getNodeByPath('testeBanco', '/copia/comum.txt');
      expect(destinoBefore).toEqual(destinoAfter);
      expect(await nodeExistsAs('testeBanco', '/copia/so-fonte.txt', 'file')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/copia/so-destino.txt', 'file')).toBe(true);
    });

    it('must not copy folder over a file when merge is true and priority is destination', async () => {
      await root.newFolder({ name: 'pasta' });
      await root.newFile({ name: 'copia' });

      const result = await tree.copy({ fromPath: '/pasta', toPath: '/copia', merge: true, priority: 'destination' });
      expect(result.ok).toBe(true);

      expect(await nodeExistsAs('testeBanco', '/copia', 'file')).toBe(true);
    });

    it('must replace file with folder when merge is false and priority is source', async () => {
      await root.newFolder({ name: 'pasta' });
      await root.newFile({ name: 'copia' });

      const result = await tree.copy({ fromPath: '/pasta', toPath: '/copia', merge: false, priority: 'source' });
      expect(result.ok).toBe(true);

      expect(await nodeExistsAs('testeBanco', '/copia', 'folder')).toBe(true);
    });
  });

  // ─── Error ───────────────────────────────────────────────────

  describe('error', () => {
    it('must return error when source does not exist', async () => {
      const result = await tree.copy({ fromPath: '/nonexistent', toPath: '/copia' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('must return error when fromPath is root', async () => {
      const result = await tree.copy({ fromPath: '/', toPath: '/copia' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('must return error when toPath is root', async () => {
      await root.newFile({ name: 'arquivo.txt' });
      const result = await tree.copy({ fromPath: '/arquivo.txt', toPath: '/' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('must return error when destination parent does not exist', async () => {
      await root.newFile({ name: 'arquivo.txt' });
      const result = await tree.copy({ fromPath: '/arquivo.txt', toPath: '/nonexistent/copia.txt' });
      expect(result.ok).toBe(false);
      expect(result.error).toContain('does not exist');
    });
  });

  // ─── Sanitization ────────────────────────────────────────────

  describe('sanitization', () => {
    it('must accept fromPath with trailing slash', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });

      const result = await tree.copy({ fromPath: '/pasta/', toPath: '/copia' });
      expect(result.ok).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/copia', 'folder')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/copia/arquivo.txt', 'file')).toBe(true);
    });

    it('must accept toPath without leading slash', async () => {
      await root.newFile({ name: 'arquivo.txt' });

      const result = await tree.copy({ fromPath: '/arquivo.txt', toPath: 'copia.txt' });
      expect(result.ok).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/copia.txt', 'file')).toBe(true);
    });
  });
});
