import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import postcss from "postcss";

describe("public CSS isolation", () => {
  for (const file of ["public-foundation.css", "home/reference-home.css"]) {
    it(`scopes every selector in ${file} to the public wrapper`, () => {
      const stylesheet = postcss.parse(readFileSync(new URL(file, import.meta.url), "utf8"));
      const unscoped: string[] = [];
      stylesheet.walkRules(rule => {
        if (rule.parent?.type === "atrule" && rule.parent.name.endsWith("keyframes")) return;
        for (const selector of rule.selectors) if (!selector.trim().startsWith(".public-site")) unscoped.push(selector);
      });
      expect(unscoped).toEqual([]);
    });
  }
});
