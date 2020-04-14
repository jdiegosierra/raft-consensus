import { Controller } from '@nestjs/common';
import { NetworkService } from './network.service';

@Controller()
export class NetworkController {
  // @ts-ignore
  constructor(private readonly networkService: NetworkService, private readonly handshakeHandler: HandshakeHandler) {
    function handle_handshake_request(sender: Int8Array): void{
      // return networkService.handle_handshake_request(sender);
    }
  }
}
