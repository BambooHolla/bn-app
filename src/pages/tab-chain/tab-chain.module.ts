import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { TabChainPage } from "./tab-chain";
import { ComponentsModule } from "../../components/components.module";

@NgModule({
	declarations: [TabChainPage],
	imports: [IonicPageModule.forChild(TabChainPage), ComponentsModule],
})
export class TabChainPageModule {}
