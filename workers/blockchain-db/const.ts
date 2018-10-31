import { PromiseOut } from "../../src/bnqkl-framework/lib/PromiseOut";

export type DB_Config = {
  max_height: number
  page_size: number
}
export type DB_Item_Index = {
  page_index: number,
  arr_index: number
}
export type BlockBaseModel = {
  id: string;
  height: number;
}

export type CacheBlockList<T extends BlockBaseModel> = Map<number, T>;

export type BlockFilterFunction<T extends BlockBaseModel> = (item: T) => boolean;

export type BlockFilterBaseWrapper<T extends BlockBaseModel>  = {
  filter: BlockFilterFunction<T>,
  limit: number,
  skip: number,
}

export type BlockFilterWrapper<T extends BlockBaseModel> = BlockFilterBaseWrapper<T> & {
  result: T[],
  task: PromiseOut<T[]>,
}

export type QueryTask<T extends BlockBaseModel> = {
  // cur_page_index: number
  filter_wrapper_map: Map<number, BlockFilterWrapper<T>>;
  task: Promise<void>;
}
