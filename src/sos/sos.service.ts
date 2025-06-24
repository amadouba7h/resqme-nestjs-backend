import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import {
  SosAlert,
  AlertStatus,
  AlertResolutionReason,
} from './entities/sos-alert.entity';
import { AlertLocation } from './entities/alert-location.entity';
import {
  AlertNotification,
  NotificationStatus,
  NotificationType,
} from './entities/alert-notification.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { NotificationQueueService } from '../notifications/services/notification-queue.service';
import { UsersService } from '../users/users.service';
import { User } from 'src/users/entities/user.entity';
import { AlertRatingService } from './services/alert-rating.service';
import { ResolveAlertDto } from './dto/resolve-alert.dto';

@Injectable()
export class SosService {
  constructor(
    @InjectRepository(SosAlert)
    private alertsRepository: Repository<SosAlert>,
    @InjectRepository(AlertLocation)
    private locationsRepository: Repository<AlertLocation>,
    @InjectRepository(AlertNotification)
    private notificationsRepository: Repository<AlertNotification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationQueueService: NotificationQueueService,
    private usersService: UsersService,
    private alertRatingService: AlertRatingService,
    private dataSource: DataSource,
  ) {}

  async createAlert(
    userId: string,
    createAlertDto: CreateAlertDto,
  ): Promise<SosAlert> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Vérifier si l'utilisateur a déjà une alerte active
      const existingAlert = await queryRunner.manager.findOne(SosAlert, {
        where: { userId, status: AlertStatus.ACTIVE },
      });

      if (existingAlert) {
        throw new BadRequestException('sos.alert.already_active');
      }

      const alert = this.alertsRepository.create({
        userId,
        status: AlertStatus.ACTIVE,
        startedAt: new Date(),
        description: createAlertDto.description,
      });

      const savedAlert = await queryRunner.manager.save(SosAlert, alert);

      // Créer et sauvegarder la position initiale
      const initialLocation = this.locationsRepository.create({
        alertId: savedAlert.id,
        location: {
          type: 'Point',
          coordinates: [createAlertDto.longitude, createAlertDto.latitude],
        },
        accuracy: createAlertDto.accuracy,
        speed: createAlertDto.speed,
        heading: createAlertDto.heading,
      });

      const savedLocation = await queryRunner.manager.save(
        AlertLocation,
        initialLocation,
      );

      await queryRunner.commitTransaction();

      // Notifier les contacts avec la position initiale (après la transaction)
      const user = await this.usersService.findById(savedAlert.userId);
      const contacts = await this.usersService.getTrustedContacts(
        savedAlert.userId,
      );
      const userName = `${user.firstName} ${user.lastName}`;

      await this.notificationQueueService.addSosAlertJob(
        savedAlert,
        userName,
        contacts,
        savedLocation,
      );

