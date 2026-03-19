import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import { createTreeAndRoot } from '../helpers/fixtures';

describe('ExplorerTree.type', () => {
  let tree: ExplorerTree;

  beforeEach(async () => {
    ({ tree } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must return "folder" for the root path', async () => {
      expect(await tree.type({ path: '/' })).toBe('folder');
    });

    it('must return "folder" for an existing folder', async () => {
      const root = await tree.source({ path: '/' });
      if (!(root instanceof Object) || !('newFolder' in root)) return;
      await (root as any).newFolder({ name: 'pasta' });

      expect(await tree.type({ path: '/pasta' })).toBe('folder');
    });

    it('must return "file" for an existing file', async () => {
      const root = await tree.source({ path: '/' });
      if (!(root instanceof Object) || !('newFile' in root)) return;
      await (root as any).newFile({ name: 'arquivo.txt' });

      expect(await tree.type({ path: '/arquivo.txt' })).toBe('file');
    });
  });

  describe('error', () => {
    it('must return null when path does not exist', async () => {
      expect(await tree.type({ path: '/nonexistent' })).toBeNull();
    });
  });
});
