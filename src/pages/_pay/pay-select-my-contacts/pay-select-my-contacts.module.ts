import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { PaySelectMyContactsPage } from "./pay-select-my-contacts";
import { ComponentsModule } from "../../../components/components.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";

@NgModule({
	declarations: [PaySelectMyContactsPage],
	imports: [IonicPageModule.forChild(PaySelectMyContactsPage), ComponentsModule, PipesModule, TranslateModule, MatButtonModule],
})
export class PaySelectMyContactsPageModule {}
