import * as request from 'request';
import { promisify } from 'util';

import { DEFAULT_QUERY_OPTIONS } from '../client/default_query_options';
import { IClient } from '../client/interface';
import { LogLevel } from '../client/options.interface';
import { IQueryOptions } from '../client/query_options.interface';
import { Logger } from '../logger';
import { neo4jErrorParser } from './error_parser';
import { INeo4jOptions } from './options.interface';

const requestPostAsync = promisify<request.OptionsWithUri & request.CoreOptions, any>(request.post);

export class Neo4jHttp implements IClient {
    public static getClient(options: INeo4jOptions): Promise<Neo4jHttp> {
        const port: number = options.protocol === 'https' ? 7473 : 7474;
        const completeOptions: Required<INeo4jOptions> = { ...this.DEFAULT_OPTIONS, ...{ port }, ...options };
        const client = new Neo4jHttp(completeOptions);
        return Promise.resolve(client);
    }

    private static DEFAULT_OPTIONS = {
        connectionLimit: 8,
        connectionTimeout: 60 * 1000,
        logLevel: LogLevel.ERROR,
        logTimed: true,
    };

    private auth: string;
    private protocol: string;
    private host: string;
    private port: number;
    private url: string;
    private connectTimeout: number;
    private logger: Logger;

    constructor(options: Required<INeo4jOptions>) {
        this.auth = new Buffer(`${options.username}:${options.password}`).toString('base64');
        this.protocol = options.protocol;
        this.host = options.host;
        this.port = options.port;
        this.connectTimeout = options.connectionTimeout;

        this.url = `${this.protocol}://${this.host}:${this.port}/db/data/transaction/commit`;

        this.logger = new Logger(options.logLevel, options.logTimed);
    }

    public async execute(query: string, options: IQueryOptions = DEFAULT_QUERY_OPTIONS): Promise<any> {
        try {
            const runStartTime: number = Date.now();
            const requestOptions: request.OptionsWithUri & request.CoreOptions = {
                body: {
                    statements: [{
                        statement: query,
                    }],
                },
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Basic ' + this.auth,
                    'X-Stream': true,
                },
                json: true,
                timeout: this.connectTimeout,
                uri: this.url,
            };

            const response = await requestPostAsync(requestOptions);
            this.logger.log(`neo4j http query time: ${Date.now() - runStartTime}ms`);

            const parseStartTime: number = Date.now();
            const parsedResponse = this.parseResponse(response);
            this.logger.log(`neo4j http parse time: ${Date.now() - parseStartTime}ms`);

            if (options.singularValue && parsedResponse.length === 1) {
                return parsedResponse[0];
            }

            return parsedResponse;
        } catch (error) {
            this.logger.error('neo4j http error', error);
            neo4jErrorParser(error);
        }
    }

    private parseResponse(response: any): any[] {
        if (response && response.errors && response.errors.length > 0) {
            throw new Error(response.errors[0].message);
        }

        if (!response || !response.results || response.errors.length > 0) {
            throw new Error('Invalid neo4j result');
        }

        const parsedResult: any[] = [];
        const columns: string[] = response.results[0].columns;

        response.results[0].data.forEach((record: any) => {
            const row: any = {};

            columns.forEach((column: string, index: number) => {
                row[column] = record.row[index];
            });

            parsedResult.push(row);
        });

        return parsedResult;
    }
}
