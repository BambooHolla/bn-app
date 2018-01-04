import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { ScanNodesPage } from "./scan-nodes";
import { ComponentsModule } from "../../components/components.module";

@NgModule({
	declarations: [ScanNodesPage],
	imports: [IonicPageModule.forChild(ScanNodesPage), ComponentsModule],
})
export class ScanNodesPageModule {}
