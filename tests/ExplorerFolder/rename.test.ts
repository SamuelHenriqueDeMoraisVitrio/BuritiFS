import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';
import { nodeExists, nodeExistsAs, checkIntegrity } from '../helpers/dataHelper';


describe('ExplorerFolder.rename', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must rename the folder in the database', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      const result = await pasta.rename({ name: 'renomeada' });
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/renomeada', 'folder')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must update the internal path after rename', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      await pasta.rename({ name: 'renomeada' });

      expect(pasta.path).toBe('/renomeada');
    });

    it('must rename folder with children and update all paths', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await pasta.newFile({ name: 'arquivo.txt' });
      await pasta.newFolder({ name: 'sub' });

      const result = await pasta.rename({ name: 'renomeada' });
      expect(result.ok).toBe(true);

      expect(await nodeExists('testeBanco', '/pasta')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/renomeada', 'folder')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/renomeada/arquivo.txt', 'file')).toBe(true);
      expect(await nodeExistsAs('testeBanco', '/renomeada/sub', 'folder')).toBe(true);
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });

    it('must allow further operations using the updated path', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      await pasta.rename({ name: 'renomeada' });
      await pasta.newFile({ name: 'novo.txt' });

      expect(await nodeExistsAs('testeBanco', '/renomeada/novo.txt', 'file')).toBe(true);
    });

    it('must rename a nested folder', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      const sub = await pasta.newFolder({ name: 'sub' });
      if (!(sub instanceof ExplorerFolder)) throw new Error('setup failed');

      const result = await sub.rename({ name: 'subrenomeada' });
      expect(result.ok).toBe(true);

      expect(await nodeExists('testeBanco', '/pasta/sub')).toBe(false);
      expect(await nodeExistsAs('testeBanco', '/pasta/subrenomeada', 'folder')).toBe(true);
      expect(sub.path).toBe('/pasta/subrenomeada');
      expect(await checkIntegrity('testeBanco')).toEqual([]);
    });
  });

  describe('error', () => {
    it('must return error after folder is deleted', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      await pasta.delete();
      const result = await pasta.rename({ name: 'renomeada' });
      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });
  });
});
