import assert from "node:assert/strict";
import test from "node:test";
import { createResourceConfigStore, resourceConfigStore, RESOURCE_PARTITIONS } from "../src/lib/resourceConfig.ts";
import { publishResources } from "../src/lib/resourceUploads.ts";
import { createTaskFieldStore, legacyTaskFields, snapshotTaskFields, taskFieldErrors } from "../src/lib/taskFieldConfig.ts";
import { createScriptTask } from "../src/lib/scriptTaskPublishing.ts";

for (const [scope, partition] of Object.entries(RESOURCE_PARTITIONS)) {
  test(`${scope}: renaming follows identity; occupied child and parent deletion are blocked`, () => {
    const store = createResourceConfigStore(), parent = store.categories(scope)[0], child = parent.children[0];
    const resource = { id: "sample", primaryCategory: parent.name, secondaryCategory: child.name };
    store.register(scope, [resource]); store.register(scope, [resource]);
    assert.equal(store.categoryUsage(scope, parent.id), 1);
    store.setCategories(prev => ({ ...prev, [partition]: prev[partition].map(n => n.id === parent.id ? { ...n, name: "秋季新品", children: n.children.map(c => c.id === child.id ? { ...c, name: "通勤实拍" } : c) } : n) }));
    assert.equal(store.project(scope, resource).primaryCategory, "秋季新品");
    assert.equal(store.project(scope, resource).secondaryCategory, "通勤实拍");
    assert.throws(() => store.setCategories(prev => ({ ...prev, [partition]: prev[partition].filter(n => n.id !== parent.id) })), /存在资源/);
    assert.throws(() => store.setCategories(prev => ({ ...prev, [partition]: prev[partition].map(n => n.id === parent.id ? { ...n, children: n.children.filter(c => c.id !== child.id) } : n) })), /存在资源/);
    store.removeResource(scope, resource.id); store.register(scope, [resource]);
    assert.equal(store.categoryUsage(scope, parent.id), 0);
    store.setCategories(prev => ({ ...prev, [partition]: prev[partition].filter(n => n.id !== parent.id) }));
    assert.ok(!store.categories(scope).some(n => n.id === parent.id));
  });
}

test("moving a resource updates usage counts; invalid secondary fails without changing assignment", () => {
  const store = createResourceConfigStore(), [first, second] = store.categories("finished");
  const resource = { id: "move", primaryCategory: first.name, secondaryCategory: first.children[0].name };
  store.register("finished", [resource]);
  assert.throws(() => store.assign("finished", resource, { primaryCategory: second.name, secondaryCategory: "不存在" }), /二级分类/);
  assert.equal(store.categoryUsage("finished", first.id), 1);
  store.assign("finished", resource, { primaryCategory: second.name, secondaryCategory: second.children[0].name });
  assert.equal(store.categoryUsage("finished", first.id), 0);
  assert.equal(store.categoryUsage("finished", second.id), 1);
  assert.equal(store.categoryValid("finished", second.name, "不存在"), false);
});

test("video status names, colors and weights update across their configured partitions", () => {
  const store = createResourceConfigStore(), status = store.getStatusCatalog("video").find(s => s.name === "审核通过")!;
  for (const scope of ["finished", "materials"]) store.register(scope, [{ id: "status", status: status.name }]);
  store.setStatusCatalog("video", prev => prev.map(s => s.id === status.id ? { ...s, name: "可投放", bgColor: "#123456", textColor: "#abcdef", weight: 100 } : s));
  for (const scope of ["finished", "materials"]) {
    assert.equal(store.project(scope, { id: "status", status: "审核通过" }).status, "可投放");
    assert.deepEqual(store.statusStyle(scope, "可投放"), { color: "#abcdef", backgroundColor: "#123456" });
    assert.equal(store.statuses(scope)[0].name, "可投放");
  }
  assert.ok(!store.statuses("materials").some(s => s.name === "已搭"));
  assert.ok(!store.statuses("finished").some(s => s.name === "画面利用"));
  assert.throws(() => store.setStatusCatalog("video", prev => prev.map(s => s.id === status.id ? { ...s, partitions: ["成片"] } : s)), /正在使用/);
});

test("in-use status deletion requires a compatible replacement and is atomic", () => {
  const store = createResourceConfigStore(), statuses = store.getStatusCatalog("video");
  const source = statuses.find(s => s.name === "审核通过")!, target = statuses.find(s => s.name === "已上机")!, incompatible = statuses.find(s => s.name === "已搭")!;
  for (const scope of ["finished", "materials"]) store.register(scope, [{ id: "same-id", status: source.name }]);
  assert.throws(() => store.deleteStatus("video", source.id), /替代状态/);
  assert.throws(() => store.deleteStatus("video", source.id, incompatible.id), /所有受影响/);
  assert.equal(store.statusUsage("video", source.id), 2);
  assert.ok(!store.replacementStatuses("video", source.id).some(s => s.id === incompatible.id));
  store.deleteStatus("video", source.id, target.id);
  assert.equal(store.statusUsage("video", target.id), 2);
  for (const scope of ["finished", "materials"]) assert.equal(store.project(scope, { id: "same-id", status: source.name }).status, target.name);
});

