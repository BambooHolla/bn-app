export class BlizzardHash {
  static InitCryptTable() {
    const cryptTable: number[] = new Array(0x500);
    var seed = 0x00100001;
    var index1 = 0;
    var index2 = 0;
    var i: number;
    var temp1: number;
    var temp2: number;
    for (index1 = 0; index1 < 0x100; index1++) {
      for (index2 = index1, i = 0; i < 5; i++, index2 += 0x100) {
        seed = (seed * 125 + 3) % 0x2aaaab;
        temp1 = (seed & 0xffff) << 0x10;
        seed = (seed * 125 + 3) % 0x2aaaab;
        temp2 = seed & 0xffff;
        cryptTable[index2] = temp1 | temp2;
      }
    }
    return cryptTable;
  }
  static cryptTable = Object.freeze(BlizzardHash.InitCryptTable());
  static cryptTable_length = BlizzardHash.cryptTable.length;

  static hashString(lpszString: string, dwHashType: number) {
    const { cryptTable, cryptTable_length } = BlizzardHash;
    var seed1 = 0x7fed7fed;
    var seed2 = 0xeeeeeeee;
    var ch: number;
    for (var i = 0; i < lpszString.length; i += 1) {
      ch = ((dwHashType << 8) + lpszString.charCodeAt(i)) % cryptTable_length;
      seed1 = cryptTable[ch] ^ (seed1 + seed2);
      seed2 = ch + seed1 + seed2 + (seed2 << 5) + 3;
    }
    return seed1;
  }

  static hashRange = Object.freeze({
    min: -2147483648,
    max: 2147483647,
    dis: Math.pow(2, 32),
  });
  static inRangePosition(v: number) {
    const { hashRange } = BlizzardHash;
    return ((v - hashRange.min) / hashRange.dis) % 1;
  }
}
