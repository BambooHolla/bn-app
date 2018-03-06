import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { LinkNodePage } from "./link-node";
import { ComponentsModule } from "../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [LinkNodePage],
  imports: [
    IonicPageModule.forChild(LinkNodePage),
    ComponentsModule,
    TranslateModule,
  ],
})
export class LinkNodePageModule {}
