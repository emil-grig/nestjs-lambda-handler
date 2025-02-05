import { Injectable, Logger } from '@nestjs/common';
import { S3readerService } from './s3reader/s3reader.service';
import { DownloadsService } from './downloads/downloads.service';
import { FileService } from './file-utils/file.service';
import * as fs from 'fs';
import { ResilienceService } from './utils/resilience.service';

@Injectable()
export class S3HandlerService {
  private readonly logger = new Logger(S3HandlerService.name);

  constructor(
    private readonly s3readerService: S3readerService,
    private readonly downloadsService: DownloadsService,
    private readonly fileService: FileService,
    private readonly resilienceService: ResilienceService,
  ) {}

  async handleS3Event(event: any): Promise<void> {
    try {
      // Wait for the asynchronous readS3Object method to resolve
      const pub047List = await this.s3readerService.readS3Object(event);

      // Iterate over the list of Pub047 objects
      for (const pub047 of pub047List) {
        for (const pub02 of pub047.customBlock.P02List) {
          const downloadOperation = async () => {
            return await this.readZipFile('zip.zip');
          };

          // const downloadOperation = async () => {
          //   return await this.downloadsService.downloadFile(
          //     pub02.distributionDeliveryURI,
          //   );
          // };

          const downloadBuffer = await this.resilienceService.executeWithRetry(
            downloadOperation,
            3,
            1000,
          );
          const zipFiles = await this.fileService.unzip(downloadBuffer);
          this.fileService.processUnzippedFiles(zipFiles);
        }
      }
    } catch (error) {
      console.error('Error handling S3 event:', error.message);
      throw error; // Re-throw the error if needed
    }
  }

  async readZipFile(filePath: string): Promise<Buffer> {
    try {
      // Ensure the file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read the file as a buffer
      const fileBuffer = fs.readFileSync(filePath);
      this.logger.log(`Successfully read ZIP file: ${filePath}`);
      return fileBuffer;
    } catch (error) {
      this.logger.error(`Error reading ZIP file: ${error.message}`);
      throw error;
    }
  }
}
