import equal from "fast-deep-equal";

class AssertTool {
	isTrue(condition: boolean, deep = 1) {
		const des = this._getDescribeAndClear();
		if (condition) {
			return ["✅ %cpass" + des, "color:green"];
		}
		const err = new Error(des);
		if (err.stack) {
			const stacks = err.stack.split("\n");
			stacks.splice(1, deep);
			err.stack = stacks.join("\n");
		}
		return [err, "❌ %cfail" + des, "color:red"];
	}
	deepEqual<T>(a: T, b: T) {
		return equal(a, b);
	}
	deepEqualForLog<T>(a: T, b: T, deep = 2) {
		const condition = this.deepEqual(a, b);
		return {
			condition,
			log_args: [...this.isTrue(condition, deep), a, ...(condition ? [] : ["!==", b])]
		};
	}
	deepEqualWithLog<T>(a: T, b: T) {
		const { condition, log_args } = this.deepEqualForLog(a, b, 3);
		const err = !condition && log_args.shift() as Error;
		console.log(...log_args);
		err && console.log("%c" + (err.stack as string).split("\n").slice(1).join("\n"), "color:red");
	}
	private _describe;
	private _getDescribeAndClear() {
		const des = this._describe;
		if (des !== undefined) {
			this._describe = undefined;
			return ": " + des;
		}
		return "";
	}
	describe(str: string) {
		this._describe = str;
		return this;
	}
	des(str: string) {
		return this.describe(str);
	}
}
const assert = new AssertTool();
export default assert;
