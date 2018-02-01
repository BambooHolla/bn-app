import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountMinerListPage } from "./account-miner-list";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
	declarations: [AccountMinerListPage],
	imports: [
		IonicPageModule.forChild(AccountMinerListPage),
		ComponentsModule,
		PipesModule,
		TranslateModule,
	],
})
export class AccountMinerListPageModule {}
