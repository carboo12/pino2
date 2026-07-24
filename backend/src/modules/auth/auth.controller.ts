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

  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renovar token de acceso' })
  refresh(@Request() req: any) {
    const token = this.extractBearerToken(req);
    return this.authService.refreshToken(req.user.sub, token);
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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión e invalidar refresh token' })
  logout(@Request() req: any) {
    return this.authService.logout(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
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
