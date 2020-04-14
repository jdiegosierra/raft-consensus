import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
// import { Reseteable, Timer } from './timer';
// import config from '../../../../config/default';
const config = {server: "hola"};
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
    this._timer = setInterval(this.callback, this.interval, this.args);
  }

  cancel(): void {
    clearTimeout(this._timer);
  }
}
interface RaftRequest {
  message: [string, (string | Int8Array)];
}
export class IRaftService {
  // @ts-ignore
  leaderRequest(message: RaftRequest): Observable<any>;
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

@Injectable()
export class RaftService {
  // """Handles the leader election process in a validator nodes network.
  // """
  private _raftStatus: RaftStatus;
  private _votingTo: number;
  private _leader: number;
  private _stepDownCounter: number;
  private _validatorId: number;
  private _validatorPeerHashes: Map<number, number>;
  private _state: ServiceState;
  private _candidateTimer: Reseteable;
  private _electionFailedTimer: Reseteable;
  private _heartbeatInterval: Reseteable;

  constructor (private _networkModule: IRaftService) {
    console.log('constructor');
    // private _timerFactory: ITimerFactory,
    this._state = ServiceState.OFF;
    this._resetRaftState();
    // this._sendHeartbeat();
  }

  private _resetRaftState(): void {
    console.log('_resetRaftState');
    // Sets the initial status to the service.
    this._raftStatus = RaftStatus.FOLLOWER;
    this._votingTo = null;
    this._leader = null;
    this._stepDownCounter = 0;
    this._validatorId = null;
    this._validatorPeerHashes = null;
  }

  private static _getRandomElectionTimeout(): number {
    console.log('_getRandomElectionTimeout');
    //   """Renews the timeout.
    //
    // Returns:
    //   timeout: Random interval to perform leader election.
    // """
    return Math.floor(Math.random() * config.server['RAFT']['END_TIME_ELECTION']) + 1;
  }

  private _startStatus(): void {
    console.log('_startStatus');
    // Starts the timers according to the current status.
    if (this._state === ServiceState.OFF)
      return;
    switch (this._raftStatus) {
      case RaftStatus.FOLLOWER:
        this._startFollowerStatus();
        break;
      case RaftStatus.CANDIDATE:
        this._startCandidateStatus();
        break;
      case RaftStatus.LEADER:
        this._startLeaderStatus();
        break;
      default:
        break;
    }
  }

  private _startFollowerStatus(): void {
    console.log('_startFollowerStatus');
    if (this._state !== ServiceState.ON)
      return;
    this._candidateTimer = new Reseteable(this._setRaftStatus, RaftService._getRandomElectionTimeout(), [RaftStatus.CANDIDATE]);
  }

  private _startCandidateStatus(): void {
    console.log('_startCandidateStatus');
    if (this._state !== ServiceState.ON)
      return;
    this._votingTo = this._validatorId;
    this._electionFailedTimer = new Reseteable(this._setRaftStatus, RaftService._getRandomElectionTimeout(), [RaftStatus.FOLLOWER]);
    if (this._requestVote())
      this._setRaftStatus(RaftStatus.LEADER);
    else
      this._setRaftStatus(RaftStatus.FOLLOWER);
  }

  private _startLeaderStatus() {
    console.log('_startLeaderStatus');
    // """Sets the node raft status as leader."""
    if (this._state != ServiceState.ON)
      return;

    this._votingTo = null;
    this._stepDownCounter = 0;
    this._leader = this._validatorId;
    this._heartbeatInterval = new Reseteable(this._setRaftStatus, config.server['RAFT']['HEARTBEAT_INTERVAL'], []);
  }

  private _endStatus(): void {
    console.log('_endStatus');
    // """Stops the timers according to the status."""
    if (this._state !== ServiceState.ON)
      return;
    else {
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
  }

  private _setRaftStatus(status: RaftStatus): void {
    console.log('_setRaftStatus');
    // """Sets this to a given status.
    //
    // Args:
    //   status: New raft status to be established.
    // """
    if (this._state !== ServiceState.ON)
      return;
    else {
      this._endStatus();
      this._raftStatus = status;
      this._startStatus();
    }
  }

  private _sendRequest(message: RaftRequest, minN: number): boolean {
    console.log('_sendRequest');
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
    // let total = 0;
    const result = false;
    // let response;
    this._networkModule.leaderRequest(message).subscribe(value => console.log(value));
    // this._validatorPeerHashes.forEach((validatorIndex, publicKey) => {
    //   if (publicKey === null)
    //     return;
    //   if (this._validatorId === validatorIndex)
    //     return;
    //   let rpcClient = this._networkModule.getPeerClient(publicKey);
    //   if(rpcClient) {
    //     response = client.consensusLeader(message);
    //     total += 1 ? response : 0;
    //     if (total >= minN)
    //       result = true;
    //   } else
    //     return;
    // });
    return result;
  }

  private _requestVote(): boolean {
    // """Requests the vote to the rest of validator nodes to become
    // leader."""
    // const message = ConsensusLeaderRequest(ConsensusLeaderRequest.Type.VOTE_REQUEST);
    const message: RaftRequest = {message: ['1', 'votemee']};
    const minVotes = Math.floor(this._validatorPeerHashes.size * config.server['RAFT']['TOLERANCE']);
    return this._sendRequest(message, Math.max(minVotes, config.server['RAFT']['RAFT_MIN_NODES']));
  }

   _sendHeartbeat(): boolean {
    // """Sends a message to maintain the authority as leader."""
    // const message = ConsensusLeaderRequest(ConsensusLeaderRequest.Type.VOTE_REQUEST);
    const message: RaftRequest = {message: ['1', 'heartbeattt']};
    return this._sendRequest(message, 1);
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


  handleRaftMessage(message: [string, (string | Int8Array)]): boolean {
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
    console.log(message);
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