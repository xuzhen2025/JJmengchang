import test from "node:test";
import assert from "node:assert/strict";
import { applicablePublicTagGroups, createResourceTagStore } from "../src/lib/resourceTags";

test("tag groups use the most specific configured category level", () => {
  const groups = createResourceTagStore().getPublicGroups().slice(0, 4).map((group, index) => ({
    ...group,
    categories: [
      ["成片"],
      ["成片", "美妆护肤"],
      ["成片", "美妆护肤", "护肤精华"],
      ["成片", "服饰内衣", "女士内衣"],
    ][index],
  }));
  const categories = [
    { name: "美妆护肤", children: [{ name: "护肤精华" }, { name: "洁面" }] },
    { name: "服饰内衣", children: [{ name: "女士内衣" }] },
  ];

  assert.deepEqual(applicablePublicTagGroups(groups, categories, "").map((group) => group.id), []);
  assert.deepEqual(applicablePublicTagGroups(groups, categories, "美妆护肤 / 护肤精华").map((group) => group.id), groups.slice(0, 3).map((group) => group.id));
  assert.deepEqual(applicablePublicTagGroups(groups, categories, "美妆护肤 / 洁面").map((group) => group.id), groups.slice(0, 2).map((group) => group.id));
  assert.deepEqual(applicablePublicTagGroups(groups, categories, "服饰内衣 / 女士内衣").map((group) => group.id), [groups[0].id, groups[3].id]);
});

test("public names and group names update on every linked resource", () => {
  const store = createResourceTagStore();
  const group = store.getPublicGroups()[0];
  const tag = group.subTags[0];
  const resource = { id: "one", tags: [tag.name] };
  store.register("finished", [resource]);
  store.assign("images", { id: "two" }, "public", [tag.name]);
  store.setPublicGroups((groups) => groups.map((item) => item.id === group.id ? {
    ...item, name: "Renamed group", subTags: item.subTags.map((item) => item.id === tag.id ? { ...item, name: "Renamed tag" } : item),
  } : item));
  assert.deepEqual(store.project("finished", resource).publicTags, ["Renamed tag"]);
  assert.deepEqual(store.project("images", { id: "two" }).publicTags, ["Renamed tag"]);
  assert.equal(store.entries("public").find((item) => item.id === tag.id)?.groupName, "Renamed group");
});

test("deleting public tags unlinks seeded and explicit assignments without deleting resources", () => {
  const store = createResourceTagStore();
  const group = store.getPublicGroups()[0];
  const tag = group.subTags[0];
  const first = { id: "one", title: "Original", tags: [tag.name] };
  store.register("finished", [first]);
  store.assign("images", { id: "two" }, "public", [tag.name]);
  store.setPublicGroups((groups) => groups.map((item) => ({ ...item, subTags: item.subTags.filter((item) => item.id !== tag.id) })));
  assert.deepEqual(store.project("finished", first).publicTags, []);
  assert.deepEqual(store.project("images", { id: "two" }).publicTags, []);
  assert.equal(store.project("finished", first).title, "Original");
  store.setPublicGroups((groups) => groups.map((item) => item.id === group.id ? { ...item, subTags: [...item.subTags, { id: "new-id", name: tag.name }] } : item));
  assert.deepEqual(store.project("finished", first).publicTags, []);
  assert.deepEqual(store.project("images", { id: "two" }).publicTags, []);
  store.assign("finished", first, "public", [tag.name]);
  assert.deepEqual(store.project("finished", first).publicTags, [tag.name]);
});

test("deleting a public group clears its tags but leaves other groups' tags", () => {
  const store = createResourceTagStore();
  const [first, second] = store.getPublicGroups();
  const resource = { id: "one" };
  store.assign("finished", resource, "public", [first.subTags[0].name, second.subTags[0].name]);
  store.setPublicGroups((groups) => groups.filter((group) => group.id !== first.id));
  assert.deepEqual(store.project("finished", resource).publicTags, [second.subTags[0].name]);
});

