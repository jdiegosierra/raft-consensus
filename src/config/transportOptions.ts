import { Transport, ClientOptions, TcpClientOptions } from '@nestjs/microservices';
import {join} from "path";

export const raftOptions: ClientOptions = {
    transport: Transport.GRPC,
    options: {
        package: 'raft',
        protoPath: './src/transport-layers/rpc/raft.proto',
        url: '127.0.0.1:' + (process.env.GRPC_CLIENT || 8000),
    }
};

export const tcpOptions: TcpClientOptions = {
    transport: Transport.TCP,
    options: {
        host: 'localhost',
        port: 3001
    }
};