


export default function validatePath(obj: { path: string }): string | null {
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




