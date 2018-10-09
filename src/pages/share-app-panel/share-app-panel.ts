import { Component, Optional, ViewChild, ElementRef } from "@angular/core";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";
import {
  IonicPage,
  NavController,
  NavParams,
  Refresher,
  Content,
  ViewController,
} from "ionic-angular/index";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { asyncCtrlGenerator } from "../../bnqkl-framework/Decorator";
import { SocialSharing } from "@ionic-native/social-sharing";

@IonicPage({ name: "share-app-panel" })
@Component({
  selector: "page-share-app-panel",
  templateUrl: "share-app-panel.html",
})
export class ShareAppPanelPage extends FirstLevelPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public socialSharing: SocialSharing
  ) {
    super(navCtrl, navParams);
  }
  shareItems_line1 = [
    { title: "MORE", logo: "WECHAT", via: "" },
    { title: "GOOGLE+", logo: "GOOGLE+", via: "", disabled: true },
    { title: "TWITTER", logo: "TWITTER", via: "" },
  ];
  shareItems_line2 = [
    { title: "FACEBOOK", logo: "FACEBOOK", via: "" },
    { title: "INSTAGRAM", logo: "INSTAGRAM", via: "" },
    { title: "LINKIN", logo: "LINKIN", via: "", disabled: true },
  ];

  share_message!: string;
  share_link?: string;
  share_image_url!: string;
  @ShareAppPanelPage.willEnter
  initData() {
    this.share_message = this.navParams.get("message");
    this.share_link = this.navParams.get("link");
    this.share_image_url = this.navParams.get("image_url");
    if (!this.share_image_url) {
      const a = document.createElement("a");
      a.href = "assets/imgs/logo.png";
      this.share_image_url = a.href;
    }
    // this.socialSharing.canShareVia()
  }
  // @asyncCtrlGenerator.error("@@SHARE_APP_ERROR")
  async shareVia(via: { title: string; logo: string; disabled?: boolean }) {
    try {
      if (via.title === "TWITTER") {
        await this.socialSharing.shareViaTwitter(
          this.share_message,
          this.share_image_url,
          this.share_link
        );
      } else if (via.title === "FACEBOOK") {
        await this.socialSharing.shareViaFacebook(
          this.share_message,
          this.share_image_url,
          this.share_link
        );
      } else if (via.title === "INSTAGRAM") {
        await this.socialSharing.shareViaInstagram(
          this.share_message + " " + this.share_link,
          this.share_image_url
        );
      } else if (via.title === "MORE") {
        await this.shareMore();
      }
    } catch (err) {
      console.error(err);
      throw await this.getTranslate("YOU_SEEMS_TO_HAS_NO_INSTALL_THIS_APP");
    }
  }
  @asyncCtrlGenerator.error("@@SHARE_APP_ERROR")
  async shareMore() {
    return this.socialSharing.share(
      this.share_message,
      undefined,
      this.share_image_url,
      this.share_link
    );
  }
  closeModal() {
    return this.viewCtrl.dismiss();
  }
}