test("admin applicability, required and single-choice settings do not constrain consumers", () => {
  const store = createResourceTagStore();
  const group = store.getPublicGroups()[0];
  store.setPublicGroups((groups) => groups.map((item) => ({ ...item, rule: "single", categories: [], requiredCategories: ["any"] })));
  const names = group.subTags.slice(0, 2).map((tag) => tag.name);
  store.assign("audio", { id: "one" }, "public", names);
  assert.deepEqual(store.project("audio", { id: "one" }).publicTags, names);
  store.assign("audio", { id: "one" }, "public", []);
  assert.deepEqual(store.project("audio", { id: "one" }).publicTags, []);
});

test("resource scope and personal owner prevent collisions", () => {
  const store = createResourceTagStore();
  const tag = store.getPersonalTags()[0];
  store.assign("finished", { id: "shared" }, "personal", [tag.name]);
  assert.deepEqual(store.project("materials", { id: "shared" }).personalTags, []);
  store.setOwner("another-user");
  assert.deepEqual(store.project("finished", { id: "shared" }).personalTags, []);
  store.setPersonalTags(store.getPersonalTags().map((item) => item.id === tag.id ? { ...item, name: "Other user label" } : item));
  store.setOwner("chaojiguanliyuan");
  assert.deepEqual(store.project("finished", { id: "shared" }).personalTags, [tag.name]);
});

test("personal rename, unlink and counts are shared and deduplicated", () => {
  const store = createResourceTagStore();
  const tag = store.getPersonalTags()[0];
  const resource = { id: "one" };
  store.assign("finished", resource, "personal", [tag.name, tag.name]);
  store.assign("finished", resource, "personal", [tag.name]);
  store.assign("materials", resource, "personal", [tag.name]);
  assert.equal(store.getPersonalTags()[0].resourceIds.length, 2);
  store.setPersonalTags(store.getPersonalTags().map((item) => item.id === tag.id ? { ...item, name: "Renamed personal" } : item));
  assert.deepEqual(store.project("finished", resource).personalTags, ["Renamed personal"]);
  store.assign("finished", resource, "personal", []);
  assert.equal(store.getPersonalTags()[0].resourceIds.length, 1);
  store.setPersonalTags(store.getPersonalTags().filter((item) => item.id !== tag.id));
  assert.deepEqual(store.project("materials", resource).personalTags, []);
});

test("personal group deletion unlinks resources and cannot revive old IDs", () => {
  const store = createResourceTagStore();
  const group = store.getPersonalGroups()[0];
  const tag = store.getPersonalTags().find((item) => group.tagIds.includes(item.id))!;
  const resource = { id: "one", personalTags: [tag.name] };
  store.register("images", [resource]);
  store.setPersonalGroups(store.getPersonalGroups().filter((item) => item.id !== group.id));
  assert.deepEqual(store.project("images", resource).personalTags, []);
});

test("duplicate names in separate groups are selected by their qualified label", () => {
  const store = createResourceTagStore();
  const group = store.getPublicGroups()[0];
  store.setPublicGroups((groups) => [...groups, { ...group, id: "another-group", name: "Another group", subTags: [{ id: "another-tag", name: group.subTags[0].name }] }]);
  const label = `Another group: ${group.subTags[0].name}`;
  store.assign("images", { id: "one" }, "public", [label]);
  assert.deepEqual(store.getIds("images", { id: "one" }, "public"), ["another-tag"]);
});

test("a new visit starts with examples, not the prior visit's edits", () => {
  const first = createResourceTagStore();
  first.setPublicGroups([]);
  first.setPersonalGroups([]);
  const fresh = createResourceTagStore();
  assert.ok(fresh.getPublicGroups().length > 0);
  assert.ok(fresh.getPersonalGroups().length > 0);
});

test("removed resource is no longer counted in personal tags", () => {
  const store = createResourceTagStore();
  const tag = store.getPersonalTags()[0];
  store.assign("images", { id: "one" }, "personal", [tag.name]);
  store.removeResource("images", "one");
  assert.equal(store.getPersonalTags()[0].resourceIds.length, 0);
});
