import { describe, expect, it } from "vitest";
import ExplorerTree from "../src/core/Explorer/ExplorerMain";




describe('ExplorerTree', () => {

  it("Must building a class ExplorerTree", async () => {
    const base = await ExplorerTree.create({ name: 'testeBanco' })
    expect(base.ok).toBe(true)
    expect(base.error).toBe(null)
  });

  it("must close the connection to the data", async () => {
    const base = await ExplorerTree.create({ name: 'testeBanco' })
    if(base.ok === false){
      throw new Error(base.error);
    }
    ExplorerTree.close('testeBanco');
  });

});

