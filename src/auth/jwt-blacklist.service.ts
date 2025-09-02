import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtBlacklistService {
  private readonly blacklistedTokens = new Set<string>(); 

  addToBlacklist(token: string) {
    this.blacklistedTokens.add(token);
  }

  isBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }
}
