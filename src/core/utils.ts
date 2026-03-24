


export function validatePath(obj: { path: string }): string | null {
  // Sanitize
  if (!obj.path.startsWith("/")) obj.path = `/${obj.path}`;
  if (obj.path.endsWith("/") && obj.path !== '/') obj.path = obj.path.slice(0, -1);
  // Validate
  if (obj.path.trim() === "") return 'Path cannot be empty';
  if (obj.path.includes("//")) return 'Path cannot contain "//"';
  if (obj.path.endsWith("/") && obj.path !== "/") return 'Path cannot end with "/"';
  if (obj.path.includes(' ')) return 'Path cannot contain spaces';
  return null
}

export function validatePath2(oldPath: string):{newPath:string, error:string|null} {
  // Sanitize
  let path = oldPath;
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.endsWith("/") && path !== '/') path = path.slice(0, -1);
  // Validate
  if (path.trim() === "") return { newPath: oldPath, error: 'Path cannot be empty' };
  if (path.includes("//")) return { newPath: oldPath, error: 'Path cannot contain "//"' };
  if (path.endsWith("/") && path !== "/") return { newPath: oldPath, error: 'Path cannot end with "/"' };
  if (path.includes(' ')) return { newPath: oldPath, error: 'Path cannot contain spaces' };
  return { newPath: path, error: null };
}


/*
export async function runAction<S extends object, E extends object>(
  props: { action: () => Promise<S | void>; free?: () => E | void }
): Promise<S & { ok: true; error: null } | E & { ok: false; error: string }> {
  try {
    const responseSucess = (await props.action()) ?? {} as S;
    return { ...responseSucess, ok: true, error: null } as S & { ok: true; error: null };
  } catch (e) {
    const responseError = (props.free?.() ?? {}) as E;
    return { ...responseError, ok: false, error: e instanceof Error ? e.message : String(e) } as E & { ok: false; error: string };
  }
}
*/








