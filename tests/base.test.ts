import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ExplorerTree from "../src/core/Explorer/ExplorerMain";

describe('ExplorerTree', () => {
  let result: Awaited<ReturnType<typeof ExplorerTree.create>>;

  beforeEach(async () => {
    result = await ExplorerTree.create({ name: 'testeBanco' });
  });

  afterEach(() => {
    ExplorerTree.close('testeBanco');
  });

  describe('ExplorerTreeSucess', () => {
    it("Must building a class ExplorerTree", () => {
      expect(result.ok).toBe(true);
      expect(result.error).toBe(null);
    });

    it("must close the connection to the data", () => {
      if (result.ok === false) throw new Error(result.error);
      // connection is closed in afterEach without throwing
    });
  });
});