      return savedAlert;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateLocation(
    userId: string,
    alertId: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<AlertLocation> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const alert = await queryRunner.manager.findOne(SosAlert, {
        where: { id: alertId, userId },
      });

      if (!alert) {
        throw new NotFoundException('sos.alert.not_found');
      }

      if (alert.status !== AlertStatus.ACTIVE) {
        throw new BadRequestException('sos.alert.location_update_inactive');
      }

      const location = this.locationsRepository.create({
        alertId: alert.id,
        location: {
          type: 'Point',
          coordinates: [
            updateLocationDto.longitude,
            updateLocationDto.latitude,
          ],
        },
        accuracy: updateLocationDto.accuracy,
        speed: updateLocationDto.speed,
        heading: updateLocationDto.heading,
      });

      const savedLocation = await queryRunner.manager.save(
        AlertLocation,
        location,
      );
      await queryRunner.commitTransaction();
      return savedLocation;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async resolveAlert(
    userId: string,
    alertId: string,
    resolveAlertDto: ResolveAlertDto,
  ): Promise<SosAlert> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const alert = await queryRunner.manager.findOne(SosAlert, {
        where: { id: alertId, userId },
      });

      if (!alert) {
        throw new NotFoundException('sos.alert.not_found');
      }

      if (alert.status !== AlertStatus.ACTIVE) {
        throw new BadRequestException('sos.alert.not_active');
      }

      alert.status = AlertStatus.RESOLVED;
      alert.resolvedAt = new Date();
      alert.resolutionReason = resolveAlertDto.resolutionReason;

      const savedAlert = await queryRunner.manager.save(SosAlert, alert);

      // Créer les évaluations si elles sont fournies
      if (resolveAlertDto.ratings && resolveAlertDto.ratings.length > 0) {
        await this.alertRatingService.createMultipleRatings(
          savedAlert,
          resolveAlertDto.ratings,
        );
      }

      await queryRunner.commitTransaction();

      // Notifier les contacts de confiance de la résolution (après la transaction)
      const user = await this.usersService.findById(savedAlert.userId);
      const contacts = await this.usersService.getTrustedContacts(
        savedAlert.userId,
      );
      const userName = `${user.firstName} ${user.lastName}`;

      await this.notificationQueueService.addSosResolvedJob(
        savedAlert,
        userName,
        contacts,
      );

      return savedAlert;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  getActiveAlert(userId: string): Promise<SosAlert | null> {
    return this.alertsRepository.findOne({
      where: { userId, status: AlertStatus.ACTIVE },
      relations: ['locations', 'notifications', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAlert(alertId: string, userId: string): Promise<SosAlert> {
    const alert = await this.alertsRepository.findOne({
      where: { id: alertId, userId },
      relations: ['locations', 'notifications', 'user'],
    });

    if (!alert) {
      throw new NotFoundException('sos.alert.not_found');
    }

    return alert;
  }

  async getAlertLocations(
    alertId: string,
    userId: string,
  ): Promise<AlertLocation[]> {
    const alert = await this.alertsRepository.findOne({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new NotFoundException('sos.alert.not_found');
    }

    return this.locationsRepository.find({
      where: { alertId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserAlertHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    alerts: (SosAlert & { userRole: 'owner' | 'contact' })[];
    total: number;
  }> {
    // Récupérer les alertes lancées par l'utilisateur
    const [userAlerts, userAlertsCount] =
      await this.alertsRepository.findAndCount({
        where: { userId },
        relations: ['locations', 'notifications', 'user'],
        order: {
          createdAt: 'DESC',
        },
      });

    // Récupérer les alertes où l'utilisateur a été contacté comme trusted contact
    const [contactedAlerts, contactedAlertsCount] = await this.alertsRepository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.locations', 'locations')
      .leftJoinAndSelect('alert.notifications', 'notifications')
      .leftJoinAndSelect('alert.user', 'user')
      .innerJoin('alert.notifications', 'notification')
      .innerJoin(
        'trusted_contacts',
        'trustedContact',
        'trustedContact.id = notification.recipientId',
      )
      .innerJoin(
        'users',
        'contactUser',
        'contactUser.email = trustedContact.email',
      )
      .where('contactUser.id = :userId', { userId })
      .orderBy('alert.createdAt', 'DESC')
      .getManyAndCount();

    // Combiner les deux listes et éliminer les doublons
    const allAlertsMap = new Map<
      string,
      SosAlert & { userRole: 'owner' | 'contact' }
    >();

    // Ajouter les alertes de l'utilisateur
    userAlerts.forEach((alert) => {
      allAlertsMap.set(alert.id, { ...alert, userRole: 'owner' });
    });

    // Ajouter les alertes où l'utilisateur a été contacté
    contactedAlerts.forEach((alert) => {
      if (!allAlertsMap.has(alert.id)) {
        allAlertsMap.set(alert.id, { ...alert, userRole: 'contact' });
      }
    });

    // Convertir en array et trier par date
    const allAlerts = Array.from(allAlertsMap.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Appliquer la pagination
    const startIndex = (page - 1) * limit;
    const paginatedAlerts = allAlerts.slice(startIndex, startIndex + limit);

    console.log('contactedAlerts : ', contactedAlerts);

    return {
      alerts: paginatedAlerts,
      total: allAlerts.length,
    };
  }
}
