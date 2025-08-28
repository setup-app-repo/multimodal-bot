import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository, CreateRequestContext } from '@mikro-orm/core';

import { CreateUserDTO } from './dto';
import { User } from './user.entity';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
      @InjectRepository(User)
      private readonly userRepository: EntityRepository<User>,
      private readonly em: EntityManager,
    ) {
    }

    /**
   * Создает нового пользователя или возвращает существующего
   */
  @CreateRequestContext()
  async findOrCreateUser(telegramId: string, userData: Partial<CreateUserDTO>): Promise<User> {
    let user = await this.userRepository.findOne({ telegramId });

    if (user) {
      this.logger.debug(`User found: ${telegramId}`);
      
      // Обновляем lastMessageAt
      user.lastMessageAt = new Date();
      await this.em.persistAndFlush(user);
      
      return user;
    }

    // Создаем нового пользователя
    this.logger.log(`Creating new user: ${telegramId}`);
    
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
    this.logger.log(`User created successfully: ${user.id}`);

    return user;
  }
}
