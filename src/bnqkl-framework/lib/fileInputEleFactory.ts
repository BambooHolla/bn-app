export function fileInputEleFactory(ele_id: string, accept = "image/*") {
  const inputEle_id = "qrcodePicker";
  // 必须把触发函数写在click里头，不然安全角度来说，是无法正常触发的
  const inputEle = (document.getElementById(inputEle_id) as HTMLInputElement) || document.createElement("input");
  if (inputEle.id !== inputEle_id) {
    inputEle.id = inputEle_id;
    inputEle.type = "file";
    inputEle.accept = "image/*";
    document.body.appendChild(inputEle);
    inputEle.style.position = "absolute";
    inputEle.style.zIndex = "-1000";
    inputEle.style.left = "0";
    inputEle.style.top = "0";
    inputEle.style.visibility = "hidden";
    inputEle.style.width = "0";
    inputEle.style.height = "0";
  }
  return inputEle;
}
