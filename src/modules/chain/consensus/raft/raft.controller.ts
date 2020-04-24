import { Controller } from '@nestjs/common';
import { Client, ClientGrpc, GrpcMethod } from '@nestjs/microservices';
import { RaftService } from './raft.service';
import { raftOptions } from '../../../../config/transportOptions';

export interface RaftRequest {
  message: [string, (string | Int8Array)];
}

export interface RaftResponse {
  message: boolean;
}

@Controller('raft')
export class RaftController {
  @Client(raftOptions)
  private client: ClientGrpc;

  constructor(private _raftService: RaftService) {}

  @GrpcMethod('RaftService')
  ping(): RaftResponse {
    return {message: this._raftService.ping()};
  }

  @GrpcMethod('RaftService')
  voteRequest(message: RaftRequest): RaftResponse {
    return {message: this._raftService.handleVoteRequest(message)};
  }

  @GrpcMethod('RaftService')
  heartbeat(): void {
    this._raftService.handleHeartbeat();
  }
}
