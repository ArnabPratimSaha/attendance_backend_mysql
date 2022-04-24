"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlConnection = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
// create the connection to database
const errorHandler_1 = require("../middleware/errorHandler");
class MySqlConnection {
    constructor(connection) {
        this.connection = connection;
    }
}
exports.MySqlConnection = MySqlConnection;
_a = MySqlConnection;
MySqlConnection.build = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const connection = yield promise_1.default.createConnection({
            host: process.env.MYSQL_ADDON_HOST,
            user: process.env.MYSQL_ADDON_USER,
            password: process.env.MYSQL_ADDON_PASSWORD,
            database: process.env.MYSQL_ADDON_DB,
            port: 3306
        });
        const nc = new MySqlConnection(connection);
        return nc;
    }
    catch (error) {
        throw new errorHandler_1.CustomError('could not connect to mysql database', 500, false);
    }
});
exports.default = MySqlConnection;
