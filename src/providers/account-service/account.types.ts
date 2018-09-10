export type AccountModel = {
  address: string;
  balance: string;
  publicKey: string;
  secondPublicKey: string;
  secondSignature: boolean;
  unconfirmedBalance: string;
  unconfirmedSignature: boolean;
  isDelegate: number;
  username: string;
  votingReward: string;
};
export type AccountResModel = {
  account: AccountModel;
  success: boolean;
};
export type AccountRoundProfitModel = {
  address: string;
  dateCreated: string;
  profit: string;
  rate: number;
  round: number;
  uniqueId: string;
  _id: string;
};
export type AccountProfitsResModel = {
  success: boolean;
  profits: AccountRoundProfitModel[];
  count: number;
};
