import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { ScanLinkPeerPage } from "./scan-link-peer";
import { ComponentsModule } from "../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";
import { PipesModule } from "../../pipes/pipes.module";
import { DirectivesModule } from "../../directives/directives.module";

@NgModule({
	declarations: [ScanLinkPeerPage],
	imports: [
		IonicPageModule.forChild(ScanLinkPeerPage),
		ComponentsModule,
		TranslateModule,
		PipesModule,
		DirectivesModule,
	],
})
export class ScanLinkPeerPageModule {}
