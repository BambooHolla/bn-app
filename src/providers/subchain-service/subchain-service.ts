import { Injectable } from '@angular/core';
import { baseConfig } from '../../bnqkl-framework/helper';
import { IfmchainCore } from 'ifmchain-js-core';
import { AppFetchProvider } from '../app-fetch/app-fetch'
import {
  AppSettingProvider,
  AppUrl,
  HEIGHT_AB_Generator,
} from "../app-setting/app-setting";
import {
  TransactionServiceProvider,
  TransactionModel,
} from "../transaction-service/transaction-service";
import { AssetsServiceProvider } from '../assets-service/assets-service';

@Injectable()
export class SubchainServiceProvider {
  ifmchain_core = new IfmchainCore(baseConfig.NET_VERSION)
  constructor(
    public appSetting: AppSettingProvider,
    public transactionService: TransactionServiceProvider,
    public fetch: AppFetchProvider,
    private _assetsService: AssetsServiceProvider,
  ) {
  }
  imageUrlToJpegBase64 = this._assetsService.imageUrlToJpegBase64;
  addSubchain(
    subchainInfo: {
      name: string
      abbreviation: string
      logo: string
      banner: string
      forgeInterval: number
      miniFee: string
      genesisNodeAddress: string
      searchPort: number
      magic: string
      offset: number
      port: {
        web: number;
        p2p: number;
        p2pForTrs: number;
      }
      rewardPerBlock: { height: number, reward: string }[]
    },
    fee = parseFloat(this.appSetting.settings.default_fee),
    secret: string,
    secondSecret?: string,
    publicKey = this.appSetting.user.publicKey,
    address = this.appSetting.user.address
  ) {
    this.ifmchain_core.createTransaction
    const txData: any = {
      type: this.ifmchain_core.transactionTypes.ISSUE_ASSET,
      secret,
      publicKey,
      fee,
      asset: {
        issueSubchain: {
          address,
          publicKey,
          ...subchainInfo,
        },
      },
    };
    if (secondSecret) {
      txData.secondSecret = secondSecret;
    }
    return this.transactionService.putTransaction(txData);
  }

}