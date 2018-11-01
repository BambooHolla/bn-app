import { BlockFilterBaseWrapper } from "../../../workers/blockchain-db/const";
import { BlockModel } from "./block.types";
import { BlockchainDB } from "../../../workers/blockchain-db";

export enum BLOCK_QUERY_MODE {
  BY_HEIGHT,
  BY_ID,
  BY_HEIGHT_RANGE,
}
export type BlockQueryModelResult<T extends BlockModel = BlockModel> = {
  backend_query: any
  v3db_query: (db: BlockchainDB<T>) => Promise<T[] | undefined>
}
export type BlockQueryModelHandler<T extends BlockModel = BlockModel> = (url_path: string, search: any) => BlockQueryModelResult<T>

//#region 细化查询模式，提供服务端与客户端的两套代码

export const blockApiCacheModelHandleMap = new Map<BLOCK_QUERY_MODE, BlockQueryModelHandler<BlockModel>>();

// 根据高度查询
blockApiCacheModelHandleMap.set(BLOCK_QUERY_MODE.BY_HEIGHT, (url_path, search) => {
  const query_model_result: BlockQueryModelResult<BlockModel> = {
    backend_query: search,
    v3db_query: async (db) => {
      const block = await db.getByHeight(search.height);
      if (block) {
        return [block]
      }
    }
  };
  return query_model_result;
});
// 根据ID查询
blockApiCacheModelHandleMap.set(BLOCK_QUERY_MODE.BY_ID, (url_path, search) => {
  const query_model_result: BlockQueryModelResult<BlockModel> = {
    backend_query: search,
    v3db_query: async (db) => {
      const block = await db.getById(search.id);
      if (block) {
        return [block]
      }
    }
  };
  return query_model_result;
});
// 根据高度范围查询
blockApiCacheModelHandleMap.set(BLOCK_QUERY_MODE.BY_HEIGHT_RANGE, (url_path, search) => {
  const query_model_result: BlockQueryModelResult<BlockModel> = {
    backend_query: search,
    v3db_query: async (db) => {
      const { $gt, $gte, $lt, $lte } = search;
      const from: number = ($gt ? ($gt + 1) : $gte) || 1;
      const to: number = ($lt ? ($lt - 1) : $lte) || await db.getMaxHeight();

      const block_list: BlockModel[] = [];
      for (var height = from; height <= to; height += 1) {
        const block = await db.getByHeight(height);
        if (block) {
          block_list.push();
        }
      }
      return block_list
    }
  };
  return query_model_result;
});


//#endregion
