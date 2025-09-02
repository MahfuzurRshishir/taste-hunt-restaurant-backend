import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/users.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]),
     AuthModule
], 
  controllers: [ProfileController],
  providers: [ProfileService, ], // Provide the JWT guard
})
export class ProfileModule {}
