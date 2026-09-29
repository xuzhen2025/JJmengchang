import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import * as analytics from "../src/lib/analyticsData";
import * as reportData from "../src/lib/reportDemoData";

test("account analytics removes the finance page, route and dedicated demo generators", () => {
  const components = new URL("../src/components/", import.meta.url);
  const router = readFileSync(new URL("AdDeliveryView.tsx", components), "utf8");
  assert.equal(existsSync(new URL("AccountFinanceReportView.tsx", components)), false);
  assert.doesNotMatch(router, /AccountFinanceReportView|financial_report|广告账户财务报表/);
  assert.match(router, /account_analytics: "account_data" \| "status_report"/);
  assert.match(router, /<AdAccountDataView/);
  assert.match(router, /<DeliveryStatusReportView/);
  assert.equal("financeRows" in analytics, false);
  assert.equal("financialReportRows" in reportData, false);
});
