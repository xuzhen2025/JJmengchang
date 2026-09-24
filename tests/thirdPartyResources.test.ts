import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { createResourceConfigStore, resourceConfigStore } from "../src/lib/resourceConfig.ts";
import { getUploadedResources, publishResources, resourceScope } from "../src/lib/resourceUploads.ts";
import { toPublishedVideo } from "../src/lib/publishedVideo.ts";
import { INITIAL_THIRD_PARTY } from "../src/data/thirdPartyVideos.ts";

test("third-party categories start like materials but have isolated identities and edits", () => {
  const store = createResourceConfigStore();
  const materials = store.categories("materials"), third = store.categories("thirdParty");
  assert.deepEqual(third.map(n => [n.name, n.children.map(c => c.name)]), materials.map(n => [n.name, n.children.map(c => c.name)]));
  assert.notEqual(third[0].id, materials[0].id);
  assert.notEqual(third[0].children[0].id, materials[0].children[0].id);
  store.setCategories(prev => ({ ...prev, 第三方: prev.第三方.map((node, i) => i === 0 ? { ...node, name: "合作供片" } : node) }));
  assert.equal(store.categories("thirdParty")[0].name, "合作供片");
  assert.equal(store.categories("materials")[0].name, materials[0].name);
  assert.deepEqual(store.statuses("thirdParty").map(s => s.name), store.statuses("materials").map(s => s.name));
});

test("third-party fixtures are classified, locally playable, and protect their categories", () => {
  assert.ok(INITIAL_THIRD_PARTY.length >= 6);
  for (const video of INITIAL_THIRD_PARTY) {
    const [primary, secondary] = video.category!.split(" / ");
    assert.ok(resourceConfigStore.categoryValid("thirdParty", primary, secondary));
    assert.ok(existsSync(new URL(`../public/${video.videoUrl}`, import.meta.url)));
    assert.ok(existsSync(new URL(`../public/${video.coverUrl}`, import.meta.url)));
    const parent = resourceConfigStore.categories("thirdParty").find(n => n.name === primary)!;
    assert.ok(resourceConfigStore.categoryUsage("thirdParty", parent.id) > 0);
    assert.throws(() => resourceConfigStore.setCategories(prev => ({ ...prev, 第三方: prev.第三方.filter(n => n.id !== parent.id) })), /存在资源/);
  }
});

test("third-party upload registers only its own partition with material-compatible status", () => {
  const parent = resourceConfigStore.categories("thirdParty")[0];
  const materialParent = resourceConfigStore.categories("materials")[0];
  const before = resourceConfigStore.categoryUsage("materials", materialParent.id);
  const { resources: [resource] } = publishResources({
    partition: "第三方", primaryCategory: parent.name, secondaryCategory: parent.children[0].name,
    publicTags: [], personalTags: [], files: [{ name: "品牌供片.mp4", url: "blob:third-party", size: 1024 }],
  });
  assert.equal(resourceScope(resource), "thirdParty");
  assert.equal(resource.resourceCategory, "第三方");
  assert.equal(resource.type, "video");
  assert.equal(resource.status, resourceConfigStore.defaultStatus("thirdParty"));
  assert.equal(resourceConfigStore.categoryUsage("materials", materialParent.id), before);
  assert.ok(getUploadedResources().includes(resource));
  assert.equal(toPublishedVideo(resource).typeLabel, "第三方");
  assert.equal(toPublishedVideo(resource).creator, "human");
  resourceConfigStore.assign("thirdParty", resource, { status: "画面利用" });
  assert.equal(resourceConfigStore.project("thirdParty", resource).status, "画面利用");
  assert.throws(() => resourceConfigStore.assign("thirdParty", resource, { status: "已搭" }));
});
