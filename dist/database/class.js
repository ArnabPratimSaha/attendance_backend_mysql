"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassModel = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    teachers: [{ type: String, required: true }],
    students: [{ type: String, required: true }],
    attendanceArray: [{ type: Date, required: true }]
});
const ClassModel = (0, mongoose_1.model)('Class', schema);
exports.ClassModel = ClassModel;
