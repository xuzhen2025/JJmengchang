import assert from "node:assert/strict";
import test from "node:test";
import { createAdStore, type AdActor } from "../src/lib/adPush";
import { INTERACTION_CHANNELS, createVideoInteractionDemoRecords, selectVideoInteractionTrend } from "../src/lib/videoInteraction";

const actor: AdActor = { id: "chaojiguanliyuan", name: "徐振", team: "电商事业部", group: "千川第一组", categories: ["千川引流"], permissions: [] };
const video = { id: "fv1", title: "复古耳环动态奢感视频.mp4", syncStatus: "synced", cost: 12685.39 };
const point = { second: 0, secondLabel: "0s", clicks: 8900, losses: 1650000, follows: 120, comments: 45, likes: 320, ctr: 8.5, lossRate: 78.2 };

test("interaction channels match the five reference options", () => {
  assert.deepEqual(INTERACTION_CHANNELS.map(item => item.label), ["全域直播-千川", "全域商品-千川", "标准-千川", "腾讯ADQ", "TikTok"]);
});

test("demo scopes belong to the current video and visible admin accounts", () => {
  const store = createAdStore();
  const records = createVideoInteractionDemoRecords(video, "qc-live", store, actor);
  assert.ok(records.length >= 4);
  assert.equal(new Set(records.map(record => record.id)).size, records.length);
  for (const record of records) {
    assert.equal(record.videoId, video.id);
    assert.ok(record.material.startsWith("复古耳环动态奢感视频_"));
    assert.ok(store.accounts.some(account => account.id === record.accountId && account.name === record.account && account.platform === "巨量千川" && account.status === "authorized"));
  }
  const renamed = { ...store, accounts: store.accounts.map(account => ({ ...account, name: `新名称-${account.name}` })) };
  assert.ok(createVideoInteractionDemoRecords(video, "qc-live", renamed, actor).every(record => record.account.startsWith("新名称-")));
  assert.equal(records.reduce((total, record) => total + Math.round(record.spend * 100), 0), Math.round(video.cost * 100 * 0.5));
  assert.deepEqual(createVideoInteractionDemoRecords(video, "adq", store, actor), []);
  assert.deepEqual(createVideoInteractionDemoRecords(video, "tiktok", store, actor), []);
  assert.deepEqual(createVideoInteractionDemoRecords({ ...video, id: "uploaded-1" }, "qc-live", store, actor), []);
  assert.deepEqual(createVideoInteractionDemoRecords({ ...video, syncStatus: "unsynced" }, "qc-live", store, actor), []);
  assert.deepEqual(createVideoInteractionDemoRecords(video, "qc-live", { ...store, visibility: "personal" }, { ...actor, name: "不可见用户" }), []);
  const restricted = { ...store, visibility: "personal" as const, accounts: store.accounts.map((account, index) => index === 0 ? account : { ...account, user: "其他人", authorizedBy: "其他人" }) };
  for (const record of createVideoInteractionDemoRecords(video, "qc-live", restricted, actor)) {
    assert.deepEqual(record, records.find(original => original.id === record.id));
  }
});

test("individual and aggregate scopes drive matching demo curves without leaking other channels", () => {
  const store = createAdStore();
  const records = createVideoInteractionDemoRecords(video, "qc-live", store, actor);
  const total = selectVideoInteractionTrend([point], records, "all")[0];
  for (const key of ["clicks", "losses", "follows", "comments", "likes"] as const) {
    assert.equal(total[key], records.reduce((sum, record) => sum + selectVideoInteractionTrend([point], records, record.id)[0][key], 0));
  }
  assert.ok(total.clicks > selectVideoInteractionTrend([point], records, records[0].id)[0].clicks);
  assert.equal(total.ctr, point.ctr);
  assert.equal(total.lossRate, point.lossRate);
  assert.deepEqual(selectVideoInteractionTrend([point], [], "all"), []);
  assert.deepEqual(selectVideoInteractionTrend([point], createVideoInteractionDemoRecords(video, "qc-product", store, actor), records[0].id), []);
});

test("product-channel account examples are available on unsynced prototype videos without changing other channels", () => {
  const store = createAdStore();
  const unsynced = { ...video, id: "fv2", syncStatus: "unsynced", cost: 0 };
  const records = createVideoInteractionDemoRecords(unsynced, "qc-product", store, actor);
  assert.ok(records.length >= 4);
  assert.ok(new Set(records.map(record => record.accountId)).size >= 2);
  assert.ok(new Set(records.map(record => record.spend)).size > 1);
  assert.ok(records.every(record => record.spend > 0 && Number.isFinite(record.weight)));
  assert.deepEqual(records, createVideoInteractionDemoRecords({ ...unsynced, syncStatus: "synced", cost: 900 }, "qc-product", store, actor));
  assert.ok(selectVideoInteractionTrend([point], records, "all")[0].clicks > 0);
  for (const channel of ["qc-live", "qc-standard", "adq", "tiktok"] as const) {
    assert.deepEqual(createVideoInteractionDemoRecords(unsynced, channel, store, actor), []);
  }
  assert.deepEqual(createVideoInteractionDemoRecords({ ...unsynced, id: "uploaded-2" }, "qc-product", store, actor), []);
  assert.deepEqual(createVideoInteractionDemoRecords(unsynced, "qc-product", { ...store, accounts: [] }, actor), []);
  assert.deepEqual(createVideoInteractionDemoRecords(unsynced, "qc-product", { ...store, visibility: "personal" }, { ...actor, name: "不可见用户" }), []);
});
