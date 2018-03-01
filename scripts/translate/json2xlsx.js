const xlsx = require("node-xlsx");
const { parse, Visitor, AST } = require("json-ast");
const crypto = require("crypto");
const fs = require("fs");
const { geti18nFileData } = require("./helper");

const zh_CN_json_obj = JSON.parse(geti18nFileData("zh-cmn-Hans"));
const langs = ["zh-cmn-Hans", "en", "ja"];
const tableData = [
	[
		"编码",
		...langs.map(lang => zh_CN_json_obj["LANG_" + lang] + `（${lang}）`),
	],
];

class LangVisitor extends Visitor {
	constructor(lang) {
		super();
		this.lang = lang;
	}

	property(propertyNode) {
		const key = propertyNode.key.value;
		const value = propertyNode.value.value;

		const map = dataMap.get(key);
		if (map) {
			map[this.lang] = value;
		}
	}
}
const dataMap = new Map();
for (let key in zh_CN_json_obj) {
	if (key.startsWith("//")) {
		continue;
	}
	dataMap.set(key, {
		// key本身就是英文，默认提供英文版本，在根据现有的json文件进行覆盖
		en: key
			.replace(/[\-\_]/g, " ")
			.replace(/\#([\w\W]+?)\#/, "{{$1}}")
			.toLowerCase(),
	});
}
// 解析语言包到dataMap
langs.forEach(lang => {
	const jsonData = geti18nFileData(lang);
	const ast = parse(jsonData, { verbose: false, junker: false });
	const langVistor = new LangVisitor(lang);
	langVistor.visit(ast);
});
// 将dataMap转成tableData
for (let [key, value] of dataMap.entries()) {
	tableData.push([key, ...langs.map(lang => value[lang] || "")]);
}

const md5_str = crypto
	.createHash("md5")
	.update(JSON.stringify(tableData))
	.digest("hex");
const buffer = xlsx.build([{ name: "翻译", data: tableData }]);
const res_file_path = __dirname + "/output-xlsx/translate." + md5_str + ".xlsx";
if (fs.existsSync(res_file_path)) {
	console.log("文件已经存在");
} else {
	console.log("文件导出：", res_file_path);
	fs.writeFileSync(res_file_path, buffer);
}
