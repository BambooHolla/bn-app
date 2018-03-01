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

const dataMap = new Map();
fileData.slice(1).forEach(row => {
	const map = {};
	langs.forEach((lang, i) => {
		map[lang] = row[i + 1];
	});
	dataMap.set(row[0], map);
});

class LangVisitor extends Visitor {
	constructor(lang) {
		super();
		this.lang = lang;
		this.json_str_list = [];
	}

	property(propertyNode) {
		const key = propertyNode.key.value;
		const value = propertyNode.value.value;
		if (key == "//") {
			this.json_str_list.push(
				JSON.stringify(key) + ":" + JSON.stringify(value),
			);
		} else {
			const map = dataMap.get(key);
			if (map) {
				const tran_value = map[this.lang];
				if (tran_value) {
					this.json_str_list.push(
						JSON.stringify(key) + ":" + JSON.stringify(tran_value),
					);
				}
			}
		}
	}

	toJSONString() {
		return `{${this.json_str_list.join(",")}}`;
	}
}

langs.forEach(lang => {
	if (lang === "zh-cmn-Hans") {
		return;
	}
	// 使用 简体中文 语言包作为模板
	const ast = parse(geti18nFileData("zh-cmn-Hans"), {
		verbose: false,
		junker: false,
	});
	const langVisitor = new LangVisitor(lang);
	langVisitor.visit(ast);
	// 格式化解析结果
	const json_str = prettier.format(langVisitor.toJSONString(), {
		...prettierConfig,
		parser: "json",
	});
	fs.writeFileSync(__dirname + "/output-json/" + lang + ".json", json_str);
});
