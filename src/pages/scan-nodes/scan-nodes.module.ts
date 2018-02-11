import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { ScanNodesPage } from "./scan-nodes";
import { ComponentsModule } from "../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [ScanNodesPage],
  imports: [
    IonicPageModule.forChild(ScanNodesPage), 
    ComponentsModule,
    TranslateModule,
  ],
})
export class ScanNodesPageModule {}
