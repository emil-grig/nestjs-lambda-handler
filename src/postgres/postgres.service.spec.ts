import { Test, TestingModule } from '@nestjs/testing';
import { PostgresService } from './postgres.service';
import { DataSource, QueryRunner, Table } from 'typeorm';
import { ResilienceService } from 'src/utils/resilience.service';
import { ParsedCsv } from 'src/dto/parsed-csv.dto';
import { Logger } from '@nestjs/common';

describe('PostgresService', () => {
  let service: PostgresService;
  let dataSourceMock: Partial<DataSource>;
  let queryRunnerMock: Partial<QueryRunner>;
  let resilienceServiceMock: Partial<ResilienceService>;
  let insertQueryBuilderMock: any;

  beforeEach(async () => {
    queryRunnerMock = {
      connect: jest.fn(),
      release: jest.fn(),
      hasTable: jest.fn().mockResolvedValue(false),
      createTable: jest.fn(),
      dropTable: jest.fn(),
    };

    // Mock InsertQueryBuilder for insertRecords
    insertQueryBuilderMock = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };

    dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
      createQueryBuilder: jest.fn().mockReturnValue(insertQueryBuilderMock), // 👈 Mock InsertQueryBuilder
    };

    resilienceServiceMock = {
      executeWithRetry: jest.fn(async (operation) => operation()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostgresService,
        { provide: DataSource, useValue: dataSourceMock },
        { provide: ResilienceService, useValue: resilienceServiceMock },
      ],
    }).compile();

    service = module.get<PostgresService>(PostgresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('insertParsedData', () => {
    it('should create a table and insert records', async () => {
      const parsedCSV: ParsedCsv = {
        tableName: 'test_table',
        columnNames: ['id', 'name'],
        rows: [
          new Map(Object.entries({ id: '1', name: 'Alice' })),
          new Map(Object.entries({ id: '2', name: 'Bob' })),
        ],
      };

      jest.spyOn(service, 'deleteTable').mockResolvedValue(undefined);
      jest.spyOn(service, 'createTable').mockResolvedValue(undefined);
      jest.spyOn(service, 'insertRecords').mockResolvedValue(undefined);

      await service.insertParsedData(parsedCSV);

      expect(service.deleteTable).toHaveBeenCalledWith('test_table');
      expect(service.createTable).toHaveBeenCalledWith('test_table', [
        { name: 'id', type: 'VARCHAR(255)' },
        { name: 'name', type: 'VARCHAR(255)' },
      ]);
      expect(service.insertRecords).toHaveBeenCalledWith(
        'test_table',
        parsedCSV.rows,
      );
    });
  });

  describe('createTable', () => {
    it('should create a new table if it does not exist', async () => {
      (queryRunnerMock.hasTable as jest.Mock).mockResolvedValue(false);

      await service.createTable('test_table', [
        { name: 'id', type: 'VARCHAR(255)' },
        { name: 'name', type: 'VARCHAR(255)' },
      ]);

      expect(queryRunnerMock.createTable).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test_table',
          columns: expect.arrayContaining([
            expect.objectContaining({
              name: 'id',
              type: 'VARCHAR(255)',
              isNullable: true,
            }),
            expect.objectContaining({
              name: 'name',
              type: 'VARCHAR(255)',
              isNullable: true,
            }),
          ]),
        }),
      );
    });

    it('should not create a table if it already exists', async () => {
      (queryRunnerMock.hasTable as jest.Mock).mockResolvedValue(true);
      const loggerSpy = jest.spyOn(Logger.prototype, 'warn');

      await service.createTable('test_table', [
        { name: 'id', type: 'VARCHAR(255)' },
      ]);

      expect(queryRunnerMock.createTable).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(
        'Table "test_table" already exists.',
      );
    });
  });

  describe('deleteTable', () => {
    it('should delete an existing table', async () => {
      (queryRunnerMock.hasTable as jest.Mock).mockResolvedValue(true);

      await service.deleteTable('test_table');

      expect(queryRunnerMock.dropTable).toHaveBeenCalledWith('test_table');
    });

    it('should not attempt to delete a non-existent table', async () => {
      (queryRunnerMock.hasTable as jest.Mock).mockResolvedValue(false);
      const loggerSpy = jest.spyOn(Logger.prototype, 'warn');

      await service.deleteTable('test_table');

      expect(queryRunnerMock.dropTable).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(
        'Table "test_table" does not exist.',
      );
    });
  });

  describe('insertRecords', () => {
    it('should insert records in batches', async () => {
      const tableName = 'test_table';
      const rows = [
        new Map(Object.entries({ id: '1', name: 'Alice' })),
        new Map(Object.entries({ id: '2', name: 'Bob' })),
      ];

      jest
        .spyOn(insertQueryBuilderMock, 'execute')
        .mockResolvedValue(undefined);

      await service.insertRecords(tableName, rows);

      expect(insertQueryBuilderMock.insert).toHaveBeenCalledTimes(1);
      expect(insertQueryBuilderMock.into).toHaveBeenCalledWith('test_table');
      expect(insertQueryBuilderMock.values).toHaveBeenCalledWith(rows);
      expect(insertQueryBuilderMock.execute).toHaveBeenCalled();
    });

    it('should log an error if insertion fails', async () => {
      const tableName = 'test_table';
      const rows = [new Map(Object.entries({ id: '1', name: 'Alice' }))];

      jest
        .spyOn(insertQueryBuilderMock, 'execute')
        .mockRejectedValue(new Error('Insert failed'));
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(service.insertRecords(tableName, rows)).rejects.toThrowError(
        `Failed to insert records into table "${tableName}".`,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        `Error inserting records into table "${tableName}": Insert failed`,
      );
    });
  });
});
