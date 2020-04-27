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
    this._timer = setTimeout(this.callback, this.interval*4, this.args);
  }

  cancel(): void {
    clearTimeout(this._timer);
  }
}
interface RaftRequest {
  message: string;
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

  constructor (private logger: winston.Logger, private _clients: Array<[string, IRaftService]>) {
    this._validatorId = process.env.GRPC_PORT_SERVER;
    this._resetRaftState();
    this.pingRequest().then(() => {
      this.logger.info('Node connected!');
      this._state = ServiceState.ON;
      this._startStatus();
    });
  }

  private _resetRaftState(): void {
    // console.log('_resetRaftState');
    // Sets the initial status to the service.
    this.logger.debug('Resetting state');
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

  pingRequest(): Promise<boolean> {
    return new Promise(async (resolve) => {
      for (let index = 0; index < this._clients.length; index++){
        this.logger.debug('Pinging ' + this._clients[index][0]);
        try {
          await this._clients[index][1].ping({}).toPromise();
        } catch (e) {
          this.logger.error(e.message);
          await delay(1000);
          index = -1;
        }
      }
      resolve(true);
    });
  }

  ping(): boolean {
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
    this.logger.debug('Starting status ' + RaftStatus[this._raftStatus]);
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
    this._candidateTimer = new Reseteable(this._setRaftStatus.bind(this), RaftService._getRandomElectionTimeout(), [RaftStatus.CANDIDATE]);
  }

  private async _startCandidateStatus(): Promise<void> {
    // console.log('_startCandidateStatus');
    this._votingTo = this._validatorId;
    this._electionFailedTimer = new Reseteable(this._setRaftStatus.bind(this), RaftService._getRandomElectionTimeout(), [RaftStatus.FOLLOWER]);
    if (await this._voteRequest())
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
    this.logger.debug('Finishing status ' + RaftStatus[this._raftStatus]);
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
    if (this._raftStatus === RaftStatus.FOLLOWER && status === RaftStatus.LEADER) {
      this.logger.debug('Cant change to Leader if its Follower');
      this._raftStatus = RaftStatus.FOLLOWER;
    } else if (this._raftStatus === RaftStatus.LEADER && status === RaftStatus.LEADER){
      this.logger.debug('this is unfair, yopu have to be Follower');
      this._raftStatus = RaftStatus.FOLLOWER;
    }
    else
      this._raftStatus = status;
    this._startStatus();
  }

  private _sendVoteRequest(message: RaftRequest, minN: number): Promise<boolean> {
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
    return new Promise(async (resolve) => {
      let total = 1;
      let result = false;
      let response;
      // this._networkModule.leaderRequest(message).subscribe(value => console.log(value));
      for (let index = 0; index < this._clients.length; index++) {
        this.logger.debug('Sending vote request to ' + this._clients[index][0])
        try {
          response = await this._clients[index][1].voteRequest(message).toPromise();
          this.logger.info('response es ' + JSON.stringify(response));
        } catch (e) {
          this.logger.error(e);
        }
        total += (response.message == 'true') ? 1 : 0;
        if (total >= minN)
          result = true;
      }
      this.logger.debug('total es ' + total);
      resolve(result);
    });
  }

  private async _sendHeartbeat(): Promise<void> {
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
    for (let index = 0; index < this._clients.length; index++) {
      // TODO: Async
      this.logger.info("se va a enviar un heartbeat a " + this._clients[index][0]);
      try {
        await this._clients[index][1].heartbeat({}).toPromise();
      } catch (e) {
        this._setRaftStatus(RaftStatus.FOLLOWER);
      }
    };
  }

  private _voteRequest(): Promise<boolean> {
    // """Requests the vote to the rest of validator nodes to become
    // leader."""
    // const message = ConsensusLeaderRequest(ConsensusLeaderRequest.Type.VOTE_REQUEST);
    return new Promise(async resolve => {
      const message: RaftRequest = {message: JSON.stringify({sender: process.env.GRPC_PORT_SERVER})};
      const minVotes = Math.floor(this._clients.length * config.raft.TOLERANCE);
      resolve(await this._sendVoteRequest(message, Math.max(minVotes, config.raft.RAFT_MIN_NODES)));
    })

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
    this.logger.debug('Se ha recibido un VOTE REQUEWSWT');
    if (this._state != ServiceState.ON) {
      this.logger.debug('ENVIADNO FALSE 1')
      return false;
    }


    if (this._raftStatus === RaftStatus.CANDIDATE) {
      this.logger.debug('ENVIADNO FALSE 2 raftstatus ' + RaftStatus[this._raftStatus] + ' votingto ' + this._votingTo);
      return false;
    }

    this._votingTo = JSON.parse(message.message).sender;

    if (this._raftStatus === RaftStatus.FOLLOWER)
      this._candidateTimer.cancel();
    else
      this._setRaftStatus(RaftStatus.FOLLOWER);
    return true;
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
    this.logger.debug('Received heartbeat');
    this._validatorId = null;
    if (this._raftStatus == RaftStatus.FOLLOWER)
      this._candidateTimer.setTimer();
    else
      this._setRaftStatus(RaftStatus.FOLLOWER);
  }
}