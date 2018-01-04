import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { MainPage } from "../pages";

@IonicPage({ name: "link-node" })
@Component({
	selector: "page-link-node",
	templateUrl: "link-node.html",
})
export class LinkNodePage extends FirstLevelPage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {
		super(navCtrl, navParams);
	}
	nodes: any[];
	@LinkNodePage.willEnter
	getNodes() {
		this.nodes = this.navParams.get("nodes");
		if (!this.nodes || this.nodes.length == 0) {
			return this.routeTo("scan-nodes", undefined, {
				animation: "wp-transition",
			});
		}
		var _auto_link_started = false;
		this.nodes.forEach(node => {
			if (Math.random() > 0.3) {
				// 模拟ping成功
				const ping = Math.random() * 200;
				const run_ping = () => {
					var diff = Math.random() * 10;
					const start_time = performance.now();
					setTimeout(() => {
						const end_time = performance.now();
						node.ping = end_time - start_time;
						// 两秒后自动选择并连接节点
						if (!_auto_link_started) {
							_auto_link_started = true;
							setTimeout(() => {
								this.timeoutAutoLinkFastetNode();
							}, 2000);
						}
						setTimeout(() => {
							run_ping();
						}, 5000);
					}, ping + diff);
				};
				setTimeout(() => {
					run_ping();
				}, 5000 * Math.random());
			}
		});
	}

	formData = {
		selected_node_id: null,
	};
	selectNode(node) {
		if (node.ping > 0) {
			this.formData.selected_node_id = node.id;
		}
	}
	hideIp(ipv4) {
		const ipinfo = ipv4.split(".");
		if (ipinfo.length == 4) {
			ipinfo.splice(1, 2, "⁎⁎");
		}
		return ipinfo.join(".");
	}

	timeoutAutoLinkFastetNode() {
		if(this.formData.selected_node_id){
			return
		}
		const fastet_node = this.nodes
			.filter(node => node.ping > 0)
			.sort((a, b) => a.ping - b.ping)[0];
		if (fastet_node) {
			this.formData.selected_node_id = fastet_node.id;
			this.linkNode(fastet_node);
		}
	}

	linkSelectedNode() {
		const selected_node = this.nodes.find(
			node => node.id === this.formData.selected_node_id,
		);
		if (selected_node) {
			this.linkNode(selected_node);
		}
	}

	@asyncCtrlGenerator.loading(LinkNodePage.getTranslate("LINKING_PEER_NODE"))
	@asyncCtrlGenerator.error(LinkNodePage.getTranslate("LINK_PEER_NODE_ERROR"))
	async linkNode(node) {
		await new Promise(cb => setTimeout(cb, 600 * Math.random() + 200));
		if (Math.random() > 0.5) {
			this.routeTo(MainPage);
		} else {
			throw new Error("节点连接失败");
		}
	}
}
