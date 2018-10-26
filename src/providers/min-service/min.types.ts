export type DelegateModel = {
  No: number;
  isDelegate: number;
  u_isDelegate: number;
  secondSignature: number;
  u_secondSignature: number;
  balance: string;
  u_balance: string;
  vote: string;
  rate: number;
  delegates: string[];
  contacts: string[];
  followers: string[];
  u_delegates: string[];
  u_contacts: string[];
  u_followers: string[];
  multisignatures: string[];
  u_multisignatures: string[];
  multimin: number;
  u_multimin: number;
  multilifetime: number;
  u_multilifetime: number;
  nameexist: number;
  u_nameexist: number;
  producedblocks: number;
  missedblocks: number;
  virgin: number;
  fees: string;
  rewards: string;
  paidFee: string;
  votingReward: string;
  forgingReward: string;
  lstRoundBalance: string;
  lstRoundTxCount: number;
  lstModDate: number;
  dateCreated: string;
  uniqueId: string;
  _id: string;
  address: string;
  __v: number;
  publicKey: string;
  u_username: any;
  username: string;
  blockId: string;
  productivity: string;
};

export type RankModel = {
  _id: string;
  username?: string;
  address: string;
  dateCreated: string;
  profit: string;
  uniqueId: string;
  rate: string;
};
export type RateOfReturnModel = {
  totalBenefit: number;
  totalFee: number;
  rateOfReturn: number;
};

export type DelegatesResModel = {
  delegates: DelegateModel[];
  totalCount: number;
};
export type DelegateInfoResModel = {
  delegate: DelegateModel;
};
export enum DELEGATE_VOTEABLE {
  UNABLE_VOTE = "unable-vote",
  CHEKCING = "checking",
  VOTEABLE = "voteable",
}
