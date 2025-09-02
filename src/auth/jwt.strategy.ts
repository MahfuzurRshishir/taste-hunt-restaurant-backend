import { Injectable,  UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtBlacklistService } from './jwt-blacklist.service';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private jwtBlacklistService: JwtBlacklistService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET, 
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const token = req.headers.authorization?.split(' ')[1]; // Extract the token from the Authorization header
    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    if (this.jwtBlacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException('Token is blacklisted');
    }
    console.log('JWT Payload:', payload); ; // Log the payload for debugging
    return { userId: payload.id, role: payload.role }; // Attach user info to request
  }
}