const xlsx = require("node-xlsx");
const { parse, Visitor, AST } = require("json-ast");
const crypto = require("crypto");
const fs = require("fs");
const prettier = require("prettier");
const prettierConfig = JSON.parse(
	fs.readFileSync(__dirname + "/../../.prettierrc"),
);
const { geti18nFileData } = require("./helper");

const outputXlsxFiles = fs
	.readdirSync(__dirname + "/output-xlsx")
	.map(filename => {
		const filepath = __dirname + "/output-xlsx/" + filename;
		const filestat = fs.statSync(filepath);
		return {
			filename,
			filepath,
			filestat,
		};
	})
	.sort((a, b) => b.mtimeMs - a.mtimeMs);

const nearFileInfo = outputXlsxFiles[0];

const fileData = xlsx.parse(nearFileInfo.filepath)[0].data;
const langs = fileData[0]
	.map(title => {
		const lang_info = title.match(/（([\w\W]+?)）/);
		return lang_info && lang_info[1];
	})
	.filter(v => v);

const chinaValueToKeyMap = new Map();
{
	const chinaJSON = JSON.parse(geti18nFileData("zh-cmn-Hans"));
	Object.keys(chinaJSON).map(key => {
		if (key !== "//") {
			const value = chinaJSON[key];
			if (chinaValueToKeyMap.has(value)) {
				chinaValueToKeyMap.get(value).push(key);
			} else {
				chinaValueToKeyMap.set(value, [key]);
			}
		}
	});
}
const dataMap = new Map();
fileData.slice(1).forEach(row => {
	const map = {};
	langs.forEach((lang, i) => {
		map[lang] = row[i + 1];
	});
	dataMap.set(row[0], map);
});

class ChinaLangVisitor extends Visitor {
	constructor(lang) {
		super();
		this.lang = lang;
		this.json_str_list = [];
	}

	property(propertyNode) {
		const key = propertyNode.key.value;
		const china_value = propertyNode.value.value;
		if (key == "//") {
			this.json_str_list.push(
				JSON.stringify(key) + ":" + JSON.stringify(china_value),
			);
		} else {
			const map = dataMap.get(key);
			let tran_value;
			if (map) {
				tran_value = map[this.lang];
			}
			// 尽可能找中文是一样的字段来填充
			if (!tran_value) {
				tran_value = (chinaValueToKeyMap.get(china_value) || []).filter(
					key => {
						const map = dataMap.get(key);
						if (map) {
							return map[this.lang];
						}
					},
				)[0];
			}

			if (tran_value) {
				this.json_str_list.push(
					JSON.stringify(key) + ":" + JSON.stringify(tran_value),
				);
			}
		}
	}

	toJSONString() {
		return `{${this.json_str_list.join(",")}}`;
	}
}

const file_hash = nearFileInfo.filename.split(".")[1];
const output_folder = __dirname + "/output-json/" + file_hash;
if (
	!(fs.existsSync(output_folder) && fs.statSync(output_folder).isDirectory())
) {
	fs.mkdirSync(output_folder);
}
console.log(`输入文件夹: ${output_folder}`);

langs.forEach(lang => {
	if (lang === "zh-cmn-Hans") {
		return;
	}
	// 使用 简体中文 语言包作为模板
	const ast = parse(geti18nFileData("zh-cmn-Hans"), {
		verbose: false,
		junker: false,
	});
	const chinaLangVisitor = new ChinaLangVisitor(lang);
	chinaLangVisitor.visit(ast);
	// 格式化解析结果
	const json_str = prettier.format(chinaLangVisitor.toJSONString(), {
		...prettierConfig,
		parser: "json",
	});
	fs.existsSync();
	fs.writeFileSync(output_folder + "/" + lang + ".json", json_str);
});
