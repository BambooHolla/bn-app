import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { PaySelectMyLocalContactsPage } from "./pay-select-my-local-contacts";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";

@NgModule({
	declarations: [PaySelectMyLocalContactsPage],
	imports: [IonicPageModule.forChild(PaySelectMyLocalContactsPage), ComponentsModule, PipesModule, TranslateModule, MatButtonModule],
})
export class PaySelectMyLocalContactsPageModule {}
