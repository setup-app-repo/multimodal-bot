import { Global, Module } from '@nestjs/common';
import { ConfigModule as AppConfigModule } from '../config/config.module';
import { WinstonLoggerService } from './winston-logger.service';

@Global()
@Module({
    imports: [AppConfigModule],
    providers: [WinstonLoggerService],
    exports: [WinstonLoggerService],
})
export class LoggerModule { }


