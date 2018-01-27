import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { TabAccountPage } from "./tab-account";
import { ComponentsModule } from "../../components/components.module";

@NgModule({
  declarations: [TabAccountPage],
  imports: [IonicPageModule.forChild(TabAccountPage), ComponentsModule],
})
export class TabAccountPageModule {}
