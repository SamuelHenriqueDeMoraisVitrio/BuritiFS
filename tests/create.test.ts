import { describe, expect, it } from "vitest"
import ExplorerTree from '../src/core/Explorer/ExplorerMain'

describe("NewExplorerTree", () => {

  describe("newFolder", () => {

    it("Must create a child folder", async () => {
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

  describe("newFile", () => {

    it("Must create a child file", async () => {
      const base = await ExplorerTree.create({ name: 'testeBanco' })
      if(base.ok === false){
        throw new Error(base.error);
      }
      const arquivo = await base.newFile('arquivo.txt')
      console.log(arquivo.error);
      expect(arquivo.ok).toBe(true)
      expect(arquivo.error).toBe(null)
    })

  })

})
