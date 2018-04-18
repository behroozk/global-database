import { RecordAlreadyExistsError } from '../client/error/record_already_exists.error';

export function neo4jErrorParser(error: any): never {
    if (error instanceof Error) {
        if (error.message) {
            if (error.message.indexOf('already exists') > -1) {
                const matchedData = error.message.match(/^.+(already exists).+\"(.+)\"=\[(.+)\]/);
                if (!matchedData) {
                    throw new RecordAlreadyExistsError();
                } else {
                    throw new RecordAlreadyExistsError(`${matchedData[2]}: ${matchedData[3]}`);
                }
            }
        }
    }

    throw new Error(error.message || 'unkown neo4j bolt error');
}
