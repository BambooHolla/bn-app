import { Component,ViewChild,Input,ElementRef } from '@angular/core';
import {AniBase} from '../AniBase';
import {BenefitModel} from '../../providers/benefit-service/benefit.types';

@Component({
  selector: 'income-trend-simple-chart',
  templateUrl: 'income-trend-simple-chart.html'
})
export class IncomeTrendSimpleChartComponent extends AniBase{
  app?: PIXI.Application ;
  @ViewChild("canvas") canvasRef!: ElementRef;
  @Input("list") list?:BenefitModel[]

  _init() {
    this.canvasNode || (this.canvasNode = this.canvasRef.nativeElement);
    return super._init();
  }
}
