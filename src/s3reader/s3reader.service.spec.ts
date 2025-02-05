import { Test, TestingModule } from '@nestjs/testing';
import { S3readerService } from './s3reader.service';
import { ConfigService } from '@nestjs/config'; // 👈 Import ConfigService

describe('S3readerService', () => {
  let service: S3readerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3readerService,
        {
          provide: ConfigService, // 👈 Mock ConfigService
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'AWS_S3_BUCKET') return 'test-bucket'; // 👈 Mock config values
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<S3readerService>(S3readerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
