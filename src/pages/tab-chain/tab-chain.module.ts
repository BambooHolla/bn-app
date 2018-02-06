import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { TabChainPage } from "./tab-chain";
import { ComponentsModule } from "../../components/components.module";
import { PipesModule } from "../../pipes/pipes.module";
import { DirectivesModule } from "../../directives/directives.module";

@NgModule({
	declarations: [TabChainPage],
	imports: [
		IonicPageModule.forChild(TabChainPage),
		ComponentsModule,
		PipesModule,
		DirectivesModule,
	],
})
export class TabChainPageModule {}
