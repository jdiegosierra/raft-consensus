import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
// import { Reseteable, Timer } from './timer';
import config from '../../../../config/default';
// import { Observable } from 'rxjs';
// import { RaftRequest } from './raft.controller';
// import { RaftController } from './raft.controller';
// import { RaftService } from './raft.service';

export interface Timer {
  // reset(interval: number): void;
  // start(): void;
  setTimer(interval?: number): void;
  cancel(): void;
}

class Reseteable implements Timer{
  private _timer: number;
  constructor(
    readonly callback: CallableFunction,
    public interval: number,
    readonly args: Iterable<any> = null,
    // readonly kwargs: Iterable<any> = null
  ) {
    this.setTimer();
  };

  setTimer(interval?: number): void {
    this.interval = interval ? interval : this.interval;
    clearTimeout(this._timer);
    this._timer = setInterval(this.callback, this.interval*2, this.args);
  }

  cancel(): void {
    clearTimeout(this._timer);
  }
}
interface RaftRequest {
  message: [string, (string | Int8Array)];
}
export class IRaftService {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  voteRequest(message: RaftRequest): Observable<any>;
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  heartbeat(algo: any): Observable<any>;
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  ping(algo: any): Observable<any>;
}

enum ServiceState {
  OFF,
  ON
}
enum RaftStatus {
  FOLLOWER,
  CANDIDATE,
  LEADER
}

enum ReqType {
  VOTE_REQUEST,
  HEARTBEAT
}

interface ConsensusLeaderMessage {
  type: string,
  body: string
}

function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

@Injectable()
export class RaftService {
  // """Handles the leader election process in a validator nodes network.
  // """
  private _raftStatus: RaftStatus;
  private _votingTo: string;
  private _leader: string;
  private _stepDownCounter: number;
  private _validatorId: string;
  // private _validatorPeerHashes: Map<number, number>;
  private _state: ServiceState;
  private _candidateTimer: Reseteable;
  private _electionFailedTimer: Reseteable;
  private _heartbeatInterval: Reseteable;

  constructor (private _clients: Array<[string, IRaftService]>) {
    // console.log(this._clients);
    // console.log('constructor');
    // private _timerFactory: ITimerFactory,
    this._resetRaftState();
    // this._sendHeartbeat();
  }

  start(): void {
    // this._state = ServiceState.ON;
    // this._startStatus();
    // console.log(this._clients);
  }

  private _resetRaftState(): void {
    // console.log('_resetRaftState');
    // Sets the initial status to the service.
    this._raftStatus = RaftStatus.FOLLOWER;
    this._state = ServiceState.OFF;
    this._votingTo = null;
    this._leader = null;
    this._stepDownCounter = 0;
    this._validatorId = null;
    // this._validatorPeerHashes = null;
  }

  private static _getRandomElectionTimeout(): number {
    // console.log('_getRandomElectionTimeout');
    //   """Renews the timeout.
    //
    // Returns:
    //   timeout: Random interval to perform leader election.
    // """
    return (Math.floor(Math.random() * config.raft.END_TIME_ELECTION) + 1)*1000;
  }

  async ping(): Promise<boolean> {
    console.log("se va a ahcer la llamada rpc al puerto" + (process.env.GRPC_CLIENT || 8000));
    this._clients[0][1].ping({}).subscribe(value => console.log(value));
    return true
  }

  private _startStatus(): void {
    // console.log('_startStatus');
    // // console.log(this._state);
    // console.log("vote " + this._raftStatus);
    // console.log("vita " + RaftStatus.CANDIDATE);
    // Starts the timers according to the current status.
    if (this._state === ServiceState.OFF)
      return;
    switch (+this._raftStatus) {
      case RaftStatus.FOLLOWER:
        // console.log("entra aqui 1");
        this._startFollowerStatus();
        break;
      case RaftStatus.CANDIDATE:
        // console.log("entra aqui 2");
        this._startCandidateStatus();
        break;
      case RaftStatus.LEADER:
        // console.log("entra aqui 3");
        this._startLeaderStatus();
        break;
      default:
        console.log('default');
        break;
    }
  }

