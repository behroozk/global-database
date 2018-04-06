export interface IClient {
  execute(query: string, singularValue?: boolean): Promise<any>;
}
