const http = require('http');
const path = require('path');
const httpProxy = require('http-proxy');
const { Console } = require('console-pro');
const console = new Console();
const { Publisher } = require('@ionic/discover');
// 从参数传入
const host = process.argv
	.filter(arg => arg.startsWith('-H') || arg.startsWith('--host'))
	.map(arg =>
		arg
			.split('=')
			.slice(1)
			.join('=')
	)[0];
if (!host) {
	// 遍历局域网
	const ipv4_address = (function() {
		const os = require('os');
		const networkInterfaces = os.networkInterfaces();
		for (let networkName in networkInterfaces) {
			const networkInterface = networkInterfaces[networkName];
			for (let network of networkInterface) {
				if (
					network.family === 'IPv4' &&
					network.address.startsWith('192.168.')
				) {
					return network.address;
				}
			}
		}
	})();
	if (ipv4_address) {
		console.flag('当前地址', ipv4_address);
		const address_info = ipv4_address.split('.');
		const self_add = address_info.pop();
		const base_add = address_info.join('.') + '.';
		const tasks = [];
		const lineLog = require('single-line-log').stdout;

		const _process_total = 255 - 2;
		let _current_process = 0;
		const log_find_LAN_process = () => {
			lineLog(
				'嗅探局域网的Ionic服务中',
				`[${_current_process}/${_process_total}]\n`
			);
		};
		for (let add = 2; add < 255; add += 1) {
			// if (add == self_add) {
			// 	continue;
			// }
			tasks[tasks.length] = new Promise(_resolve => {
				var is_end = false;
				const resolve = data => {
					is_end = true;
					_resolve(data);
					_current_process += 1;
					log_find_LAN_process();
				};
				const ip_address = base_add + add;
				const req = http.get(
					`http://${ip_address}:8100/ionic-lab/api/v1/cordova`,
					res => {
						const bufs = [];
						res.on('data', chunk => bufs.push(chunk));
						res.on('end', () => {
							try {
								resolve({
									ip: ip_address,
									info: JSON.parse(Buffer.concat(bufs))
								});
							} catch (err) {
								resolve();
							}
						});
					}
				);
				req.on('error', () => {
					resolve();
				});
				req.end();
				setTimeout(() => {
					// 1~2s不响应就过掉
					if (!is_end) {
						req.abort();
					}
				}, 1000 + add);
			});
		}
		log_find_LAN_process();
		Promise.all(tasks)
			.then(async tasks_res => {
				const ionic_servers = tasks_res
					.filter(r => r)
					.filter(ionic_server => {
						const { info } = ionic_server;
						if (ionic_server.ip === ipv4_address) {
							console.error('警告，检测到本地服务，请先关闭本地服务！');
							console.info(
								`${ipv4_address} ${info.name} ${info.id} ${info.version}`
							);
						} else {
							return true;
						}
					});
				if (ionic_servers.length === 0) {
					console.log('无可用的Ionic服务！');
					return;
				}

				const menu = require('appendable-cli-menu');
				const selected_serve = await new Promise(cb => {
					const servers = menu('请选择要代理的Ionic服务', selected_options => {
						cb(selected_options.value);
					});

					ionic_servers.forEach((ionic_server, i) => {
						const { info, ip } = ionic_server;
						servers.add({
							name: `(${i +
								1}) ${ip} ${info.name} ${info.id} ${info.version}`,
							value: ionic_server
						});
					});
				});

				proxyIonicServe(selected_serve);
			})
			.catch(console.error.bind(console));
	}
}

function proxyIonicServe(serve_config) {
	const host = serve_config.ip;
	console.flag('代理基础文件服务', 8100);
	runProxy(host, 8100);
	console.flag('代理LiveReload服务', 35729);
	runProxy(host, 35729);
	console.flag('代理开发日志端口服务', 53703);
	runProxy(host, 53703);
	console.flag('代理Vorlon SERVER', 1337);
	runProxy(host, 1337);
	console.flag('代理Vorlon PROXY', 5050);
	runProxy(host, 5050);

	console.flag('局域网广播');
	const service = new Publisher('devapp', serve_config.info.name, 8100);
	service.start();
}

function runProxy(host, port) {
	const proxy = new httpProxy.createProxyServer({
		target: {
			host,
			port
		}
	});
	const proxyServer = http.createServer(function(req, res) {
		proxy.web(req, res);
	});

	proxyServer.on('upgrade', function(req, socket, head) {
		proxy.ws(req, socket, head);
	});

	proxyServer.listen(port);
}
