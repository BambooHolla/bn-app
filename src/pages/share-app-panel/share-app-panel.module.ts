import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { ShareAppPanelPage } from "./share-app-panel";
import { ComponentsModule } from "../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";
import { PipesModule } from "../../pipes/pipes.module";
import { MatButtonModule } from "@angular/material";

@NgModule({
	declarations: [ShareAppPanelPage],
	imports: [IonicPageModule.forChild(ShareAppPanelPage), ComponentsModule, TranslateModule, PipesModule, MatButtonModule],
})
export class ShareAppPanelPageModule {}
