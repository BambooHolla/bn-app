import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular";
import { LinkNodePage } from "./link-node";
import { ComponentsModule } from "../../components/components.module";

@NgModule({
	declarations: [LinkNodePage],
	imports: [IonicPageModule.forChild(LinkNodePage), ComponentsModule],
})
export class LinkNodePageModule {}
