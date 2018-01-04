import { Component, ViewChild, ElementRef } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { EarthNetMeshComponent } from "../../components/earth-net-mesh/earth-net-mesh";

@IonicPage({ name: "scan-nodes" })
@Component({
	selector: "page-scan-nodes",
	templateUrl: "scan-nodes.html",
})
export class ScanNodesPage extends FirstLevelPage {
	constructor(public navCtrl: NavController, public navParams: NavParams) {
		super(navCtrl, navParams);
	}
	@ViewChild(EarthNetMeshComponent) earth: EarthNetMeshComponent;

	@ScanNodesPage.didEnter
	initEarchPos() {
		this.earth.camera.position.y = -10 * this.earth.devicePixelRatio;
		// this.earth.camera.position.z /= 1.6;
	}

	nodes = [];
	@ScanNodesPage.willEnter
	scanNodes() {
		const add_nodes = () => {
			const ran_deg = Math.PI * 2 * Math.random();
			const ran_len = (Math.random() * 100 - 50) * 0.9 + 10;
			this.nodes.push({
				id: this.nodes.length,
				ip: Array.from({ length: 4 })
					.map(() => (256 * Math.random()) | 0)
					.join("."),
				height: parseInt(
					new Date()
						.toDateString()
						.match(/\d+/g)
						.join(""),
				),
				ping: 0,
				linked_number: (Math.random() * 50) | 0,
				port: 8080,
				_pos_top: Math.sin(ran_deg) * ran_len + 50,
				_pos_left: Math.cos(ran_deg) * ran_len + 50,
			});
			if (this.nodes.length > 10 && Math.random() > 0.5) {
				this.gotoLinkNodes();
				return;
			}
			setTimeout(add_nodes, Math.random() * 500);
		};
		add_nodes();
	}

	gotoLinkNodes() {
		return this.routeTo(
			"link-node",
			{ nodes: this.nodes },
			{
				animation: "wp-transition",
			},
		);
	}
}
