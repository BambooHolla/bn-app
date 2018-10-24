import { Injectable } from "@angular/core";
import { BehaviorSubject, AsyncSubject, Observable } from "rxjs";
import { AsyncBehaviorSubject, Executor } from "../../bnqkl-framework/RxExtends";
export * from "../../bnqkl-framework/RxExtends";
import { IsIOS, ReadToGenerate, global } from "../../bnqkl-framework/helper";
import { AniBase } from "../../components/AniBase";
import { UserInfoProvider } from "../user-info/user-info";
import * as PIXI from "pixi.js";
import { TranslateService } from "@ngx-translate/core";
import { afCtrl, baseConfig, getQueryVariable } from "../../bnqkl-framework/helper";
import { MiningMachine } from "../../pages/_vote/types";
import { AppUrl, CommonService } from "../commonService";
export { AppUrl };
import { IfmchainCore } from "../../ifmchain-js-core/src";
import { PromiseOut } from "../../fangodb/dist/src/const";
import * as IDB_VK from "idb-keyval";
import * as TYPE from "./app-setting.type";

const constructor_inited = new PromiseOut<AppSettingProvider>();
@Injectable()
export class AppSettingProvider extends CommonService {
  // static readonly APP_VERSION = baseConfig.APP_VERSION;
  // static SERVER_URL = baseConfig.SERVER_URL;
  // static readonly SEED_DATE = baseConfig.SEED_DATE;
  // static readonly MAGIC = baseConfig.MAGIC;
  // static readonly seedDateTimestamp = baseConfig.seedDateTimestamp;
  // static readonly seedDate = baseConfig.seedDate;
  // static readonly timezoneoffset = baseConfig.timezoneoffset;
  // static readonly NET_VERSION = baseConfig.NET_VERSION;
  // static readonly BLOCK_UNIT_TIME = baseConfig.BLOCK_UNIT_TIME;
  // readonly BLOCK_UNIT_TIME = baseConfig.BLOCK_UNIT_TIME;
  // static readonly LATEST_APP_VERSION_URL = baseConfig.LATEST_APP_VERSION_URL;
  // static readonly SETTING_KEY_PERFIX = baseConfig.SETTING_KEY_PERFIX;
  @baseConfig.WatchPropChanged("NET_VERSION")
  static get IFMJSCORE() {
    return new IfmchainCore(baseConfig.NET_VERSION);
  }

  isIOS = IsIOS();

  APP_URL(path: string) {
    return new AppUrl(path);
  }

