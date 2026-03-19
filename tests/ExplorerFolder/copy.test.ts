import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';
import { nodeExists, nodeExistsAs, getNodeByPath, checkIntegrity } from '../helpers/dataHelper';

describe('ExplorerFolder.copy', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must return an ExplorerFolder instance of the copy', async () => {
      await root.newFolder({ name: 'pasta' });
      const folderResult = await root.get({ name: 'pasta' });
      if (!(folderResult instanceof ExplorerFolder)) throw new Error('setup failed');

      const result = await folderResult.copy({ to: '/copia' });
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
      expect(result).toBeInstanceOf(ExplorerFolder);

      expect(await nodeExistsAs('testeBanco', '/copia', 'folder')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must copy folder with children and return accessible instance', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });
      await pasta.newFolder({ name: 'sub' });

      const result = await pasta.copy({ to: '/copia' });
      expect(result).toBeInstanceOf(ExplorerFolder);

      expect(await nodeExistsAs('testeBanco', '/copia/arquivo.txt', 'file')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/copia/sub', 'folder')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must replace destination when merge is false and priority is source', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'fonte.txt' });

      const copia = await root.newFolder({ name: 'copia' });
      if (!(copia instanceof ExplorerFolder)) throw new Error('setup failed');
      await copia.newFile({ name: 'destino.txt' });

      const result = await pasta.copy({ to: '/copia', merge: false, priority: 'source' });
      expect(result).toBeInstanceOf(ExplorerFolder);

      expect(await nodeExistsAs('testeBanco', '/copia/fonte.txt', 'file')).toBe(true);
      expect(await nodeExists('testeBanco', '/copia/destino.txt')).toBe(false);
    });

    it('must keep destination when merge is false and priority is destination and it exists', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'fonte.txt' });

      const copia = await root.newFolder({ name: 'copia' });
      if (!(copia instanceof ExplorerFolder)) throw new Error('setup failed');
      await copia.newFile({ name: 'destino.txt' });

      const result = await pasta.copy({ to: '/copia', merge: false, priority: 'destination' });
      expect(result).toBeInstanceOf(ExplorerFolder);

      expect(await nodeExists('testeBanco', '/copia/fonte.txt')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/copia/destino.txt', 'file')).toBe(true);
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

      const result = await pasta.copy({ to: '/copia', merge: true, priority: 'source' });
      expect(result).toBeInstanceOf(ExplorerFolder);

      expect(await nodeExistsAs('testeBanco', '/copia/comum.txt', 'file')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/copia/so-fonte.txt', 'file')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/copia/so-destino.txt', 'file')).toBe(true);
    });

    it('must merge and destination wins on conflict when merge is true and priority is destination', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'comum.txt' });
      await pasta.newFile({ name: 'so-fonte.txt' });

      const copia = await root.newFolder({ name: 'copia' });
      if (!(copia instanceof ExplorerFolder)) throw new Error('setup failed');
      await copia.newFile({ name: 'comum.txt' });

      const destinoBefore = await getNodeByPath('testeBanco', '/copia/comum.txt');

      const result = await pasta.copy({ to: '/copia', merge: true, priority: 'destination' });
      expect(result).toBeInstanceOf(ExplorerFolder);

      const destinoAfter = await getNodeByPath('testeBanco', '/copia/comum.txt');
      expect(destinoBefore).toEqual(destinoAfter);
      expect(await nodeExistsAs('testeBanco', '/copia/so-fonte.txt', 'file')).toBe(true);
    });
  });

  describe('error', () => {
    it('must return error when destination parent does not exist', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      const result = await pasta.copy({ to: '/nonexistent/copia' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });

  describe('sanitization', () => {
    it('must accept destination path with trailing slash', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      const result = await pasta.copy({ to: '/copia/' });
      expect(result).toBeInstanceOf(ExplorerFolder);
      expect(await nodeExistsAs('testeBanco', '/copia', 'folder')).toBe(true);
    });

    it('must accept destination path without leading slash', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      const result = await pasta.copy({ to: 'copia' });
      expect(result).toBeInstanceOf(ExplorerFolder);
      expect(await nodeExistsAs('testeBanco', '/copia', 'folder')).toBe(true);
    });
  });
});
