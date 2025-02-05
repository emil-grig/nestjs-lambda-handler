import { Module } from '@nestjs/common';
import { S3HandlerService } from './lambda.handler.service';
import { S3readerService } from './s3reader/s3reader.service';
import { ConfigModule } from '@nestjs/config';
import { DownloadsModule } from './downloads/downloads.module';
import { FileUtilsModule } from './file-utils/file-utils.module';
import { PostgresModule } from './postgres/postgres.module';
import { UtilsModule } from './utils/utils.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule globally available
    }),
    DownloadsModule,
    FileUtilsModule,
    PostgresModule,
    UtilsModule,
  ],
  providers: [S3HandlerService, S3readerService],
})
export class AppModule {}
