import { expect, expectTypeOf, describe, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repositoryRoot = dirname(dirname(__dirname));

const file = readFileSync(join(repositoryRoot, "deno", "jsr.json")).toString();
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

describe("jsr for import map", () => {
  const testCases = [
    {
      title: "should accept jsr specifier",
      input: `{
        "imports": {
          "@luca/flag": "jsr:@luca/flag@^1.0.1"
        }
      }`,
      currentValue: "1.0.1",
      depName: "@luca/flag",
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

describe("jsr for js file", () => {
  const testCases = [
    {
      title: "should accept jsr specifier",
      input: `import { printProgress } from "jsr:@luca/flag@1.0.1";`,
      currentValue: "1.0.1",
      depName: "@luca/flag",
    },
    {
      title: "should accept version pinning(^)",
      input: `import { printProgress } from "jsr:@luca/flag@^1.0.1";`,
      currentValue: "1.0.1",
      depName: "@luca/flag",
    },
    {
      title: "should accept version pinning(~)",
      input: `import { printProgress } from "jsr:@luca/flag@~1.0.1";`,
      currentValue: "1.0.1",
      depName: "@luca/flag",
    },
    {
      title: "should accept only major version",
      input: `import { printProgress } from "jsr:@luca/flag@1";`,
      currentValue: "1",
      depName: "@luca/flag",
    },
    {
      title: "should accept jsr specifier in //@deno-types",
      input: `// @deno-types="jsr:@luca/flag@1.0.1";`,
      currentValue: "1.0.1",
      depName: "@luca/flag",
    },
    {
      title: "should accept jsr specifier in //@deno-types",
      input: `// @deno-types="jsr:@luca/flag@1.0.1";`,
      currentValue: "1.0.1",
      depName: "@luca/flag",
    },
    {
      title: "version pinning(^) with //@deno-types",
      input: `// @deno-types="jsr:@luca/flag@^1.0.1";`,
      currentValue: "1.0.1",
      depName: "@luca/flag",
    },
    {
      title: "version pinning(~) with //@deno-types",
      input: `// @deno-types="jsr:@luca/flag@~1.0.1";`,
      currentValue: "1.0.1",
      depName: "@luca/flag",
    },
    {
      title: "only major version with //@deno-types",
      input: `// @deno-types="jsr:@luca/flag@1";`,
      currentValue: "1",
      depName: "@luca/flag",
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