  private _startFollowerStatus(): void {
    // console.log('_startFollowerStatus');
    console.log(RaftService._getRandomElectionTimeout());
    this._candidateTimer = new Reseteable(this._setRaftStatus.bind(this), RaftService._getRandomElectionTimeout(), [RaftStatus.CANDIDATE]);
  }

  private _startCandidateStatus(): void {
    // console.log('_startCandidateStatus');
    this._votingTo = this._validatorId;
    this._electionFailedTimer = new Reseteable(this._setRaftStatus.bind(this), RaftService._getRandomElectionTimeout(), [RaftStatus.FOLLOWER]);
    if (this._voteRequest())
      this._setRaftStatus(RaftStatus.LEADER);
    else
      this._setRaftStatus(RaftStatus.FOLLOWER);
  }

  private _startLeaderStatus() {
    // console.log('_startLeaderStatus');
    // """Sets the node raft status as leader."""
    this._votingTo = null;
    this._stepDownCounter = 0;
    this._leader = this._validatorId;
    this._heartbeatInterval = new Reseteable(this._sendHeartbeat.bind(this), config.raft.HEARTBEAT_INTERVAL, []);
  }

  private _endStatus(): void {
    // console.log('_endStatus');
    // """Stops the timers according to the status."""
    switch (this._raftStatus) {
      case RaftStatus.FOLLOWER:
        this._candidateTimer.cancel();
        break;
      case RaftStatus.CANDIDATE:
        this._votingTo = null;
        this._electionFailedTimer.cancel();
        break;
      case RaftStatus.LEADER:
        this._heartbeatInterval.cancel();
        break;
      default:
        break;
    }
  }

  private _setRaftStatus(status: RaftStatus): void {
    // console.log('_setRaftStatus');
    // """Sets this to a given status.
    //
    // Args:
    //   status: New raft status to be established.
    // """
    this._endStatus();
    if (this._raftStatus === RaftStatus.FOLLOWER && status === RaftStatus.LEADER)
      this._raftStatus = RaftStatus.FOLLOWER;
    else
      this._raftStatus = status;
    this._startStatus();
  }

  private _sendVoteRequest(message: RaftRequest, minN: number): boolean {
    // """Sends a raft message [ConsensusLeaderRequest].
    //
    // Args:
    //   message: Dict that includes action type and sender.
    //   min_n: Minimum number of true responses to consider
    // valid the request.
    //
    //   Returns:
    // Whether the request if successful or not.
    // """
    let total = 0;
    let result = false;
    let response;
    // this._networkModule.leaderRequest(message).subscribe(value => console.log(value));
    this._clients.forEach(([id, client]) => {
      if (client === null)
        return;
      if (this._validatorId === id)
        return;
      // TODO: Async
      try {
        response = client.voteRequest(message).subscribe(value => {console.log('recibido vote request de vuelta ' + value)});
      } catch (e) {
        
      }
      total += 1 ? response : 0;
      if (total >= minN)
        result = true;
    });
    return result;
  }

  private _sendHeartbeat(): void {
    // """Sends a raft message [ConsensusLeaderRequest].
    //
    // Args:
    //   message: Dict that includes action type and sender.
    //   min_n: Minimum number of true responses to consider
    // valid the request.
    //
    //   Returns:
    // Whether the request if successful or not.
    // """
    // this._networkModule.leaderRequest(message).subscribe(value => console.log(value));
    this._clients.forEach(([id, client]) => {
      if (client === null)
        return;
      if (this._validatorId === id)
        return;
      // TODO: Async
      console.log("se va a enviar un heartbeat a " + (process.env.GRPC_CLIENT || 8000));
      try {
        client.heartbeat({}).subscribe(value => console.log('recibido heartbeat de vuelta del puerto ' + (process.env.GRPC_CLIENT || 8000)));
      } catch (e) {
        
      }

    });
  }

