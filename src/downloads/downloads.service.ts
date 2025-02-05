import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { AxiosResponse, HttpStatusCode } from 'axios';
import { STATUS_CODES } from 'http';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class DownloadsService {
  private readonly logger = new Logger(DownloadsService.name);

  constructor(private readonly httpService: HttpService) {}

  async downloadFile(dynamicUrl: string): Promise<Buffer> {
    const response: AxiosResponse = await lastValueFrom(
      this.httpService.get(dynamicUrl, { responseType: 'arraybuffer' }), // Ensure binary data is handled
    );
    if (response.status != HttpStatusCode.Ok) {
      throw new HttpException(
        'Unknown error. Could not download',
        response.status,
      );
    }
    return response.data;
  }
}
