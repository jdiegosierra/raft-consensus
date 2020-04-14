import Timeout = NodeJS.Timeout;
import { Injectable } from '@nestjs/common';

export enum timerType {
  NORMAL,
  RESETEABLE,
  INTERVAL,
}

export interface Timer {
  // reset(interval: number): void;
  // start(): void;
  setTimer(interval?: number): void;
  cancel(): void;
}

// export interface ITimerFactory {
//   // create(type: timerType): Timer
// }

// class TimerFactory {
//   constructor(
//     private type: timerType,
//     public interval: number,
//     readonly callback: CallableFunction,
//     readonly args: Iterable<any> = null,
//   ) {}
//
//   create(
//     type: timerType,
//     interval: number,
//     callback: CallableFunction,
//     args: Iterable<any> = null
//   ): Timer {
//     if (type === timerType.RESETEABLE)
//       return new Reseteable(callback, interval, args);
//     else
//       return Normal(this.callback, this.interval, this.args);
//   }
// }
//
// class Normal implements Timer{
//   private _timer: number;
//   constructor(
//     readonly callback: CallableFunction,
//     public interval: number,
//     readonly args: Iterable<any> = null,
//     // readonly kwargs: Iterable<any> = null
//   ) {};
//
//   setTimer(): void {
//     this._timer = setTimeout(this.callback, this.interval, this.args);
//   }
//
//   cancel(): void {
//     clearTimeout(this._timer);
//   }
// }

@Injectable()
export class Reseteable implements Timer{
  private _timer: number;
  constructor(
    readonly callback: CallableFunction,
    public interval: number,
    readonly args: Iterable<any> = null,
    // readonly kwargs: Iterable<any> = null
    ) {};

  setTimer(interval?: number): void {
    this.interval = interval ? interval : this.interval;
    clearTimeout(this._timer);
    this._timer = setTimeout(this.callback, this.interval, this.args);
  }

  cancel(): void {
    clearTimeout(this._timer);
  }
}