import { Test, TestingModule } from '@nestjs/testing';
import { SetupAppService } from './setup-app.service';

describe('SetupAppService', () => {
  let service: SetupAppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SetupAppService],
    }).compile();

    service = module.get<SetupAppService>(SetupAppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
