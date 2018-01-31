import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { PwdInputPage } from "./pwd-input";
import { DirectivesModule } from "../../directives/directives.module";

@NgModule({
	declarations: [PwdInputPage],
	imports: [IonicPageModule.forChild(PwdInputPage), DirectivesModule],
})
export class PwdInputPageModule {}
