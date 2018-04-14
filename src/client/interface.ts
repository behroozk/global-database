import { IQueryOptions } from './query_options.interface';

export interface IClient {
  execute(query: string, options?: IQueryOptions): Promise<any>;
}
