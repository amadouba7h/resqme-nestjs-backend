import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdminService } from './admin.service';
import { AlertStatus } from '../sos/entities/sos-alert.entity';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obtenir les statistiques du tableau de bord' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Obtenir la liste des utilisateurs' })
  @ApiResponse({
    status: 200,
    description: 'Liste des utilisateurs récupérée avec succès',
  })
  async getAllUsers(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.adminService.getAllUsers(page, limit);
  }

  @Get('users/:id')
  @ApiOperation({ summary: "Obtenir les détails d'un utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Détails de l'utilisateur récupérés avec succès",
  })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('users/:id/role')
  @ApiOperation({ summary: "Mettre à jour le rôle d'un utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Rôle de l'utilisateur mis à jour avec succès",
  })
  async updateUserRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.adminService.updateUserRole(id, role);
  }

  @Post('users/:id/toggle-status')
  @ApiOperation({ summary: 'Activer/désactiver un utilisateur' })
  @ApiResponse({
    status: 200,
    description: "Statut de l'utilisateur mis à jour avec succès",
  })
  async toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Obtenir la liste des alertes' })
  @ApiResponse({
    status: 200,
    description: 'Liste des alertes récupérée avec succès',
  })
  async getAllAlerts(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: AlertStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getAllAlerts(
      page,
      limit,
      status,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('alerts/:id')
  @ApiOperation({ summary: "Obtenir les détails d'une alerte" })
  @ApiResponse({
    status: 200,
    description: "Détails de l'alerte récupérés avec succès",
  })
  async getAlertById(@Param('id') id: string) {
    return this.adminService.getAlertById(id);
  }

  @Post('alerts/:id/resolve')
  @ApiOperation({ summary: 'Résoudre une alerte' })
  @ApiResponse({ status: 200, description: 'Alerte résolue avec succès' })
  async resolveAlert(@Param('id') id: string) {
    return this.adminService.resolveAlert(id);
  }
}
