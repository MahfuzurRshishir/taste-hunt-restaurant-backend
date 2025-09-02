import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { User } from '../users/users.entity';
import { ResetPassword } from '../users/resetPass.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ResetPassword) private resetRepo: Repository<ResetPassword>,
    private jwtService: JwtService,
  ) {}

  // Register a new user
  async register(email: string, password: string, fullName: string) {
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }
  
    try {
      const user = this.userRepo.create({ email, password, fullName });
      return await this.userRepo.save(user);
    } catch (error) {
      console.error('Error creating user:', error); // Log the error for debugging
      throw new UnauthorizedException('Failed to create user. Please try again later.');
    }
  }

  // Login a user and return a JWT token
  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { id: user.id, fullname: user.fullName, role: user.role, path: user.profilePicture };
    const token = this.jwtService.sign(payload);
    return { token };
  }
  
  // Forgot password (send reset link)
  async sendResetLink(email: string) {
    try {
      console.log('Email received:', email);  // Log email to check

      const user = await this.userRepo.findOne({ where: { email } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      console.log('User found:', user);  // Log user found

      const token = crypto.randomBytes(20).toString('hex');
      const otp = await Math.floor(100000 + Math.random() * 900000); // Generate a random OTP
      console.log('Generated OTP:', otp);  // Log OTP generation

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const resetToken = this.resetRepo.create({
        email,
        token,
        otp,
        expiresAt,
      });
      await this.resetRepo.save(resetToken);

      console.log('Reset token saved:', resetToken);  // see token creation

      // const resetLink = `http://localhost:3000/auth/reset-password/${token}`;
      // console.log('Generated reset link:', resetLink);  // Log the generated link

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,  
          pass: process.env.EMAIL_PASS,  
        },
      });

      // Send the email
      await transporter.sendMail({
        from: '"Taste Hunt Restaurant" <no-reply@tastehunt.com>',
        to: email,
        subject: 'Password Reset option',
        text: `Your OTP is ${otp}. Use this to reset your password.`,  // Send OTP in the email body
      });

      console.log('OTP is sent to your email!');  // Log email sent

      return { message: '6-Digit OTP is sent to your email',
               token: resetToken.token,
               otp: resetToken.otp
       };
    } catch (error) {
      console.error('Error in sending reset link:', error);  // Log any errors
      throw error; 
    }
  }

  // Reset password logic
  async resetPassword( newPassword: string, otp: number) {
    console.log('Resetting password with OTP:', otp);  // Log OTP for debugging
    const resetRecord = await this.resetRepo.findOne({ where: { otp} });

    if (!resetRecord) {
      console.error('Reset record not found for OTP:', otp);  // Log if record not found
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (new Date() > resetRecord.expiresAt) {
      console.error('OTP has expired for record:', resetRecord);  // Log if OTP has expired
      throw new UnauthorizedException('OTP has expired');
    }

    const user = await this.userRepo.findOne({ where: { email: resetRecord.email } });
    if (!user) {
      console.error('User not found for email:', resetRecord.email);  // Log if user not found
      throw new UnauthorizedException('User not found');
    }

    if(resetRecord.otp !== otp) {
      console.error('Invalid OTP provided:', otp);  // Log if OTP is invalid
      throw new UnauthorizedException('Invalid OTP');
    }

    user.password = newPassword;
    await this.userRepo.save(user);
    await this.resetRepo.delete(resetRecord.id);

    return { message: 'Password has been successfully reset' };
  }
}
