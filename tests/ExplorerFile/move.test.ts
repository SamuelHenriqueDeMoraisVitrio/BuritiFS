import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import ExplorerFile from '../../src/core/Explorer/file';
import { createTreeAndRoot } from '../helpers/fixtures';
import { nodeExists, nodeExistsAs, getNodeByPath, checkIntegrity } from '../helpers/dataHelper';

describe('ExplorerFile.move', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must return an ExplorerFile instance of the destination', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await fileResult.move({ to: '/movido.txt' });
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
      expect(result).toBeInstanceOf(ExplorerFile);

      expect(await nodeExists('testeBanco', '/arquivo.txt')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movido.txt', 'file')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must overwrite destination when priority is source and destination exists', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');
      await root.newFile({ name: 'movido.txt' });

      const result = await fileResult.move({ to: '/movido.txt', priority: 'source' });
      expect(result).toBeInstanceOf(ExplorerFile);

      expect(await nodeExists('testeBanco', '/arquivo.txt')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movido.txt', 'file')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must keep destination and remove source when priority is destination and it exists', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');
      await root.newFile({ name: 'movido.txt' });

      const destinoBefore = await getNodeByPath('testeBanco', '/movido.txt');

      const result = await fileResult.move({ to: '/movido.txt', priority: 'destination' });
      expect(result).toBeInstanceOf(ExplorerFile);

      expect(await nodeExists('testeBanco', '/arquivo.txt')).toBe(false);
      const destinoAfter = await getNodeByPath('testeBanco', '/movido.txt');
      expect(destinoBefore).toEqual(destinoAfter);
    });

    it('must move when priority is destination and destination does not exist', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await fileResult.move({ to: '/movido.txt', priority: 'destination' });
      expect(result).toBeInstanceOf(ExplorerFile);

      expect(await nodeExists('testeBanco', '/arquivo.txt')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movido.txt', 'file')).toBe(true);
    });
  });

  describe('error', () => {
    it('must return error when destination parent does not exist', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await fileResult.move({ to: '/nonexistent/movido.txt' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('must return error when moving to itself', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await fileResult.move({ to: '/arquivo.txt' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });

  describe('sanitization', () => {
    it('must accept destination path with trailing slash', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await fileResult.move({ to: '/movido.txt/' });
      expect(result).toBeInstanceOf(ExplorerFile);
      expect(await nodeExists('testeBanco', '/arquivo.txt')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movido.txt', 'file')).toBe(true);
    });

    it('must accept destination path without leading slash', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await fileResult.move({ to: 'movido.txt' });
      expect(result).toBeInstanceOf(ExplorerFile);
      expect(await nodeExists('testeBanco', '/arquivo.txt')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/movido.txt', 'file')).toBe(true);
    });
  });
});
