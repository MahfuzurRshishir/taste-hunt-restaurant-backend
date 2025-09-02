import { Controller, Post, Body, Param, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/createUser.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPassDto } from './dto/resetPass.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtBlacklistService } from './jwt-blacklist.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtBlacklistService: JwtBlacklistService, 
  ) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto.email, createUserDto.password, createUserDto.fullName, );
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    const token = req.headers.authorization?.split(' ')[1];
    this.jwtBlacklistService.addToBlacklist(token);

    return { message: 'Successfully logged out' };
  }

  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.authService.sendResetLink(email);
  }

  @Post('reset-password')
  resetPassword( @Body() resetPassDto: ResetPassDto) {
    return this.authService.resetPassword( resetPassDto.newPassword, resetPassDto.otp);
  }
}