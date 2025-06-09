import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Patch,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SosService } from './sos.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { SosAlert } from './entities/sos-alert.entity';
import { AlertLocation } from './entities/alert-location.entity';

@ApiTags('sos')
@Controller('sos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SosController {
  constructor(private readonly sosService: SosService) {}

  @Post('alerts')
  @ApiOperation({
    summary: 'Créer une nouvelle alerte SOS',
    description: "Crée une nouvelle alerte SOS pour l'utilisateur connecté",
  })
  @ApiBody({
    type: CreateAlertDto,
    description: "Informations de l'alerte SOS",
    examples: {
      example1: {
        value: {
          description: 'Je me sens en danger dans cette zone',
        },
        summary: "Exemple de création d'alerte",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Alerte SOS créée avec succès',
    type: SosAlert,
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
          example: ['description doit être une chaîne de caractères'],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Une alerte active existe déjà',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 409,
        },
        message: {
          type: 'string',
          example: 'Une alerte active existe déjà',
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
  async createAlert(
    @Request() req,
    @Body() createAlertDto: CreateAlertDto,
  ): Promise<SosAlert> {
    return this.sosService.createAlert(req.user.id, createAlertDto);
  }

  @Patch('alerts/:id/location')
  @ApiOperation({
    summary: "Mettre à jour la localisation d'une alerte",
    description: "Met à jour la position géographique d'une alerte SOS active",
  })
  @ApiParam({
    name: 'id',
    description: "ID de l'alerte",
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateLocationDto,
    description: 'Nouvelles coordonnées géographiques',
    examples: {
      example1: {
        value: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10,
          speed: 5.5,
          heading: 90,
        },
        summary: 'Exemple de mise à jour de localisation',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Localisation mise à jour avec succès',
    type: AlertLocation,
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
            'latitude doit être un nombre entre -90 et 90',
            'longitude doit être un nombre entre -180 et 180',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Alerte non trouvée',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 404,
        },
        message: {
          type: 'string',
          example: 'Alerte non trouvée',
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
  updateLocation(
    @Request() req,
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ): Promise<AlertLocation> {
    return this.sosService.updateLocation(req.user.id, id, updateLocationDto);
  }

  @Patch('alerts/:id/resolve')
  @ApiOperation({
    summary: 'Résoudre une alerte SOS',
    description: 'Marque une alerte SOS comme résolue',
  })
  @ApiParam({
    name: 'id',
    description: "ID de l'alerte",
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Alerte résolue avec succès',
    type: SosAlert,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Alerte non trouvée',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 404,
        },
        message: {
          type: 'string',
          example: 'Alerte non trouvée',
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
  async resolveAlert(
    @Request() req,
    @Param('id') id: string,
  ): Promise<SosAlert> {
    return this.sosService.resolveAlert(req.user.id, id);
  }

  @Get('alerts/active')
  @ApiOperation({
    summary: "Obtenir l'alerte active de l'utilisateur",
    description: "Récupère l'alerte SOS active de l'utilisateur connecté",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Alerte active récupérée avec succès',
    type: SosAlert,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Aucune alerte active trouvée',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 404,
        },
        message: {
          type: 'string',
          example: 'Aucune alerte active trouvée',
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
  async getActiveAlert(@Request() req): Promise<SosAlert | null> {
    return await this.sosService.getActiveAlert(req.user.id);
  }
}
