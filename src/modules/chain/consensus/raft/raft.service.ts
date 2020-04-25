import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
// import { Reseteable, Timer } from './timer';
import config from '../../../../config/default';
import * as winston from 'winston';
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
  private _pingInterval: Reseteable;

  constructor (private logger: winston.Logger, private _clients: Array<[string, IRaftService]>) {
    this._resetRaftState();
    this._pingInterval = new Reseteable(this.pingRequest.bind(this), 2000);

  }

  start(): void {
    // this.pingRequest();
    // this._state = ServiceState.ON;
    // this._startStatus();
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
    /**
     * Returns the average of two numbers.
     *
     * @remarks
     * This method is part of the {@link core-library#Statistics | Statistics subsystem}.
     *
     * @param x - The first input number
     * @param y - The second input number
     * @returns The arithmetic mean of `x` and `y`
     *
     * @beta
     */
    return (Math.floor(Math.random() * config.raft.END_TIME_ELECTION) + 1)*1000;
  }

  pingRequest(): void {
    this._clients.forEach(client => {
      this.logger.info('Ping to port ' + client[0])

      client[1].ping({}).subscribe(
        (value) => this.logger.info('Pingged to port ' + client[0] + ': ' + JSON.stringify(value)),
        (error) => this.logger.error(error.message)
      )
    });
  }

  ping(): boolean {
    this.logger.info('Received ping');
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
      response = client.voteRequest(message).subscribe(
        value => this.logger.info(JSON.stringify(value)));
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
      this.logger.info("se va a enviar un heartbeat a " + (process.env.GRPC_CLIENT || 8000));
      client.heartbeat({}).subscribe(
        value => this.logger.info(JSON.stringify(value)));
    });
  }

  private _voteRequest(): boolean {
    // """Requests the vote to the rest of validator nodes to become
    // leader."""
    // const message = ConsensusLeaderRequest(ConsensusLeaderRequest.Type.VOTE_REQUEST);
    const message: RaftRequest = {message: ['sender', process.env.GRPC_PORT]};
    const minVotes = Math.floor(this._clients.length * config.raft.TOLERANCE);
    this._sendVoteRequest(message, Math.max(minVotes, config.raft.RAFT_MIN_NODES));

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


  handleVoteRequest(message: RaftRequest): boolean {
    // """Performs actions according to a received raft message.
    //
    // Args:
    //   message: Contains type and sender of the request.
    //
    //   Returns:
    // Whether the answer is positive or negative to a heartbeat / vote
    // request.
    // """
    // If is not running or is not validator
    if (this._state != ServiceState.ON || this._validatorId === null)
      return false;

    if (this._raftStatus === RaftStatus.CANDIDATE || this._votingTo != null)
      return false;

    this._votingTo = message[0];

    if (this._raftStatus === RaftStatus.FOLLOWER)
      this._candidateTimer.cancel();
    else
      this._setRaftStatus(RaftStatus.FOLLOWER);
  }

  handleHeartbeat(): void {
    // """Performs actions according to a received raft message.
    //
    // Args:
    //   message: Contains type and sender of the request.
    //
    //   Returns:
    // Whether the answer is positive or negative to a heartbeat / vote
    // request.
    // """
    // If is not running or is not validator
    this.logger.info('Received heartbeat');
    if (this._state != ServiceState.ON || this._validatorId === null)
    this._candidateTimer.setTimer();
  }
}