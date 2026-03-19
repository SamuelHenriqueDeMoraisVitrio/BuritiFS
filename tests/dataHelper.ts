// =============================================================================
// dataHelper.ts — Utilitários de inspeção direta do IndexedDB para testes
// Totalmente independente da lib. Acesso raw ao banco via IDBFactory.
// =============================================================================

const STORE_NAME = 'nodes';

// ─── Tipos espelhados da lib ──────────────────────────────────────────────────

interface DBNodeBase {
  path: string;
  parent: string | null;
  createdAt: number;
  updatedAt: number;
}

interface DBFolder extends DBNodeBase {
  type: 'folder';
}

interface DBFile extends DBNodeBase {
  type: 'file';
  extension?: string;
}

type DBNode = DBFolder | DBFile;

// ─── Resultado padronizado ────────────────────────────────────────────────────

type HelperResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ─── Utilitário interno: abre conexão raw ─────────────────────────────────────

function openRaw(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    // Não define onupgradeneeded — se o banco não existe, falha propositalmente
  });
}

function wrap<T>(fn: () => Promise<T>): Promise<HelperResult<T>> {
  return fn()
    .then((data) => ({ ok: true as const, data }))
    .catch((err) => ({ ok: false as const, error: String(err?.message ?? err) }));
}

// =============================================================================
// 1. STATUS DO BANCO
// =============================================================================

/**
 * Verifica se o banco existe e consegue ser aberto.
 * Retorna false se o banco não existir ou estiver inacessível.
 */
export async function isDbOpen(dbName: string): Promise<boolean> {
  try {
    const db = await openRaw(dbName);
    db.close();
    return true;
  } catch {
    return false;
  }
}

/**
 * Tenta abrir o banco e verifica se a store "nodes" está presente.
 * Útil para garantir que o schema foi criado corretamente.
 */
export async function isDbReady(dbName: string): Promise<boolean> {
  try {
    const db = await openRaw(dbName);
    const has = db.objectStoreNames.contains(STORE_NAME);
    db.close();
    return has;
  } catch {
    return false;
  }
}

// =============================================================================
// 2. METADADOS DO BANCO
// =============================================================================

interface DbMetadata {
  name: string;
  version: number;
  stores: string[];
  indexes: Record<string, string[]>;
}

/**
 * Retorna metadados do banco: versão, stores e índices de cada store.
 */
export async function getDbMetadata(dbName: string): Promise<HelperResult<DbMetadata>> {
  return wrap(async () => {
    const db = await openRaw(dbName);
    const stores = Array.from(db.objectStoreNames);
    const indexes: Record<string, string[]> = {};

    const tx = db.transaction(stores, 'readonly');
    for (const storeName of stores) {
      const store = tx.objectStore(storeName);
      indexes[storeName] = Array.from(store.indexNames);
    }

    const metadata: DbMetadata = {
      name: dbName,
      version: db.version,
      stores,
      indexes,
    };

    db.close();
    return metadata;
  });
}

// =============================================================================
// 3. CONSULTAS DE REGISTROS
// =============================================================================

/**
 * Retorna todos os registros da store "nodes".
 */
