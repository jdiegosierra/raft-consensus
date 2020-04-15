import { config } from "dotenv"
import settings from './settings';
import { Transport } from '@nestjs/microservices';

interface IData {
  [key: string]: any;
}

// Some basic config
const defaultConfig: IData = {
  title: 'TypeScript Server'
};

// Environment config
const server: IData = {
  development: {
    HOST: '0.0.0.0',
    PORT: 3001,
    HTTPS: false,
    RAFT_CLIENTS: [
      {
      transport: Transport.GRPC,
      options: {
        package: 'raft',
        protoPath: './src/transport-layers/rpc/raft.proto',
        url: 'localhost: 8000',
      }
    },
      {
        transport: Transport.GRPC,
        options: {
          package: 'raft',
          protoPath: './src/transport-layers/rpc/raft.proto',
          url: 'localhost: 8001',
        }
      },
      {
        transport: Transport.GRPC,
        options: {
          package: 'raft',
          protoPath: './src/transport-layers/rpc/raft.proto',
          url: 'localhost: 8002',
        }
      }]
  },
  test: {
    HOST: '0.0.0.0',
    PORT: 3001,
    HTTPS: true,
  },
  production: {
    HOST: '0.0.0.0',
    PORT: 3001,
    HTTPS: true,
  }
};

export default {
  ...defaultConfig,
  ...settings,
  ...{
    server: server[process.env.NODE_ENV || 'development']
  }
};
