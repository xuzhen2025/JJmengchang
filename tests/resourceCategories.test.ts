import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL_CATEGORIES } from "../src/data/resourceCategories.ts";

test("all six resource types retain independent lower-level category IDs", () => {
  const expected = [
    ["\u6210\u7247", ["sp1-c1", "sp1-c2", "sp2-c1", "sp2-c2", "sp3-c1", "sp4-c1"], 15],
    ["\u811a\u672c", ["scr1-c1", "scr1-c2", "scr2-c1", "scr3-c1"], 9],
    ["\u97f3\u9891", ["aud1-c1", "aud1-c2", "aud2-c1", "aud2-c2", "aud3-c1"], 11],
    ["\u7d20\u6750", ["mat-c1", "mat-c2", "mat-c3"], 8],
    ["\u56fe\u7247", ["img-c1", "img-c2", "img-c3"], 7],
    ["\u7b2c\u4e09\u65b9", ["third-mat-c1", "third-mat-c2", "third-mat-c3"], 8],
  ] as const;
  assert.equal(Object.keys(INITIAL_CATEGORIES).length, expected.length);
  for (const [type, primaryIds, secondaryCount] of expected) {
    const list = INITIAL_CATEGORIES[type];
    assert.deepEqual(list.slice(0, primaryIds.length).map(node => node.id), primaryIds);
    assert.ok(list.flatMap(node => node.children).length >= secondaryCount);
    for (const parent of list.filter(node => primaryIds.includes(node.id as never))) {
      assert.ok(parent.children.some(child => child.id === `${parent.id}-1`));
    }
  }
});

test("resource categories contain exactly two levels with unique identities", () => {
  const ids: string[] = [];
  for (const list of Object.values(INITIAL_CATEGORIES)) {
    for (const parent of list) {
      assert.deepEqual(Object.keys(parent).sort(), ["children", "id", "name"]);
      assert.ok(parent.name.trim());
      ids.push(parent.id);
      for (const child of parent.children) {
        assert.deepEqual(Object.keys(child).sort(), ["id", "name"]);
        assert.ok(child.name.trim());
        ids.push(child.id);
      }
    }
  }
  assert.ok(ids.length >= 71);
  assert.equal(new Set(ids).size, ids.length);
});
