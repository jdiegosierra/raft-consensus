export default {
    raft: {
      START_TIME_ELECTION: 1,
      END_TIME_ELECTION: 3,
      HEARTBEAT_INTERVAL: 1,
      TOLERANCE: 0.1,
      RAFT_MIN_NODES: 3,
      RAFT_CLIENTS: [
        {
          id: "8000",
          options:
            {
              package: 'raft',
              protoPath: './src/transport-layers/rpc/raft.proto',
              url: '0.0.0.0:' +  8000,
            }
        },
        {
          id: "8001",
          options:
            {
              package: 'raft',
              protoPath: './src/transport-layers/rpc/raft.proto',
              url: '0.0.0.0:' + 8001,
            }
        },
        {
          id: "8002",
          options:
            {
              package: 'raft',
              protoPath: './src/transport-layers/rpc/raft.proto',
              url: '0.0.0.0:' + 8002,
            }
        }
        ]
    }
};
