import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';
import { getNodeByPath } from '../helpers/dataHelper';

describe('ExplorerFolder.info', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  describe('success', () => {
    it('must return info matching the database', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      const info = await pasta.info();
      const raw = await getNodeByPath('testeBanco', '/pasta');

      expect(info.ok).toBe(true);
      if (!info.ok || !raw.ok || !raw.data) throw new Error('setup failed');

      expect(info.path).toBe(raw.data.path);
      expect(info.createdAt).toBe(raw.data.createdAt);
      expect(info.updatedAt).toBe(raw.data.updatedAt);
    });

    it('must return info for root folder', async () => {
      const info = await root.info();
      const raw = await getNodeByPath('testeBanco', '/');

      expect(info.ok).toBe(true);
      if (!info.ok || !raw.ok || !raw.data) throw new Error('setup failed');

      expect(info.path).toBe('/');
      expect(info.createdAt).toBe(raw.data.createdAt);
      expect(info.updatedAt).toBe(raw.data.updatedAt);
    });

    it('must not expose parent or type', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      const info = await pasta.info();
      expect(info.ok).toBe(true);

      expect(info).not.toHaveProperty('parent');
      expect(info).not.toHaveProperty('type');
    });

    it('must reflect new path after rename', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');

      await pasta.rename({ name: 'renomeada' });

      const info = await pasta.info();
      expect(info.ok).toBe(true);
      if (!info.ok) throw new Error('setup failed');

      expect(info.path).toBe('/renomeada');
    });

    it('must reflect new path after move', async () => {
      const pasta = await root.newFolder({ name: 'pasta' });
      if (!(pasta instanceof ExplorerFolder)) throw new Error('setup failed');
      await root.newFolder({ name: 'destino' });
      const destino = await root.get({ name: 'destino' });
      if (!(destino instanceof ExplorerFolder)) throw new Error('setup failed');

      await pasta.move({ to: '/destino/pasta' });

      const info = await pasta.info();
      expect(info.ok).toBe(true);
      if (!info.ok) throw new Error('setup failed');

      expect(info.path).toBe('/destino/pasta');
    });
  });
});
