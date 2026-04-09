import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

export const JWT_SECRET = process.env.JWT_SECRET || 'talentai-super-secret-key-change-in-production';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    try {
      const user = await this.usersService.findById(payload.sub);
      return user; // se inyecta en req.user
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
