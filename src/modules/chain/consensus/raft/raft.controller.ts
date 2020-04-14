import { Controller, Get, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc, GrpcMethod } from '@nestjs/microservices';
import { RaftService } from './raft.service';
import { raftOptions } from '../../../../config/transportOptions';
import { Observable } from 'rxjs';

export interface RaftRequest {
  message: [string, (string | Int8Array)];
}

export interface RaftResponse {
  message: boolean;
}

class IRaftService {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  voteRequest(message: RaftRequest): Observable<any>;
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  heartbeat(): void;
}

@Controller('raft')
export class RaftController implements OnModuleInit {
  @Client(raftOptions)
  private client: ClientGrpc;
  private raftClient: IRaftService;
  private rpcClients: Array<[string, IRaftService]>;
  private _raftService: RaftService;

  onModuleInit() {
    this.raftClient = this.client.getService<IRaftService>('RaftService');
    this._raftService = new RaftService(this.rpcClients);
    this._raftService.start();
  }

  @GrpcMethod('RaftService')
  voteRequest(): RaftResponse {
    return {message: this._raftService.handleVoteRequest()};
  }

  @GrpcMethod('RaftService')
  heartbeat(): void {
    this._raftService.handleHeartbeat();
  }
}
