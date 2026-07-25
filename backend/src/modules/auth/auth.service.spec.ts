import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

jest.mock(
  'argon2',
  () => ({
    hash: jest.fn().mockResolvedValue('hashed'),
    verify: jest.fn().mockResolvedValue(true),
  }),
  { virtual: true },
);

import { AuthService } from './auth.service';


describe('AuthService', () => {
  let service: AuthService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      query: jest.fn(),
      withTransaction: jest.fn((cb: Function) => cb({ query: jest.fn() })),
      getClient: jest
        .fn()
        .mockResolvedValue({ query: jest.fn(), release: jest.fn() }),
    };

    const mockJwt = { sign: jest.fn().mockReturnValue('mock-token') };
    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        if (key === 'JWT_EXPIRES_IN') return '15m';
        return null;
      }),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        throw new Error(`Missing key: ${key}`);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debe rechazar login con credenciales invalidas', async () => {
    mockDb.query.mockResolvedValue({ rows: [], rowCount: 0 });

    await expect(service.login('noexiste@test.com', 'wrong')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe rechazar refresh token vacio', async () => {
    await expect(service.rotateRefreshToken('')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe rechazar refresh token invalido', async () => {
    const mockJwtService = {
      verifyAsync: jest.fn().mockRejectedValue(new Error('invalid')),
    };
    (service as any).refreshJwt = mockJwtService;

    await expect(service.rotateRefreshToken('invalid-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('logout debe limpiar refresh_token_hash', async () => {
    mockDb.query.mockResolvedValue({ rowCount: 1 });

    const result = await service.logout('user-1');
    expect(result.message).toContain('Sesión');
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET refresh_token_hash'),
      ['user-1'],
    );
  });
});
