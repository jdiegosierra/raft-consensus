import { Injectable } from '@nestjs/common';

@Injectable()
export class PingService {
  get() {
    return 'pong';
  }
}
