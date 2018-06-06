import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AccountVoucherWalletPage } from "./account-voucher-wallet";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
	declarations: [AccountVoucherWalletPage],
	imports: [
		IonicPageModule.forChild(AccountVoucherWalletPage),
		TranslateModule,
		DirectivesModule,
		ComponentsModule,
	],
})
export class AccountVoucherWalletPageModule {}
