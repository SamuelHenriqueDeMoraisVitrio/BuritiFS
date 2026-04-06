// @vitest-environment happy-dom
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { useFolder } from '../../src/react/useFolder';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';
import { createTreeAndRoot } from '../helpers/fixtures';

describe('useFolder', () => {
  let root: ExplorerFolder;

  beforeEach(async () => {
    ({ root } = await createTreeAndRoot());
  });

  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  it('deve começar com loading true e items vazio', () => {
    const { result } = renderHook(() => useFolder(root));

    expect(result.current.loading).toBe(true);
    expect(result.current.items.length).toBe(0);
  });

  it('deve listar items após carregar', async () => {
    await root.newFile({ name: 'arquivo.txt' });

    const { result } = renderHook(() => useFolder(root));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items.length).toBe(1);
  });

  it('deve atualizar items quando arquivo é criado', async () => {
    const { result } = renderHook(() => useFolder(root));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await root.newFile({ name: 'novo.txt' });
    });

    await waitFor(() => expect(result.current.items.length).toBe(1));
  });

  it('deve atualizar items quando arquivo é deletado', async () => {
    const fileResult = await root.newFile({ name: 'para-deletar.txt' });

    const { result } = renderHook(() => useFolder(root));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      if (fileResult.ok) {
        await fileResult.delete();
      }
    });

    await waitFor(() => expect(result.current.items.length).toBe(0));
  });

  it('deve retornar error null quando pasta existe', async () => {
    const { result } = renderHook(() => useFolder(root));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
  });
});
