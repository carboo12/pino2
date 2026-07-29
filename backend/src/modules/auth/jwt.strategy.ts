import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { normalizeUserRole } from '../../common/utils/user-role.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        config.get('JWT_SECRET') ||
        'pino2-default-jwt-secret-key-prod-2026-fallback-key',
    });
  }

  async validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException('Token inválido');
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: normalizeUserRole(payload.role) || payload.role,
      storeIds: payload.storeIds || [],
    };
  }
}
