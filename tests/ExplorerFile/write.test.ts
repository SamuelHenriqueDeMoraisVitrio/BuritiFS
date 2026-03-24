import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import ExplorerFile from '../../src/core/Explorer/file';
import { createTreeAndRoot } from '../helpers/fixtures';
import { getNodeByPath } from '../helpers/dataHelper';

describe('ExplorerFile.write', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must write a string to the file', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await file.write({ content: 'hello world' });

      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
    });

    it('must write an ArrayBuffer to the file', async () => {
      const file = await root.newFile({ name: 'arquivo.bin' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const buffer = new TextEncoder().encode('binary data').buffer;
      const result = await file.write({ content: buffer });

      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
    });

    it('must write an object as JSON to the file', async () => {
      const file = await root.newFile({ name: 'dados.json' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await file.write({ content: { chave: 'valor', numero: 1 } });

      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
    });

    it('must update updatedAt after writing', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const before = await getNodeByPath('testeBanco', '/arquivo.txt');
      if (!before.ok || !before.data) throw new Error('setup failed');

      await new Promise(r => setTimeout(r, 2));
      await file.write({ content: 'novo conteudo' });

      const after = await getNodeByPath('testeBanco', '/arquivo.txt');
      if (!after.ok || !after.data) throw new Error('setup failed');

      expect(after.data.updatedAt).toBeGreaterThan(before.data.updatedAt);
    });

    it('must allow overwriting content with a new write', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      await file.write({ content: 'primeiro' });
      const result = await file.write({ content: 'segundo' });

      expect(result.ok).toBe(true);
    });

    it('must write using the correct path after rename', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      await file.rename({ name: 'renomeado.txt' });
      const result = await file.write({ content: 'conteudo' });

      expect(result.ok).toBe(true);
    });

    it('must write using the correct path after move', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');
      await root.newFolder({ name: 'pasta' });

      await file.move({ to: '/pasta/arquivo.txt' });
      const result = await file.write({ content: 'conteudo' });

      expect(result.ok).toBe(true);
    });
  });
});
