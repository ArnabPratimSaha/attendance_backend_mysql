"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomid = void 0;
const uuid_1 = require("uuid");
const errorHandler_1 = require("../middleware/errorHandler");
const getCustomid = () => {
    const id = (0, uuid_1.v4)();
    let newId = '';
    for (let i = 0; i < id.length; i++) {
        newId = newId.trim();
        if (id[i] == '-')
            newId += '_';
        else
            newId += id[i];
    }
    if (newId)
        return newId.trim();
    throw new errorHandler_1.CustomError('uuid parsing failed', 500, false);
};
exports.getCustomid = getCustomid;
