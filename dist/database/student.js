"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentModel = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    classId: { type: String, required: true },
    name: { type: String, required: true },
    attendanceArray: [{ type: Boolean, required: true }],
    roll: { type: String, required: true }
});
const StudentModel = (0, mongoose_1.model)('Student', schema);
exports.StudentModel = StudentModel;
