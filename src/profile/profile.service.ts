import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/users.entity';  
import { UpdateProfileDto } from './dto/profile.dto';  

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,  
  ) {}

  // Get profile information by user ID
  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found'); 
    }
    return user;
  }

  async updateProfile(updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: updateProfileDto.id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    // Check if the new email already exists
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.userRepo.findOne({ where: { email: updateProfileDto.email } });
      if (existingUser) {
        throw new ConflictException('Email is already in use');
      }
    }
  
    // Update the user's profile
    if (updateProfileDto.fullName) {
      user.fullName = updateProfileDto.fullName;
    }
    if (updateProfileDto.email) {
      user.email = updateProfileDto.email;
    }
    if (updateProfileDto.password) {
      user.password = updateProfileDto.password;
    }
  
    await this.userRepo.save(user);
    return { message: 'Profile updated successfully' };
  }

  async getProfilePicturePath(userId: number): Promise<string> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.profilePicture) {
      throw new NotFoundException('Profile picture not found for this user');
    }    
    return user.profilePicture; // Assuming `profilePicture` is a column in the User entity
  }

  async updateProfilePicture(userId: number, filePath: string) {
    // Update the user's profile picture in the database
    return await this.userRepo.update(userId, { profilePicture: filePath });
  }

  // Update CV path in the database
  async updateCV(userId: number, filePath: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.cvPath = filePath; // Assuming `cvPath` is a column in the User entity
    await this.userRepo.save(user);
    return { message: 'CV updated successfully' };
  }

  // Get CV path from the database
  async getCVPath(userId: number): Promise<string> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.cvPath) {
      throw new NotFoundException('CV not found for this user');
    }
    return user.cvPath;
  }
}