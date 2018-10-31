import { BlockchainDBCore } from './blockchain-db.core';
import { BlockBaseModel } from './const';
export * from './blockchain-db.core';

export class BlockchainDB<T extends BlockBaseModel> extends BlockchainDBCore<T> {
  afterInited(){
    return this._db_init;
  }
  async hasId(id: string) {
    return this._id_height_indexs.has(id);
  }
  async hasHeight(height: number) {
    return this._height_id_indexs.has(height);
  }
}
