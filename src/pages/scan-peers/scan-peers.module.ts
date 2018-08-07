import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { ScanPeersPage } from "./scan-peers";
import { ComponentsModule } from "../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [ScanPeersPage],
  imports: [
    IonicPageModule.forChild(ScanPeersPage),
    ComponentsModule,
    TranslateModule,
  ],
})
export class ScanPeersPageModule {}
