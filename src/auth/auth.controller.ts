import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';

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
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: "Token JWT pour l'authentification",
        },
        refresh_token: {
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
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
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
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: "Token JWT pour l'authentification",
        },
        refresh_token: {
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

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
        access_token: {
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
}
