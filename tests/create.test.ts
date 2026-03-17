import { describe, expect, it } from "vitest"
import ExplorerTree from '../src/core/Explorer/ExplorerMain'

describe("ExplorerTree", () => {

  describe("newFolder", () => {

    it("deve inicializar o banco corretamente", async () => {
      const base = await ExplorerTree.create({ name: 'testeBanco' })
      expect(base.ok).toBe(true)
      expect(base.error).toBe(null)
    })

    it("deve criar uma pasta filha", async () => {
      const base = await ExplorerTree.create({ name: 'testeBanco' })
      if(base.ok === false){
        throw new Error(base.error);
      }
      const pastaFilho = await base.newFolder('pastaFilho')
      console.log(pastaFilho.error);
      expect(pastaFilho.ok).toBe(true)
      expect(pastaFilho.error).toBe(null)
    })

  })

})
