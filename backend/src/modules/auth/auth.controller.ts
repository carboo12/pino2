import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsString,
  MinLength,
} from 'class-validator';

class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  role: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  storeIds?: string[];
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
  @Roles('master-admin', 'store-admin')
  @Post('register')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Renovar token de acceso' })
  refresh(@Body() dto: { refreshToken: string }) {
    return this.authService.rotateRefreshToken(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(202)
  @ApiOperation({
    summary: 'Solicitud de recuperación de contraseña',
  })
  requestPasswordReset(@Body() dto: { email: string }) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión e invalidar refresh token' })
  logout(@Request() req: any) {
    return this.authService.logout(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, StoreAccessGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Alias de /auth/me — perfil del usuario autenticado',
  })
  getProfileAlias(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  private extractBearerToken(req: any): string | undefined {
    const authorization = req.headers?.authorization || '';
    const [type, token] = authorization.split(' ');
    return type?.toLowerCase() === 'bearer' ? token : undefined;
  }
}
