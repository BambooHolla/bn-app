import {
	trigger,
	state,
	style,
	animate,
	transition,
	keyframes,
} from "@angular/animations";
export const LoginFormInOut = trigger("login-in-out", [
	state(
		"login",
		style({
			transform: "rotateY(0deg) translateZ(80px)",
		}),
	),
	state(
		"register",
		style({
			transform: "rotateY(180deg) translateZ(80px)",
		}),
	),
	transition(
		"login => register",
		animate(
			"500ms ease-out",
			keyframes([
				style({
					transform: "rotateY(0deg) translateZ(80px)",
				}),
				style({
					transform: "rotateY(180deg) translateZ(80px)",
				}),
			]),
		),
	),
	transition(
		"register => login",
		animate(
			"500ms ease-out",
			keyframes([
				style({
					transform: "rotateY(180deg) translateZ(80px)",
				}),
				style({
					transform: "rotateY(360deg) translateZ(80px)",
				}),
			]),
		),
	),
]);

export const RegisterFormInOut = trigger("register-in-out", [
	state(
		"login",
		style({
			transform: "rotateY(-180deg) translateZ(80px)",
		}),
	),
	state(
		"register",
		style({
			transform: "rotateY(0deg) translateZ(80px)",
		}),
	),
	transition(
		"login => register",
		animate(
			"500ms ease-out",
			keyframes([
				style({
					transform: "rotateY(-180deg) translateZ(80px)",
				}),
				style({
					transform: "rotateY(0deg) translateZ(80px)",
				}),
			]),
		),
	),
	transition(
		"register => login",
		animate(
			"500ms ease-out",
			keyframes([
				style({
					transform: "rotateY(0deg) translateZ(80px)",
				}),
				style({
					transform: "rotateY(180deg) translateZ(80px)",
				}),
			]),
		),
	),
]);
