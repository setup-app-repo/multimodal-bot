import { EntityManager, EntityRepository, CreateRequestContext } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import { CreateUserDTO } from './dto';
import { User } from './user.entity';
import { WinstonLoggerService } from 'src/logger/winston-logger.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
    private readonly logger: WinstonLoggerService,
  ) { }

  /**
   * Создает нового пользователя или возвращает существующего
   */
  @CreateRequestContext()
  async findOrCreateUser(telegramId: string, userData: Partial<CreateUserDTO>): Promise<User> {
    let user = await this.userRepository.findOne({ telegramId });

    if (user) {
      this.logger.debug(`User found: ${telegramId}`, 'UserService');

      // Обновляем lastMessageAt
      user.lastMessageAt = new Date();
      await this.em.persistAndFlush(user);

      return user;
    }

    // Создаем нового пользователя
    this.logger.log(`Creating new user: ${telegramId}`, 'UserService');

    user = this.userRepository.create({
      telegramId,
      firstName: userData.firstName || 'User',
      lastName: userData.lastName,
      username: userData.username,
      languageCode: userData.languageCode,
      isPremium: userData.isPremium || false,
      lastMessageAt: new Date(),
      // Явно указываем значения по умолчанию
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.em.persistAndFlush(user);
    this.logger.log(`User created successfully: ${user.telegramId}`, 'UserService');

    return user;
  }

  /**
   * Обновляет только поле lastMessageAt пользователя по telegramId.
   */
  @CreateRequestContext()
  async updateUser(telegramId: string): Promise<void> {
    await this.em.nativeUpdate(User, { telegramId }, { lastMessageAt: new Date() });
  }
}
