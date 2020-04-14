import { Module } from '@nestjs/common';
import { ChainController } from './chain.controller';
import { ChainService } from './chain.service';

@Module({
  controllers: [ChainController],
  providers: [ChainService]
})
export class ChainModule {}