  constructor(public user: UserInfoProvider, public translate: TranslateService) {
    super();

    constructor_inited.resolve(this);

    const user_token = this.getUserToken();

    // 初始化缓存中的user_info
    this.user.initUserInfo(user_token);

    this.user_token = new BehaviorSubject(user_token);
    this.account_address = this.user_token
      .map(token => {
        const token_info = this.getUserToken();
        if (token_info) {
          return token_info.address;
        }
        return "";
      })
      .distinctUntilChanged<string>();
    this.secondPublicKey = this.user_token
      .map(token => {
        const token_info = this.getUserToken();
        if (token_info) {
          return token_info.secondPublicKey;
        }
        return "";
      })
      .distinctUntilChanged<string>();

    /** 独立账户的数据与配置*/
    {
      const default_settings = { ...this.settings };
      const get_settings_key = () => {
        return (
          this.user.address && `${baseConfig.settingKeyPerfix}${this.user.address}:${baseConfig.NET_VERSION}|${baseConfig.BLOCK_UNIT_TIME}` //${AppSettingProvider.SERVER_URL}|
        );
      };
      const getUserSettings = () => {
        let settings: typeof default_settings | undefined;
        const settings_key = get_settings_key();
        if (settings_key) {
          const settings_json = localStorage.getItem(settings_key);
          let should_write_in = true; // 是否需要初始化写入
          if (typeof settings_json === "string") {
            try {
              settings = JSON.parse(settings_json); //JSON可用
              should_write_in = false;
            } catch (e) {}
          }
          // 进行初始化写入
          if (should_write_in) {
            localStorage.setItem(settings_key, JSON.stringify((settings = { ...default_settings })));
          }
        }
        return settings;
      };
      // 将setting与本地存储进行关联
      for (var _key in this.settings) {
        const key = _key;
        const default_value = default_settings[key];
        Object.defineProperty(this.settings, key, {
          get: () => {
            let value = default_value;
            const settings = getUserSettings();
            if (settings) {
              if (key in settings) {
                value = settings[key];
              } else {
                settings[key] = value;

                const settings_key = get_settings_key();
                localStorage.setItem(settings_key, JSON.stringify(settings));
              }
            }
            return value;
          },
          set: value => {
            const settings_key = get_settings_key();
            const settings = getUserSettings();
            if (settings) {
              settings[key] = value;
              localStorage.setItem(settings_key, JSON.stringify(settings));
              this.emit(`changed@setting.${key}`, value);
              this.emit(`changed@setting`, { key, value });
            }
          },
        });
      }
    }

    /** 多账户共享的数据与配置*/
    {
      const default_share_settings = { ...this.share_settings };
      const get_share_settings_key = () => {
        return `SHARE:${baseConfig.settingKeyPerfix}:${baseConfig.NET_VERSION}|${baseConfig.BLOCK_UNIT_TIME}`; //${AppSettingProvider.SERVER_URL}|;
      };
      const shareSettingCtrl = (() => {
        const settings_key = get_share_settings_key();
        let micro_task_lock;
        const cur_settings = {
          ...default_share_settings,
          ...JSON.parse(localStorage.getItem(settings_key) || "{}"),
        };
        return {
          save(settings) {
            if (cur_settings !== settings) {
              Object.assign(cur_settings, settings);
            }
            if (micro_task_lock) {
              return;
            }
            // 创建一个微任务
            micro_task_lock = Promise.resolve().then(() => {
              // 写入
              localStorage.setItem(settings_key, JSON.stringify(cur_settings));
              // 结束微任务
              micro_task_lock = undefined;
            });
          },
          get() {
            return cur_settings;
          },
        };
      })();
      // 将setting与本地存储进行关联
      for (var _key in this.share_settings) {
        const key = _key;
        const default_value = default_share_settings[key];
        Object.defineProperty(this.share_settings, key, {
          get: () => {
            let value = default_value;
            const settings = shareSettingCtrl.get();
            if (key in settings) {
              value = settings[key];
            }
            return value;
          },
          set: value => {
            const settings = shareSettingCtrl.get();
            if (key in settings) {
              settings[key] = value;
              shareSettingCtrl.save(settings);
              this.emit(`changed@share_settings.${key}`, value);
              this.emit(`changed@share_settings`, { key, value });
            }
          },
        });
      }
    }
    // 省电模式
    {
      this.on("changed@setting.power_saving_mode", is_save => (this.settings.animation_switch = !is_save));
    }

    // 动画开关对动画的控制

    // 框架内置的AniBase
    {
      const _update = AniBase.prototype._update;
      const noop = function(t, diff_t) {
        if (this.force_update) {
          _update.call(this, t, diff_t);
        }
      };
      const toggle_update = is_ani => {
        AniBase.power_saving_mode = is_ani;
        AniBase.prototype._update = is_ani ? _update : noop;
      };
      this.on("changed@setting.animation_switch", toggle_update);
    }
    // PIXI框架的循环
    {
      const noop = function(t) {
        if (this.force_update) {
          _update.call(this, t);
        }
      };
      const _update = PIXI.ticker.Ticker.prototype.update;
      const toggle_update = is_ani => {
        PIXI.ticker.Ticker.prototype.update = is_ani ? _update : noop;
      };
      this.on("changed@setting.animation_switch", toggle_update);
    }

    // 声音开关
    {
      const _play = PIXI.sound.play;
      const noop = function(...args) {
        if (this.force_play_sound) {
          _play.apply(this, args);
        }
      } as any;
      const toggle_play = is_play_sound => {
        PIXI.sound.play = is_play_sound ? _play : noop;
      };
      this.on("changed@setting.sound_effect", toggle_play);
    }
    // 触发配置
    this.account_address.distinctUntilChanged().subscribe(() => {
      const cur_setting = { ...this.settings };
      console.log("%c新用户登录，配置重新生效", "color:purple;font-size:1.6em;", cur_setting);
      for (var k in cur_setting) {
        this.settings[k] = cur_setting[k];
      }
    });
  }
  private LOGINABLE_ACCOUNTS = "LOGINABLE_ACCOUNTS";
  private USER_TOKEN_STORE_KEY = "LOGIN_TOKEN";
  user_token: BehaviorSubject<TYPE.UserTokenModel | null>;
  account_address: Observable<string>;
  secondPublicKey: Observable<string>;
  private _token_timeout_ti: any;
  getUserToken() {
    try {
      const tokenJson = localStorage.getItem(this.USER_TOKEN_STORE_KEY);
      if (!tokenJson) {
        return null;
      }
      const obj: TYPE.UserTokenModel = JSON.parse(tokenJson);
      return obj;
    } catch (e) {
      return null;
    }
  }
  setUserToken(obj: TYPE.UserTokenModel | string) {
    if (typeof obj !== "string") {
      const old_token = this.getUserToken();
      if (old_token && old_token.address === obj.address) {
        obj.remember = old_token.remember;
        obj.password = old_token.password;
      } else {
        // 登录
        obj.lastest_login_time = Date.now();
        if (obj.remember) {
          this.addLoginAbleAccount(obj);
        } else {
          this.delLoginAbleAccount(obj.address);
        }
      }
      this.user.initUserInfo(obj);
      obj = JSON.stringify(obj);
    } else {
      throw new TypeError("user token must be an object:{address,password,balance,fee}");
    }
    localStorage.setItem(this.USER_TOKEN_STORE_KEY, obj);

    this._setUserToken(this.getUserToken());
  }
  clearUserToken() {
    localStorage.removeItem(this.USER_TOKEN_STORE_KEY);
    this._setUserToken(this.getUserToken());
  }
  private _setUserToken(token: TYPE.UserTokenModel | null) {
    this.user_token.next(this.getUserToken());
  }
  async getLoginAbleAccounts(): Promise<Map<string, TYPE.UserTokenModel>> {
    return (await IDB_VK.get<any>(this.LOGINABLE_ACCOUNTS)) || new Map();
  }
  async addLoginAbleAccount(account: TYPE.UserTokenModel) {
    const accountMap = await this.getLoginAbleAccounts();
    accountMap.set(account.address, account);
    await IDB_VK.set(this.LOGINABLE_ACCOUNTS, accountMap);
  }
  async delLoginAbleAccount(address: string) {
    const accountMap = await this.getLoginAbleAccounts();
    if (accountMap.has(address)) {
      accountMap.delete(address);
      await IDB_VK.set(this.LOGINABLE_ACCOUNTS, accountMap);
    }
    const cur_logining_account = this.getUserToken();
    if (cur_logining_account && cur_logining_account.address === address) {
      this.clearUserToken();
    }
  }
  /**高度*/
  height: BehaviorSubject<number> = new BehaviorSubject(1);
  /**当高度发生改变后要触发的，应用级别使用这个。
   确保不会因为height绑定而更新数据的触发函数还没触发就触发了应用界别的请求函数*/
  after_height: BehaviorSubject<number> = new BehaviorSubject(1);
  /**轮次*/
  round: BehaviorSubject<number> = new BehaviorSubject(1);
  after_round: BehaviorSubject<number> = new BehaviorSubject(1);
  setHeight(height: number) {
    if (this.getHeight() == height) {
      return;
    }
    this.height.next(height);
    this.after_height.next(height);
    this.emit("HEIGHT:CHANGED");
    const pre_round = this.getRound();
    const cur_round = this.calcRoundByHeight(height);
    if (cur_round !== pre_round) {
      this.setRound(cur_round);
    }
  }
  calcRoundByHeight(height) {
    return Math.ceil(height / 57);
  }
  getBlockNumberToRoundEnd(cur_height) {
    return 57 - (cur_height % 57);
  }
  getRoundStartHeight(round_num: number) {
    return (round_num - 1) * 57 + 1;
  }
  getHeight() {
    return this.height.getValue();
  }
  setRound(round: number) {
    this.round.next(round);
    this.after_round.next(round);
    this.emit("ROUND:CHANGED");
  }
  getRound() {
    return this.round.getValue();
  }

