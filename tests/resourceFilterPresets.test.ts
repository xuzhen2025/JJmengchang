import assert from "node:assert/strict";
import test from "node:test";
import {
  AUDIO_PRESET_DEFAULTS, FILTER_PRESET_LIMIT, IMAGE_PRESET_DEFAULTS, SCRIPT_PRESET_DEFAULTS, VIDEO_PRESET_DEFAULTS,
  filterPresetStorageKey, normalizePresetFilters, readFilterPresets, removeFilterPreset, samePresetFilters, saveFilterPreset,
  type FilterPreset, type ResourcePresetScope,
} from "../src/lib/resourceFilterPresets.ts";

const defaults = { category: "all", tag: "", sort: "latest", startDate: "", endDate: "" };
const original: FilterPreset<typeof defaults>[] = [{ id: "one", name: "Original", filters: { ...defaults, tag: "kept" } }];

test("presets are isolated by member and each of the five resource pages", () => {
  const scopes: ResourcePresetScope[] = ["finished", "materials", "scripts", "images", "audio"];
  const keys = ["member-a", "member-b"].flatMap(member => scopes.map(scope => filterPresetStorageKey(member, scope)));
  assert.equal(new Set(keys).size, 10);
  assert.notEqual(filterPresetStorageKey("a:b", "images"), filterPresetStorageKey("a%3Ab", "images"));
});

test("an empty persisted collection stays empty instead of reseeding deleted presets", () => {
  const seeds = [{ name: "Example", filters: { tag: "seed" } }];
  assert.equal(readFilterPresets(null, defaults, seeds).length, 1);
  assert.deepEqual(readFilterPresets(JSON.stringify({ version: 1, presets: [] }), defaults, seeds), []);
});

test("saving requires a nonblank name and copies all filter values", () => {
  assert.equal(saveFilterPreset(original, "  ", defaults, "two").status, "empty-name");
  const filters = { ...defaults, category: "video", sort: "oldest", startDate: "2026-09-01", endDate: "2026-09-09" };
  const result = saveFilterPreset(original, "  New  ", filters, "two");
  assert.equal(result.status, "saved");
  if (result.status !== "saved") return;
  assert.equal(result.preset.name, "New");
  assert.deepEqual(result.preset.filters, filters);
  filters.tag = "later-change";
  assert.equal(result.preset.filters.tag, "");
  assert.equal(original.length, 1);
});

test("same-name save requests confirmation and leaves the original untouched", () => {
  const result = saveFilterPreset(original, " Original ", defaults, "two");
  assert.equal(result.status, "confirm-overwrite");
  assert.equal(original[0].filters.tag, "kept");
});

test("confirmed overwrite retains identity and does not add another record", () => {
  const result = saveFilterPreset(original, "Original", defaults, "unused", "one");
  assert.equal(result.status, "saved");
  if (result.status !== "saved") return;
  assert.equal(result.presets.length, 1);
  assert.equal(result.preset.id, "one");
  assert.equal(result.preset.filters.tag, "");
  assert.equal(original[0].filters.tag, "kept");
});

test("five is the limit for new names but not for confirmed overwrites", () => {
  const full = Array.from({ length: FILTER_PRESET_LIMIT }, (_, index) => ({ id: `${index}`, name: `Preset ${index}`, filters: defaults }));
  assert.equal(saveFilterPreset(full, "Sixth", defaults, "six").status, "limit");
  assert.equal(saveFilterPreset(full, "Preset 0", defaults, "six").status, "confirm-overwrite");
  const overwritten = saveFilterPreset(full, "Preset 0", { ...defaults, tag: "new" }, "six", "0");
  assert.equal(overwritten.status, "saved");
  if (overwritten.status === "saved") assert.equal(overwritten.presets.length, 5);
});

test("a stale overwrite confirmation cannot recreate or replace a different preset", () => {
  assert.equal(saveFilterPreset([], "Original", defaults, "new", "one").status, "missing");
  assert.equal(saveFilterPreset([{ ...original[0], id: "replacement" }], "Original", defaults, "new", "one").status, "missing");
});

