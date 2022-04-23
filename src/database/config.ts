import mysql,{Connection} from 'mysql2/promise';
// create the connection to database
import { CustomError } from '../middleware/errorHandler';

export class MySqlConnection{
    public connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }
    
    public static build =async():Promise<MySqlConnection>=> {
        try {
            const connection= await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: 'password',
                database: 'attendenceDatabase',
                port: 3306
            });
            const nc=new MySqlConnection(connection);
            return nc;
        } catch (error) {
            throw new CustomError('could not connect to mysql database',500,false);
        }
    }
}
export default MySqlConnection;
