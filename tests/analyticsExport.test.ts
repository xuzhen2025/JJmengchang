import test from "node:test";
import assert from "node:assert/strict";
import { analyticsExportFileName, buildAnalyticsExportName } from "../src/lib/analyticsExport";

test("analytics export name contains page, local timestamp and only active filters", () => {
  const name = buildAnalyticsExportName({
    pageName: "广告账户数据",
    now: new Date(2026, 8, 24, 12, 34, 56),
    filters: [
      { label: "平台", value: "巨量千川" },
      { label: "分类", value: "美妆护肤 / 护肤精华" },
      { label: "部门", value: "" },
      { label: "范围", value: "全部" },
    ],
    startDate: "2026-09-09",
    endDate: "2026-09-24",
  });
  assert.equal(name, "广告账户数据_20260924123456_平台-巨量千川_分类-美妆护肤-护肤精华_时间-2026-09-09至2026-09-24");
});

test("analytics export filename strips an existing extension and unsafe characters", () => {
  assert.equal(analyticsExportFileName("标签分析:测试.csv", "xlsx"), "标签分析-测试.xlsx");
  assert.equal(analyticsExportFileName("广告账户数据_20260924123456_平台-巨量千川", "csv"), "广告账户数据_20260924123456_平台-巨量千川.csv");
});
