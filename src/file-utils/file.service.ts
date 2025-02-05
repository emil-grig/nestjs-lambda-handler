import { HttpException, Injectable, Logger } from '@nestjs/common';
import AdmZip, { IZipEntry } from 'adm-zip';
import { CsvParserService } from './csv-parser.service';
import { PostgresService } from 'src/postgres/postgres.service';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    private readonly csvParserService: CsvParserService,
    private readonly postgresService: PostgresService,
  ) {}

  async unzip(buffer: Buffer): Promise<IZipEntry[]> {
    const csvEntries: Buffer[] = [];
    try {
      // Initialize AdmZip with the downloaded file buffer
      const zip = new AdmZip(buffer);

      // Get the entries (files) inside the zip
      const zipEntries = zip.getEntries();
      return zipEntries;
    } catch (error) {
      this.logger.error(`Error unzipping the file: ${error.message}`);
      throw new HttpException('Error unzipping the file', 500);
    }
  }

  async processUnzippedFiles(csvFiles: IZipEntry[]): Promise<void> {
    this.logger.log('Processing extracted files');
    const regex = /^[^a-zA-Z0-9]/;

    for (const file of csvFiles) {
      if (regex.test(file.entryName) || !file.entryName.endsWith('.csv')) {
        this.logger.warn(
          `Skipping file: ${file.entryName} - Unprocessable format`,
        );
        continue; // Skip this iteration for unprocessable files
      }

      try {
        const parsedCsv = await this.csvParserService.parse(file.getData());
        await this.postgresService.insertParsedData(parsedCsv);
      } catch (error) {
        this.logger.error(
          `Error parsing file: ${file.entryName}`,
          error.message,
        );
      }
    }
    this.logger.debug('Processed extracted files');
  }
}
