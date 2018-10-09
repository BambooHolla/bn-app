import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { SearchPage } from "./search";
import { ComponentsModule } from "../../components/components.module";
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [SearchPage],
  imports: [
    IonicPageModule.forChild(SearchPage),
    ComponentsModule,
    TranslateModule,
  ],
})
export class SearchPageModule {}
