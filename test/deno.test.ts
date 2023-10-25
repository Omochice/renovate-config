import { expect, expectTypeOf, describe, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const file = readFileSync(join(dirname(__dirname), "deno.json")).toString();
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

describe("1: deno.land for import map", () => {
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

describe("2: npm for import map", () => {
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

describe("3: deno.land for import map", () => {
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
      const re = regexps[2].map((r) => new RegExp(r, "gm"));
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

describe("4: npm for js file", () => {
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
  ] as const;

  for (const testCase of testCases) {
    it(testCase.title, () => {
      const re = regexps[3].map((r) => new RegExp(r, "gm"));
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

describe("5: github tag for import_map", () => {
  const testCases = [
    {
      title: "should accept raw.githubusercontent.com",
      input: `{
        "imports": {
          "sample": "https://raw.githubusercontent.com/user/repo/1.0.0/mod.ts",
        }
      }`,
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept pax.deno.dev",
      input: `{
        "imports": {
          "sample": "https://pax.deno.dev/user/repo@1.0.0/mod.ts",
        }
      }`,
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept omit 'mod.ts' when specify pax.deno.dev",
      input: `{
        "imports": {
          "sample": "https://pax.deno.dev/user/repo@1.0.0",
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

  for (const testCase of testCases) {
    it(testCase.title, () => {
      const re = regexps[4].map((r) => new RegExp(r, "gm"));
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

describe("6: github tag for js file", () => {
  const testCases = [
    {
      title: "should accept raw.githubusercontent.com",
      input: `import { sample } from "https://raw.githubusercontent.com/user/repo/1.0.0/mod.ts",`,
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept pax.deno.dev",
      input: `import { sample } from "https://pax.deno.dev/user/repo@1.0.0/mod.ts",`,
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept omit 'mod.ts' when specify pax.deno.dev",
      input: `import { sample } from "https://pax.deno.dev/user/repo@1.0.0",`,
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
  ];

  for (const testCase of testCases) {
    it(testCase.title, () => {
      const re = regexps[5].map((r) => new RegExp(r, "gm"));
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
