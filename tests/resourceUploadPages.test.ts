import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

test("all resource image and video upload entry points use complete pages", () => {
  const root = fileURLToPath(new URL("../src/", import.meta.url));
  let entries = 0;
  const scan = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) { scan(path); continue; }
      if (!entry.name.endsWith(".tsx")) continue;
      const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
          ["UploadFinishedVideoModal", "UploadImageModal"].includes(node.tagName.getText(source))) {
          entries++;
          const pageMode = node.attributes.properties.find((attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === "isPage");
          assert.ok(pageMode && ts.isJsxAttribute(pageMode), `${path}: upload must use page mode`);
          assert.ok(!pageMode.initializer || (ts.isJsxExpression(pageMode.initializer) && pageMode.initializer.expression?.kind === ts.SyntaxKind.TrueKeyword), `${path}: page mode must be enabled`);
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
  };
  scan(root);
  assert.ok(entries >= 11, "should cover resource, task, and creation upload entries");
});
