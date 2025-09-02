import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtBlacklistService } from './jwt-blacklist.service';  // Import blacklist service
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private blacklistService: JwtBlacklistService,  
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return false;  
    }

    const token = authHeader.split(' ')[1]; 
    if (!token) {
      return false; 
    }

    try {
      if (this.blacklistService.isBlacklisted(token)) {
        return false; 
      }

      const user = this.jwtService.verify(token);  
      request.user = user;  
      return true;  // Token is valid
    } catch (e) {
      return false;  // Invalid token
    }
  }
}
