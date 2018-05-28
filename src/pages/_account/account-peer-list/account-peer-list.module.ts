import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountPeerListPage } from "./account-peer-list";
import { TranslateModule } from "@ngx-translate/core";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";

@NgModule({
	declarations: [AccountPeerListPage],
	imports: [
		IonicPageModule.forChild(AccountPeerListPage),
		TranslateModule,
		ComponentsModule,
		PipesModule,
	],
})
export class AccountPeerListPageModule {}
