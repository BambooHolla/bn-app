import {
  OnInit,
  AfterContentInit,
  OnDestroy,
  ChangeDetectorRef,
} from "@angular/core";
import { EventEmitter } from "eventemitter3";
import { PAGE_STATUS } from "./const";
import { FLP_Tool, tryRegisterGlobal } from "./FLP_Tool";
// import { MyApp } from "../app/app.component";

export class FLP_Lifecycle extends FLP_Tool
  implements OnInit, AfterContentInit, OnDestroy {
  constructor() {
    super();
    console.log(this.cname, this);
    tryRegisterGlobal("instanceOf" + this.cname, this);
  }
  cname = this.constructor.name;
  PAGE_LEVEL = 1;
  _event?: EventEmitter;
  get event() {
    return this._event || (this._event = new EventEmitter());
  }
  PAGE_STATUS = PAGE_STATUS.UNLOAD;

  tryEmit(eventanme, ...args) {
    if (this._event) {
      this._event.emit(eventanme, ...args);
    }
  }
  /** 注册视图层相关的事件
   *  注册后，在leave期间，事件不会触发，但会收集，等再次进入页面的时候按需更新一次
   *  这个函数主要是用来配合ChangeDetectorRef进行手动更新视图用的
   */
  registerViewEvent(emitter: EventEmitter, evetname: string, handle: Function) {
    let should_emit: any = null;
    // TODO，要监听页面堆栈，压入一个新的页面的时候，下面的页面也会处于DID_ENTER状态
    const proxy_handle = (...args) => {
      if (this.PAGE_STATUS != PAGE_STATUS.DID_ENTER) {
        should_emit = args; // 页面不属于激活状态，不去更新
        return;
      }
      handle(...args);
    };
    let offed = false;
    const off_listen = () => {
      if (offed) {
        return;
      }
      offed = true;
      emitter.off(evetname, proxy_handle);
    };
    emitter.on(evetname, proxy_handle);
    this.event.on("onDestory", off_listen);
    this.event.on("didEnter", () => {
      if (!should_emit) {
        return;
      }
      try {
        handle(...should_emit);
      } finally {
        should_emit = null;
      }
    });
  }
  ngOnInit() {
    // console.log("ngOnInit",this.content,this.header)
    // this.content.fullscreen = true;
    for (let fun_name of this._oninit_funs) {
      try {
        this[fun_name]();
      } catch (err) {
        console.error(fun_name, err);
      }
    }
    this.tryEmit("onInit");
  }
  ngAfterContentInit() {
    for (let fun_name of this._aftercontentinit_funs) {
      try {
        this[fun_name]();
      } catch (err) {
        console.error(fun_name, err);
      }
    }
    this.tryEmit("afterContentInit");
  }
  ngOnDestroy() {
    for (let fun_name of this._ondestory_funs) {
      try {
        this[fun_name]();
      } catch (err) {
        console.error(fun_name, err);
      }
    }
    this.tryEmit("onDestory");
  }

  ionViewWillEnter() {
    this.PAGE_STATUS = PAGE_STATUS.WILL_ENTER;
    console.log("ionViewWillEnter", this.cname);

    for (let fun_name of this._will_enter_funs) {
      try {
        this[fun_name]();
      } catch (err) {
        console.error(fun_name, err);
      }
    }
    this.tryEmit("willEnter");
  }

  @FLP_Tool.FromGlobal myapp!: any;
  cdRef?: ChangeDetectorRef;
  ionViewDidEnter() {
    this.PAGE_STATUS = PAGE_STATUS.DID_ENTER;
    if (this.cdRef instanceof ChangeDetectorRef) {
      this.cdRef.reattach();
    }

    console.log("ionViewDidEnter", this.cname);
    this.myapp.hideSplashScreen();
    this.myapp.tryOverlaysWebView(3);

    for (let fun_name of this._did_enter_funs) {
      try {
        this[fun_name]();
      } catch (err) {
        console.error(fun_name, err);
      }
    }
    this.tryEmit("didEnter");
  }
  ionViewWillLeave() {
    this.PAGE_STATUS = PAGE_STATUS.WILL_LEAVE;
    console.log("ionViewWillLeave", this.cname);

    for (let fun_name of this._will_leave_funs) {
      try {
        this[fun_name]();
      } catch (err) {
        console.error(fun_name, err);
      }
    }
    this.tryEmit("willLeave");
  }
  ionViewDidLeave() {
    this.PAGE_STATUS = PAGE_STATUS.DID_LEAVE;
    if (this.cdRef instanceof ChangeDetectorRef) {
      this.cdRef.detach();
    }
    console.log("ionViewDidLeave", this.cname);

    for (let fun_name of this._did_leave_funs) {
      try {
        this[fun_name]();
      } catch (err) {
        console.error(fun_name, err);
      }
    }
    this.tryEmit("didLeave");
  }
  dispatchEvent(fire_event_name: string, ...args: any[]): void;
  dispatchEvent(
    fire_event_name: "HEIGHT:CHANGED",
    height: number,
    is_init: boolean,
  ): void;
  dispatchEvent(
    fire_event_name: "ROUND:CHANGED",
    height: number,
    is_init: boolean,
  ): void;
  dispatchEvent(fire_event_name: string, ...args: any[]) {
    console.group(
      "%cdispatchEvent",
      "color:blue;background-color:#FFF",
      fire_event_name,
    );
    for (let { handle_name, event_name } of this._on_evnet_funs) {
      if (event_name === fire_event_name) {
        try {
          console.log(handle_name);
          this[handle_name](...args);
        } catch (err) {
          console.error(err);
        }
      }
    }
    console.groupEnd();
  }

  // 生命周期 修饰器
  // 这里只保存属性名，在调用的时候就能获取到最终被其它修饰器修饰完的属性值
  @FLP_Lifecycle.cacheFromProtoArray("onInit")
  private _oninit_funs!: Set<string>;
  static onInit(target: any, name: string, descriptor?: PropertyDescriptor) {
    FLP_Tool.addProtoArray(target, "onInit", name);
    return descriptor;
  }
  @FLP_Lifecycle.cacheFromProtoArray("afterContentInit")
  private _aftercontentinit_funs!: Set<string>;
  static afterContentInit(
    target: any,
    name: string,
    descriptor?: PropertyDescriptor,
  ) {
    FLP_Tool.addProtoArray(target, "afterContentInit", name);
    return descriptor;
  }
  @FLP_Lifecycle.cacheFromProtoArray("onDestory")
  private _ondestory_funs!: Set<string>;
  static onDestory(target: any, name: string, descriptor?: PropertyDescriptor) {
    FLP_Tool.addProtoArray(target, "onDestory", name);
    return descriptor;
  }
  @FLP_Lifecycle.cacheFromProtoArray("willEnter")
  private _will_enter_funs!: Set<string>;
  static willEnter(target: any, name: string, descriptor?: PropertyDescriptor) {
    FLP_Tool.addProtoArray(target, "willEnter", name);
    return descriptor;
  }
  @FLP_Lifecycle.cacheFromProtoArray("didEnter")
  private _did_enter_funs!: Set<string>;
  static didEnter(target: any, name: string, descriptor?: PropertyDescriptor) {
    FLP_Tool.addProtoArray(target, "didEnter", name);
    return descriptor;
  }
  @FLP_Lifecycle.cacheFromProtoArray("willLeave")
  private _will_leave_funs!: Set<string>;
  static willLeave(target: any, name: string, descriptor?: PropertyDescriptor) {
    FLP_Tool.addProtoArray(target, "willLeave", name);
    return descriptor;
  }
  @FLP_Lifecycle.cacheFromProtoArray("didLeave")
  private _did_leave_funs!: Set<string>;
  static didLeave(target: any, name: string, descriptor?: PropertyDescriptor) {
    FLP_Tool.addProtoArray(target, "didLeave", name);
    return descriptor;
  }

  @FLP_Lifecycle.cacheFromProtoArray("onEvent")
  private _on_evnet_funs!: Set<{ handle_name: string; event_name: string }>;
  static addEvent(event_name: string) {
    return function(
      target: any,
      handle_name: string,
      descriptor?: PropertyDescriptor,
    ) {
      FLP_Tool.addProtoArray(target, "onEvent", { handle_name, event_name });
      return descriptor;
    };
  }

  static autoUnsubscribe(target: FLP_Lifecycle, name: string) {
    const cache_key = `-AU-${name}-`;
    if (!target[cache_key]) {
      target[cache_key] = function() {
        if (this[name]) {
          this[name].unsubscribe();
          this[name] = null;
        }
      };
      FLP_Tool.addProtoArray(target, "didLeave", cache_key);
      FLP_Tool.addProtoArray(target, "onDestory", cache_key);
    }
  }

  static cacheFromProtoArray(key) {
    return (target: any, name: string, descriptor?: PropertyDescriptor) => {
      const cache_key = `-PA-${name}-`;
      Object.defineProperty(target, name, {
        get() {
          return (
            this[cache_key] ||
            (this[cache_key] = FLP_Tool.getProtoArray(this, key))
          );
        },
      });
    };
  }
}
