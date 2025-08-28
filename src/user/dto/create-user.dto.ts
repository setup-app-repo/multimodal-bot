import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  telegramId!: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  languageCode?: string;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;
}
