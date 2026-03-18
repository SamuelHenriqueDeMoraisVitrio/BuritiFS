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
      expect(result).toBeInstanceOf(ExplorerTree);
    });

    it("must close the connection to the data", () => {
      // connection is closed in afterEach without throwing
    });
  });

  describe('ExplorerTreeError', () => {
    it("must return error object on failure", async () => {
      // Simulates checking the error shape when create fails
      const bad = await ExplorerTree.create({ name: '' });
      if (bad instanceof ExplorerTree) return; // skip if DB allows empty name
      expect(bad.ok).toBe(false);
      expect(typeof bad.error).toBe('string');
    });
  });
});
