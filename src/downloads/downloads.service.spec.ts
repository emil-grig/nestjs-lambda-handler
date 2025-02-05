import { Test, TestingModule } from '@nestjs/testing';
import { DownloadsService } from './downloads.service';
import { HttpService } from '@nestjs/axios'; // 👈 Import HttpService
import { of } from 'rxjs'; // 👈 Needed for mock observables

describe('DownloadsService', () => {
  let service: DownloadsService;
  let httpServiceMock: Partial<HttpService>;

  beforeEach(async () => {
    httpServiceMock = {
      get: jest.fn().mockReturnValue(of({ data: 'mocked response' })), // 👈 Mock HTTP GET request
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DownloadsService,
        {
          provide: HttpService, // 👈 Provide HttpService mock
          useValue: httpServiceMock,
        },
      ],
    }).compile();

    service = module.get<DownloadsService>(DownloadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
