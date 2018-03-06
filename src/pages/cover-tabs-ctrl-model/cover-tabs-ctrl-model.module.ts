import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { CoverTabsCtrlModelPage } from "./cover-tabs-ctrl-model";
import { ComponentsModule } from "../../components/components.module";

@NgModule({
  declarations: [CoverTabsCtrlModelPage],
  imports: [IonicPageModule.forChild(CoverTabsCtrlModelPage), ComponentsModule],
})
export class CoverTabsCtrlModelPageModule {}
