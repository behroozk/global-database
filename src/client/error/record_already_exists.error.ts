export class RecordAlreadyExistsError extends Error {
    constructor(message?: string) {
        super(message || 'record already exists');
    }
}
