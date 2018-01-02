import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { TabAccountPage } from "./tab-account";

@NgModule({
  declarations: [TabAccountPage],
  imports: [IonicPageModule.forChild(TabAccountPage)],
})
export class TabAccountPageModule {}
