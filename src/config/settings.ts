export default {
    raft: {
      START_TIME_ELECTION: 1,
      END_TIME_ELECTION: 3,
      HEARTBEAT_INTERVAL: 1,
      TOLERANCE: 0.6,
      RAFT_MIN_NODES: 3,
      RAFT_CLIENTS: [
        {
          package: 'raft',
          protoPath: './src/transport-layers/rpc/raft.proto',
          url: 'localhost: 8000',
        },
        {
          package: 'raft',
          protoPath: './src/transport-layers/rpc/raft.proto',
          url: 'localhost: 8001',
        },
        {
          package: 'raft',
          protoPath: './src/transport-layers/rpc/raft.proto',
          url: 'localhost: 8002',
        }]
    }
};
