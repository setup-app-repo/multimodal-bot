import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { UserLog } from 'src/user-logs/user-log.entity';
import { UserLogsService } from 'src/user-logs/user-logs.service';

@Module({
    imports: [MikroOrmModule.forFeature([UserLog])],
    providers: [UserLogsService],
    exports: [UserLogsService],
})
export class UserLogsModule { }
