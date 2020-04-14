import { Module } from '@nestjs/common';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';


@Module({
  imports: [],
  controllers: [NetworkController],
  providers: [NetworkService],
})
export class NetworkModule {}