  private _voteRequest(): boolean {
    // """Requests the vote to the rest of validator nodes to become
    // leader."""
    // const message = ConsensusLeaderRequest(ConsensusLeaderRequest.Type.VOTE_REQUEST);
    const message: RaftRequest = {message: ['1', 'votemee']};
    const minVotes = Math.floor(this._clients.length * config.raft.TOLERANCE);
    console.log('se va enviar un mensaje a ' + (process.env.GRPC_CLIENT || 8000));
    try {
      this._sendVoteRequest(message, Math.max(minVotes, config.raft.RAFT_MIN_NODES));
    } catch (e) {
      console.log('ERROOOOOOOL');
    }
    return false
  }

  static parseRequest(
    message: string,
    minN: number
  ): boolean {
    // """Sends a raft message [ConsensusLeaderRequest].
    //
    // Args:
    //   message: Dict that includes action type and sender.
    //   min_n: Minimum number of true responses to consider
    // valid the request.
    //
    //   Returns:
    // Whether the request if successful or not.
    // """
    const total = 0;
    // let client = null;
    // let response = null;
    //
    // this._validatorPeerHashes.forEach(
    //   (publicKeyHash: number, validatorIndex: number) => {
    //     if (this._validatorId === validatorIndex || publicKeyHash === null)
    //       return;
    //     client = this._networkModule.getPeerClient(publicKeyHash);
    //     if (!client)
    //       return;
    //     response = client.consensusLeader(message);
    //     total += response ? 1 : 0;
    //   });
    return total >= minN;
  }


  handleVoteRequest(): boolean {
    // """Performs actions according to a received raft message.
    //
    // Args:
    //   message: Contains type and sender of the request.
    //
    //   Returns:
    // Whether the answer is positive or negative to a heartbeat / vote
    // request.
    // """
    console.log("ha llegado un mensaje");
    // If is not running or is not validator
    // if (this._state != ServiceState.ON || this._validatorId === null)
    //   return false;
    //
    // const reqType: ReqType = message['type'];
    // const sender = this._validatorPeerHashes[message['sender']];
    //
    // if (reqType === ReqType.VOTE_REQUEST) {
    //   if (this._raftStatus === RaftStatus.CANDIDATE || this._votingTo != null)
    //     return false;
    //
    //   this._votingTo = sender;
    //
    //   if (this._raftStatus === RaftStatus.FOLLOWER)
    //     this._candidateTimer.cancel();
    //   else
    //     this._setRaftStatus(RaftStatus.FOLLOWER);
    //
    //   return true;
    //
    // } else if (reqType === ReqType.HEARTBEAT) {
    //   this._votingTo = null;
    //   this._leader = sender;
    //
    //   if (this._raftStatus === RaftStatus.FOLLOWER)
    //     this._candidateTimer.setTimer();
    //   else
    //     this._setRaftStatus(RaftStatus.FOLLOWER);
    //   return true;
    // }
    return false;
  }

  handleHeartbeat(): boolean {
    // """Performs actions according to a received raft message.
    //
    // Args:
    //   message: Contains type and sender of the request.
    //
    //   Returns:
    // Whether the answer is positive or negative to a heartbeat / vote
    // request.
    // """
    console.log("ha llegado un heartbeat");
    // If is not running or is not validator
    // if (this._state != ServiceState.ON || this._validatorId === null)
    //   return false;
    //
    // const reqType: ReqType = message['type'];
    // const sender = this._validatorPeerHashes[message['sender']];
    //
    // if (reqType === ReqType.VOTE_REQUEST) {
    //   if (this._raftStatus === RaftStatus.CANDIDATE || this._votingTo != null)
    //     return false;
    //
    //   this._votingTo = sender;
    //
    //   if (this._raftStatus === RaftStatus.FOLLOWER)
    //     this._candidateTimer.cancel();
    //   else
    //     this._setRaftStatus(RaftStatus.FOLLOWER);
    //
    //   return true;
    //
    // } else if (reqType === ReqType.HEARTBEAT) {
    //   this._votingTo = null;
    //   this._leader = sender;
    //
    //   if (this._raftStatus === RaftStatus.FOLLOWER)
    //     this._candidateTimer.setTimer();
    //   else
    //     this._setRaftStatus(RaftStatus.FOLLOWER);
    //   return true;
    // }
    return false;
  }
}