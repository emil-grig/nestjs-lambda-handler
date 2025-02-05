export class ParsedCsv {
  constructor(
    readonly tableName: string,
    readonly columnNames: string[],
    readonly rows: Map<string, string>[],
  ) {}
}
