import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import ExplorerFile from '../../src/core/Explorer/file';
import { createTreeAndRoot } from '../helpers/fixtures';

describe('ExplorerTree.read', () => {
  let tree: ExplorerTree;
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ tree, root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must return content and text for a written string', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      await tree.write({ path: '/arquivo.txt', content: 'hello world' });
      const result = await tree.read({ path: '/arquivo.txt' });

      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
      if (!result.ok) throw new Error('unreachable');

      expect(result.text).toBe('hello world');
      expect(result.content).toBeInstanceOf(ArrayBuffer);
    });

    it('must return content and text for a written object', async () => {
      const file = await root.newFile({ name: 'dados.json' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const payload = { key: 'valor', num: 7 };
      await tree.write({ path: '/dados.json', content: payload });
      const result = await tree.read({ path: '/dados.json' });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');

      expect(JSON.parse(result.text)).toEqual(payload);
    });

    it('must return the last written content after overwrite', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      await tree.write({ path: '/arquivo.txt', content: 'primeiro' });
      await tree.write({ path: '/arquivo.txt', content: 'segundo' });
      const result = await tree.read({ path: '/arquivo.txt' });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');

      expect(result.text).toBe('segundo');
    });

    it('must return ArrayBuffer for binary content', async () => {
      const file = await root.newFile({ name: 'arquivo.bin' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const buffer = new TextEncoder().encode('dado binario').buffer;
      await tree.write({ path: '/arquivo.bin', content: buffer });
      const result = await tree.read({ path: '/arquivo.bin' });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');

      expect(result.content).toBeInstanceOf(ArrayBuffer);
      expect(result.text).toBe('dado binario');
    });

    it('must read empty content from a newly created file', async () => {
      const file = await root.newFile({ name: 'vazio.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await tree.read({ path: '/vazio.txt' });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');

      expect(result.content).toBeInstanceOf(ArrayBuffer);
      expect(result.text).toBe('');
    });
  });

  describe('error', () => {
    it('must return error when path does not exist', async () => {
      const result = await tree.read({ path: '/inexistente.txt' });

      expect(result.ok).toBe(false);
      expect(typeof result.error).toBe('string');
    });

    it('must return error when path is a folder', async () => {
      await root.newFolder({ name: 'pasta' });

      const result = await tree.read({ path: '/pasta' });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('/pasta');
    });
  });

  describe('sanitization', () => {
    it('must accept path with trailing slash', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      await tree.write({ path: '/arquivo.txt', content: 'hello' });
      const result = await tree.read({ path: '/arquivo.txt/' });

      expect(result.ok).toBe(true);
    });

    it('must accept path without leading slash', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      await tree.write({ path: '/arquivo.txt', content: 'hello' });
      const result = await tree.read({ path: 'arquivo.txt' });

      expect(result.ok).toBe(true);
    });
  });
});
