import * as Logger from 'console';
import * as MysqlDriver from 'mysql';

import { IClient } from '../client/interface';
import { IMysqlOptions } from './options.interface';

export class Mysql implements IClient {
    public static getClient(options: IMysqlOptions): Promise<Mysql> {
        try {
            const completeOptions: Required<IMysqlOptions> = { ...this.DEFAULT_OPTIONS, ...options };
            const client = new Mysql(completeOptions);
            return Promise.resolve(client);
        } catch (error) {
            Logger.error(error);
            throw new Error(error);
        }
    }

    private static DEFAULT_OPTIONS = {
        connectionLimit: 8,
        connectionTimeout: 60 * 1000,
        port: 3306,
    };

    // private options: Required<IMysqlOptions>;
    private pool: MysqlDriver.Pool;

    constructor(options: Required<IMysqlOptions>) {
        // this.options = options;

        this.pool = MysqlDriver.createPool({
            connectTimeout: options.connectionTimeout,
            connectionLimit: options.connectionLimit,
            database: options.database,
            host: options.host,
            password: options.password,
            port: options.port,
            user: options.username,
        });
    }

    public async execute(query: string): Promise<any> {
        const connection: MysqlDriver.PoolConnection = await this.getConnection();
        const results: any = await this.query(connection, query);
        return results;
    }

    private getConnection(): Promise<MysqlDriver.PoolConnection> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((error, connection) => {
                if (error) {
                    return reject(error);
                }

                resolve(connection);
            });
        });
    }

    private query(connection: MysqlDriver.PoolConnection, query: string): Promise<any> {
        return new Promise((resolve, reject) => {
            connection.query(query, (error, results) => { // , fields) => {
                connection.release();

                if (error) {
                    return reject(error);
                }

                return resolve(results);
            });
        });
    }
}
