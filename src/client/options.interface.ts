export interface IClientOptions {
    connectionLimit?: number;
    connectionTimeout?: number;
    host: string;
    password: string;
    port?: number;
    username: string;

    logLevel?: LogLevel;
    logTimed?: boolean;
}

export enum LogLevel {
    ALL,
    ERROR,
    NONE,
}
