import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { AccountMinerListPage } from "./account-miner-list";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";

@NgModule({
	declarations: [AccountMinerListPage],
	imports: [IonicPageModule.forChild(AccountMinerListPage), ComponentsModule, PipesModule, TranslateModule, MatButtonModule],
})
export class AccountMinerListPageModule {}
