import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { AssetsIssuingAssetsPage } from "./assets-issuing-assets";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import {
  MatFormFieldModule,
  MatInputModule,
  MatAutocompleteModule,
  MatMenuModule,
  MatButtonModule,
} from "@angular/material";
import { MomentModule } from "angular2-moment";

@NgModule({
  declarations: [AssetsIssuingAssetsPage],
  imports: [
    IonicPageModule.forChild(AssetsIssuingAssetsPage),
    TranslateModule,
    DirectivesModule,
    PipesModule,
    ComponentsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatButtonModule,
    MomentModule,
  ],
})
export class AssetsIssuingAssetsPageModule {}
