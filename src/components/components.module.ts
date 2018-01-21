import { NgModule } from "@angular/core";
import { EarthNetMeshComponent } from "./earth-net-mesh/earth-net-mesh";
import { AliIconComponent } from "./ali-icon/ali-icon";
import { RadioButtonComponent } from "./radio-button/radio-button";
import { GoldCoinComponent } from "./gold-coin/gold-coin";
import { SatellitePixiComponent } from './satellite-pixi/satellite-pixi';
import { FallCoinsComponent } from './fall-coins/fall-coins';
import { BuddhaGlowComponent } from './buddha-glow/buddha-glow';
import { ChainMeshComponent } from './chain-mesh/chain-mesh';
@NgModule({
	declarations: [
		EarthNetMeshComponent,
		AliIconComponent,
		RadioButtonComponent,
		GoldCoinComponent,
    SatellitePixiComponent,
    FallCoinsComponent,
    BuddhaGlowComponent,
    ChainMeshComponent,
	],
	imports: [],
	exports: [
		EarthNetMeshComponent,
		AliIconComponent,
		RadioButtonComponent,
		GoldCoinComponent,
    SatellitePixiComponent,
    FallCoinsComponent,
    BuddhaGlowComponent,
    ChainMeshComponent,
	],
})
export class ComponentsModule {}
