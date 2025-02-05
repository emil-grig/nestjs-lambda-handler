import { Test, TestingModule } from '@nestjs/testing';
import { CsvParserService } from './csv-parser.service';
import { FileService } from './file.service';

import { privateDecrypt } from 'crypto';
import { PostgresService } from '../postgres/postgres.service'; // 👈 Import other dependencies

describe('FileService', () => {
  let service: FileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        {
          provide: CsvParserService, // 👈 Mock CsvParserService
          useValue: {
            parseCsv: jest.fn().mockResolvedValue([]), // 👈 Mock method returning an empty array
          },
        },
        {
          provide: PostgresService, // 👈 Mock PostgresService
          useValue: {
            insertParsedData: jest.fn(), // 👈 Mock method
          },
        },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
