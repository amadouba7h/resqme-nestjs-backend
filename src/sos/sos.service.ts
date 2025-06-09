import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SosAlert, AlertStatus } from './entities/sos-alert.entity';
import { AlertLocation } from './entities/alert-location.entity';
import { AlertNotification } from './entities/alert-notification.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SosService {
  constructor(
    @InjectRepository(SosAlert)
    private alertsRepository: Repository<SosAlert>,
    @InjectRepository(AlertLocation)
    private locationsRepository: Repository<AlertLocation>,
    @InjectRepository(AlertNotification)
    private notificationsRepository: Repository<AlertNotification>,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  async createAlert(
    userId: string,
    createAlertDto: CreateAlertDto,
  ): Promise<SosAlert> {
    const alert = this.alertsRepository.create({
      userId,
      status: AlertStatus.ACTIVE,
      startedAt: new Date(),
      description: createAlertDto.description,
    });

    const savedAlert = await this.alertsRepository.save(alert);
    await this.notifyTrustedContacts(savedAlert);
    return savedAlert;
  }

  async updateLocation(
    alertId: string,
    userId: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<AlertLocation> {
    const alert = await this.alertsRepository.findOne({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    if (alert.status !== AlertStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot update location for non-active alert',
      );
    }

    const location = this.locationsRepository.create({
      alertId: alert.id,
      location: {
        type: 'Point',
        coordinates: [updateLocationDto.longitude, updateLocationDto.latitude],
      },
      accuracy: updateLocationDto.accuracy,
      speed: updateLocationDto.speed,
      heading: updateLocationDto.heading,
      timestamp: new Date(),
    } as unknown as AlertLocation);

    return await this.locationsRepository.save(location);
  }

  async resolveAlert(alertId: string, userId: string): Promise<SosAlert> {
    const alert = await this.alertsRepository.findOne({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    if (alert.status !== AlertStatus.ACTIVE) {
      throw new BadRequestException('Alert is not active');
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();
    return this.alertsRepository.save(alert);
  }

  getActiveAlert(userId: string): Promise<SosAlert | null> {
    return this.alertsRepository.findOne({
      where: { userId, status: AlertStatus.ACTIVE },
      relations: ['locations'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAlertLocations(
    alertId: string,
    userId: string,
  ): Promise<AlertLocation[]> {
    const alert = await this.alertsRepository.findOne({
      where: { id: alertId, userId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    return this.locationsRepository.find({
      where: { alertId },
      order: { createdAt: 'DESC' },
    });
  }

  private async notifyTrustedContacts(alert: SosAlert): Promise<void> {
    const user = await this.usersService.findById(alert.userId);
    const contacts = await this.usersService.getTrustedContacts(alert.userId);

    for (const contact of contacts) {
      const notification = this.notificationsRepository.create({
        alertId: alert.id,
        recipientId: contact.id,
        type: 'alert_created',
        status: 'pending',
      } as unknown as AlertNotification);

      await this.notificationsRepository.save(notification);

      // Send notifications based on preferences
      if (contact.notificationPreferences.email) {
        await this.notificationsService.sendEmail(
          contact.email,
          'Nouvelle alerte SOS',
          `${user.firstName} ${user.lastName} a déclenché une alerte SOS.`,
        );
      }

      if (contact.notificationPreferences.sms) {
        await this.notificationsService.sendSMS(
          contact.phoneNumber,
          `${user.firstName} ${user.lastName} a déclenché une alerte SOS.`,
        );
      }

      if (contact.notificationPreferences.push) {
        await this.notificationsService.sendPushNotification(
          contact.id,
          'Nouvelle alerte SOS',
          `${user.firstName} ${user.lastName} a déclenché une alerte SOS.`,
          { alertId: alert.id },
        );
      }
    }
  }
}
