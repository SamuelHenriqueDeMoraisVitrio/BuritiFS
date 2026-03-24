import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import ExplorerFile from '../../src/core/Explorer/file';
import { createTreeAndRoot } from '../helpers/fixtures';
import { getNodeByPath } from '../helpers/dataHelper';

describe('ExplorerTree.write', () => {
  let tree: ExplorerTree;
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ tree, root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must write a string to a file', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await tree.write({ path: '/arquivo.txt', content: 'hello world' });

      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
    });

    it('must write an ArrayBuffer to a file', async () => {
      const file = await root.newFile({ name: 'arquivo.bin' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const buffer = new TextEncoder().encode('binary content').buffer;
      const result = await tree.write({ path: '/arquivo.bin', content: buffer });

      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
    });

    it('must write an object as JSON to a file', async () => {
      const file = await root.newFile({ name: 'dados.json' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await tree.write({ path: '/dados.json', content: { key: 'value', num: 42 } });

      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
    });

    it('must update updatedAt after writing', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const before = await getNodeByPath('testeBanco', '/arquivo.txt');
      if (!before.ok || !before.data) throw new Error('setup failed');

      await new Promise(r => setTimeout(r, 2));
      await tree.write({ path: '/arquivo.txt', content: 'novo conteudo' });

      const after = await getNodeByPath('testeBanco', '/arquivo.txt');
      if (!after.ok || !after.data) throw new Error('setup failed');

      expect(after.data.updatedAt).toBeGreaterThan(before.data.updatedAt);
    });

    it('must allow overwriting content with a new write', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      await tree.write({ path: '/arquivo.txt', content: 'primeiro' });
      const result = await tree.write({ path: '/arquivo.txt', content: 'segundo' });

      expect(result.ok).toBe(true);
    });
  });

  describe('error', () => {
    it('must return error when path does not exist', async () => {
      const result = await tree.write({ path: '/inexistente.txt', content: 'x' });

      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('must return error when path is a folder', async () => {
      await root.newFolder({ name: 'pasta' });

      const result = await tree.write({ path: '/pasta', content: 'x' });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('/pasta');
    });
  });

  describe('sanitization', () => {
    it('must accept path with trailing slash', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await tree.write({ path: '/arquivo.txt/', content: 'hello' });

      expect(result.ok).toBe(true);
    });

    it('must accept path without leading slash', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await tree.write({ path: 'arquivo.txt', content: 'hello' });

      expect(result.ok).toBe(true);
    });
  });
});
