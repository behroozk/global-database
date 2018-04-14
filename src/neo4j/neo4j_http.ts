import * as Logger from 'console';
import * as requestPromise from 'request-promise';

import { DEFAULT_QUERY_OPTIONS } from '../client/default_query_options';
import { IClient } from '../client/interface';
import { IQueryOptions } from '../client/query_options.interface';
import { INeo4jOptions } from './options.interface';

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
    };

    private auth: string;
    private protocol: string;
    private host: string;
    private port: number;
    private url: string;
    private connectTimeout: number;

    constructor(options: Required<INeo4jOptions>) {
        this.auth = new Buffer(`${options.username}:${options.password}`).toString('base64');
        this.protocol = options.protocol;
        this.host = options.host;
        this.port = options.port;
        this.connectTimeout = options.connectionTimeout;

        this.url = `${this.protocol}://${this.host}:${this.port}/db/data/transaction/commit`;
    }

    public async execute(query: string, options: IQueryOptions = DEFAULT_QUERY_OPTIONS): Promise<any> {
        try {
            const requestOptions: requestPromise.OptionsWithUri = {
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

            const response = await requestPromise.post(requestOptions);
            const parsedResponse = this.parseResponse(response);

            if (options.singularValue && parsedResponse.length === 1) {
                return parsedResponse[0];
            }

            return parsedResponse;
        } catch (error) {
            Logger.error(error);
            throw new Error('Error executing neo4j query');
        }
    }

    private parseResponse(response: any): any[] {
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
