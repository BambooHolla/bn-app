import { isIPv4 } from "../helper/ip";
import { Buffer } from "buffer";

export default class District {
    constructor(public data) {}
    indexSize = this.bytes2Uint32(
        this.data[0],
        this.data[1],
        this.data[2],
        this.data[3]
    );

    findSync(ip) {
        if (!isIPv4(ip)) {
            return false;
        }

        const ips = ip.split(".");
        const val = this.bytes2Uint32(ips[0], ips[1], ips[2], ips[3]);

        let low = 0;
        let mid = 0;
        let pos = 0;
        let high = Math.floor((this.indexSize - 262148 - 262144) / 13) - 1;
        let pos1 = 0;
        let start = 0;
        let end = 0;

        while (low <= high) {
            mid = Math.ceil((low + high) / 2);
            pos = mid * 13 + 262148;

            start = this.bytes2Uint32(
                this.data[pos],
                this.data[pos + 1],
                this.data[pos + 2],
                this.data[pos + 3]
            );
            end = this.bytes2Uint32(
                this.data[pos + 4],
                this.data[pos + 5],
                this.data[pos + 6],
                this.data[pos + 7]
            );

            if (val > end) {
                low = mid + 1;
            } else if (val < start) {
                high = mid - 1;
            } else {
                let off = this.bytes2Uint32(
                    this.data[pos + 11],
                    this.data[pos + 10],
                    this.data[pos + 9],
                    this.data[pos + 8]
                );
                let len = this.data[pos + 12];

                pos = off - 262144 + this.indexSize;
                let buf = Buffer.alloc(len);
                this.data.copy(buf, 0, pos, pos + len);

                return String(buf).split("\t");
            }
        }

        return null;
    }

    bytes2Uint32(a, b, c, d) {
        let v = (a << 24) | (b << 16) | (c << 8) | d;
        if (v < 0) {
            return v + 4294967296;
        } else {
            return v;
        }
    }
}
