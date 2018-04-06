import { IClientOptions } from '../client/options.interface';

export interface IMysqlOptions extends IClientOptions {
    database: string;
}
