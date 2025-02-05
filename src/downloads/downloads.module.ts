import { Module } from '@nestjs/common';
import { DownloadsService } from './downloads.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [DownloadsService],
  exports: [DownloadsService],
})
export class DownloadsModule {}
