import { NgModule } from "@angular/core";
import { IonicPageModule } from "ionic-angular/index";
import { SubchainGatewayPage } from "./subchain-gateway";
import { ComponentsModule } from "../../../components/components.module";
import { DirectivesModule } from "../../../directives/directives.module";
import { PipesModule } from "../../../pipes/pipes.module";
import { TranslateModule } from "@ngx-translate/core";
import { MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatMenuModule, MatButtonModule, MatIconModule } from "@angular/material";
import { MomentModule } from "angular2-moment";

@NgModule({
	declarations: [SubchainGatewayPage],
	imports: [
		IonicPageModule.forChild(SubchainGatewayPage),
		TranslateModule,
		DirectivesModule,
		PipesModule,
		ComponentsModule,
		MatFormFieldModule,
		MatInputModule,
		MatAutocompleteModule,
		MatMenuModule,
		MatButtonModule,
		MatIconModule,
		MomentModule,
	],
})
export class SubchainGatewayPageModule {}
