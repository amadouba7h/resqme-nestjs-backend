import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpStatus,
  Req,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from '../users/entities/user.entity';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Connexion utilisateur',
    description:
      'Permet à un utilisateur de se connecter avec son email et son mot de passe',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Identifiants de connexion',
    examples: {
      example1: {
        value: {
          email: 'user@example.com',
          password: 'Password123!',
        },
        summary: 'Exemple de connexion',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connexion réussie',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: "Token JWT pour l'authentification",
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'Token JWT pour le rafraîchissement',
        },
        user: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: "Identifiant unique de l'utilisateur",
            },
            email: {
              type: 'string',
              example: 'user@example.com',
              description: "Email de l'utilisateur",
            },
            firstName: {
              type: 'string',
              example: 'John',
              description: "Prénom de l'utilisateur",
            },
            lastName: {
              type: 'string',
              example: 'Doe',
              description: "Nom de l'utilisateur",
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Identifiants invalides',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 401,
        },
        message: {
          type: 'string',
          example: 'Email ou mot de passe incorrect',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.validateUser(loginDto.email, loginDto.password);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Inscription utilisateur',
    description: 'Permet à un nouvel utilisateur de créer un compte',
  })
  @ApiBody({
    type: RegisterDto,
    description: "Informations d'inscription",
    examples: {
      example1: {
        value: {
          email: 'newuser@example.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+22370540470',
        },
        summary: "Exemple d'inscription",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Inscription réussie',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: "Token JWT pour l'authentification",
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'Token JWT pour le rafraîchissement',
        },
        user: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: "Identifiant unique de l'utilisateur",
            },
            email: {
              type: 'string',
              example: 'newuser@example.com',
              description: "Email de l'utilisateur",
            },
            firstName: {
              type: 'string',
              example: 'John',
              description: "Prénom de l'utilisateur",
            },
            lastName: {
              type: 'string',
              example: 'Doe',
              description: "Nom de l'utilisateur",
            },
            phoneNumber: {
              type: 'string',
              example: '+22370540470',
              description: "Numéro de téléphone de l'utilisateur",
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 400,
        },
        message: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: [
            'email doit être une adresse email valide',
            'password doit contenir au moins 6 caractères',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email déjà utilisé',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 409,
        },
        message: {
          type: 'string',
          example: 'Cet email est déjà utilisé',
        },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Obtenir le profil de l'utilisateur connecté",
    description:
      "Récupère les informations du profil de l'utilisateur actuellement connecté",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profil utilisateur récupéré avec succès',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non authentifié',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 401,
        },
        message: {
          type: 'string',
          example: 'Token JWT invalide ou expiré',
        },
      },
    },
  })
  getProfile(@Request() req): Promise<User> {
    return req.user;
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Rafraîchir le token d'accès",
    description:
      "Permet d'obtenir un nouveau token d'accès à partir du token de rafraîchissement",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token rafraîchi avec succès',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: "Nouveau token JWT pour l'authentification",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token invalide ou expiré',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 401,
        },
        message: {
          type: 'string',
          example: 'Token de rafraîchissement invalide ou expiré',
        },
      },
    },
  })
  async refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user);
  }

  @Post('google')
  @ApiOperation({
    summary: 'Authentification Google',
    description: 'Authentifie un utilisateur avec un token Google',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Token Google ID',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authentification réussie',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: "Token JWT pour l'authentification",
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'Token JWT pour le rafraîchissement',
        },
        user: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: "Identifiant unique de l'utilisateur",
            },
            email: {
              type: 'string',
              example: 'user@example.com',
              description: "Email de l'utilisateur",
            },
            firstName: {
              type: 'string',
              example: 'John',
              description: "Prénom de l'utilisateur",
            },
            lastName: {
              type: 'string',
              example: 'Doe',
              description: "Nom de l'utilisateur",
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token Google invalide',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 401,
        },
        message: {
          type: 'string',
          example: 'Token Google invalide',
        },
      },
    },
  })
  async googleAuth(@Body('idToken') idToken: string) {
    return this.authService.validateGoogleToken(idToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Déconnexion utilisateur',
    description:
      "Déconnecte l'utilisateur en invalidant son token de rafraîchissement",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Déconnexion réussie',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Déconnexion réussie',
          description: 'Message de confirmation de déconnexion',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non authentifié',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 401,
        },
        message: {
          type: 'string',
          example: 'Token JWT invalide ou expiré',
        },
      },
    },
  })
  async logout(@Request() req) {
    await this.authService.logout(req.user.id);
    return { message: 'logged_out_succesfully' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Demande de réinitialisation de mot de passe',
    description:
      "Permet à un utilisateur de demander un lien de réinitialisation de mot de passe pour son compte s'il utilise l'authentification locale.",
  })
  @ApiBody({
    type: ForgotPasswordDto,
    description: "Email de l'utilisateur",
    examples: {
      example1: {
        value: { email: 'user@example.com' },
        summary: 'Exemple de demande',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      "Si l'email existe et est associé à une authentification locale, un email de réinitialisation sera envoyé.",
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'auth.forgot_password.email_sent',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Format d'email invalide",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      "L'utilisateur n'existe pas ou n'utilise pas l'authentification locale.",
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return { message: 'auth.forgot_password.email_sent' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Réinitialiser le mot de passe',
    description:
      "Permet à un utilisateur de réinitialiser son mot de passe en utilisant un token valide et son nouveau mot de passe. Le token est généralement obtenu via un lien envoyé par email après une demande de 'forgot-password'.",
  })
  @ApiBody({
    type: ResetPasswordDto,
    description:
      'Token de réinitialisation et nouveau mot de passe. Le token doit être fourni dans le corps de la requête.',
    examples: {
      example1: {
        value: {
          token: 'valid_reset_token_jwt_or_uuid',
          password: 'NewSecurePassword123!',
        },
        summary: 'Exemple de réinitialisation',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mot de passe réinitialisé avec succès.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'auth.reset_password.success',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Token invalide, expiré, ou le nouveau mot de passe ne respecte pas les critères.',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
    return { message: 'auth.reset_password.success' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Changer le mot de passe',
    description:
      'Permet à un utilisateur connecté de changer son mot de passe actuel',
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Données pour le changement de mot de passe',
    examples: {
      example1: {
        value: {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewPassword123!',
        },
        summary: 'Exemple de changement de mot de passe',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mot de passe changé avec succès',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'auth.change_password.success',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token invalide ou mot de passe actuel incorrect',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      "Données invalides ou nouveau mot de passe identique à l'ancien",
  })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return { message: 'auth.change_password.success' };
  }
}
