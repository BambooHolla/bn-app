export interface LocalContactModel {
  _id: string;
  owner_publicKey: string;
  address: string;
  username?: string;
  nickname?: string;
  tags: string[];
  phones: string[];
  remark?: string;
  image?: Blob;
  create_time: number;
  last_update_height: number;
}
export interface TagModel {
  _id: string;
  owner_publicKey: string;
  name: string;
  contact_ids: string[];
  create_time: number;
}
