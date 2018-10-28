import { NgModule } from '@angular/core';
import { IonicPageModule } from "ionic-angular/index";
import { ComponentsModule } from "../../../components/components.module";
import { SubchainWorldPage } from './subchain-world';
import { TranslateModule } from "@ngx-translate/core";

@NgModule({
  declarations: [
    SubchainWorldPage,
  ],
  imports: [
    IonicPageModule.forChild(SubchainWorldPage),
    ComponentsModule,
    TranslateModule
  ],
})
export class SubchainWorldPageModule {}
