import { Component } from "@angular/core";
import {
  IonicPage,
  MenuController,
  NavController,
  Platform,
} from "ionic-angular";

import { TranslateService } from "@ngx-translate/core";
import { MyApp } from "../../app/app.component";

export interface Slide {
  title: string;
  description: string;
  image: string;
}

@IonicPage({ name: "tutorial" })
@Component({
  selector: "page-tutorial",
  templateUrl: "tutorial.html",
})
export class TutorialPage {
  slides?: Slide[];
  showSkip = true;
  dir: string = "ltr";

  constructor(
    public navCtrl: NavController,
    public menu: MenuController,
    translate: TranslateService,
    public platform: Platform,
    public myapp: MyApp,
  ) {
    this.dir = platform.dir();
    translate
      .get([
        "TUTORIAL_SLIDE1_TITLE",
        "TUTORIAL_SLIDE1_DESCRIPTION",
        "TUTORIAL_SLIDE2_TITLE",
        "TUTORIAL_SLIDE2_DESCRIPTION",
        "TUTORIAL_SLIDE3_TITLE",
        "TUTORIAL_SLIDE3_DESCRIPTION",
      ])
      .subscribe(values => {
        console.log("Loaded values", values);
        this.slides = [
          {
            title: values.TUTORIAL_SLIDE1_TITLE,
            description: values.TUTORIAL_SLIDE1_DESCRIPTION,
            image: "assets/imgs/tutorial/1.jpg",
          },
          {
            title: values.TUTORIAL_SLIDE2_TITLE,
            description: values.TUTORIAL_SLIDE2_DESCRIPTION,
            image: "assets/imgs/tutorial/2.jpg",
          },
          {
            title: values.TUTORIAL_SLIDE3_TITLE,
            description: values.TUTORIAL_SLIDE3_DESCRIPTION,
            image: "assets/imgs/tutorial/3.jpg",
          },
        ];
      });
  }

  startApp() {
    localStorage.setItem("HIDE_WELCOME", "1");
    this.myapp.openPage(this.myapp.tryInPage, true);
  }

  onSlideChangeStart(slider) {
    this.showSkip = !slider.isEnd();
  }

  ionViewDidEnter() {
    // the root left menu should be disabled on the tutorial page
    this.menu.enable(false);
  }

  ionViewWillLeave() {
    // enable the root left menu when leaving the tutorial page
    this.menu.enable(true);
  }
}
