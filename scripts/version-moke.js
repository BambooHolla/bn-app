const http = require("http");
const fs = require("fs");
const querystring = require("querystring");
const url = require("url");

/*MOKE DATA*/
const package_json = require("../package.json");
const latest_version_info = JSON.stringify({
	version: package_json.version + "-aplha",
	changelogs: [`没什么变动，真的`, `啊哈哈哈哈`],
	hotreload_version: "",
	download_link_android:
		"https://www.ifmchain.com/files/ibt-android-v2.1.3.apk",
	download_link_ios_plist:
		"itms-services://?action=download-manifest&url=https://www.ifmchain.com/download.plist",
	download_link_web: "https://www.ifmchain.com/downloadv2.0.html",
	create_time: fs.statSync(__dirname + "/../package.json").mtimeMs,
	apk_size: 66666,
	plist_size: 13145,
	"//": "……",
	success: true,
});

/*API SERVER*/
http
	.createServer((req, res) => {
		const url_info = url.parse(req.url);
		const query = querystring.parse(url_info.query);

		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Allow-Methods", "GET");

		if (url_info.pathname === "/api/app/version/latest") {
			const lang = query.lang;
			// TODO: return diffrent result for diffrent language.

			res.setHeader("Content-Type", "application/json");
			res.end(latest_version_info);
			return;
		}
		res.statusCode = 404;
		res.end();
	})
	.listen(8180);