  settings = {
    lang: "",
    /**指纹保护开关*/
    open_fingerprint_protection: false,
    /**指纹保护密码*/
    fingerprint_protection: "",
    /**后台挖矿*/
    background_mining: false,
    /**缓存用户最后一次发送投票的轮次*/
    digRound: 0,
    /**挖矿收益通知*/
    mining_income_notice: false,
    /**默认手续费*/
    default_fee: "0.00000000",
    /**只在wifi时挖矿*/
    mining_only_in_wifi: true,
    /**动画开关*/
    animation_switch: true,
    /**省电模式*/
    power_saving_mode: true, // 默认开启省电模式
    /**自动更新*/
    auto_update_app: false,
    /**自动更新手续费到前一轮的最低值*/
    auto_update_default_fee_to_pre_round_min: false,
    /**自动更新手续费到前一轮的最低值*/
    auto_update_default_fee_max_amount: "1.00000000",
    /**音效*/
    sound_effect: true,
    /**是否有过挖矿收益*/
    _has_mining_income: false,
    /**我的矿机*/
    my_mining_machine: [] as MiningMachine[],
    /**已经处理的交易*/
    detal_tran_num: 0,
    /**贡献的流量*/
    contribution_flow: 0,
    /**隐藏账户金额信息*/
    can_view_amount: true,
    /**是否显示过 初次转账提醒*/
    _is_show_first_transfer_tip: false,
    /**是否显示过 区块详情*/
    _is_show_first_block_remark: false,
    /**是否显示过 初次挖矿提示*/
    _is_show_first_mining_tip: false,
    /**是否已经知道校验区块会导致发热*/
    is_known_verifier_will_heat_up: false,
    /**是否显示过 我的关注提示*/
    _is_show_first_local_contacts_tip: false,
    /*是否显示过 商务合作的提示*/
    _is_first_show_send_business_cooperation: false,
    /*是否显示过 用户服务的提示*/
    _is_first_show_send_user_service: false,
    /*是否显示过 分享APP的提示*/
    _is_fisrt_show_share_app: false,
    /*是否显示过 使用离线支付的提示*/
    _is_first_show_offline_pay: false,
    /*是否显示过 将离线收益放入钱包的提示*/
    _is_first_put_into_voucher: false,
    /*是否显示过 IBT增加的提示*/
    _is_first_balance_grow_up_notice: false,
    /*是否显示过第一次 挖矿手续费不足 显示的提示*/
    _is_first_no_enough_balance_to_vote: false,
  };
  /*多个账户之间共享的数据*/
  share_settings = {
    /**是否已经同步过区块链数据*/
    is_agree_to_sync_blockchain: false,
    /**是否正在同步中*/
    is_syncing_blocks: false,
    /**同步区块 的进度 0 ~ 100*/
    sync_progress_blocks: 0,
    /**同步交易 的进度 0 ~ 100*/
    sync_progress_transactions: 0,
    /**同步权益 的进度 0 ~ 100*/
    sync_progress_equitys: 0,
    /**启用同步区块*/
    enable_sync_progress_blocks: !this.isIOS,
    /**启用同步交易*/
    enable_sync_progress_transactions: false,
    /**启用同步权益*/
    enable_sync_progress_equitys: false,
    /**同步数据累计使用的流量*/
    sync_data_flow: 0,
    /**当前同步的进度区块*/
    sync_progress_height: 0,
    /**当前是否在验证区块*/
    sync_is_verifying_block: false,
    /**累计APP使用时长*/
    acc_app_usage_duration: 0,
  };

