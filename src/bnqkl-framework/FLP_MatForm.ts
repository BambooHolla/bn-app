import { FLP_Form } from "./FLP_Form";

import { ErrorStateMatcher } from "@angular/material/core";
import {
	FormControl,
	FormGroupDirective,
	NgForm,
	Validators,
} from "@angular/forms";

// Google Materail form plugin
export class FLP_MatForm extends FLP_Form {
	private _matFormMatcher_map = new Map<string, ErrorStateMatcher>();
	// 用于辅助表单的错误校验显示与否
	matFormMatcherFactory(name: string) {
		const { _matFormMatcher_map, errors } = this;
		let matcher = _matFormMatcher_map.get(name);
		if (!matcher) {
			matcher = new class MyErrorStateMatcher
				implements ErrorStateMatcher {
				isErrorState() {
					return !!errors[name];
				}
			}();
			_matFormMatcher_map.set(name, matcher);
		}
		return matcher;
	}
}
