import { config } from "dotenv"

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
    RAFT: {
      START_TIME_ELECTION: 1,
      END_TIME_ELECTION: 3,
      HEARTBEAT_INTERVAL: 1,
      TOLERANCE: 0.6,
      RAFT_MIN_NODES: 3
    }
  },
  test: {
    HOST: '0.0.0.0',
    PORT: 3001,
    HTTPS: true,
    RAFT: {
      START_TIME_ELECTION: 1,
      END_TIME_ELECTION: 3,
      HEARTBEAT_INTERVAL: 1,
      TOLERANCE: 0.6,
      RAFT_MIN_NODES: 3
    }
  },
  production: {
    HOST: '0.0.0.0',
    PORT: 3001,
    HTTPS: true,
    RAFT: {
      START_TIME_ELECTION: 1,
      END_TIME_ELECTION: 3,
      HEARTBEAT_INTERVAL: 1,
      TOLERANCE: 0.6,
      RAFT_MIN_NODES: 3
    }
  }
};

export default {
  ...defaultConfig,
  ...{
    server: server[process.env.NODE_ENV || 'development']
  }
};
