export const is_dev = (() => {
  const test_fun = function DEV_WITH_FULL_NAME() {};
  return test_fun.name === "DEV_WITH_FULL_NAME";
  // return isDevMode();
})();
export const global = typeof self === "object" ? self : window;
export function tryRegisterGlobal(name, obj) {
  if (is_dev) {
    return (global[name] = obj);
  }
}
