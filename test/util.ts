import { readFileSync } from "node:fs";

type CustomManager = {
  customType: "jsonata" | "regex";
  matchStrings: string[];
};

export type Config = {
  customManagers: CustomManager[];
};

export const parse = (path: string): Config => {
  return JSON.parse(readFileSync(path).toString());
};
