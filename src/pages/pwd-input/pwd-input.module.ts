import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { PwdInputPage } from "./pwd-input";
import { DirectivesModule } from "../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatButtonModule } from "@angular/material";

@NgModule({
	declarations: [PwdInputPage],
	imports: [IonicPageModule.forChild(PwdInputPage), DirectivesModule, TranslateModule, MatButtonModule],
})
export class PwdInputPageModule {}
