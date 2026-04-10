import { isAbsolute, resolve } from "node:path";

export function resolveRuntimePath(value: string) {
  return isAbsolute(value)
    ? value
    : resolve(/* turbopackIgnore: true */ process.cwd(), value);
}
