import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { TabAccountPage } from "./tab-account";
import { ComponentsModule } from "../../components/components.module";
import { PipesModule } from "../../pipes/pipes.module";

@NgModule({
  declarations: [TabAccountPage],
  imports: [
    IonicPageModule.forChild(TabAccountPage),
    ComponentsModule,
    PipesModule,
  ],
})
export class TabAccountPageModule {}
