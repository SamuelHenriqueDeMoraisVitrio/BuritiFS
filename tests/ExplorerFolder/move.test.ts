import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';
import { nodeExists, nodeExistsAs, getNodeByPath, checkIntegrity } from '../helpers/dataHelper';

describe('ExplorerFolder.move', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must return ok and update self', async () => {
      await root.newFolder({ name: 'pasta' });
      const folderResult = await root.get({ name: 'pasta' });
      if (!(folderResult instanceof ExplorerFolder)) throw new Error('setup failed');

      const result = await folderResult.move({ to: '/movida' });
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movida', 'folder')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must update self so subsequent operations use the new path', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      await pasta.move({ to: '/movida' });
      await pasta.newFile({ name: 'novo.txt' });

      expect(await nodeExistsAs('testeBanco', '/movida/novo.txt', 'file')).toBe(true);
      expect(await nodeExists('testeBanco', '/pasta/novo.txt')).toBe(false);
    });

    it('must move folder with children', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });
      await pasta.newFolder({ name: 'sub' });

      const result = await pasta.move({ to: '/movida' });
      expect(result.ok).toBe(true);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movida/arquivo.txt', 'file')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/movida/sub', 'folder')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must replace destination when merge is false and priority is source', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'fonte.txt' });

      const movida = await root.newFolder({ name: 'movida' });
      if (!(movida instanceof ExplorerFolder)) throw new Error('setup failed');
      await movida.newFile({ name: 'destino.txt' });

      const result = await pasta.move({ to: '/movida', merge: false, priority: 'source' });
      expect(result.ok).toBe(true);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movida/fonte.txt', 'file')).toBe(true);
      expect(await nodeExists('testeBanco', '/movida/destino.txt')).toBe(false);
    });

    it('must keep destination and remove source when merge is false and priority is destination and it exists', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'fonte.txt' });

      const movida = await root.newFolder({ name: 'movida' });
      if (!(movida instanceof ExplorerFolder)) throw new Error('setup failed');
      await movida.newFile({ name: 'destino.txt' });

      const result = await pasta.move({ to: '/movida', merge: false, priority: 'destination' });
      expect(result.ok).toBe(true);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExists('testeBanco', '/movida/fonte.txt')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movida/destino.txt', 'file')).toBe(true);
    });

    it('must merge and source wins on conflict when merge is true and priority is source', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'comum.txt' });
      await pasta.newFile({ name: 'so-fonte.txt' });

      const movida = await root.newFolder({ name: 'movida' });
      if (!(movida instanceof ExplorerFolder)) throw new Error('setup failed');
      await movida.newFile({ name: 'comum.txt' });
      await movida.newFile({ name: 'so-destino.txt' });

      const result = await pasta.move({ to: '/movida', merge: true, priority: 'source' });
      expect(result.ok).toBe(true);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movida/comum.txt', 'file')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/movida/so-fonte.txt', 'file')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/movida/so-destino.txt', 'file')).toBe(true);
    });

    it('must merge and destination wins on conflict when merge is true and priority is destination', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'comum.txt' });
      await pasta.newFile({ name: 'so-fonte.txt' });

      const movida = await root.newFolder({ name: 'movida' });
      if (!(movida instanceof ExplorerFolder)) throw new Error('setup failed');
      await movida.newFile({ name: 'comum.txt' });

      const destinoBefore = await getNodeByPath('testeBanco', '/movida/comum.txt');

      const result = await pasta.move({ to: '/movida', merge: true, priority: 'destination' });
      expect(result.ok).toBe(true);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      const destinoAfter = await getNodeByPath('testeBanco', '/movida/comum.txt');
      expect(destinoBefore).toEqual(destinoAfter);
      expect(await nodeExistsAs('testeBanco', '/movida/so-fonte.txt', 'file')).toBe(true);
    });
  });

  describe('error', () => {
    it('must return error when destination parent does not exist', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      const result = await pasta.move({ to: '/nonexistent/movida' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('must return error when moving into own descendant', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFolder({ name: 'sub' });

      const result = await pasta.move({ to: '/pasta/sub/movida' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });

  describe('sanitization', () => {
    it('must accept destination path with trailing slash', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      const result = await pasta.move({ to: '/movida/' });
      expect(result.ok).toBe(true);
      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movida', 'folder')).toBe(true);
    });

    it('must accept destination path without leading slash', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      const result = await pasta.move({ to: 'movida' });
      expect(result.ok).toBe(true);
      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movida', 'folder')).toBe(true);
    });
  });
});
