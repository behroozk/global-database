import * as Logger from 'console';
import { v1 as Neo4j } from 'neo4j-driver';

import { IClient } from '../client/interface';
import { INeo4jOptions } from './options.interface';

export class Neo4jBolt implements IClient {
    public static getClient(options: INeo4jOptions): Promise<Neo4jBolt> {
        const completeOptions: Required<INeo4jOptions> = { ...this.DEFAULT_OPTIONS, ...options };
        const client = new Neo4jBolt(completeOptions);
        return Promise.resolve(client);
    }

    private static DEFAULT_OPTIONS = {
        connectionLimit: 8,
        connectionTimeout: 60 * 1000,
        port: 7687,
    };

    private client: Neo4j.Driver;

    constructor(options: Required<INeo4jOptions>) {
        this.client = Neo4j.driver(
            `bolt://${options.host}:${options.port}`,
            Neo4j.auth.basic(options.username, options.password),
            {
                connectionTimeout: options.connectionTimeout,
                maxConnectionPoolSize: options.connectionLimit,
            },
        );
    }

    public async execute(query: string, singularValue: boolean = false): Promise<any> {
        try {
            const session = this.client.session();
            const response = await session.run(query);
            session.close();
            const parsedResponse = this.parseResponse(response);

            if (singularValue && parsedResponse.length === 1) {
                return parsedResponse[0];
            }

            return parsedResponse;

        } catch (error) {
            throw new Error(error.message || 'unkown neo4j bolt error');
        }
    }

    private parseResponse(response: Neo4j.StatementResult): any[] {
        return response.records.map((record) => this.neo4jResultToJson(record));
    }

    private neo4jResultToJson(input: any): any {
        if (typeof input === 'string' || typeof input === 'boolean'
            || typeof input === 'number' || input === null) {
            return input;
        } else if (Array.isArray(input)) {
            return input.map((item) => this.neo4jResultToJson(item));
        } else if (input.constructor.name === 'Integer') {
            return (input as Neo4j.Integer).toNumber();
        } else if (input.constructor.name === 'Node') {
            return this.neo4jResultToJson((input as Neo4j.Node).properties);
        } else if (input.constructor.name === 'Relationship') {
            return this.neo4jResultToJson((input as Neo4j.Relationship).properties);
        }

        const output: any = {};

        // if input is a neo4j record
        if (input.constructor.name === 'Record') {
            const record: Neo4j.Record = input;
            for (const key of record.keys) {
                output[key] = this.neo4jResultToJson(record.get(key));
            }
        } else if (input.constructor.name !== 'Object') {
            Logger.log(`neo4j bolt output type: ${input.constructor.name}`);
        } else {
            for (const key in input) {
                if (!input.hasOwnProperty(key)) { continue; }
                output[key] = this.neo4jResultToJson(input[key]);
            }
        }

        return output;
    }
}
