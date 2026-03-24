import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import ExplorerFile from '../../src/core/Explorer/file';
import { createTreeAndRoot } from '../helpers/fixtures';

describe('ExplorerFile.read', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must return content and text for a written string', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      await file.write({ content: 'hello world' });
      const result = await file.read();

      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
      if (!result.ok) throw new Error('unreachable');

      expect(result.text).toBe('hello world');
      expect(result.content).toBeInstanceOf(ArrayBuffer);
    });

    it('must return content and text for a written object', async () => {
      const file = await root.newFile({ name: 'dados.json' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const payload = { chave: 'valor', num: 99 };
      await file.write({ content: payload });
      const result = await file.read();

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');

      expect(JSON.parse(result.text)).toEqual(payload);
    });

    it('must return the last written content after overwrite', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      await file.write({ content: 'primeiro' });
      await file.write({ content: 'segundo' });
      const result = await file.read();

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');

      expect(result.text).toBe('segundo');
    });

    it('must return ArrayBuffer for binary content', async () => {
      const file = await root.newFile({ name: 'arquivo.bin' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const buffer = new TextEncoder().encode('dado binario').buffer;
      await file.write({ content: buffer });
      const result = await file.read();

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');

      expect(result.content).toBeInstanceOf(ArrayBuffer);
      expect(result.text).toBe('dado binario');
    });

    it('must read empty content from a newly created file', async () => {
      const file = await root.newFile({ name: 'vazio.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const result = await file.read();

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');

      expect(result.content).toBeInstanceOf(ArrayBuffer);
      expect(result.text).toBe('');
    });

    it('must read using the correct path after rename', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      await file.write({ content: 'conteudo original' });
      await file.rename({ name: 'renomeado.txt' });
      const result = await file.read();

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');

      expect(result.text).toBe('conteudo original');
    });

    it('must read using the correct path after move', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');
      await root.newFolder({ name: 'pasta' });

      await file.write({ content: 'conteudo movido' });
      await file.move({ to: '/pasta/arquivo.txt' });
      const result = await file.read();

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');

      expect(result.text).toBe('conteudo movido');
    });
  });
});
