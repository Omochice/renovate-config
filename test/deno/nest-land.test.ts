import { dirname, join } from "node:path";
import jsonata, { type Expression } from "jsonata";
import RE2 from "re2";
import { describe, expect, expectTypeOf, it } from "vitest";
import { parse } from "../util";

const repositoryRoot = dirname(dirname(__dirname));
const config = parse(join(repositoryRoot, "deno", "nest-land.json"));

const regexps: RE2[][] = config.customManagers
  .filter(({ customType }) => customType === "regex")
  .map(({ matchStrings }) => matchStrings.map((re) => new RE2(re)));

const jsonatas: Expression[][] = config.customManagers
  .filter(({ customType }) => customType === "jsonata")
  .map(({ matchStrings }) => matchStrings.map((re) => jsonata(re)));

describe("check configuration existing", () => {
  it("should be array", () => {
    expect(Array.isArray(config));
  });
  it("should be array of regexp", () => {
    expectTypeOf(regexps).toEqualTypeOf<RE2[][]>();
  });
});

describe("x.nest.land for import_map", () => {
  const testCases = [
    {
      title: "should accept x.nest.land",
      input: `{
        "imports": {
          "sample": "https://x.nest.land/sample@0.0.1/mod.ts"
        }
      }`,
      currentValue: "0.0.1",
      depName: "sample",
    },
    {
      title: "should accept x.nest.land with `v`",
      input: `{
        "imports": {
          "sample": "https://x.nest.land/sample@v0.0.1/mod.ts"
        }
      }`,
      currentValue: "v0.0.1",
      depName: "sample",
    },
  ];

  it.each(testCases)("$title", async ({ input, currentValue, depName }) => {
    const data = JSON.parse(input);
    const matches = (
      await Promise.all(
        jsonatas.at(0)?.map(async (j) => await j.evaluate(data)) ?? [],
      )
    ).flat();
    expect(matches).toBeDefined();
    expect(Array.isArray(matches)).toBe(true);
    expect(matches.length).toBe(1);
    expect(matches.at(0).currentValue).toBe(currentValue);
    expect(matches.at(0).depName).toBe(depName);
  });
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
    {
      title: "should accept x.nest.land in //@deno-types",
      input: `// @deno-types="https://x.nest.land/sample@0.0.1/mod.ts";`,
      currentValue: "0.0.1",
      depName: "sample",
    },
    {
      title: "should accept x.nest.land with `v` in //@deno-types",
      input: `// @deno-types="https://x.nest.land/sample@v0.0.1/mod.ts";`,
      currentValue: "v0.0.1",
      depName: "sample",
    },
    {
      title: "should accept x.nest.land in //@ts-types",
      input: `// @ts-types="https://x.nest.land/sample@0.0.1/mod.ts";`,
      currentValue: "0.0.1",
      depName: "sample",
    },
  ];

  it.each(testCases)("$title", ({ input, currentValue, depName }) => {
    const re = regexps[0].map((r) => new RegExp(r, "gm"));
    const matches = re
      .map((r) => Array.from(input.matchAll(r)).map((e) => e.groups))
      .filter((match) => match.length !== 0)
      .flat();
    expect(matches.length).toBe(1);
    expect(matches[0]?.currentValue).toBe(currentValue);
    expect(matches[0]?.depName).toBe(depName);
  });
});
