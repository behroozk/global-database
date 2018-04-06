import { IClient } from '../client/interface';
import { Neo4jBolt } from './neo4j_bolt';
import { Neo4jHttp } from './neo4j_http';
import { INeo4jOptions } from './options.interface';

export class Neo4j {
    public static getClient(options: INeo4jOptions): Promise<IClient> {
        switch (options.protocol) {
            case 'http':
            case 'https':
                return Neo4jHttp.getClient(options);
            case 'bolt':
                return Neo4jBolt.getClient(options);
            default:
                throw new Error(`unknown neo4j protocol: ${options.protocol}`);
        }
    }
}
