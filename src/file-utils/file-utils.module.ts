import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { CsvParserService } from './csv-parser.service';
import { PostgresModule } from 'src/postgres/postgres.module';

@Module({
  providers: [FileService, CsvParserService],
  imports: [PostgresModule],
  exports: [FileService],
})
export class FileUtilsModule {}
