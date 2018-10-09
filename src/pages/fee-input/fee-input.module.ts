import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { FeeInputPage } from "./fee-input";
import { DirectivesModule } from "../../directives/directives.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [FeeInputPage],
  imports: [
    IonicPageModule.forChild(FeeInputPage),
    DirectivesModule,
    TranslateModule,
  ],
})
export class FeeInputPageModule {}
