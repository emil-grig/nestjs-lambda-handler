import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner, Table } from 'typeorm';
import { ParsedCsv } from 'src/dto/parsed-csv.dto';
import { ResilienceService } from 'src/utils/resilience.service';
import _ from 'lodash';
@Injectable()
export class PostgresService {
  private readonly logger = new Logger(PostgresService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly resilienceService: ResilienceService,
  ) {}

  async insertParsedData(parsedCSV: ParsedCsv): Promise<void> {
    const tableName = parsedCSV.tableName;
    const columnNames = parsedCSV.columnNames;
    const rows = parsedCSV.rows;
    const columns = columnNames.map((name) => ({
      name,
      type: 'VARCHAR(255)', // Default type for all columns, can be customized
    }));
    await this.deleteTable(tableName);
    await this.createTable(tableName, columns);
    await this.insertRecords(tableName, rows);
  }

  /**
   * Creates a new table dynamically using TypeORM's QueryRunner.
   * @param tableName - Name of the table.
   * @param columns - Array of column definitions (name and type).
   */
  async createTable(
    tableName: string,
    columns: { name: string; type: string }[],
  ): Promise<void> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const hasTableOperation = async () => {
        return await queryRunner.hasTable(tableName);
      };

      const tableExists = await this.resilienceService.executeWithRetry(
        hasTableOperation,
        3,
        1000,
      );

      if (tableExists) {
        this.logger.warn(`Table "${tableName}" already exists.`);
        return;
      }

      // Construct table schema dynamically
      const table = new Table({
        name: tableName,
        columns: columns.map((col) => ({
          name: col.name,
          type: col.type,
          isNullable: true,
        })),
      });

      const createTableOperation = async () => {
        await queryRunner.createTable(table);
      };

      await this.resilienceService.executeWithRetry(
        createTableOperation,
        3,
        1000,
      );

      this.logger.log(`Table "${tableName}" created successfully.`);
    } catch (error) {
      this.logger.error(
        `Failed to create table "${tableName}": ${error.message}`,
      );
      throw new Error(`Could not create table: ${tableName}`);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteTable(tableName: string): Promise<void> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const hasTableOperation = async () => {
        return await queryRunner.hasTable(tableName);
      };

      const tableExists = await this.resilienceService.executeWithRetry(
        hasTableOperation,
        3,
        1000,
      );

      if (!tableExists) {
        this.logger.warn(`Table "${tableName}" does not exist.`);
        return;
      }

      const deleteTableOperation = async () => {
        await queryRunner.dropTable(tableName);
      };

      await this.resilienceService.executeWithRetry(
        deleteTableOperation,
        3,
        1000,
      );

      this.logger.log(`Table "${tableName}" deleted successfully.`);
    } catch (error) {
      this.logger.error(
        `Failed to delete table "${tableName}": ${error.message}`,
      );
      throw new Error(`Could not delete table: ${tableName}`);
    } finally {
      await queryRunner.release();
    }
  }

  async insertRecords(
    tableName: string,
    rows: Map<string, string>[],
  ): Promise<void> {
    try {
      const batches = _.chunk(rows, 100);

      const queryBuilder = this.dataSource.createQueryBuilder();

      // Process all batches in parallel
      await Promise.all(
        batches.map(async (batch, index) => {
          const insertRecordsOperation = async () => {
            await queryBuilder
              .insert()
              .into(tableName)
              .values(batch) // Pass rows as dynamic key-value pairs
              .execute();
          };
          await this.resilienceService.executeWithRetry(
            insertRecordsOperation,
            3,
            1000,
          );
        }),
      );
      this.logger.log(
        `Inserted ${rows.length} rows into table "${tableName}".`,
      );
    } catch (error) {
      this.logger.error(
        `Error inserting records into table "${tableName}": ${error.message}`,
      );
      throw new Error(`Failed to insert records into table "${tableName}".`);
    }
  }
}
