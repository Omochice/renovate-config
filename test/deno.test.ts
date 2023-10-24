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
  const file = `
  {
    "import_map": {
      "std": "https://deno.land/std@0.204.0",
      "path": "https://deno.land/std@v0.204.0/path/mod.ts",
      "some": "https://deno.land/x/some_module@v0.1.0",
    }
  }
  `;
  const expects = [
    {
      title: "should be accept deno.land/std",
      currentValue: "0.204.0",
      depName: "https://deno.land/std",
    },
    {
      title: "should be accept if include 'v' in version",
      currentValue: "0.204.0",
      depName: "https://deno.land/std",
    },
    {
      title: "should be accept deno.land/x",
      currentValue: "0.1.0",
      depName: "https://deno.land/x/some_module",
    },
  ];

  const matches = regexps[0]
    .map((re) =>
      Array.from(file.matchAll(new RegExp(re, "gm"))).map((e) => e.groups),
    )
    .flat();
  it(`should be match ${expects.length} object`, () => {
    expect(matches.length).toBe(expects.length);
  });

  for (let i = 0; i < expects.length; i++) {
    it(expects[i].title, () => {
      expect(matches[i]?.currentValue).toBe(expects[i].currentValue);
    });
  }
});

describe("2: npm for import map", () => {
  const file = `
  {
    "imports": {
      "chalk": "npm:chalk@5.0.1",
      "chalk": "https://esm.sh/chalk@5.0.1",
      "chalk": "npm:chalk@5",
      "foo": "https://unpkg.com/@bar/foo@0.1.0/foo.ts",
      "foo": "https://unpkg.com/foo@0.1.0/umd/foo.production.min.js",
    }
  }`;
  const expects = [
    {
      title: "should accept npm specifier",
      currentValue: "5.0.1",
      depName: "chalk",
    },
    {
      title: "should accept esm.sh specifier",
      currentValue: "5.0.1",
      depName: "chalk",
    },
    {
      title: "should accept only major version",
      currentValue: "5",
      depName: "chalk",
    },
    {
      title: "should accept unpkg.com specifier",
      currentValue: "0.1.0",
      depName: "@bar/foo",
    },
    {
      title: "should accept unpkg.com specifier without @scope",
      currentValue: "0.1.0",
      depName: "foo",
    },
  ];
  const matches = regexps[1]
    .map((re) =>
      Array.from(file.matchAll(new RegExp(re, "gm"))).map((e) => e.groups),
    )
    .flat();
  it(`should be match ${expects.length} object`, () => {
    expect(matches.length).toBe(expects.length);
  });

  for (let i = 0; i < expects.length; i++) {
    it(expects[i].title, () => {
      expect(matches[i]?.currentValue).toBe(expects[i].currentValue);
      expect(matches[i]?.depName).toBe(expects[i].depName);
    });
  }
});

describe("3: deno.land for import map", () => {
  const file = `
  import { join } from "https://deno.land/std@0.204.0/path/mod.ts";
  export { someFuncion } from "https://deno.land/std@0.204.0/some/mod.ts";
  import { someFuncion } from "https://deno.land/std@v1.0.0/some/mod.ts";
  export { someFuncion } from "https://deno.land/x/some_module@0.1.0/some/mod.ts";
  `;
  const expects = [
    {
      title: "should accept deno.land/std",
      currentValue: "0.204.0",
      depName: "https://deno.land/std",
    },
    {
      title: "should accept export specifier",
      currentValue: "0.204.0",
      depName: "https://deno.land/std",
    },
    {
      title: "should accept if 'v' in version",
      currentValue: "1.0.0",
      depName: "https://deno.land/std",
    },
    {
      title: "should accept deno.land/x",
      currentValue: "0.1.0",
      depName: "https://deno.land/x/some_module",
    },
  ];

  const matches = regexps[2]
    .map((re) =>
      Array.from(file.matchAll(new RegExp(re, "gm"))).map((e) => e.groups),
    )
    .flat();
  it(`should be match ${expects.length} object`, () => {
    expect(matches.length).toBe(expects.length);
  });

  for (let i = 0; i < expects.length; i++) {
    it(expects[i].title, () => {
      expect(matches[i]?.currentValue).toBe(expects[i].currentValue);
      expect(matches[i]?.depName).toBe(expects[i].depName);
    });
  }
});

