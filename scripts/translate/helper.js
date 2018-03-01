const fs = require("fs");
exports.geti18nFileData = function geti18nFileData(lang) {
	const cache = geti18nFileData.cache || (geti18nFileData.cache = new Map());
	if (cache.has(lang)) {
		return cache.get(lang);
	} else {
		const data = fs.readFileSync(
			__dirname + "/../../src/assets/i18n/" + lang + ".json",
			"UTF-8",
		);
		cache.set(lang, data);
		return data;
	}
}