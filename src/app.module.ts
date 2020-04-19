import { Module } from '@nestjs/common';
import { RpcModule } from './transport-layers/rpc/rpc.module';
import { RestModule } from "./transport-layers/rest/rest.module";

@Module({
  imports: [RestModule, RpcModule]
})
export class AppModule {}
