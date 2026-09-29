import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("department analytics pages and exclusive dependencies are removed without removing shared reports", () => {
  const src = new URL("../src/", import.meta.url);
  const router = readFileSync(new URL("components/AdDeliveryView.tsx", src), "utf8");
  assert.doesNotMatch(router, /team_analytics|data_insights|creation_analytics|task_analytics|部门分析/);
  assert.match(router, /MainCategory = "video_analytics" \| "account_analytics"/);
  for (const file of [
    "components/DataInsightsView.tsx",
    "components/CreationAnalyticsView.tsx",
    "components/TaskAnalyticsView.tsx",
    "lib/usePlatformReportData.ts",
    "lib/reportPlatformData.ts",
    "lib/reportInsights.ts",
    "lib/platformAnalytics.ts",
  ]) {
    assert.equal(existsSync(new URL(file, src)), false, file);
  }
  for (const component of ["AdPlatformAnalysisView", "PlatformTagsView", "TagAnalyticsView", "AdAccountDataView", "DeliveryStatusReportView"]) {
    assert.ok(router.includes(`<${component}`), component);
    assert.ok(existsSync(new URL(`components/${component}.tsx`, src)), component);
  }
  assert.ok(existsSync(new URL("lib/analyticsOrganization.ts", src)));
  assert.ok(existsSync(new URL("lib/useReportData.ts", src)));
});
