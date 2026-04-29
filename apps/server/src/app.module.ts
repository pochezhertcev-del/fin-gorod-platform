import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

import {
  Role,
  User,
  Lesson,
  Task,
  TaskResult,
  Achievement,
  UserAchievement,
  Wallet,
  Transaction,
} from './entities';

import { AuthService } from './modules/auth/auth.service';
import { RolesGuard } from './modules/auth/roles.guard';
import { GamificationService } from './modules/gamification/gamification.service';
import { AssessmentService } from './modules/assessment/assessment.service';
import { ModerationService } from './modules/content/moderation.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [
        Role,
        User,
        Lesson,
        Task,
        TaskResult,
        Achievement,
        UserAchievement,
        Wallet,
        Transaction,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([
      Role,
      User,
      Lesson,
      Task,
      TaskResult,
      Achievement,
      UserAchievement,
      Wallet,
      Transaction,
    ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev_secret_change_me',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [
    AuthService,
    GamificationService,
    AssessmentService,
    ModerationService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
