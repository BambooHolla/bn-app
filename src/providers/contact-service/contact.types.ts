export interface ContactModel {
  address: string;
  username: string;
}
export interface ContactProModel extends ContactModel {
  owner_publicKey: string;
  remarkname?: string;
  tags?: string[];
  phones?: string[];
  remark?: string;
  image?: Blob;
}
export interface ContactModel {
  address: string;
  username: string;
}
export type MyContactResModel<
  CONFIRMED_CONTACT = ContactModel,
  UNCONFIRM_CONTACT = ContactModel
> = {
  success: boolean;
  followers: UNCONFIRM_CONTACT[];
  following: CONFIRMED_CONTACT[];
};
