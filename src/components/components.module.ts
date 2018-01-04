import { NgModule } from "@angular/core";
import { EarthNetMeshComponent } from "./earth-net-mesh/earth-net-mesh";
import { AliIconComponent } from './ali-icon/ali-icon';
import { RadioButtonComponent } from './radio-button/radio-button';
@NgModule({
  declarations: [EarthNetMeshComponent,
    AliIconComponent,
    RadioButtonComponent],
  imports: [],
  exports: [EarthNetMeshComponent,
    AliIconComponent,
    RadioButtonComponent],
})
export class ComponentsModule {}
