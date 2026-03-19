import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import ExplorerFile from '../../src/core/Explorer/file';
import { createTreeAndRoot } from '../helpers/fixtures';
import { nodeExistsAs, getNodeByPath, checkIntegrity } from '../helpers/dataHelper';

describe('ExplorerFile.copy', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must return an ExplorerFile instance of the copy', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await fileResult.copy({ to: '/copia.txt' });
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
      expect(result).toBeInstanceOf(ExplorerFile);

      expect(await nodeExistsAs('testeBanco', '/arquivo.txt', 'file')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/copia.txt', 'file')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must overwrite destination when priority is source and destination exists', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');
      await root.newFile({ name: 'copia.txt' });

      const result = await fileResult.copy({ to: '/copia.txt', priority: 'source' });
      expect(result).toBeInstanceOf(ExplorerFile);

      expect(await nodeExistsAs('testeBanco', '/copia.txt', 'file')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must keep destination when priority is destination and it exists', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');
      await root.newFile({ name: 'copia.txt' });

      const destinoBefore = await getNodeByPath('testeBanco', '/copia.txt');

      const result = await fileResult.copy({ to: '/copia.txt', priority: 'destination' });
      expect(result).toBeInstanceOf(ExplorerFile);

      const destinoAfter = await getNodeByPath('testeBanco', '/copia.txt');
      expect(destinoBefore).toEqual(destinoAfter);
    });

    it('must copy when priority is destination and destination does not exist', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await fileResult.copy({ to: '/copia.txt', priority: 'destination' });
      expect(result).toBeInstanceOf(ExplorerFile);

      expect(await nodeExistsAs('testeBanco', '/copia.txt', 'file')).toBe(true);
    });
  });

  describe('error', () => {
    it('must return error when destination parent does not exist', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await fileResult.copy({ to: '/nonexistent/copia.txt' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });

  describe('sanitization', () => {
    it('must accept destination path with trailing slash', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await fileResult.copy({ to: '/copia.txt/' });
      expect(result).toBeInstanceOf(ExplorerFile);
      expect(await nodeExistsAs('testeBanco', '/copia.txt', 'file')).toBe(true);
    });

    it('must accept destination path without leading slash', async () => {
      const fileResult = await root.newFile({ name: 'arquivo.txt' });
      if (!(fileResult instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await fileResult.copy({ to: 'copia.txt' });
      expect(result).toBeInstanceOf(ExplorerFile);
      expect(await nodeExistsAs('testeBanco', '/copia.txt', 'file')).toBe(true);
    });
  });
});
