import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import ExplorerFile from '../../src/core/Explorer/file';
import { createTreeAndRoot } from '../helpers/fixtures';
import { getNodeByPath } from '../helpers/dataHelper';

describe('ExplorerFile.info', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must return info matching the database', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const info = await file.info();
      const raw = await getNodeByPath('testeBanco', '/arquivo.txt');

      expect(info.ok).toBe(true);
      if (!info.ok || !raw.ok || !raw.data) throw new Error('setup failed');

      expect(info.path).toBe(raw.data.path);
      expect(info.createdAt).toBe(raw.data.createdAt);
      expect(info.updatedAt).toBe(raw.data.updatedAt);
    });

    it('must not expose parent or type', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      const info = await file.info();
      expect(info.ok).toBe(true);

      expect(info).not.toHaveProperty('parent');
      expect(info).not.toHaveProperty('type');
    });

    it('must reflect new path after rename', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');

      await file.rename({ name: 'renomeado.txt' });

      const info = await file.info();
      expect(info.ok).toBe(true);
      if (!info.ok) throw new Error('setup failed');

      expect(info.path).toBe('/renomeado.txt');
    });

    it('must reflect new path after move', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');
      await root.newFolder({ name: 'pasta' });

      await file.move({ to: '/pasta/arquivo.txt' });

      const info = await file.info();
      expect(info.ok).toBe(true);
      if (!info.ok) throw new Error('setup failed');

      expect(info.path).toBe('/pasta/arquivo.txt');
    });

    it('must reflect updatedAt after move', async () => {
      const file = await root.newFile({ name: 'arquivo.txt' });
      if (!(file instanceof ExplorerFile)) throw new Error('setup failed');
      await root.newFolder({ name: 'pasta' });

      const before = await file.info();
      if (!before.ok) throw new Error('setup failed');

      await new Promise(r => setTimeout(r, 2));
      await file.move({ to: '/pasta/arquivo.txt' });

      const after = await file.info();
      if (!after.ok) throw new Error('setup failed');

      expect(after.updatedAt).toBeGreaterThanOrEqual(before.updatedAt);
    });
  });
});