  afterShareSettings(key: string) {
    if (!this.share_settings.hasOwnProperty(key)) {
      return false;
    }
    if (this.share_settings[key]) {
      return true;
    }

    return new Promise(cb => this.once("changed@share_settings." + key, cb));
  }

  @baseConfig.WatchPropChanged(["NET_VERSION", "HIDE_FLAG"])
  async testFlag() {
    let _testnet_flag = document.getElementById("testnetFlag");
    if (!_testnet_flag) {
      _testnet_flag = document.createElement("div");

      _testnet_flag.id = "testnetFlag";
      _testnet_flag.innerHTML = `TESTNET`;
      const testnet_flag_wrapper = document.createElement("div");
      testnet_flag_wrapper.appendChild(_testnet_flag);
      document.body.appendChild(testnet_flag_wrapper);

      // 测试网络角标内容
      constructor_inited.promise.then(appSetting => {
        let ani_flag_frame_id;
        let pre_flag_transform;
        appSetting.translate.stream(["TESTNET_FLAG"]).subscribe(values => {
          if (ani_flag_frame_id) {
            cancelAnimationFrame(ani_flag_frame_id);
            ani_flag_frame_id = null;
          }
          function setTran(transform: string | null) {
            testnet_flag.style.transform = testnet_flag.style.webkitTransform = transform;
          }
          function setTranDur(transitionDuration: string | null) {
            testnet_flag.style.transitionDuration = testnet_flag.style.webkitTransitionDuration = transitionDuration;
          }
          testnet_flag.innerHTML = values.TESTNET_FLAG;
          setTran(null);
          setTranDur("0ms"); // 确保下面计算出来的值是正确的
          const bound_rect = testnet_flag.getBoundingClientRect(); //reflow
          setTran(pre_flag_transform);
          afCtrl.raf(() => {
            setTranDur(null);
            setTran((pre_flag_transform = `scale(${55 / bound_rect.width})`));
          });
        });
      });
    }

    const testnet_flag = _testnet_flag;

    const testnet_flag_wrapper = testnet_flag.parentElement;
    if (!testnet_flag_wrapper) {
      throw new Error("testnet_flag_wrapper not found. should not happed.");
    }
    /*显示测试网络flag*/
    if (
      (baseConfig.NET_VERSION === "testnet" && baseConfig.HIDE_FLAG !== "1") ||
      baseConfig.HIDE_FLAG === "-1" // 强制显示flag
    ) {
      testnet_flag_wrapper.className = "testnet-flag";
      testnet_flag_wrapper.style.visibility = "";
    } else {
      testnet_flag_wrapper.style.visibility = "hidden";
    }
  }
}