test("deletion removes only its record, preserves filters, and releases a slot", () => {
  const full = Array.from({ length: 5 }, (_, index) => ({ id: `${index}`, name: `Preset ${index}`, filters: { ...defaults, tag: `${index}` } }));
  const currentFilters = { ...full[0].filters };
  const next = removeFilterPreset(full, "0");
  assert.equal(next.length, 4);
  assert.equal(full.length, 5);
  assert.equal(next[0], full[1]);
  assert.deepEqual(currentFilters, full[0].filters);
  assert.equal(saveFilterPreset(next, "New", defaults, "new").status, "saved");
});

test("storage round-trip restores all fields for every resource schema", () => {
  for (const schema of [VIDEO_PRESET_DEFAULTS, SCRIPT_PRESET_DEFAULTS, IMAGE_PRESET_DEFAULTS, AUDIO_PRESET_DEFAULTS]) {
    const fields = Object.fromEntries(Object.keys(schema).map(key => [key, `value-${key}`]));
    const raw = JSON.stringify({ version: 1, presets: [{ id: "saved", name: "Saved", filters: fields }] });
    assert.deepEqual(readFilterPresets(raw, schema)[0].filters, fields);
  }
});

test("snapshots exclude selection, pagination, and unknown data while filling missing fields", () => {
  const snapshot = normalizePresetFilters({ category: "changed", tag: "", sort: 8, currentPage: "3", selectedIds: ["resource"] }, defaults);
  assert.deepEqual(snapshot, { ...defaults, category: "changed" });
  assert.equal("currentPage" in snapshot, false);
  assert.equal("selectedIds" in snapshot, false);
});

test("legacy main-category conditions are discarded without losing other preset fields", () => {
  const schemas: Record<string, string>[] = [VIDEO_PRESET_DEFAULTS, SCRIPT_PRESET_DEFAULTS, IMAGE_PRESET_DEFAULTS, AUDIO_PRESET_DEFAULTS];
  for (const schema of schemas) {
    const retained = Object.fromEntries(Object.keys(schema).map(key => [key, `retained-${key}`]));
    const legacy = { ...retained, mainCat: "old-video", selectedMainCat: "old-script", selectedMainCategory: "old-audio" };
    const seeds = [{ name: "Legacy", filters: legacy }];
    const stored = JSON.stringify({ version: 1, presets: [{ id: "legacy", ...seeds[0] }] });
    assert.deepEqual(normalizePresetFilters(legacy, schema), retained);
    for (const presets of [readFilterPresets(stored, schema), readFilterPresets(null, schema, seeds)]) {
      assert.equal(presets[0].name, "Legacy");
      assert.deepEqual(presets[0].filters, retained);
      const saved = saveFilterPreset(presets, "Copy", presets[0].filters, "copy");
      assert.equal(saved.status, "saved");
      if (saved.status === "saved") {
        assert.deepEqual(readFilterPresets(JSON.stringify({ version: 1, presets: saved.presets }), schema), saved.presets);
        for (const preset of saved.presets) assert.deepEqual(preset.filters, retained);
      }
    }
  }
});

test("a legacy preset with only a main category now applies the unfiltered defaults", () => {
  for (const schema of [VIDEO_PRESET_DEFAULTS, SCRIPT_PRESET_DEFAULTS, AUDIO_PRESET_DEFAULTS]) {
    const raw = JSON.stringify({ version: 1, presets: [{
      id: "old", name: "Old", filters: { mainCat: "restrictive", selectedMainCat: "restrictive", selectedMainCategory: "restrictive" },
    }] });
    assert.deepEqual(readFilterPresets(raw, schema)[0].filters, schema);
  }
});

test("corrupt storage is reported instead of silently replacing existing data", () => {
  for (const raw of ["broken-json", "null", "{}", '{"version":2,"presets":[]}', JSON.stringify({ version: 1, presets: [original[0], original[0]] })]) {
    assert.throws(() => readFilterPresets(raw, defaults));
  }
});

test("preset matching ignores property order and notices changed or missing fields", () => {
  assert.equal(samePresetFilters({ a: "one", b: "two" }, { b: "two", a: "one" }), true);
  assert.equal(samePresetFilters({ a: "one", b: "two" }, { a: "one" }), false);
  assert.equal(samePresetFilters({ a: "one" }, { a: "two" }), false);
});
