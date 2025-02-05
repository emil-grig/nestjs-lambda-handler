import { Injectable, Logger } from '@nestjs/common';
import { ParsedCsv } from 'src/dto/parsed-csv.dto';
import { parse } from '@fast-csv/parse';
import { Readable } from 'stream';

@Injectable()
export class CsvParserService {
  logger = new Logger(CsvParserService.name);
  parse(buffer: Buffer): Promise<ParsedCsv> {
    return new Promise((resolve, reject) => {
      let rowCount = 0;
      let firstRow = [];
      let secondRow = [];
      let rowObjects = [];
      const stream = Readable.from(buffer);
      stream
        .pipe(parse({ ignoreEmpty: true, delimiter: ',' }))
        .on('data', (row) => {
          // Silent processing without logs
          if (rowCount < 1) {
            firstRow = row;
          } else if (rowCount < 2) {
            secondRow = this.getUniqueColumnNames(row);
          } else {
            if (row.length == secondRow.length) {
              rowObjects.push(
                secondRow.reduce((acc, col, index) => {
                  acc[col] = row[index];
                  return acc;
                }, {}),
              );
            }
          }

          rowCount++;
        })
        .on('error', (err) => {
          console.error(
            'Error occurred while processing the file:',
            JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
          );
          reject(err);
        })
        .on('end', () => {
          console.log('Finished processing CSV file silently');
          resolve(new ParsedCsv(firstRow[1], secondRow, rowObjects));
        });
    });
  }
  getUniqueColumnNames(columnNames: string[]): string[] {
    const columnCount: Map<string, number> = new Map();
    return columnNames.map((originalName) => {
      const cleanName = originalName.replace(/[^a-zA-Z0-9 _]/g, '');
      const count = (columnCount.get(cleanName) || 0) + 1;
      columnCount.set(cleanName, count);

      return count > 1 ? `${cleanName}${count}` : cleanName;
    });
  }
}