/**
 * 基于token的AsyncBehaviorSubjuet类型的属性/方法生成器
 * tokenBaseAsyncBehaviorSubjectGenerator
 *
 * @export
 * @param {any} target
 * @param {any} name
 * @param {any} descriptor
 */
export function TB_AB_Generator(
  target_prop_name: string,
  need_token = true,
  expiry_time_opts?: ExpiryTime & {
    loop?: boolean;
  }
) {
  return (target, name, descriptor) => {
    var executor: Executor<any> = descriptor.value;
    let _v: AsyncBehaviorSubject<any>;
    const timeout_auto_refresh = (from: Date) => {
      let refresh_time = calcExpiryTime(Object.assign({}, expiry_time_opts, { from }));
      const do_refresh = () => {
        if (_v) {
          console.log(target_prop_name, "过期，强制刷新");
          _v.refresh(target_prop_name);
          if (expiry_time_opts && expiry_time_opts.loop) {
            timeout_auto_refresh(refresh_time);
          }
        }
      };
      const time_out = +refresh_time - Date.now();
      if (time_out < 0) {
        const time_span_val = +refresh_time - +from;
        // 将refresh_time推进到一个合适的值，确保下一次执行timeout_auto_refresh，得到的time_out正好>=0
        refresh_time = new Date(+refresh_time + ((Math.abs(time_out) / time_span_val) | 0) * time_span_val);
        do_refresh();
      } else {
        setTimeout(do_refresh, time_out);
      }
      console.log("time_out", time_out);
    };
    // console.log(target_prop_name);
    Object.defineProperty(target, target_prop_name, {
      get() {
        if (!_v) {
          if (!(this.appSetting instanceof AppSettingProvider)) {
            throw new Error(`${this.constructor.name} 需要注入依赖： (appSetting)AppSettingProvider`);
          }
          (this.appSetting as AppSettingProvider).account_address.distinctUntilChanged().subscribe(token => {
            if (need_token && !token) {
              return;
            }
            if (!_v) {
              _v = new AsyncBehaviorSubject(executor.bind(this));
              expiry_time_opts && timeout_auto_refresh(expiry_time_opts.from);
            } else {
              _v.refresh(target_prop_name);
            }
          });
        }
        return _v;
      },
    });
    return descriptor;
  };
}

/**
 * 基于height的AsyncBehaviorSubjuet类型的属性/方法生成器
 * tokenBaseAsyncBehaviorSubjectGenerator
 *
 * @export
 * @param {any} target
 * @param {any} name
 * @param {any} descriptor
 */
