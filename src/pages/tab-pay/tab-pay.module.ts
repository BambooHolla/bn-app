import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { TabPayPage } from "./tab-pay";
import { MomentModule } from "angular2-moment";
import { ComponentsModule } from "../../components/components.module";
import { PipesModule } from "../../pipes/pipes.module";

@NgModule({
  declarations: [TabPayPage],
  imports: [
    IonicPageModule.forChild(TabPayPage),
    MomentModule,
    ComponentsModule,
    PipesModule,
  ],
})
export class TabPayPageModule {}
