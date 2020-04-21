import { Module } from '@nestjs/common';
import { RpcModule } from './transport-layers/rpc/rpc.module';
import { RestModule } from "./transport-layers/rest/rest.module";
import { LoggerModule } from './shared/logger/logger.module';

@Module({
  imports: [RestModule, RpcModule, LoggerModule]
})
export class AppModule {}
