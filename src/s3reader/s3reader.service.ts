import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { Pub047 } from 'src/dto/pub047.dto';
import { Readable } from 'stream';

@Injectable()
export class S3readerService {
  private readonly logger = new Logger(S3readerService.name);
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const s3Endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint: s3Endpoint, // Set the local endpoint
      forcePathStyle: true,
    });
  }

  async readS3Object(event: any): Promise<Pub047[]> {
    const record = event.Records[0];

    this.logger.log(`Bucket: ${record.s3.bucket.name}`);
    this.logger.log(`Object Key: ${record.s3.object.key}`);

    const bucketName = record.s3.bucket.name;
    const objectKey = record.s3.object.key;
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    try {
      const response = await this.s3Client.send(command);
      const stream = response.Body as Readable;

      const data = await this.streamToString(stream); // Read the S3 object as a string

      // Convert the raw JSON string into an array of Pub047 objects
      const parsedData: any[] = JSON.parse(data); // Parse the string to JSON
      const pub047List: Pub047[] = plainToInstance(Pub047, parsedData);
      return pub047List;
    } catch (error) {
      this.logger.error(`Error reading object from S3: ${error.message}`);
      throw error;
    }

    return []; // Return an empty array if no records were processed
  }

  private async streamToString(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
  }
}
