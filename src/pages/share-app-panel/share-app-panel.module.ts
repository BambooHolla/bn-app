import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { ShareAppPanelPage } from "./share-app-panel";
import { ComponentsModule } from "../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";
import { PipesModule } from "../../pipes/pipes.module";

@NgModule({
	declarations: [ShareAppPanelPage],
	imports: [
		IonicPageModule.forChild(ShareAppPanelPage),
		ComponentsModule,
		TranslateModule,
		PipesModule,
	],
})
export class ShareAppPanelPageModule {}
