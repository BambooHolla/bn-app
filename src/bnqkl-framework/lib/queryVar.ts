/*查询从外部进行配置的参数*/
export function getQueryVariable(key: string) {
  if (typeof localStorage === "object") {
    const res = localStorage.getItem(key);
    if (typeof res === "string") {
      return res;
    }
  }
  if (typeof sessionStorage === "object") {
    const res = sessionStorage.getItem(key);
    if (typeof res === "string") {
      return res;
    }
  }
  const query = location.search.substring(1);
  if (query) {
    const vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (decodeURIComponent(pair[0]) == key) {
        return decodeURIComponent(pair[1]);
      }
    }
  }
}
export function formatQueryVariable<T>(key: string, handle: (vairable?: string) => T) {
  return handle(getQueryVariable(key));
}