test("script defaults and disabled settings reset in a fresh visit", () => {
  const store = createResourceConfigStore(), target = store.getStatusCatalog("script")[1];
  store.setStatusCatalog("script", prev => prev.map(s => ({ ...s, isDefault: s.id === target.id })));
  assert.equal(store.defaultStatus("scripts"), target.name);
  assert.throws(() => store.deleteStatus("script", target.id), /默认值/);
  store.setSettings("script", { enabled: false, partitions: ["脚本"] });
  assert.equal(store.statusEnabled("scripts"), false);
  assert.equal(store.statusEnabled("finished"), true);
  assert.equal(createResourceConfigStore().statusEnabled("scripts"), true);
  assert.equal(createResourceConfigStore().defaultStatus("scripts"), "待审核");
});

test("task schemas validate types and preserve snapshots after configuration changes", () => {
  const store = createTaskFieldStore();
  assert.deepEqual(Object.keys(taskFieldErrors(store.getFields(), {})), ["tf-product"]);
  const snapshot = snapshotTaskFields(store.getFields(), { "tf-product": "抗衰精华液" });
  store.setFields([{ id: "custom", name: "拍摄地点", type: "文本", isRequired: true, options: [] }]);
  assert.equal(snapshot.fields[0].name, "产品");
  assert.equal(snapshot.values["tf-product"], "抗衰精华液");
  assert.deepEqual(Object.keys(taskFieldErrors(store.getFields(), {})), ["custom"]);
  const fields = [
    { id: "n", name: "预算", type: "数字", isRequired: false, options: [] },
    { id: "u", name: "链接", type: "链接", isRequired: false, options: [] },
    { id: "m", name: "平台", type: "多选", isRequired: true, options: ["抖音", "快手"] },
  ];
  assert.deepEqual(Object.keys(taskFieldErrors(fields, { n: "bad", u: "javascript:alert(1)", m: ["其他"] })), ["n", "u", "m"]);
  assert.deepEqual(taskFieldErrors(fields, { n: "0", u: "https://example.com", m: ["快手"] }), {});
  assert.equal(createTaskFieldStore().getFields()[0].name, "产品");
});

test("legacy values remain valid; script publishing captures the current fields and reference script", () => {
  const old = legacyTaskFields({ product: "历史商品", scriptType: "历史类型" });
  assert.deepEqual(taskFieldErrors(old.fields, old.values), {});
  const fields = createTaskFieldStore().getFields();
  const form = { assigneePath: "运营部 / 剪辑组 / 张三", orderCount: 2, deadlineDate: "2026-09-30", remark: "保留卖点", visibilityType: "none" as const, visibilityRange: "public" as const, specifiedTeam: "", specifiedGroup: "", specifiedPerson: "", publicDate: "" };
  const task = createScriptTask({ id: "script-1", title: "秋季通勤" }, form, fields, { "tf-product": "抗衰精华液" });
  assert.equal(task.associatedScript?.id, "script-1");
  assert.equal(task.assignee, "张三");
  assert.equal(task.status, "pending");
  assert.equal(task.product, "抗衰精华液");
  fields[0].name = "changed";
  assert.equal(task.customFields?.fields[0].name, "产品");
});

test("late-opened references resolve renamed catalog IDs; new assignments reject obsolete names", () => {
  const store = createResourceConfigStore(), parent = store.categories("scripts")[0], child = parent.children[0];
  store.setCategories(prev => ({ ...prev, 脚本: prev.脚本.map(n => n.id === parent.id ? { ...n, name: "新品脚本" } : n) }));
  store.setStatusCatalog("script", prev => prev.map(s => s.name === "待审核" ? { ...s, name: "待复核" } : s));
  store.register("scripts", [{ id: "late", primaryCategory: parent.name, secondaryCategory: child.name, status: "待审核" }]);
  const projected = store.project("scripts", { id: "late", status: "待审核", category: "", basicType: "" });
  assert.equal(projected.status, "待复核");
  assert.equal(projected.category, `新品脚本 / ${child.name}`);
  assert.equal(projected.basicType, projected.category);
  assert.throws(() => store.assign("scripts", { id: "late" }, { primaryCategory: parent.name, secondaryCategory: child.name }), /可用的分类/);
});

test("uploads for all five partitions use current categories and status defaults and protect occupied categories", () => {
  for (const [scope, partition] of Object.entries(RESOURCE_PARTITIONS)) {
    const parent = resourceConfigStore.categories(scope)[0], secondary = parent.children[0]?.name || "";
    const before = resourceConfigStore.categoryUsage(scope, parent.id);
    const result = publishResources({ partition, primaryCategory: parent.name, secondaryCategory: secondary, publicTags: [], personalTags: [], files: [{ name: "秋季商品展示", url: "blob:prototype" }] });
    assert.equal(result.resources[0].primaryCategory, parent.name);
    if (["finished", "materials", "scripts"].includes(scope)) assert.equal(result.resources[0].status, resourceConfigStore.defaultStatus(scope));
    assert.equal(resourceConfigStore.categoryUsage(scope, parent.id), before + 1);
    assert.throws(() => resourceConfigStore.setCategories(prev => ({ ...prev, [partition]: prev[partition].filter(n => n.id !== parent.id) })), /存在资源/);
    assert.throws(() => publishResources({ partition, primaryCategory: parent.name, secondaryCategory: "已删除分类", publicTags: [], personalTags: [], files: [{ name: "失效分类", url: "blob:prototype" }] }), /可用的一级分类和二级分类/);
    assert.equal(resourceConfigStore.categoryUsage(scope, parent.id), before + 1);
  }
});
