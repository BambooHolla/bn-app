import { Component, ViewChild, ElementRef } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { ChainMeshComponent } from "../../components/chain-mesh/chain-mesh";
import {
  PeerServiceProvider,
  PeerModel,
} from "../../providers/peer-service/peer-service";

@IonicPage({ name: "scan-nodes" })
@Component({
  selector: "page-scan-nodes",
  templateUrl: "scan-nodes.html",
})
export class ScanNodesPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public peerService: PeerServiceProvider,
  ) {
    super(navCtrl, navParams);
  }
  // @ViewChild(ChainMeshComponent) cmesh: ChainMeshComponent;

  // @ScanNodesPage.didEnter
  // initEarchPos() {
  //   this.cmesh.startAnimation();
  //   // this.earth.camera.position.y = -10 * this.earth.devicePixelRatio;
  //   // this.earth.camera.position.z /= 1.6;
  // }

  nodes = [];
  @ScanNodesPage.willEnter
  async scanNodes() {
    const peer_url_list = await this.peerService.getAllPeers();
    const add_nodes = () => {
      const peer_url = peer_url_list.pop();
      if (!peer_url) {
        this.gotoLinkNodes();
        return;
      }
      const ran_deg = Math.PI * 2 * Math.random();
      const ran_len = (Math.random() * 100 - 50) * 0.9 + 10;

      this.nodes.push({
        peer_url,
        _pos_top: Math.sin(ran_deg) * ran_len + 50,
        _pos_left: Math.cos(ran_deg) * ran_len + 50,
      });
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
