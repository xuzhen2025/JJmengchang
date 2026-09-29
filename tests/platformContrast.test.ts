import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import postcss from "postcss";
import { compile } from "tailwindcss";

const stylesheet = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
const theme = readFileSync(new URL("../node_modules/tailwindcss/theme.css", import.meta.url), "utf8");

test("neutral surfaces, borders and dividers share tokens without changing text or brand colors", async () => {
  const source = stylesheet.replace('@import "tailwindcss";', `${theme}\n@tailwind utilities;`);
  const compiler = await compile(source);
  const classes = ["bg-slate-50", "bg-slate-100", "bg-slate-200", "hover:bg-slate-50/70", "border-slate-100", "border-b-slate-200", "border-slate-200/80", "divide-slate-100", "text-slate-100", "text-slate-200", "bg-purple-600"];
  const css = postcss.parse(compiler.build(classes));
  const declarations = (selector: string | RegExp, property: string) => {
    const values: string[] = [];
    css.walkRules(selector, rule => { rule.walkDecls(property, declaration => { values.push(declaration.value); }); });
    return values;
  };
  for (const shade of [50, 100, 200]) assert.deepEqual(declarations(`.bg-slate-${shade}`, "background-color"), [`var(--background-color-slate-${shade})`]);
  assert.deepEqual(declarations(".border-slate-100", "border-color"), ["var(--border-color-slate-100)"]);
  assert.deepEqual(declarations(".border-b-slate-200", "border-bottom-color"), ["var(--border-color-slate-200)"]);
  assert.deepEqual(declarations(":where(.divide-slate-100 > :not(:last-child))", "border-color"), ["var(--border-color-slate-100)"]);
  assert.ok(declarations(".hover\\:bg-slate-50\\/70:hover", "background-color").some(value => value.includes("var(--background-color-slate-50) 70%")));
  assert.ok(declarations(".border-slate-200\\/80", "border-color").some(value => value.includes("var(--border-color-slate-200) 80%")));
  for (const shade of [100, 200]) assert.deepEqual(declarations(`.text-slate-${shade}`, "color"), [`var(--color-slate-${shade})`]);
  assert.deepEqual(declarations(".bg-purple-600", "background-color"), ["var(--color-purple-600)"]);
  const overrides = postcss.parse(stylesheet);
  overrides.walkDecls(declaration => { assert.ok(!declaration.prop.startsWith("--color-"), "Do not override shared text/icon/brand palette"); });
});

test("neutral palette stays light while preserving surface and border hierarchy", () => {
  const tokens = new Map<string, string>();
  postcss.parse(stylesheet).walkDecls(declaration => { tokens.set(declaration.prop, declaration.value); });
  const expected = {
    "--background-color-slate-50": "#f6f7fa",
    "--background-color-slate-100": "#f0f2f7",
    "--background-color-slate-200": "#e2e7ef",
    "--border-color-slate-50": "#f0f2f7",
    "--border-color-slate-100": "#e7ebf2",
    "--border-color-slate-200": "#d5ddeb",
  };
  for (const [name, value] of Object.entries(expected)) assert.equal(tokens.get(name), value);
  for (const shade of [100, 200]) assert.equal(tokens.get(`--ring-color-slate-${shade}`), tokens.get(`--border-color-slate-${shade}`));
});

test("module rounding is opt-in and does not change control radii or clip popovers", async () => {
  const compiler = await compile(stylesheet.replace('@import "tailwindcss";', `${theme}\n@tailwind utilities;`));
  const css = postcss.parse(compiler.build(["rounded-module", "rounded-lg", "rounded-b-[inherit]"]));
  const moduleDeclarations: Record<string, string> = {};
  css.walkRules(".rounded-module", rule => {
    rule.walkDecls(declaration => { moduleDeclarations[declaration.prop] = declaration.value; });
  });
  assert.deepEqual(moduleDeclarations, { "border-radius": "var(--radius-module)" });
  css.walkRules(".rounded-lg", rule => {
    rule.walkDecls("border-radius", declaration => { assert.equal(declaration.value, "var(--radius-lg)"); });
  });
  const tokens = postcss.parse(stylesheet);
  tokens.walkDecls("--radius-module", declaration => { assert.equal(declaration.value, "1rem"); });
  tokens.walkRules(rule => { assert.fail(`Global element rounding is not allowed: ${rule.selector}`); });
});
