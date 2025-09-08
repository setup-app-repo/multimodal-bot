import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import { EUserLogType, UserLog } from './user-log.entity';

@Injectable()
export class UserLogsService {
    constructor(private readonly em: EntityManager) { }

    async log(telegramId: string, type: EUserLogType, amount: number, description: string): Promise<UserLog> {
        const log = this.em.create(UserLog, { telegramId, type, amount, description, createdAt: new Date() });
        await this.em.persistAndFlush(log);
        return log;
    }
}
