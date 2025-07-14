import { dirname, join } from "node:path";
import jsonata, { type Expression } from "jsonata";
import RE2 from "re2";
import { describe, expect, expectTypeOf, it } from "vitest";
import { parse } from "../util";

const repositoryRoot = dirname(dirname(__dirname));
const config = parse(join(repositoryRoot, "deno", "deno-land.json"));

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

describe("deno.land for import map", () => {
  const testCases = [
    {
      title: "should be accept deno.land/std",
      input: `{
        "imports": {
          "std": "https://deno.land/std@0.204.0"
        }
      }`,
      currentValue: "0.204.0",
      depName: "https://deno.land/std",
    },
    {
      title: "should be accept if include 'v' in version",
      input: `{
        "imports": {
          "path": "https://deno.land/std@v0.204.0/path/mod.ts"
        }
      }`,
      currentValue: "v0.204.0",
      depName: "https://deno.land/std",
    },
    {
      title: "should be accept deno.land/x",
      input: `{
        "imports": {
          "some": "https://deno.land/x/some_module@v0.1.0"
        }
      }`,
      currentValue: "v0.1.0",
      depName: "https://deno.land/x/some_module",
    },
  ] as const;

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
      currentValue: "v1.0.0",
      depName: "https://deno.land/std",
    },
    {
      title: "should accept deno.land/x",
      input: `export { someFuncion } from "https://deno.land/x/some_module@0.1.0/some/mod.ts";`,
      currentValue: "0.1.0",
      depName: "https://deno.land/x/some_module",
    },
    {
      title: "should accept deno.land/std in //@deno-types",
      input: `// @deno-types="https://deno.land/std@0.204.0/path/mod.ts";`,
      currentValue: "0.204.0",
      depName: "https://deno.land/std",
    },
    {
      title: "should accept if 'v' in version in //@deno-types",
      input: `// @deno-types="https://deno.land/std@v1.0.0/some/mod.ts";`,
      currentValue: "v1.0.0",
      depName: "https://deno.land/std",
    },
    {
      title: "should accept deno.land/x in //@deno-types",
      input: `// @deno-types="https://deno.land/x/some_module@0.1.0/some/mod.ts";`,
      currentValue: "0.1.0",
      depName: "https://deno.land/x/some_module",
    },
    {
      title: "should accept deno.land/x in //@ts-types",
      input: `// @ts-types="https://deno.land/x/some_module@1.0.0/some/mod.ts";`,
      currentValue: "1.0.0",
      depName: "https://deno.land/x/some_module",
    },
  ] as const;

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
