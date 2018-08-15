import { Pipe, PipeTransform } from "@angular/core";
import * as moment from "moment";

@Pipe({
	name: "amoment",
})
export class AmomentPipe implements PipeTransform {
	transform(value: string, ...args) {
		var m = moment(value);
		args.forEach(arg => {
			if (typeof arg === "string") {
				m = m[arg]();
			} else if (arg instanceof Array) {
				const [name, ...args] = arg;
				if (name === "INIT") {
					const [init_name, ...init_args] = args;
					m = moment[init_name](value, ...init_args);
				} else {
					m = m[name](...args);
				}
			}
		});
		return m;
	}
}
