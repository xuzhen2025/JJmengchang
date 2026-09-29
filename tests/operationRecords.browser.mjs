import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const { chromium, expect } = createRequire(import.meta.url)("playwright/test");
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const button = name => page.getByRole("button", { name, exact: true });
const dialog = name => page.getByRole("dialog", { name, exact: true });
const tab = name => page.getByRole("tab", { name, exact: true });

try {
  await mkdir("tmp/operation-records", { recursive: true });
  await page.addInitScript(() => localStorage.setItem("mengchang_prototype_session", JSON.stringify({ username: "chaojiguanliyuan", mode: "user" })));
  await page.goto(process.env.PREVIEW_URL || "http://localhost:3003/", { waitUntil: "domcontentloaded" });
  await page.locator("#sidebar-item-operation_records").click();
  await expect(page.getByRole("tab")).toHaveText(["衍生视频记录", "推送视频记录", "创建计划队列", "上传文件记录", "导出记录", "下载记录", "登录记录"]);

  const derivation = page.getByTestId("derivation-history");
  await expect(derivation.locator("tbody tr")).toHaveCount(8);
  await expect(derivation.locator("tbody img")).toHaveCount(0);
  await expect(derivation.locator("thead th")).toHaveText(["", "视频标题", "衍生视频", "素材ID", "衍生状态", "是否卡审", "操作人", "衍生时间", "更新时间", "推送记录ID", "备注", "操作", "系统信息"]);
  await expect(derivation.getByText("衍生方式", { exact: true })).toHaveCount(0);
  await expect(derivation.locator('tbody tr').filter({ hasText: "fv-analytics-1" })).toHaveCount(3);
  await expect(page.getByLabel("衍生状态").locator("option")).toHaveText(["请选择状态", "成功", "失败", "处理中", "取消衍生", "待衍生", "已删除"]);
  await expect(button("重置")).toHaveCount(0);

  const derivationBefore = await derivation.locator("tbody").textContent();
  await page.getByPlaceholder("请输入视频ID").fill("NOT-FOUND-VIDEO");
  await expect(derivation.locator("tbody")).toHaveText(derivationBefore);
  await button("查询").click();
  await expect(derivation.getByText("暂无数据", { exact: true })).toBeVisible();
  await page.getByPlaceholder("请输入视频ID").fill("");
  await button("查询").click();
  await expect(derivation.locator("tbody tr")).toHaveCount(8);

  await derivation.locator("tbody tr").first().locator("button").first().click();
  await expect(page.locator('[role="dialog"] video')).toBeVisible();
  await dialog((await derivation.locator("tbody tr").first().locator("button").first().textContent()).trim()).getByRole("button", { name: /^关闭/ }).click();
  await page.getByRole("button", { name: "素材ID说明", exact: true }).focus();
  await expect(page.getByRole("tooltip")).toContainText("仅执行了衍生操作，尚未推送");
  await page.getByLabel("衍生状态").selectOption("成功");
  await expect(derivation.locator("tbody tr")).toHaveCount(8);
  await button("查询").click();
  await expect(derivation.locator("tbody tr")).toHaveCount(3);
  await page.getByLabel("选择本页全部衍生视频").check();
  await expect(button("批量重试")).toBeDisabled();
  await expect(button("批量取消")).toBeDisabled();
  await expect(button("批量推送")).toBeEnabled();
  await expect(button("批量下载")).toBeEnabled();
  await button("批量备注").click();
  await page.getByLabel("记录备注").fill("批量备注未保存");
  await dialog("填写备注").getByRole("button", { name: "取消", exact: true }).click();
  await expect(derivation.locator("tbody")).not.toContainText("批量备注未保存");
  await button("批量备注").click();
  await page.getByLabel("记录备注").fill("批量备注验证");
  await dialog("填写备注").getByRole("button", { name: "确定", exact: true }).click();
  await expect(derivation.getByRole("button", { name: "批量备注验证", exact: true })).toHaveCount(3);
  await button("批量推送").click();
  await expect(button("关闭推送任务")).toBeVisible();
  await button("关闭推送任务").click();
  await button("导出").click();
  await expect(page.getByRole("menuitem")).toHaveText(["导出CSV", "导出Excel"]);
  await page.keyboard.press("Escape");
  await page.getByLabel("衍生状态").selectOption("");
  await button("查询").click();
  await page.screenshot({ path: "tmp/operation-records/derivation-desktop.png", fullPage: true });

  await tab("推送视频记录").click();
  const push = page.getByTestId("push-history");
  await expect(push.locator("thead th")).toHaveText(["", "视频标题", "推送视频", "广告账户", "媒体", "素材ID", "推送状态", "失败原因", "操作人", "创建推送时间", "更新时间", "任务ID", "操作"]);
  await expect(page.getByLabel("推送视频类型")).toBeVisible();
  await expect(page.getByLabel("推送类型")).toBeVisible();
  await expect(page.getByLabel("操作人")).toBeVisible();
  await expect(push.getByText("今日创建推送", { exact: false })).toBeVisible();
  await expect(button("重置")).toHaveCount(0);
  const pushCount = await push.locator("tbody tr").count();
  assert.ok(pushCount >= 30);
  for (const status of ["待处理", "衍生中", "推送中", "等待素材入库", "审核中", "创建计划中", "追加中", "请求开启中", "待确认", "推送成功", "推送失败", "已取消"]) await expect(push.getByTestId(`push-row-${status}`).first()).toBeVisible();

  const pushBefore = await push.locator("tbody").textContent();
  await page.getByPlaceholder("请输入视频ID").fill("NOT-FOUND-VIDEO");
  await expect(push.locator("tbody")).toHaveText(pushBefore);
  await button("查询").click();
  await expect(push.getByText("暂无数据", { exact: true })).toBeVisible();
  await page.getByPlaceholder("请输入视频ID").fill("");
  await button("查询").click();
  await expect(push.locator("tbody tr")).toHaveCount(pushCount);

  await page.getByLabel(/^选择推送记录 OP-DEMO-.*-upload-success$/).check();
  await button("批量重试").click();
  await expect(push.getByRole("alert")).toHaveText("批量重试仅支持推送失败的记录");
  await page.getByLabel(/^选择推送记录 OP-DEMO-.*-upload-success$/).uncheck();

  await page.getByLabel(/^选择推送记录 OP-DEMO-.*-upload-failed$/).check();
  await button("批量重试").click();
  await dialog("批量重试").getByRole("button", { name: "确认重试", exact: true }).click();
  await expect(push.getByRole("status")).toContainText("已重试 1 条推送记录");

  await page.getByLabel(/^选择推送记录 OP-DEMO-.*-upload-waiting$/).check();
  await button("批量取消").click();
  await dialog("批量取消").getByRole("button", { name: "确认取消", exact: true }).click();
  await expect(push.getByRole("status")).toContainText("已取消 1 条推送记录");
  await expect(page.getByTestId("push-row-已取消").filter({ hasText: "upload-waiting" })).toBeVisible();
  await page.screenshot({ path: "tmp/operation-records/push-desktop.png", fullPage: true });

  await tab("上传文件记录").click();
  const finishedUpload = page.locator("tbody tr").filter({ hasText: "0730-8835-鲁月园-复古耳环动态奢感视频.mp4" });
  await finishedUpload.getByRole("button", { name: "详情", exact: true }).click();
  await expect(page.getByTitle("返回成片列表")).toBeVisible();
  await expect(page.getByText("0730-8835-鲁月园-复古耳环动态奢感视频.mp4", { exact: true }).first()).toBeVisible();
  await page.getByTitle("返回成片列表").click();
  await expect(page.getByRole("button", { name: "成片管理", exact: true })).toBeVisible();

  await page.locator("#sidebar-item-operation_records").click();
  await tab("上传文件记录").click();
  const failedUpload = page.locator("tbody tr").filter({ hasText: "跑鞋开箱_补拍.mp4" });
  await failedUpload.getByRole("button", { name: "详情", exact: true }).click();
  await expect(dialog("记录详情")).toContainText("传输中断，文件未入库");
  await dialog("记录详情").getByRole("button", { name: /^关闭/ }).click();

  const imageUpload = page.locator("tbody tr").filter({ hasText: "防晒植物提取精华液展图.jpg" });
  await imageUpload.getByRole("button", { name: "详情", exact: true }).click();
  await expect(page.getByTitle("返回图片列表")).toBeVisible();
  await expect(page.getByText("防晒植物提取精华液展图.jpg", { exact: true }).first()).toBeVisible();
  await page.getByTitle("返回图片列表").click();
  await expect(page.getByRole("button", { name: "图片管理", exact: true })).toBeVisible();

  await page.locator("#sidebar-item-operation_records").click();
  await tab("导出记录").click();
  await expect(page.locator("tbody tr").first()).toBeVisible();
  await expect(button("详情")).toHaveCount(0);
  await expect(button("下载")).toHaveCount(1);
  await expect(page.locator("tbody tr").filter({ hasText: "推送视频记录.csv" }).locator("td").last()).toHaveText("");
  const [exportDownload] = await Promise.all([
    page.waitForEvent("download"),
    button("下载").click(),
  ]);
  assert.match(exportDownload.suggestedFilename(), /^成片数据_\d{14}_全部\.csv$/);

  await tab("下载记录").click();
  const finishedDownload = page.locator("tbody tr").filter({ hasText: "0730-8835-鲁月园-复古耳环动态奢感视频.mp4" });
  await finishedDownload.getByRole("button", { name: "详情", exact: true }).click();
  await expect(page.getByTitle("返回成片列表")).toBeVisible();
  await expect(page.getByText("0730-8835-鲁月园-复古耳环动态奢感视频.mp4", { exact: true }).first()).toBeVisible();
  await page.getByTitle("返回成片列表").click();
  await expect(page.getByRole("button", { name: "成片管理", exact: true })).toBeVisible();

  await page.locator("#sidebar-item-operation_records").click();
  await tab("下载记录").click();
  const failedDownload = page.locator("tbody tr").filter({ hasText: "历史成片.mp4" });
  await failedDownload.getByRole("button", { name: "详情", exact: true }).click();
  await expect(dialog("记录详情")).toContainText("文件已删除或链接失效");
  await dialog("记录详情").getByRole("button", { name: /^关闭/ }).click();

  await tab("登录记录").click();
  await expect(page.locator("tbody tr").first()).toBeVisible();

  await tab("衍生视频记录").click();
  await page.setViewportSize({ width: 768, height: 900 });
  assert.ok(await page.getByTestId("operation-records").evaluate(element => element.scrollWidth <= element.clientWidth));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("aside button").last().click();
  await expect.poll(() => page.locator("aside").evaluate(element => element.getBoundingClientRect().width)).toBeLessThanOrEqual(65);
  await page.screenshot({ path: "tmp/operation-records/mobile.png", fullPage: true });
  assert.ok(await page.getByTestId("operation-records").evaluate(element => element.scrollWidth <= element.clientWidth));

  await page.evaluate(async () => {
    const derivationModule = await import("/src/lib/videoDerivation.ts");
    derivationModule.seedDerivationExamples("other-user");
  });
  await expect(derivation.locator("tbody tr")).toHaveCount(8);
  assert.deepEqual(errors, []);
  console.log("PASS operation records: screenshot fields, no derivation thumbnails, query timing, push statistics, validated retry/cancel, owner isolation and responsive layout.");
} catch (error) {
  await page.screenshot({ path: "tmp/operation-records/failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
