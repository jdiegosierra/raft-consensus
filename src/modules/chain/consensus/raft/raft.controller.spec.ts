import { Test, TestingModule } from '@nestjs/testing';
import { RaftController } from './raft.controller';

describe('Chain Controller', () => {
  let controller: RaftController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RaftController],
    }).compile();

    controller = module.get<RaftController>(RaftController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
