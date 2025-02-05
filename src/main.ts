import { NestFactory } from '@nestjs/core';
import { AppModule } from './lambda.handler.module';
import { Handler, Context } from 'aws-lambda';
import { S3HandlerService } from './lambda.handler.service';

let app;

export const handler: Handler = async (event: any, context: Context) => {
  if (!app) {
    app = await NestFactory.createApplicationContext(AppModule);
  }
  const s3HandlerService = app.get(S3HandlerService);
  s3HandlerService.handleS3Event(event);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Event processed successfully!' }),
  };
};
