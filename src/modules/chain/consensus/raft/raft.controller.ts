import { Controller, Get, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc, GrpcMethod } from '@nestjs/microservices';
import { RaftService } from './raft.service';
import { raftOptions } from '../../../../config/transportOptions';
import { Observable } from 'rxjs';

export interface RaftRequest {
  message: [string, (string | Int8Array)];
}

// export interface RaftResponse {
//   message: handle;
// }

interface IRaftService {
  leaderRequest(message: RaftRequest): Observable<any>;
}

@Controller('raft')
export class RaftController implements OnModuleInit {
  @Client(raftOptions)
  private client: ClientGrpc;
  private raftClient: IRaftService;

  onModuleInit() {
    this.raftClient = this.client.getService<IRaftService>('RaftService');
  }
  @GrpcMethod('RaftService')
  leaderRequest(message: RaftRequest): any {
    const raftService = new RaftService(this.raftClient);
    return {message: raftService.handleRaftMessage(message.message).toString()};
  }

  // @Get()
  // sendRequest(): string {
  //   this.raftClient.leaderRequest({message: "I want to be the leader"}).subscribe(response => {
  //     console.log(response.message);
  //   });
  //   return "You are the leader";
  // }
}
