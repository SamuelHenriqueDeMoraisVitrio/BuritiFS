import ExplorerTree from '../../src/core/Explorer/ExplorerMain';
import ExplorerFolder from '../../src/core/Explorer/folder';

export async function createTreeAndRoot() {
  const result = await ExplorerTree.create({ name: 'testeBanco' });
  if (!(result instanceof ExplorerTree)) throw new Error(result.error);

  const rootResult = await result.source({path: '/'});
  if (rootResult.ok === false) throw new Error(rootResult.error);
  if (!(rootResult instanceof ExplorerFolder)) throw new Error('Expected a folder');

  return { tree: result, root: rootResult };
}
