import { Pipe, PipeTransform } from "@angular/core";

/**
 * Generated class for the MaskPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
	name: "mask",
})
export class MaskPipe implements PipeTransform {
	/**
	 * Takes a value and makes it lowercase.
	 */
	transform(value: string, ...args) {
		if (args[0].indexOf("@") === 0) {
			const type = args[0].substr(1);
			if (type === "address") {
				return (
					value.substr(0, 4) +
					"<span class='hide-content'>**</span>" +
					value.substr(-4)
				);
			}
			if (type === "ip") {
				const ipinfo = value.split(".");
				if (ipinfo.length == 4) {
					ipinfo.splice(1, 2, "<span class='hide-content'>⁎⁎</span>");
				}
				return ipinfo.join(".");
			}
		}
		return value.toLowerCase();
	}
}
