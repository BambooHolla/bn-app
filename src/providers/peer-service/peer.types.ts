export type PeerModel = {
  ip: string;
  port: number;
  height: number;
  health: number;
  state: number;
  sharePort: number;
};
export type LocalPeerModel = {
  height: number;
  ip: string;
  p2pPort: number;
  webPort: number;
  origin: string;
  delay: number;
  level: PEER_LEVEL;
  /* # 节点品质算法
   * 1. 节点连接失败的时候并不直接影响节点的品质，因为要考虑网络问题就是不稳定的情况
   * 2. 使用累计时间以ms（毫秒）为单位，一般一分钟更新一次
   * 3. 有计算能力的节点品质分3级（降序）：可信节点，次可信节点，其它节点。
   * 4. 在节点连接成功后，并且收集到一定数量的节点（可信节点连接成功； 次可信节点>=4||<57 ； 其它节点>=57）后，就开始执行校验
   * 5. 在满足校验规则后，开始校验的过程中，节点的扫描依旧继续，当更高一级的节点满足条件后，放弃低级别的节点，使用高级别的节点。
   * 6. *如果校验一直无法成功超过30s，可否让用户自己手动选择一个节点继续连接
   *  
   * ## 校验规则
   * ### 可信节点校验规则
   * 1. 直接连上无需额外的校验，校验次数+=1，校验成功次数+=1
   * ### 次可信节点、其它节点校验规则
   * 1. 校验次数+=1
   * 1. 使用同步区块的接口，获取所有节点高度为1的区块hash，取拜占庭众数（众数f>=3/(n-1)），有这个满足这个条件的众数就进行下一步校验
   * 2. 获取以上节点的区块高度，如果取高度的拜占庭众数（众数f>=3/(n-1)），如果有就进行下一步校验
   * 3. 获取以上节点的最后一个块的id，取拜占庭众数，如果有，命中节点校验成功次数+=1，否则继续等待新的节点进来
   *  
   * ## 计算公式
   * ```
   * const fail_rate = ((acc_verify_total_times - acc_verify_success_times)/acc_verify_total_times)||0;// 失败率
   * const time_water = Math.max(Date.now() - latest_verify_fail_time, 1);// 时间能冲淡一切
   * // 如果是刚刚添加的新节点，那么fail_rate为0，time_water==Date.now()，会导致fail_score为0，那么这将是一个满分节点
   * // 如果是刚刚失败的节点，那么time_water>=1，会导致fail_score非常大
   * const fail_score = fail_rate / time_water; 
   * node_quality = 1 / fail_score
   * ```
   */
  /*节点累计 使用的时长*/ acc_use_duration: number;
  /*节点累计 最后检验失败的时间*/ latest_verify_fail_time: number;
  /*节点累计 校验次数*/ acc_verify_total_times: number;
  /*节点累计 校验成功次数*/ acc_verify_success_times: number;
  /*节点创建的时间*/ create_time: number;
};

export enum PEER_LEVEL {
  DISABLED = 0, // 拉黑
  TRUST = 1,
  SEC_TRUST = 2,
  OTHER = 3,
}
export function getNextPeerLevel(level: PEER_LEVEL) {
  if (level === PEER_LEVEL.TRUST) {
    return PEER_LEVEL.SEC_TRUST;
  }
  // if(level === PEER_LEVEL.SEC_TRUST){
  return PEER_LEVEL.OTHER;
  // }
  // return PEER_LEVEL.OTHER;
}
/* {
  ip: string;
  port: number;
  height: number;
  health: number;
  state: number;
  os: string;
  sharePort: number;
  version: string;
};
*/
