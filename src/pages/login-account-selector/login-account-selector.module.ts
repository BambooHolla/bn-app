import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { LoginAccountSelectorPage } from "./login-account-selector";
import { MatButtonModule } from "@angular/material";
import { DirectivesModule } from "../../directives/directives.module";
import { ComponentsModule } from "../../components/components.module";
import { PipesModule } from "../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [LoginAccountSelectorPage],
  imports: [
    PipesModule,
    IonicPageModule.forChild(LoginAccountSelectorPage),
    MatButtonModule,
    DirectivesModule,
    ComponentsModule,
    TranslateModule,
  ],
})
export class LoginAccountSelectorPageModule { }
