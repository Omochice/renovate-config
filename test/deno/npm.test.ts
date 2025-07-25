import { dirname, join } from "node:path";
import jsonata, { type Expression } from "jsonata";
import RE2 from "re2";
import { describe, expect, expectTypeOf, it } from "vitest";
import { parse } from "../util";

const repositoryRoot = dirname(dirname(__dirname));

const config = parse(join(repositoryRoot, "deno", "npm.json"));

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

describe("npm for import map", () => {
  const testCases = [
    {
      title: "should accept npm specifier",
      input: `{
        "imports": {
          "chalk": "npm:chalk@5.0.1"
        }
      }`,
      currentValue: "5.0.1",
      depName: "chalk",
    },
    {
      title: "should accept esm.sh specifier",
      input: `{
        "imports": {
          "chalk": "https://esm.sh/chalk@5.0.1"
        }
      }`,
      currentValue: "5.0.1",
      depName: "chalk",
    },
    {
      title: "should accept esm.sh specifier with query",
      input: `{
        "imports": {
          "tslib": "https://esm.sh/tslib@2.6.2?exports=__await,__rest"
        }
      }`,
      currentValue: "2.6.2",
      depName: "tslib",
    },
    {
      title: "should accept only major version",
      input: `{
        "imports": {
          "chalk": "npm:chalk@5"
        }
      }`,
      currentValue: "5",
      depName: "chalk",
    },
    {
      title: "should accept unpkg.com specifier",
      input: `{
        "imports": {
          "foo": "https://unpkg.com/@bar/foo@0.1.0/foo.ts"
        }
      }`,
      currentValue: "0.1.0",
      depName: "@bar/foo",
    },
    {
      title: "should accept unpkg.com specifier without @scope",
      input: `{
        "imports": {
          "foo": "https://unpkg.com/foo@0.1.0/umd/foo.production.min.js"
        }
      }`,
      currentValue: "0.1.0",
      depName: "foo",
    },
    {
      title: "should accept skypack.dev specifier",
      input: `{
        "imports": {
          "foo": "https://cdn.skypack.dev/@scope/package@10.5.5"
        }
      }`,
      currentValue: "10.5.5",
      depName: "@scope/package",
    },
    {
      title: "should accept skypack.dev with query",
      input: `{
        "imports": {
          "foo": "https://cdn.skypack.dev/@scope/package@10.5.5?min"
        }
      }`,
      currentValue: "10.5.5",
      depName: "@scope/package",
    },
    {
      title: "should accept npm with ^ range",
      input: `{
        "imports": {
          "foo": "npm:chalk@^5.0.0"
        }
      }`,
      currentValue: "^5.0.0",
      depName: "chalk",
    },
    {
      title: "should accept npm with ~ range",
      input: `{
        "imports": {
          "foo": "npm:chalk@~5.0.0"
        }
      }`,
      currentValue: "~5.0.0",
      depName: "chalk",
    },
    {
      title: "should accept npm with > range",
      input: `{
        "imports": {
          "foo": "npm:chalk@>5.0.0"
        }
      }`,
      currentValue: ">5.0.0",
      depName: "chalk",
    },
    {
      title: "should accept npm with >= range",
      input: `{
        "imports": {
          "foo": "npm:chalk@>=5.0.0"
        }
      }`,
      currentValue: ">=5.0.0",
      depName: "chalk",
    },
    {
      title: "should accept npm with < range",
      input: `{
        "imports": {
          "foo": "npm:chalk@<5.0.0"
        }
      }`,
      currentValue: "<5.0.0",
      depName: "chalk",
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

// NOTE: This feature is not required in the imports field in deno.json and source files.
// https://github.com/denoland/deno/pull/22087
// https://deno.com/blog/v1.40#simpler-imports-in-denojson
describe("should accept npm specifier with subpath exports in import map", () => {
  it("should match all exports of preact", async () => {
    const { input, currentValue, depName } = {
      input: `{
        "imports": {
          "preact": "npm:preact@10.5.13",
          "preact/": "npm:/preact@10.5.13/"
        }
      }`,
      currentValue: "10.5.13",
      depName: "preact",
    } as const;

    const data = JSON.parse(input);
    const matches = (
      await Promise.all(
        jsonatas.at(0)?.map(async (j) => await j.evaluate(data)) ?? [],
      )
    ).flat();
    expect(matches).toBeDefined();
    expect(Array.isArray(matches)).toBe(true);
    expect(matches.length).toBe(2);
    for (const match of matches) {
      expect(match?.currentValue).toBe(currentValue);
      expect(match?.depName).toBe(depName);
    }
  });
});

describe("npm for js file", () => {
  const testCases = [
    {
      title: "should accept npm specifier",
      input: `import chalk from "npm:chalk@5.0.1";`,
      currentValue: "5.0.1",
      depName: "chalk",
    },
    {
      title: "should accept esm.sh specifier",
      input: `export chalk from "https://esm.sh/chalk@5.0.1";`,
      currentValue: "5.0.1",
      depName: "chalk",
    },
    {
      title: "should accept esm.sh specifier with prefix",
      input: `export chalk from "https://esm.sh/v135/chalk@5.0.1";`,
      currentValue: "5.0.1",
      depName: "chalk",
    },
    {
      title: "should accept esm.sh specifier with query",
      input: `import { __await, __rest } from "https://esm.sh/tslib@2.6.2?exports=__await,__rest";`,
      currentValue: "2.6.2",
      depName: "tslib",
    },
    {
      title: "should accept only major version",
      input: `import chalk from "npm:chalk@5";`,
      currentValue: "5",
      depName: "chalk",
    },
    {
      title: "should accept unpkg.com specifier",
      input: `import foo from "https://unpkg.com/@bar/foo@0.1.0/foo.ts";`,
      currentValue: "0.1.0",
      depName: "@bar/foo",
    },
    {
      title: "should accept unpkg.com specifier without @scope",
      input: `import foo from "https://unpkg.com/foo@0.1.0/umd/foo.production.min.js";`,
      currentValue: "0.1.0",
      depName: "foo",
    },
    {
      title: "should accept skypack.dev specifier",
      input: `import foo from "https://cdn.skypack.dev/@scope/package@10.5.5";`,
      currentValue: "10.5.5",
      depName: "@scope/package",
    },
    {
      title: "should accept skypack.dev with query",
      input: `import foo from "https://cdn.skypack.dev/@scope/package@10.5.5?min";`,
      currentValue: "10.5.5",
      depName: "@scope/package",
    },
    {
      title: "should accept npm specifier in //@deno-types",
      input: `// @deno-types="npm:chalk@5.0.1";`,
      currentValue: "5.0.1",
      depName: "chalk",
    },
    {
      title: "should accept esm.sh specifier with query in //@deno-types",
      input: `// @deno-types="https://esm.sh/tslib@2.6.2?exports=__await,__rest";`,
      currentValue: "2.6.2",
      depName: "tslib",
    },
    {
      title: "should accept only major version in //@deno-types",
      input: `// @deno-types="npm:chalk@5";`,
      currentValue: "5",
      depName: "chalk",
    },
    {
      title: "should accept unpkg.com specifier in //@deno-types",
      input: `// @deno-types="https://unpkg.com/@bar/foo@0.1.0/foo.ts";`,
      currentValue: "0.1.0",
      depName: "@bar/foo",
    },
    {
      title:
        "should accept unpkg.com specifier without @scope in //@deno-types",
      input: `// @deno-types="https://unpkg.com/foo@0.1.0/umd/foo.production.min.js";`,
      currentValue: "0.1.0",
      depName: "foo",
    },
    {
      title: "should accept skypack.dev specifier in //@deno-types",
      input: `// @deno-types="https://cdn.skypack.dev/@scope/package@10.5.5";`,
      currentValue: "10.5.5",
      depName: "@scope/package",
    },
    {
      title: "should accept skypack.dev with query in //@deno-types",
      input: `// @deno-types="https://cdn.skypack.dev/@scope/package@10.5.5?min";`,
      currentValue: "10.5.5",
      depName: "@scope/package",
    },
    {
      title: "should accept npm specifier in //@ts-types",
      input: `// @ts-types="npm:some@0.1.0";`,
      currentValue: "0.1.0",
      depName: "some",
    },
    {
      title: "should accept npm with ^ range",
      input: `import chalk from "npm:chalk@^5.0.0";`,
      currentValue: "^5.0.0",
      depName: "chalk",
    },
    {
      title: "should accept npm with ~ range",
      input: `import chalk from "npm:chalk@~5.0.0";`,
      currentValue: "~5.0.0",
      depName: "chalk",
    },
    {
      title: "should accept npm with `>` range",
      input: `import chalk from "npm:chalk@>5.0.0";`,
      currentValue: ">5.0.0",
      depName: "chalk",
    },
    {
      title: "should accept npm with `>=` range",
      input: `import chalk from "npm:chalk@>=5.0.0";`,
      currentValue: ">=5.0.0",
      depName: "chalk",
    },
    {
      title: "should accept npm with `<` range",
      input: `import chalk from "npm:chalk@<5.0.0";`,
      currentValue: "<5.0.0",
      depName: "chalk",
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
