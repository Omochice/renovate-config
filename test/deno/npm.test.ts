import { expect, expectTypeOf, describe, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repositoryRoot = dirname(dirname(__dirname));

const file = readFileSync(join(repositoryRoot, "deno", "npm.json")).toString();
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

describe("npm for import map", () => {
  const testCases = [
    {
      title: "should accept npm specifier",
      input: `{
        "imports": {
          "chalk": "npm:chalk@5.0.1",
        }
      }`,
      currentValue: "5.0.1",
      depName: "chalk",
    },
    {
      title: "should accept esm.sh specifier",
      input: `{
        "imports": {
          "chalk": "https://esm.sh/chalk@5.0.1",
        }
      }`,
      currentValue: "5.0.1",
      depName: "chalk",
    },
    {
      title: "should accept esm.sh specifier with query",
      input: `{
        "imports": {
          "tslib": "https://esm.sh/tslib@2.6.2?exports=__await,__rest",
        }
      }`,
      currentValue: "2.6.2",
      depName: "tslib",
    },
    {
      title: "should accept only major version",
      input: `{
        "imports": {
          "chalk": "npm:chalk@5",
        }
      }`,
      currentValue: "5",
      depName: "chalk",
    },
    {
      title: "should accept unpkg.com specifier",
      input: `{
        "imports": {
          "foo": "https://unpkg.com/@bar/foo@0.1.0/foo.ts",
        }
      }`,
      currentValue: "0.1.0",
      depName: "@bar/foo",
    },
    {
      title: "should accept unpkg.com specifier without @scope",
      input: `{
        "imports": {
          "foo": "https://unpkg.com/foo@0.1.0/umd/foo.production.min.js",
        }
      }`,
      currentValue: "0.1.0",
      depName: "foo",
    },
    {
      title: "should accept skypack.dev specifier",
      input: `{
        "imports": {
          "foo": "https://cdn.skypack.dev/@scope/package@10.5.5",
        }
      }`,
      currentValue: "10.5.5",
      depName: "@scope/package",
    },
    {
      title: "should accept skypack.dev with query",
      input: `{
        "imports": {
          "foo": "https://cdn.skypack.dev/@scope/package@10.5.5?min",
        }
      }`,
      currentValue: "10.5.5",
      depName: "@scope/package",
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
