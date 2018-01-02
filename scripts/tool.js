"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline = require("readline");
function getConsoleOneLine(question, filter) {
    return new Promise((cb) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        process.stdin.setRawMode(false);
        rl.question(question, (answer) => {
            if (filter instanceof Function) {
                if (!filter(answer)) {
                    cb(getConsoleOneLine(question, filter));
                }
            }
            cb(answer);
            rl.close();
        });
    });
}
exports.getConsoleOneLine = getConsoleOneLine;
async function getConsoleOneLineWithTrim(question, filter) {
    var line;
    while (!line) {
        line = await getConsoleOneLine(question, filter);
        line = line.trim();
    }
    return line;
}
exports.getConsoleOneLineWithTrim = getConsoleOneLineWithTrim;
