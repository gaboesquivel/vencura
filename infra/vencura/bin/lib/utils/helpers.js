"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutputValue = getOutputValue;
function getOutputValue(output) {
    return new Promise((resolve) => {
        output.apply((value) => {
            resolve(value);
        });
    });
}
