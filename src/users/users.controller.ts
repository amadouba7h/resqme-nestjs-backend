import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { CreateTrustedContactDto } from './dto/create-trusted-contact.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { User } from './entities/user.entity';
import { TrustedContact } from './entities/trusted-contact.entity';
import { UpdateTrustedContactDto } from './dto/update-trusted-contact.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({
    summary: "Obtenir le profil de l'utilisateur",
    description:
      "Récupère les informations du profil de l'utilisateur connecté",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profil récupéré avec succès',
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
  async getProfile(@Request() req): Promise<User> {
    return this.usersService.findById(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({
    summary: "Mettre à jour le profil de l'utilisateur",
    description:
      "Met à jour les informations du profil de l'utilisateur connecté",
  })
  @ApiBody({
    type: UpdateProfileDto,
    description: 'Nouvelles informations du profil',
    examples: {
      example1: {
        value: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@example.com',
          phoneNumber: '+22370540470',
        },
        summary: 'Exemple de mise à jour de profil',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profil mis à jour avec succès',
    type: User,
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
            'phoneNumber doit être un numéro de téléphone valide',
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
          example: 'Cette adresse email est déjà utilisée',
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
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Patch('password')
  @ApiOperation({
    summary: 'Mettre à jour le mot de passe',
    description: "Met à jour le mot de passe de l'utilisateur connecté",
  })
  @ApiBody({
    type: UpdatePasswordDto,
    description: 'Ancien et nouveau mot de passe',
    examples: {
      example1: {
        value: {
          currentPassword: 'ancienMotDePasse123',
          newPassword: 'nouveauMotDePasse456',
        },
        summary: 'Exemple de mise à jour de mot de passe',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mot de passe mis à jour avec succès',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Mot de passe mis à jour avec succès',
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
            'newPassword doit contenir au moins 8 caractères',
            'newPassword doit contenir au moins une lettre majuscule',
            'newPassword doit contenir au moins une lettre minuscule',
            'newPassword doit contenir au moins un chiffre ou un caractère spécial',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Mot de passe actuel incorrect',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 401,
        },
        message: {
          type: 'string',
          example: 'Mot de passe actuel incorrect',
        },
      },
    },
  })
  async updatePassword(
    @Request() req,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.updatePassword(req.user.id, updatePasswordDto);
    return { message: 'Mot de passe mis à jour avec succès' };
  }

  @Patch('fcm-token')
  @ApiOperation({
    summary: 'Mettre à jour le token FCM',
    description:
      'Met à jour le token Firebase Cloud Messaging pour les notifications push',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fcmToken: {
          type: 'string',
          description: 'Token FCM pour les notifications push',
          example: 'fcm-token-example-123456789',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token FCM mis à jour avec succès',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Token FCM invalide',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 400,
        },
        message: {
          type: 'string',
          example: 'Token FCM invalide',
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
  async updateFcmToken(
    @Request() req,
    @Body('fcmToken') fcmToken: string,
  ): Promise<User> {
    return this.usersService.updateFcmToken(req.user.id, fcmToken);
  }

  @Post('trusted-contacts')
  @ApiOperation({
    summary: 'Ajouter un contact de confiance',
    description:
      "Ajoute un nouveau contact de confiance à la liste de l'utilisateur",
  })
  @ApiBody({
    type: [CreateTrustedContactDto],
    description: 'Informations des contacts de confiance',
    examples: {
      example1: {
        value: [
          {
            name: 'John Doe',
            email: 'john@example.com',
            phoneNumber: '+22370540470',
            isAppUser: true,
            notificationPreferences: {
              email: true,
              sms: true,
              push: true,
            },
          },
          {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phoneNumber: '+22370575247',
            isAppUser: false,
            notificationPreferences: {
              email: true,
              sms: false,
              push: false,
            },
          },
        ],
        summary: "Exemple d'ajout de contact de confiance",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Contacts de confiance ajoutés avec succès',
    type: [TrustedContact],
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
            'phoneNumber doit être un numéro de téléphone valide',
          ],
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
  async addTrustedContacts(
    @Request() req,
    @Body() createTrustedContactDtos: CreateTrustedContactDto[],
  ): Promise<TrustedContact[]> {
    return this.usersService.addTrustedContacts(
      req.user.id,
      createTrustedContactDtos,
    );
  }

  @Get('trusted-contacts')
  @ApiOperation({
    summary: 'Obtenir les contacts de confiance',
    description: "Récupère la liste des contacts de confiance de l'utilisateur",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des contacts de confiance récupérée avec succès',
    type: [TrustedContact],
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
  async getTrustedContacts(@Request() req): Promise<TrustedContact[]> {
    return this.usersService.getTrustedContacts(req.user.id);
  }

  @Patch('trusted-contacts/:id')
  @ApiOperation({
    summary: 'Mettre à jour un contact de confiance',
    description: "Met à jour les informations d'un contact de confiance",
  })
  @ApiParam({
    name: 'id',
    description: 'ID du contact de confiance',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateTrustedContactDto,
    description: 'Nouvelles informations du contact',
    examples: {
      example1: {
        value: {
          name: 'Marie Martin',
          email: 'trusted.contact@example.com',
          phoneNumber: '+22370540470',
          notificationPreferences: {
            email: true,
            sms: false,
            push: false,
          },
        },
        summary: 'Exemple de mise à jour de contact',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact mis à jour avec succès',
    type: TrustedContact,
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
            'phoneNumber doit être un numéro de téléphone valide',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contact non trouvé',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 404,
        },
        message: {
          type: 'string',
          example: 'Contact de confiance non trouvé',
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
  async updateTrustedContact(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTrustedContactDto: UpdateTrustedContactDto,
  ): Promise<TrustedContact> {
    return this.usersService.updateTrustedContact(
      req.user.id,
      id,
      updateTrustedContactDto,
    );
  }

  @Delete('trusted-contacts/:id')
  @ApiOperation({
    summary: 'Supprimer un contact de confiance',
    description:
      "Supprime un contact de confiance de la liste de l'utilisateur",
  })
  @ApiParam({
    name: 'id',
    description: 'ID du contact de confiance',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact de confiance supprimé avec succès',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Contact de confiance supprimé avec succès',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contact de confiance non trouvé',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 404,
        },
        message: {
          type: 'string',
          example: 'Contact de confiance non trouvé',
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
  async removeTrustedContact(
    @Request() req,
    @Param('id') id: string,
  ): Promise<void> {
    return this.usersService.removeTrustedContact(req.user.id, id);
  }
}
