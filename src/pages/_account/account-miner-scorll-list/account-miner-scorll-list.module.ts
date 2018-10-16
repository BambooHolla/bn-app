import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { AccountMinerScorllListPage } from "./account-miner-scorll-list";
import { MatButtonModule } from "@angular/material";

@NgModule({
	declarations: [AccountMinerScorllListPage],
	imports: [IonicPageModule.forChild(AccountMinerScorllListPage), ComponentsModule, PipesModule, TranslateModule, MatButtonModule],
})
export class AccountMinerScorllListPageModule {}