export async function getAllNodes(dbName: string): Promise<HelperResult<DBNode[]>> {
  return wrap(async () => {
    const db = await openRaw(dbName);
    return new Promise<DBNode[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => { db.close(); resolve(req.result as DBNode[]); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  });
}

/**
 * Busca um registro específico pela chave primária (path).
 */
export async function getNodeByPath(dbName: string, path: string): Promise<HelperResult<DBNode | undefined>> {
  return wrap(async () => {
    const db = await openRaw(dbName);
    return new Promise<DBNode | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(path);
      req.onsuccess = () => { db.close(); resolve(req.result as DBNode | undefined); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  });
}

/**
 * Verifica se um path existe na store (independente de tipo).
 */
export async function nodeExists(dbName: string, path: string): Promise<boolean> {
  const result = await getNodeByPath(dbName, path);
  return result.ok && result.data !== undefined;
}

/**
 * Verifica se um path existe e é do tipo especificado.
 */
export async function nodeExistsAs(
  dbName: string,
  path: string,
  type: 'file' | 'folder'
): Promise<boolean> {
  const result = await getNodeByPath(dbName, path);
  return result.ok && result.data !== undefined && result.data.type === type;
}

// =============================================================================
// 4. CONSULTAS POR ÍNDICE
// =============================================================================

/**
 * Retorna todos os nós de um tipo específico ('file' ou 'folder').
 */
export async function getNodesByType(
  dbName: string,
  type: 'file' | 'folder'
): Promise<HelperResult<DBNode[]>> {
  return wrap(async () => {
    const db = await openRaw(dbName);
    return new Promise<DBNode[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const index = tx.objectStore(STORE_NAME).index('type');
      const req = index.getAll(type);
      req.onsuccess = () => { db.close(); resolve(req.result as DBNode[]); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  });
}

/**
 * Retorna os filhos diretos de um parent (pelo índice "parent").
 */
export async function getChildren(
  dbName: string,
  parentPath: string | null
): Promise<HelperResult<DBNode[]>> {
  return wrap(async () => {
    const db = await openRaw(dbName);
    return new Promise<DBNode[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const index = tx.objectStore(STORE_NAME).index('parent');
      const req = index.getAll(parentPath);
      req.onsuccess = () => { db.close(); resolve(req.result as DBNode[]); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  });
}

/**
 * Retorna todos os arquivos com uma extensão específica (ex: 'txt', 'json').
 */
export async function getFilesByExtension(
  dbName: string,
  extension: string
): Promise<HelperResult<DBFile[]>> {
  return wrap(async () => {
    const db = await openRaw(dbName);
    return new Promise<DBFile[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const index = tx.objectStore(STORE_NAME).index('extension');
      const req = index.getAll(extension);
      req.onsuccess = () => { db.close(); resolve(req.result as DBFile[]); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  });
}

// =============================================================================
// 5. CONTAGENS
// =============================================================================

/**
 * Conta o total de registros na store.
 */
export async function countNodes(dbName: string): Promise<HelperResult<number>> {
  return wrap(async () => {
    const db = await openRaw(dbName);
    return new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).count();
      req.onsuccess = () => { db.close(); resolve(req.result); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  });
}

/**
 * Conta registros por tipo.
 */
export async function countByType(
  dbName: string,
  type: 'file' | 'folder'
): Promise<HelperResult<number>> {
  return wrap(async () => {
    const db = await openRaw(dbName);
    return new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const index = tx.objectStore(STORE_NAME).index('type');
      const req = index.count(type);
      req.onsuccess = () => { db.close(); resolve(req.result); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  });
}

/**
 * Conta filhos diretos de um parent.
 */
export async function countChildren(
  dbName: string,
  parentPath: string | null
): Promise<HelperResult<number>> {
  return wrap(async () => {
    const db = await openRaw(dbName);
    return new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const index = tx.objectStore(STORE_NAME).index('parent');
      const req = index.count(parentPath);
      req.onsuccess = () => { db.close(); resolve(req.result); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  });
}

// =============================================================================
// 6. INTEGRIDADE / VALIDAÇÕES ÚTEIS PARA TESTES
// =============================================================================

/**
 * Verifica se um nó tem timestamps válidos (createdAt e updatedAt > 0).
 */
export async function hasValidTimestamps(
  dbName: string,
  path: string
): Promise<boolean> {
  const result = await getNodeByPath(dbName, path);
  if (!result.ok || !result.data) return false;
  const { createdAt, updatedAt } = result.data;
  return createdAt > 0 && updatedAt > 0;
}

/**
 * Verifica se updatedAt >= createdAt (ordem cronológica consistente).
 */
export async function hasConsistentTimestamps(
  dbName: string,
  path: string
): Promise<boolean> {
  const result = await getNodeByPath(dbName, path);
  if (!result.ok || !result.data) return false;
  return result.data.updatedAt >= result.data.createdAt;
}

/**
 * Verifica se o parent de um nó existe no banco (sem referências órfãs).
 */
export async function hasValidParent(
  dbName: string,
  path: string
): Promise<boolean> {
  const result = await getNodeByPath(dbName, path);
  if (!result.ok || !result.data) return false;

  // Root node: parent null é válido
  if (result.data.parent === null) return true;

  return nodeExists(dbName, result.data.parent);
}

/**
 * Verifica a integridade de todos os nós: sem orphans, timestamps válidos.
 * Retorna lista de paths com problemas (vazia = tudo ok).
 */
export async function checkIntegrity(dbName: string): Promise<string[]> {
  const allResult = await getAllNodes(dbName);
  if (!allResult.ok) return [`[DB ERROR] ${allResult.error}`];

  const problems: string[] = [];
  const pathSet = new Set(allResult.data.map((n) => n.path));

  for (const node of allResult.data) {
    if (node.createdAt <= 0 || node.updatedAt <= 0) {
      problems.push(`${node.path}: timestamps inválidos`);
    }
    if (node.updatedAt < node.createdAt) {
      problems.push(`${node.path}: updatedAt < createdAt`);
    }
    if (node.parent !== null && !pathSet.has(node.parent)) {
      problems.push(`${node.path}: parent "${node.parent}" não existe (órfão)`);
    }
  }

  return problems;
}

// =============================================================================
// 7. DEBUG / DX
// =============================================================================

/**
 * Imprime no console um snapshot do banco formatado — útil durante dev.
 * Não usar em assertions, só para inspeção manual.
 */
export async function debugSnapshot(dbName: string): Promise<void> {
  const all = await getAllNodes(dbName);
  const meta = await getDbMetadata(dbName);

  console.group(`[dataHelper] Snapshot: ${dbName}`);

  if (meta.ok) {
    console.log('Versão:', meta.data.version);
    console.log('Stores:', meta.data.stores);
    console.log('Índices:', meta.data.indexes);
  }

  if (all.ok) {
    console.log(`Total de nós: ${all.data.length}`);
    const folders = all.data.filter((n) => n.type === 'folder');
    const files = all.data.filter((n) => n.type === 'file');
    console.log(`  Pastas (${folders.length}):`, folders.map((f) => f.path));
    console.log(`  Arquivos (${files.length}):`, files.map((f) => f.path));
  } else {
    console.warn('Erro ao ler nós:', all.error);
  }

  console.groupEnd();
}