export function HEIGHT_AB_Generator(
  target_prop_name: string,
  need_token = false,
  expiry_time_opts?: ExpiryTime & {
    loop?: boolean;
  }
) {
  return (target, name, descriptor) => {
    var executor: Executor<any> = descriptor.value;
    let _v: AsyncBehaviorSubject<any>;
    const timeout_auto_refresh = (from: Date) => {
      let refresh_time = calcExpiryTime(Object.assign({}, expiry_time_opts, { from }));
      const do_refresh = () => {
        if (_v) {
          console.log(target_prop_name, "过期，强制刷新");
          _v.refresh();
          if (expiry_time_opts && expiry_time_opts.loop) {
            timeout_auto_refresh(refresh_time);
          }
        }
      };
      const time_out = +refresh_time - Date.now();
      if (time_out < 0) {
        const time_span_val = +refresh_time - +from;
        // 将refresh_time推进到一个合适的值，确保下一次执行timeout_auto_refresh，得到的time_out正好>=0
        refresh_time = new Date(+refresh_time + ((Math.abs(time_out) / time_span_val) | 0) * time_span_val);
        do_refresh();
      } else {
        setTimeout(do_refresh, time_out);
      }
      console.log("time_out", time_out);
    };
    // console.log(target_prop_name);
    Object.defineProperty(target, target_prop_name, {
      get() {
        if (!_v) {
          const appSetting: AppSettingProvider = this.appSetting;
          if (!(appSetting instanceof AppSettingProvider)) {
            throw new Error(`${this.constructor.name} 需要注入依赖： (appSetting)AppSettingProvider`);
          }
          const runner = height_or_token => {
            if (!height_or_token) {
              return;
            }
            if (!_v) {
              _v = new AsyncBehaviorSubject(executor.bind(this));
              expiry_time_opts && timeout_auto_refresh(expiry_time_opts.from);
            } else {
              _v.refresh(target_prop_name);
            }
          };
          appSetting.height.distinctUntilChanged().subscribe(runner);
          if (need_token) {
            appSetting.account_address.distinctUntilChanged().subscribe(runner);
          }
        }
        return _v;
      },
    });
    return descriptor;
  };
}
/**
 * 基于round的AsyncBehaviorSubjuet类型的属性/方法生成器
 * tokenBaseAsyncBehaviorSubjectGenerator
 *
 * @export
 * @param {any} target
 * @param {any} name
 * @param {any} descriptor
 */
export function ROUND_AB_Generator(
  target_prop_name: string,
  need_token = false,
  expiry_time_opts?: ExpiryTime & {
    loop?: boolean;
  }
) {
  return (target, name, descriptor) => {
    var executor: Executor<any> = descriptor.value;
    let _v: AsyncBehaviorSubject<any>;
    const timeout_auto_refresh = (from: Date) => {
      let refresh_time = calcExpiryTime(Object.assign({}, expiry_time_opts, { from }));
      const do_refresh = () => {
        if (_v) {
          console.log(target_prop_name, "过期，强制刷新");
          _v.refresh(target_prop_name);
          if (expiry_time_opts && expiry_time_opts.loop) {
            timeout_auto_refresh(refresh_time);
          }
        }
      };
      const time_out = +refresh_time - Date.now();
      if (time_out < 0) {
        const time_span_val = +refresh_time - +from;
        // 将refresh_time推进到一个合适的值，确保下一次执行timeout_auto_refresh，得到的time_out正好>=0
        refresh_time = new Date(+refresh_time + ((Math.abs(time_out) / time_span_val) | 0) * time_span_val);
        do_refresh();
      } else {
        setTimeout(do_refresh, time_out);
      }
      console.log("time_out", time_out);
    };
    // console.log(target_prop_name);
    Object.defineProperty(target, target_prop_name, {
      get() {
        if (!_v) {
          const appSetting: AppSettingProvider = this.appSetting;
          if (!(appSetting instanceof AppSettingProvider)) {
            throw new Error(`${this.constructor.name} 需要注入依赖： (appSetting)AppSettingProvider`);
          }
          const runner = height_or_token => {
            if (!height_or_token) {
              return;
            }
            if (!_v) {
              _v = new AsyncBehaviorSubject(executor.bind(this));
              expiry_time_opts && timeout_auto_refresh(expiry_time_opts.from);
            } else {
              _v.refresh(target_prop_name);
            }
          };
          appSetting.round.distinctUntilChanged().subscribe(runner);
          if (need_token) {
            appSetting.account_address.distinctUntilChanged().subscribe(runner);
          }
        }
        return _v;
      },
    });
    return descriptor;
  };
}

export type TimeSpan = {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
};
export type ExpiryTime = {
  from: Date;
  time_span: TimeSpan;
};
export function calcExpiryTime(expiry_time: ExpiryTime) {
  const { from, time_span } = expiry_time;
  const res_time = new Date(+from);
  for (var k in time_span) {
    const v = time_span[k] | 0;
    switch (k) {
      case "year":
        res_time.setFullYear(res_time.getFullYear() + v);
        break;
      case "month":
        res_time.setMonth(res_time.getMonth() + v);
        break;
      case "day":
        res_time.setDate(res_time.getDate() + v);
        break;
      case "hour":
        res_time.setHours(res_time.getHours() + v);
        break;
      case "minute":
        res_time.setMinutes(res_time.getMinutes() + v);
        break;
      case "second":
        res_time.setSeconds(res_time.getSeconds() + v);
        break;
    }
  }
  return res_time;
}
