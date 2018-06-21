import * as PIXI from "pixi.js";
import PIXI_SOUND from "pixi-sound";
console.log("--PIXI_SOUND", PIXI_SOUND);
export const addSound: typeof PIXI.sound.add = (...args) =>
	(PIXI.sound.add as any)(...args);
export const playSound: typeof PIXI.sound.play = (...args) =>
	(PIXI.sound.play as any)(...args);

addSound("scan-success", "assets/sounds/wx-scanner.wav");
addSound("coinSingle", "assets/sounds/coinSingle.wav");
playSound("coinSingle", {
	muted:true,
	volume: 0,
});
// addSound("coinSoundFew", "assets/sounds/coinFew.wav");
// addSound("coinSoundMore", "assets/sounds/coinMore.wav");
// addSound("coinSoundMuch", "assets/sounds/coinMuch.wav");
