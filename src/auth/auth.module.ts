import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/users.entity';
import { ResetPassword } from '../users/resetPass.entity';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ConfigModule } from '@nestjs/config';
import { JwtBlacklistService } from './jwt-blacklist.service'; // Import the JwtBlacklistService

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([User, ResetPassword]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, JwtBlacklistService],
  exports: [JwtModule, JwtAuthGuard, JwtBlacklistService],
})
export class AuthModule {}
