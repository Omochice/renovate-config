import { expect, expectTypeOf, describe, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repositoryRoot = dirname(dirname(__dirname));

const file = readFileSync(
  join(repositoryRoot, "deno", "nest-land.json"),
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

describe("x.nest.land for import_map", () => {
  const testCases = [
    {
      title: "should accept x.nest.land",
      input: `{
        "imports": {
          "sample": "https://x.nest.land/sample@0.0.1/mod.ts",
        }
      }`,
      currentValue: "0.0.1",
      depName: "sample",
    },
    {
      title: "should accept x.nest.land with `v`",
      input: `{
        "imports": {
          "sample": "https://x.nest.land/sample@v0.0.1/mod.ts",
        }
      }`,
      currentValue: "v0.0.1",
      depName: "sample",
    },
  ];

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

describe("x.nest.land for js file", () => {
  const testCases = [
    {
      title: "should accept x.nest.land",
      input: `import { sample } from "https://x.nest.land/sample@0.0.1/mod.ts";`,
      currentValue: "0.0.1",
      depName: "sample",
    },
    {
      title: "should accept x.nest.land with `v`",
      input: `import { sample } from "https://x.nest.land/sample@v0.0.1/mod.ts";`,
      currentValue: "v0.0.1",
      depName: "sample",
    },
  ];

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
