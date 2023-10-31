import { expect, expectTypeOf, describe, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repositoryRoot = dirname(dirname(__dirname));

const file = readFileSync(
  join(repositoryRoot, "deno", "deno-land.json"),
).toString();
const config: string[][] = JSON.parse(file)?.customManagers?.map(
  (manager: { matchStrings?: string[] }) => manager.matchStrings,
);

const regexps: RegExp[][] = config.map((matchStrings: string[]) =>
  matchStrings.map((re) => new RegExp(re)),
);

describe("check configuration existing", () => {
  it("should be array", () => {
    expect(Array.isArray(config));
  });
  it("should be array of regexp", () => {
    expectTypeOf(regexps).toEqualTypeOf<RegExp[][]>();
  });
});

describe("deno.land for import map", () => {
  const testCases = [
    {
      title: "should be accept deno.land/std",
      input: `{
        "import_map": {
          "std": "https://deno.land/std@0.204.0",
        }
      }`,
      currentValue: "0.204.0",
      depName: "https://deno.land/std",
    },
    {
      title: "should be accept if include 'v' in version",
      input: `{
        "import_map": {
          "path": "https://deno.land/std@v0.204.0/path/mod.ts",
        }
      }`,
      currentValue: "0.204.0",
      depName: "https://deno.land/std",
    },
    {
      title: "should be accept deno.land/x",
      input: `{
        "import_map": {
          "some": "https://deno.land/x/some_module@v0.1.0",
        }
      }`,
      currentValue: "0.1.0",
      depName: "https://deno.land/x/some_module",
    },
  ] as const;

  for (const testCase of testCases) {
    it(testCase.title, () => {
      const re = regexps[0].map((r) => new RegExp(r, "gm"));
      const matches = re
        .map((r) => Array.from(testCase.input.matchAll(r)).map((e) => e.groups))
        .filter((match) => match.length !== 0)
        .flat();
      expect(matches.length).toBe(1);
      expect(matches[0]?.currentValue).toBe(testCase.currentValue);
      expect(matches[0]?.depName).toBe(testCase.depName);
    });
  }
});

describe("deno.land for import map", () => {
  const testCases = [
    {
      title: "should accept deno.land/std",
      input: `import { join } from "https://deno.land/std@0.204.0/path/mod.ts";`,
      currentValue: "0.204.0",
      depName: "https://deno.land/std",
    },
    {
      title: "should accept export specifier",
      input: `export { someFuncion } from "https://deno.land/std@0.204.0/some/mod.ts";`,
      currentValue: "0.204.0",
      depName: "https://deno.land/std",
    },
    {
      title: "should accept if 'v' in version",
      input: `import { someFuncion } from "https://deno.land/std@v1.0.0/some/mod.ts";`,
      currentValue: "1.0.0",
      depName: "https://deno.land/std",
    },
    {
      title: "should accept deno.land/x",
      input: `export { someFuncion } from "https://deno.land/x/some_module@0.1.0/some/mod.ts";`,
      currentValue: "0.1.0",
      depName: "https://deno.land/x/some_module",
    },
  ] as const;

  for (const testCase of testCases) {
    it(testCase.title, () => {
      const re = regexps[1].map((r) => new RegExp(r, "gm"));
      const matches = re
        .map((r) => Array.from(testCase.input.matchAll(r)).map((e) => e.groups))
        .filter((match) => match.length !== 0)
        .flat();
      expect(matches.length).toBe(1);
      expect(matches[0]?.currentValue).toBe(testCase.currentValue);
      expect(matches[0]?.depName).toBe(testCase.depName);
    });
  }
});
