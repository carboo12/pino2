import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import { DatabaseService } from '../../database/database.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshJwt: JwtService;

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.refreshJwt = new JwtService({
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      signOptions: {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      },
    });
  }

  async register(dto: {
    email: string;
    password: string;
    name: string;
    role: string;
    storeIds?: string[];
  }) {
    // Usamos el bloque transaccional del módulo pg puro
    return await this.db.withTransaction(async (client) => {
      // 1. Verificar si existe
      const existing = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [dto.email],
      );
      if ((existing.rowCount ?? 0) > 0)
        throw new ConflictException('Email ya registrado');

      // 2. Hash e Insertar usuario
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const resUser = await client.query(
        `INSERT INTO users (email, password_hash, name, role) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [dto.email, passwordHash, dto.name, dto.role],
      );
      const savedUser = resUser.rows[0];

      // 3. Insertar tiendas asignadas
      if (dto.storeIds?.length) {
        for (const storeId of dto.storeIds) {
          await client.query(
            'INSERT INTO user_stores (user_id, store_id) VALUES ($1, $2)',
            [savedUser.id, storeId],
          );
        }
      }

      savedUser.userStores =
        dto.storeIds?.map((storeId) => ({ storeId })) || [];
      return this.generateTokens(client, savedUser);
    });
  }

  async login(email: string, password: string) {
    try {
      const resUser = await this.db.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email],
      );
      if ((resUser.rowCount ?? 0) === 0)
        throw new UnauthorizedException('Credenciales inválidas');

      const user = resUser.rows[0];

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) throw new UnauthorizedException('Credenciales inválidas');

      // Obtener sus tiendas
      const resStores = await this.db.query(
        'SELECT store_id FROM user_stores WHERE user_id = $1',
        [user.id],
      );
      user.userStores = resStores.rows.map((r) => ({ storeId: r.store_id }));

      // Reutilizamos el pool principal para generar tokens
      const client = await this.db.getClient();
      try {
        return await this.generateTokens(client, user);
      } finally {
        client.release();
      }
    } catch (e) {
      this.logger.error(
        `Error during login for ${email}: ${e instanceof Error ? e.message : String(e)}`,
        e instanceof Error ? e.stack : undefined,
      );
      throw e;
    }
  }

  async rotateRefreshToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Refresh token requerido');
    }

    let payload: { sub: string };
    try {
      payload = await this.refreshJwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Refresh token expirado o inválido');
    }

    const resUser = await this.db.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [payload.sub],
    );
    if (resUser.rowCount === 0)
      throw new UnauthorizedException('Usuario no encontrado');

    const user = resUser.rows[0];
    if (!user.refresh_token_hash) {
      throw new UnauthorizedException('Refresh token no emitido');
    }

    const valid = await argon2.verify(user.refresh_token_hash, token);
    if (!valid) {
      throw new UnauthorizedException('Refresh token inválido o reutilizado');
    }

    const resStores = await this.db.query(
      'SELECT store_id FROM user_stores WHERE user_id = $1',
      [user.id],
    );
    user.userStores = resStores.rows.map((r) => ({ storeId: r.store_id }));

    const client = await this.db.getClient();
    try {
      return await this.generateTokens(client, user);
    } finally {
      client.release();
    }
  }

  async getProfile(userId: string) {
    const resUser = await this.db.query('SELECT * FROM users WHERE id = $1', [
      userId,
    ]);
    if (resUser.rowCount === 0)
      throw new UnauthorizedException('Usuario no encontrado');

    const user = resUser.rows[0];
    const resStores = await this.db.query(
      'SELECT store_id FROM user_stores WHERE user_id = $1',
      [user.id],
    );

    const { password_hash, refresh_token_hash, ...profile } = user;
    return {
      ...profile,
      storeIds: resStores.rows.map((r) => r.store_id) || [],
    };
  }

  private async generateTokens(client: any, user: any) {
    const storeIds = user.userStores?.map((us: any) => us.storeId) || [];
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      storeIds,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
    });
    const refreshTokenValue = this.refreshJwt.sign(payload);

    const refreshHash = await argon2.hash(refreshTokenValue);

    await client.query(
      'UPDATE users SET refresh_token_hash = $1, updated_at = now() WHERE id = $2',
      [refreshHash, user.id],
    );

    return {
      accessToken,
      access_token: accessToken,
      refreshToken: refreshTokenValue,
      refresh_token: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        storeIds,
      },
    };
  }

  async impersonate(targetUserId: string) {
    const resUser = await this.db.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [targetUserId],
    );
    if (resUser.rowCount === 0)
      throw new UnauthorizedException('Usuario no encontrado');

    const user = resUser.rows[0];
    const resStores = await this.db.query(
      'SELECT store_id FROM user_stores WHERE user_id = $1',
      [user.id],
    );
    user.userStores = resStores.rows.map((r: any) => ({ storeId: r.store_id }));

    const client = await this.db.getClient();
    try {
      const tokens = await this.generateTokens(client, user);
      return { ...tokens, impersonated: true, originalRole: 'master-admin' };
    } finally {
      client.release();
    }
  }

  async logout(userId: string) {
    await this.db.query(
      'UPDATE users SET refresh_token_hash = NULL, updated_at = now() WHERE id = $1',
      [userId],
    );
    return { message: 'Sesión cerrada correctamente' };
  }

  async requestPasswordReset(email: string) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Correo inválido');
    }

    const resUser = await this.db.query(
      'SELECT id FROM users WHERE email = $1 AND is_active = true',
      [email],
    );

    if ((resUser.rowCount ?? 0) > 0) {
      this.logger.warn(
        `Password reset requested for ${email}. Email delivery is not configured.`,
      );
    }

    return {
      accepted: true,
      deliveryConfigured: false,
      message:
        'Solicitud registrada. La entrega de correo aún no está configurada; contacte al administrador.',
    };
  }
}
