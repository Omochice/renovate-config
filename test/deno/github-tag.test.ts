import { dirname, join } from "node:path";
import jsonata, { type Expression } from "jsonata";
import RE2 from "re2";
import { describe, expect, expectTypeOf, it } from "vitest";
import { parse } from "../util";

const repositoryRoot = dirname(dirname(__dirname));
const config = parse(join(repositoryRoot, "deno", "github-tag.json"));

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

describe("github tag for import_map", () => {
  const testCases = [
    {
      title: "should accept raw.githubusercontent.com",
      input: `{
        "imports": {
          "sample": "https://raw.githubusercontent.com/user/repo/1.0.0/mod.ts"
        }
      }`,
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept pax.deno.dev",
      input: `{
        "imports": {
          "sample": "https://pax.deno.dev/user/repo@1.0.0/mod.ts"
        }
      }`,
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept omit 'mod.ts' when specify pax.deno.dev",
      input: `{
        "imports": {
          "sample": "https://pax.deno.dev/user/repo@1.0.0"
        }
      }`,
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept complex semver version",
      input: `{
        "imports": {
          "sample": "https://raw.githubusercontent.com/user/repo/1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay/mod.ts"
        }
      }`,
      currentValue: "1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay",
      depName: "user/repo",
    },
    {
      title: "should accept un-semver version",
      input: `{
        "imports": {
          "sample": "https://raw.githubusercontent.com/user/repo/sampleversion/mod.ts"
        }
      }`,
      currentValue: "sampleversion",
      depName: "user/repo",
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

describe("github tag for js file", () => {
  const testCases = [
    {
      title: "should accept raw.githubusercontent.com",
      input: `import { sample } from "https://raw.githubusercontent.com/user/repo/1.0.0/mod.ts"`,
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept pax.deno.dev",
      input: `import { sample } from "https://pax.deno.dev/user/repo@1.0.0/mod.ts"`,
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept omit 'mod.ts' when specify pax.deno.dev",
      input: `import { sample } from "https://pax.deno.dev/user/repo@1.0.0"`,
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept complex semver version",
      input: `import { sample } from "https://raw.githubusercontent.com/user/repo/1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay/mod.ts"`,
      currentValue: "1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay",
      depName: "user/repo",
    },
    {
      title: "should accept un-semver version",
      input: `import { sample } from "https://raw.githubusercontent.com/user/repo/sampleversion/mod.ts"`,
      currentValue: "sampleversion",
      depName: "user/repo",
    },
    {
      title: "should accept raw.githubusercontent.com in //@deno-types",
      input: `// @deno-types="https://raw.githubusercontent.com/user/repo/1.0.0/mod.ts"`,
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept pax.deno.dev in //@deno-types",
      input: `// @deno-types="https://pax.deno.dev/user/repo@1.0.0/mod.ts"`,
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title:
        "should accept omit 'mod.ts' when specify pax.deno.dev in //@deno-types",
      input: `// @deno-types="https://pax.deno.dev/user/repo@1.0.0"`,
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept complex semver version in //@deno-types",
      input: `// @deno-types="https://raw.githubusercontent.com/user/repo/1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay/mod.ts"`,
      currentValue: "1.0.0-alpha-a.b-c-somethinglong+build.1-aef.1-its-okay",
      depName: "user/repo",
    },
    {
      title: "should accept un-semver version in //@deno-types",
      input: `// @deno-types="https://raw.githubusercontent.com/user/repo/sampleversion/mod.ts"`,
      currentValue: "sampleversion",
      depName: "user/repo",
    },
    {
      title: "should accept un-semver version in //@ts-types",
      input: `// @ts-types="https://raw.githubusercontent.com/user/repo/sampleversion/mod.ts"`,
      currentValue: "sampleversion",
      depName: "user/repo",
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
