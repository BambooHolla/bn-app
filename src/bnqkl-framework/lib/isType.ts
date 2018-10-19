export const IsIOS = () => !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
export const is_dev = (() => {
  const test_fun = function DEV_WITH_FULL_NAME() {};
  return test_fun.name === "DEV_WITH_FULL_NAME";
  // return isDevMode();
})();
