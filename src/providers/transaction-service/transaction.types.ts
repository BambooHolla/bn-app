export type transactionsModel = {
  success: boolean;
  transactions: Array<TransactionModel>;
  count: number;
};
export type TransactionModel = {
  id: string;
  height: number;
  blockId: string;
  type: number;
  timestamp: number;
  senderPublicKey: string;
  senderId: string;
  recipientId: string;
  senderUsername: string;
  recipientUsername: string;
  amount: string;
  fee: string;
  signature: string;
  signSignature: string;
  signatures: any;
  confirmations: string;
  asset: any;
  remark?: string;
  assetType?: string;
};

export type timeStampModel = {
  success?: boolean;
  timestamp: number;
};

export type putTransactionReturn = {
  success?: boolean;
  transactionId: string;
};

export type QueryTransactionsResModel = {
  success: boolean;
  transactions: TransactionModel[];
  count: number;
};

export enum TransactionTypes {
  /** 是最基本的转账交易*/
  SEND = 0,
  /** “签名”交易*/
  SIGNATURE = 1,
  /** 注册为受托人*/
  DELEGATE = 2,
  /**投票*/
  VOTE = 3,
  /**注册用户别名地址*/
  USERNAME = 4,
  /**添加联系人*/
  FOLLOW = 5,
  /**注册多重签名帐号*/
  MULTI = 6,
  /**侧链应用*/
  DAPP = 7,
  /**转入Dapp资金*/
  IN_TRANSFER = 8,
  /**转出Dapp资金*/
  OUT_TRANSFER = 9,
  /**点赞*/
  FABULOUS = 10,
  /**打赏*/
  GRATUITY = 11,
  /**发送信息*/
  SENDMESSAGE = 12,
  /** 侧链数据存证*/
  MARK = 13,
  /**ISSUE_ASSET: 发行数字资产*/
  ISSUE_ASSET = 14,
  /**DESTORY_ASSET: 销毁数字资产*/
  DESTORY_ASSET = 15,
  /**TRANSFER_ASSET: 数字资产转账*/
  TRANSFER_ASSET = 16,
}
