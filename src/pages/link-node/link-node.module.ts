import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { LinkNodePage } from "./link-node";
import { ComponentsModule } from "../../components/components.module";
import { PipesModule } from "../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [LinkNodePage],
  imports: [
    IonicPageModule.forChild(LinkNodePage),
    ComponentsModule,
    PipesModule,
    TranslateModule,
  ],
})
export class LinkNodePageModule {}
