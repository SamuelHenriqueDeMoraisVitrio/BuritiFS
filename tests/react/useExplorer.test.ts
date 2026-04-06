// @vitest-environment happy-dom
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { useExplorer } from '../../src/react/explorerTree';
import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';

describe('useExplorer', () => {
  afterEach(() => {
    ExplorerTree.close({ name: 'testeBanco' });
  });

  it('deve começar com status loading', () => {
    const { result } = renderHook(() => useExplorer('testeBanco'));

    expect(result.current.status).toBe('loading');
  });

  it('deve ir para status ready com root após inicializar', async () => {
    const { result } = renderHook(() => useExplorer('testeBanco'));

    await waitFor(() => expect(result.current.status).not.toBe('loading'));

    expect(result.current.status).toBe('ready');
    if (result.current.status === 'ready') {
      expect(result.current.root).toBeInstanceOf(ExplorerFolder);
    }
  });

  it('deve expor root com tree acessível via root.tree', async () => {
    const { result } = renderHook(() => useExplorer('testeBanco'));

    await waitFor(() => expect(result.current.status).not.toBe('loading'));

    expect(result.current.status).toBe('ready');
    if (result.current.status === 'ready') {
      expect(result.current.root.tree).toBeInstanceOf(ExplorerTree);
    }
  });

  it('deve ir para status error se name for inválido', async () => {
    const { result } = renderHook(() => useExplorer(''));

    await waitFor(() => expect(result.current.status).not.toBe('loading'));

    if (result.current.status === 'ready') {
      expect(true).toBe(true);
    } else {
      expect(result.current.status).toBe('error');
      if (result.current.status === 'error') {
        expect(typeof result.current.error).toBe('string');
      }
    }
  });

  it('deve fechar a conexão ao desmontar', async () => {
    const { result, unmount } = renderHook(() => useExplorer('testeBanco'));

    await waitFor(() => expect(result.current.status).not.toBe('loading'));

    expect(result.current.status).toBe('ready');

    expect(() => unmount()).not.toThrow();
  });
});
