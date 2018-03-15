const package_json = require("../package.json");
const fs = require("fs");

const index_html = fs.readFileSync(__dirname + "/../src/index.html", "utf-8");

const cordova_js_line = `<script src="cordova.js"></script>`;
const new_index_html = index_html
	.split("\n")
	.map(line => {
		if (line.indexOf(cordova_js_line) !== -1) {
			return (
				cordova_js_line +
				`<script>APP_VERSION='${package_json.version}'</script>`
			);
		}
		return line;
	})
	.join("\n");
fs.writeFileSync(__dirname + "/../src/index.html", new_index_html);
