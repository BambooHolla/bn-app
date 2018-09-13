export enum PAGE_STATUS {
  UNLOAD = 0,
  WILL_ENTER,
  DID_ENTER,
  WILL_LEAVE,
  DID_LEAVE,
}

const _ERROR_FROM_ASYNCERROR_CODE =
  "CATCHED_ERROR@" +
  Math.random()
    .toString(36)
    .substr(2);

export function getErrorFromAsyncerror(keep_throw?: boolean) {
  const res = {
    code: _ERROR_FROM_ASYNCERROR_CODE,
  };
  if (keep_throw) {
    return Promise.reject<{ code: string }>(res);
  }
  return res;
}
export function isErrorFromAsyncerror(err) {
  return err && err.code === _ERROR_FROM_ASYNCERROR_CODE;
}
