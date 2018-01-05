import { NgModule } from "@angular/core";
import { EarthNetMeshComponent } from "./earth-net-mesh/earth-net-mesh";
import { AliIconComponent } from "./ali-icon/ali-icon";
import { RadioButtonComponent } from "./radio-button/radio-button";
import { GoldCoinComponent } from "./gold-coin/gold-coin";
@NgModule({
	declarations: [
		EarthNetMeshComponent,
		AliIconComponent,
		RadioButtonComponent,
		GoldCoinComponent,
	],
	imports: [],
	exports: [
		EarthNetMeshComponent,
		AliIconComponent,
		RadioButtonComponent,
		GoldCoinComponent,
	],
})
export class ComponentsModule {}
