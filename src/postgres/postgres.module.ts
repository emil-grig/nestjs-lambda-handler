import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresService } from './postgres.service';
import { UtilsModule } from 'src/utils/utils.module';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const ssm = new SSMClient({
          region: configService.get<string>('AWS_REGION', 'us-east-1'),
          endpoint: configService.get<string>(
            'AWS_ENDPOINT',
            'http://localhost:4569',
          ),
          credentials: {
            accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID', 'test'),
            secretAccessKey: configService.get<string>(
              'AWS_SECRET_ACCESS_KEY',
              'test',
            ),
          },
        });

        const fetchSSM = async (param: string, decrypt = false) => {
          try {
            const response = await ssm.send(
              new GetParameterCommand({ Name: param, WithDecryption: decrypt }),
            );
            return (
              response.Parameter?.Value ||
              configService.get(param.replace('/app/', ''), '')
            );
          } catch (error) {
            if (error.message.includes('Not Found')) {
              console.warn(
                `⚠️  Missing SSM parameter: ${param} - Using local fallback value`,
              );
              return configService.get(param.replace('/app/', ''), '');
            }
            throw error;
          }
        };

        return {
          type: 'postgres',
          host: await fetchSSM('/app/DB_HOST'),
          port: Number(await fetchSSM('/app/DB_PORT')),
          username: await fetchSSM('/app/DB_USERNAME'),
          password: await fetchSSM('/app/DB_PASSWORD', true),
          database: await fetchSSM('/app/DB_NAME'),
          entities: [],
          synchronize: false,
          logging: configService.get<boolean>('DB_LOGGING', false),
        };
      },
    }),
    UtilsModule,
  ],
  providers: [PostgresService],
  exports: [PostgresService],
})
export class PostgresModule {}
