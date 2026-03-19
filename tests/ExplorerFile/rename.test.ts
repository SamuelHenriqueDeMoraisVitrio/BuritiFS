import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFile from '../../src/core/Explorer/file';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';
import { nodeExists, nodeExistsAs, checkIntegrity } from '../helpers/dataHelper';


describe('ExplorerFile.rename', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must rename the file in the database', async () => {
      const arquivo = await root.newFile({ name: 'arquivo.txt' });
      if (!(arquivo instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await arquivo.rename({ name: 'renomeado.txt' });
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);

      expect(await nodeExists('testeBanco', '/arquivo.txt')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/renomeado.txt', 'file')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must update the internal path after rename', async () => {
      const arquivo = await root.newFile({ name: 'arquivo.txt' });
      if (!(arquivo instanceof ExplorerFile)) throw new Error('setup failed');

      await arquivo.rename({ name: 'renomeado.txt' });

      expect(arquivo.path).toBe('/renomeado.txt');
    });

    it('must allow further operations using the updated path', async () => {
      const arquivo = await root.newFile({ name: 'arquivo.txt' });
      if (!(arquivo instanceof ExplorerFile)) throw new Error('setup failed');

      await arquivo.rename({ name: 'renomeado.txt' });
      const info = await arquivo.info();

      expect(info.ok).toBe(true);
      if (!info.ok) throw new Error('setup failed');
      expect(info.path).toBe('/renomeado.txt');
    });

    it('must rename a nested file', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      const arquivo = await pasta.newFile({ name: 'arquivo.txt' });
      if (!(arquivo instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await arquivo.rename({ name: 'renomeado.txt' });
      expect(result.ok).toBe(true);

      expect(await nodeExists('testeBanco', '/pasta/arquivo.txt')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/pasta/renomeado.txt', 'file')).toBe(true);
      expect(arquivo.path).toBe('/pasta/renomeado.txt');
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must allow rename multiple times', async () => {
      const arquivo = await root.newFile({ name: 'arquivo.txt' });
      if (!(arquivo instanceof ExplorerFile)) throw new Error('setup failed');

      await arquivo.rename({ name: 'primeiro.txt' });
      await arquivo.rename({ name: 'segundo.txt' });

      expect(arquivo.path).toBe('/segundo.txt');
      expect(await nodeExists('testeBanco', '/arquivo.txt')).toBe(false);
      expect(await nodeExists('testeBanco', '/primeiro.txt')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/segundo.txt', 'file')).toBe(true);
    });
  });

  describe('error', () => {
    it('must return error after file is deleted', async () => {
      const arquivo = await root.newFile({ name: 'arquivo.txt' });
      if (!(arquivo instanceof ExplorerFile)) throw new Error('setup failed');

      await arquivo.delete();
      const result = await arquivo.rename({ name: 'renomeado.txt' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });
});
