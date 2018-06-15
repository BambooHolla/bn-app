export const getUTF8ByteSize = (str: string) => {
	var total = 0;
	for (var i = 0; i < str.length; i += 1) {
		const charCode = str.charCodeAt(i);
		if (charCode <= 0x007f) {
			total += 1;
		} else if (charCode <= 0x07ff) {
			total += 2;
		} else if (charCode <= 0xffff) {
			total += 3;
		} else {
			total += 4;
		}
	}
	return total;
};

export const getJsonObjectByteSize = object => {
	if (typeof object === "object" && object) {
		var total = 2 /*两个花括号 或者 两个中括号*/;
		for (var key in object) {
			total +=
				getUTF8ByteSize(key) +
				3 /*两个引号+一个冒号*/ +
				getJsonObjectByteSize(object[key]);
		}
		return total;
	} else {
		return getUTF8ByteSize(object + "");
	}
};