describe("4: npm for js file", () => {
  const file = `
  import chalk from "npm:chalk@5.0.1";
  export chalk from "https://esm.sh/chalk@5.0.1";
  import chalk from "npm:chalk@5";
  import foo from "https://unpkg.com/@bar/foo@0.1.0/foo.ts";
  import foo from "https://unpkg.com/foo@0.1.0/umd/foo.production.min.js";
  `;

  const expects = [
    {
      title: "should accept npm specifier",
      currentValue: "5.0.1",
      depName: "chalk",
    },
    {
      title: "should accept esm.sh specifier",
      currentValue: "5.0.1",
      depName: "chalk",
    },
    {
      title: "should accept only major version",
      currentValue: "5",
      depName: "chalk",
    },
    {
      title: "should accept unpkg.com specifier",
      currentValue: "0.1.0",
      depName: "@bar/foo",
    },
    {
      title: "should accept unpkg.com specifier without @scope",
      currentValue: "0.1.0",
      depName: "foo",
    },
  ];

  const matches = regexps[3]
    .map((re) =>
      Array.from(file.matchAll(new RegExp(re, "gm"))).map((e) => e.groups),
    )
    .flat();
  it(`should be match ${expects.length} object`, () => {
    expect(matches.length).toBe(expects.length);
  });

  for (let i = 0; i < expects.length; i++) {
    it(expects[i].title, () => {
      expect(matches[i]?.currentValue).toBe(expects[i].currentValue);
      expect(matches[i]?.depName).toBe(expects[i].depName);
    });
  }
});

describe("5: github tag for import_map", () => {
  const file = `
  {
    "imports": {
      "sample": "https://raw.githubusercontent.com/user/repo/1.0.0/mod.ts",
      "sample": "https://pax.deno.dev/user/repo@1.0.0/mod.ts",
      "sample": "https://pax.deno.dev/user/repo@1.0.0",
      "sample": "https://raw.githubusercontent.com/user/repo/someversion/mod.ts"
    }
  }`;

  const expects = [
    {
      title: "should accept raw.githubusercontent.com",
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept pax.deno.dev",
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept omit 'mod.ts' when specify pax.deno.dev",
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept un-semver version",
      currentValue: "someversion",
      depName: "user/repo",
    },
  ];

  const matches = regexps[4]
    .map((re) =>
      Array.from(file.matchAll(new RegExp(re, "gm"))).map((e) => e.groups),
    )
    .flat();
  it(`should be match ${expects.length} object`, () => {
    expect(matches.length).toBe(expects.length);
  });

  for (let i = 0; i < expects.length; i++) {
    it(expects[i].title, () => {
      expect(matches[i]?.currentValue).toBe(expects[i].currentValue);
      expect(matches[i]?.depName).toBe(expects[i].depName);
    });
  }
});

describe("6: github tag for js file", () => {
  const file = `
  import { sample } from "https://raw.githubusercontent.com/user/repo/1.0.0/mod.ts",
  import { sample } from "https://pax.deno.dev/user/repo@1.0.0/mod.ts",
  import { sample } from "https://pax.deno.dev/user/repo@1.0.0",
  import { sample } from "https://raw.githubusercontent.com/user/repo/someversion/mod.ts"
  `;

  const expects = [
    {
      title: "should accept raw.githubusercontent.com",
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept pax.deno.dev",
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept omit 'mod.ts' when specify pax.deno.dev",
      currentValue: "1.0.0",
      depName: "user/repo",
    },
    {
      title: "should accept un-semver version",
      currentValue: "someversion",
      depName: "user/repo",
    },
  ];

  const matches = regexps[5]
    .map((re) =>
      Array.from(file.matchAll(new RegExp(re, "gm"))).map((e) => e.groups),
    )
    .flat();
  it(`should be match ${expects.length} object`, () => {
    expect(matches.length).toBe(expects.length);
  });

  for (let i = 0; i < expects.length; i++) {
    it(expects[i].title, () => {
      expect(matches[i]?.currentValue).toBe(expects[i].currentValue);
      expect(matches[i]?.depName).toBe(expects[i].depName);
    });
  }
});
