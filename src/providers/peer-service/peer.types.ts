export interface PeerModel {
	ip: string;
	port: number;
	height: number;
	health: number;
	state: number;
	sharePort: number;
}
export interface LocalPeerModel extends PeerModel {
	full_url: string;
	during: number;
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
