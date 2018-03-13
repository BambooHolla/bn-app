import { Component } from "@angular/core";
import {
  IonicPage,
  MenuController,
  NavController,
  NavParams,
  Platform,
  Slides,
} from "ionic-angular";
import { FirstLevelPage } from "../../bnqkl-framework/FirstLevelPage";
import { MyApp } from "../../app/app.component";

export interface SlideItem {
  class: string;
  title: string;
  description: string;
  image: string;
}

// @IonicPage({ name: "tutorial" })
@Component({
  selector: "page-tutorial",
  templateUrl: "tutorial.html",
})
export class TutorialPage extends FirstLevelPage {
  slides?: SlideItem[];
  showSkip = true;
  dir: string = "ltr";

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public menu: MenuController,
    public myapp: MyApp,
  ) {
    super(navCtrl, navParams);
    this.dir = this.platform.dir();
    this.translate
      .stream([
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
            class: "slide-1",
            title: values.TUTORIAL_SLIDE2_TITLE,
            description: values.TUTORIAL_SLIDE2_DESCRIPTION,
            image: "assets/imgs/tutorial/2.jpg",
          },
          {
            class: "slide-2",
            title: values.TUTORIAL_SLIDE3_TITLE,
            description: values.TUTORIAL_SLIDE3_DESCRIPTION,
            image: "assets/imgs/tutorial/3.jpg",
          },
          {
            class: "slide-0",
            title: values.TUTORIAL_SLIDE1_TITLE,
            description: values.TUTORIAL_SLIDE1_DESCRIPTION,
            image: "assets/imgs/tutorial/1.jpg",
          },
        ];
      });
  }
  // @TutorialPage.willEnter
  // fixStaturBug() {
  //   this.myapp.tryOverlaysWebView();
  // }
  get lang_code() {
    return this.translate.currentLang;
  }

  startApp() {
    console.log("startApp");
    localStorage.setItem("HIDE_WELCOME", "1");
    this.myapp.openPage(this.myapp.tryInPage, true);
  }

  onSlideChangeStart(slider: Slides) {
    this.showSkip = !slider.isEnd();
  }

  onSlideDrag(slider: Slides) {
    const touchs = slider._touches;
    if (!this.showSkip && touchs.diff < -150) {
      console.log("drag", touchs.diff);
      this.startApp();
    }
  }
  onSlideTap() {
    if (!this.showSkip) {
      console.log("tap");
      this.startApp();
    }
  }

  @TutorialPage.didEnter
  disableMenu() {
    // the root left menu should be disabled on the tutorial page
    this.menu.enable(false);
  }

  @TutorialPage.didLeave
  enableMenu() {
    // enable the root left menu when leaving the tutorial page
    this.menu.enable(true);
  }
}
