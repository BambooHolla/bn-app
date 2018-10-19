import { is_dev } from "./isType";

export const global = typeof self === "object" ? self : window;
export function tryRegisterGlobal(name, obj) {
  if (is_dev) {
    return (global[name] = obj);
  }
}
