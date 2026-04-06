// @vitest-environment happy-dom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAction } from '../../src/react/useAction';

describe('useAction', () => {
  it('deve começar com loading false e error null', () => {
    const fn = vi.fn().mockResolvedValue({ ok: true, error: null });
    const { result } = renderHook(() => useAction(fn));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deve setar loading true durante a execução', async () => {
    let resolve: (value: { ok: boolean; error: null }) => void;
    const fn = vi.fn().mockReturnValue(new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useAction(fn));

    act(() => { result.current.run(); });

    expect(result.current.loading).toBe(true);

    await act(async () => { resolve!({ ok: true, error: null }); });

    expect(result.current.loading).toBe(false);
  });

  it('deve setar error quando a operação retorna ok false', async () => {
    const fn = vi.fn().mockResolvedValue({ ok: false, error: 'algo deu errado' });
    const { result } = renderHook(() => useAction(fn));

    await act(async () => { await result.current.run(); });

    expect(result.current.error).toBe('algo deu errado');
    expect(result.current.loading).toBe(false);
  });

  it('deve limpar error quando run é chamado novamente com sucesso', async () => {
    const fn = vi.fn()
      .mockResolvedValueOnce({ ok: false, error: 'falhou' })
      .mockResolvedValueOnce({ ok: true, error: null });
    const { result } = renderHook(() => useAction(fn));

    await act(async () => { await result.current.run(); });
    expect(result.current.error).toBe('falhou');

    await act(async () => { await result.current.run(); });
    expect(result.current.error).toBeNull();
  });

  it('deve setar error quando fn lança uma exceção', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('erro inesperado'));
    const { result } = renderHook(() => useAction(fn));

    await act(async () => { await result.current.run(); });

    expect(result.current.error).toBe('erro inesperado');
    expect(result.current.loading).toBe(false);
  });

  it('deve ignorar segunda chamada se já está loading', async () => {
    let resolve: (value: { ok: boolean; error: null }) => void;
    const fn = vi.fn().mockReturnValue(new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useAction(fn));

    act(() => { result.current.run(); });
    act(() => { result.current.run(); });

    expect(fn).toHaveBeenCalledTimes(1);

    await act(async () => { resolve!({ ok: true, error: null }); });
  });

  it('deve limpar loading e error com reset', async () => {
    const fn = vi.fn().mockResolvedValue({ ok: false, error: 'erro' });
    const { result } = renderHook(() => useAction(fn));

    await act(async () => { await result.current.run(); });
    expect(result.current.error).toBe('erro');

    act(() => { result.current.reset(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
