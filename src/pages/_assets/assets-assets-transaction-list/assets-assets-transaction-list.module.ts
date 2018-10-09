import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AssetsAssetsTransactionListPage } from "./assets-assets-transaction-list";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";
import { MomentModule } from "angular2-moment";

@NgModule({
	declarations: [AssetsAssetsTransactionListPage],
	imports: [
		IonicPageModule.forChild(AssetsAssetsTransactionListPage),
		TranslateModule,
		DirectivesModule,
		PipesModule,
		ComponentsModule,
		MatButtonModule,
		MomentModule,
	],
})
export class AssetsAssetsTransactionListPageModule {}
