import { expect, expectTypeOf, describe, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import dedent from "dedent";
import RE2 from "re2";

const repositoryRoot = dirname(dirname(__dirname));

const file = readFileSync(join(repositoryRoot, "deno", "jsr.json")).toString();
const config: string[][] = JSON.parse(file)?.customManagers?.map(
  (manager: { matchStrings?: string[] }) => manager.matchStrings,
);

const regexps: RE2[][] = config.map((matchStrings: string[]) =>
  matchStrings.map((re) => new RE2(re)),
);

describe("check configuration existing", () => {
  it("should be array", () => {
    expect(Array.isArray(config));
  });
  it("should be array of regexp", () => {
    expectTypeOf(regexps).toEqualTypeOf<RE2[][]>();
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
    {
      title: "should accept https://jsr.io",
      input: `{
        "imports": {
          "@luca/flag": "https://jsr.io/@luca/flag/1.0.1/main.ts"
        }
      }`,
      currentValue: "1.0.1",
      depName: "@luca/flag",
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

describe("jsr for js file", () => {
  const testCases = [
    {
      title: "should accept jsr specifier",
      input: `import { printProgress } from "jsr:@luca/flag@1.0.1";`,
      currentValue: "1.0.1",
      depName: "@luca/flag",
    },
    {
      title: "should accept https://jsr.io",
      input: `import { printProgress } from "https://jsr.io/@luca/flag/1.0.1/main.ts";`,
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
    {
      title: "should update in jsdoc",
      input: dedent`
      /**
      * \`\`\`ts
      * import { assertEquals } from "jsr:@std/assert@1.0.6/equals";
      *
      * assertEquals(add(1, 2), 3);
      * \`\`\`
      */
      export function add(a: number, b: number) {
        return a + b;
      }
      `,
      currentValue: "1.0.6",
      depName: "@std/assert",
    },
    {
      title: "should accept jsr specifier in //@ts-types",
      input: `// @ts-types="jsr:@some/package@0.1.0";`,
      currentValue: "0.1.0",
      depName: "@some/package",
    },
  ] as const;

  it.each(testCases)("$title", ({ input, currentValue, depName }) => {
    const re = regexps[1].map((r) => new RegExp(r, "gm"));
    const matches = re
      .map((r) => Array.from(input.matchAll(r)).map((e) => e.groups))
      .filter((match) => match.length !== 0)
      .flat();
    expect(matches.length).toBe(1);
    expect(matches[0]?.currentValue).toBe(currentValue);
    expect(matches[0]?.depName).toBe(depName);
  });
});
