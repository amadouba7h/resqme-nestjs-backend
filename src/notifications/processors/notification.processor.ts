import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationsService } from '../notifications.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AlertNotification,
  NotificationStatus,
  NotificationType,
} from '../../sos/entities/alert-notification.entity';
import {
  SosAlertJobData,
  SosResolvedJobData,
  PushNotificationJobData,
  SmsJobData,
  EmailJobData,
} from '../dto/notification-job.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(AlertNotification)
    private readonly alertNotificationRepository: Repository<AlertNotification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.name} with ID ${job.id}`);

    try {
      switch (job.name) {
        case 'sos-alert':
          return await this.processSosAlert(job.data as SosAlertJobData);
        case 'sos-resolved':
          return await this.processSosResolved(job.data as SosResolvedJobData);
        case 'push-notification':
          return await this.processPushNotification(
            job.data as PushNotificationJobData,
          );
        case 'sms':
          return await this.processSms(job.data as SmsJobData);
        case 'email':
          return await this.processEmail(job.data as EmailJobData);
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process job ${job.name}: ${error.message}`);
      throw error;
    }
  }

  private async processSosAlert(data: SosAlertJobData): Promise<void> {
    this.logger.log(`Processing SOS alert for user ${data.userName}`);

    for (const contact of data.contacts) {
      try {
        // Créer la notification en base
        const notification = this.alertNotificationRepository.create({
          alertId: data.alertId,
          recipientId: contact.id,
          type: NotificationType.PUSH,
          status: NotificationStatus.PENDING,
        });
        await this.alertNotificationRepository.save(notification);

        // Envoyer les notifications selon les préférences
        if (contact.notificationPreferences.email) {
          await this.notificationsService.sendSosAlertEmail(
            contact.email,
            data.userName,
            data.alertId,
            data.userId,
            data.location
              ? ({
                  location: {
                    type: 'Point',
                    coordinates: data.location.coordinates,
                  },
                  accuracy: data.location.accuracy,
                  speed: data.location.speed,
                  heading: data.location.heading,
                } as any)
              : undefined,
          );
          this.logger.log(`SOS alert email sent to ${contact.email}`);
        }

        if (contact.notificationPreferences.sms && contact.phoneNumber) {
          await this.notificationsService.sendSMS(
            contact.phoneNumber,
            `${data.userName} a déclenché une alerte SOS.`,
          );
          this.logger.log(`SOS alert SMS sent to ${contact.phoneNumber}`);
        }

        if (contact.notificationPreferences.push) {
          const contactUser = await this.userRepository.findOne({
            where: { email: contact.email },
          });
          if (contactUser) {
            await this.notificationsService.sendPushNotification(
              contactUser.id,
              'Nouvelle alerte SOS',
              `${data.userName} a déclenché une alerte SOS.`,
              { alertId: data.alertId },
            );
            this.logger.log(
              `SOS alert push notification sent to user ${contactUser.id}`,
            );
          }
        }

        // Mettre à jour le statut de la notification
        notification.status = NotificationStatus.SENT;
        await this.alertNotificationRepository.save(notification);
      } catch (error) {
        this.logger.error(
          `Failed to send SOS alert to contact ${contact.email}: ${error.message}`,
        );
        // Continuer avec les autres contacts même si un échoue
      }
    }
  }

  private async processSosResolved(data: SosResolvedJobData): Promise<void> {
    this.logger.log(`Processing SOS resolution for user ${data.userName}`);

    for (const contact of data.contacts) {
      try {
        // Créer la notification en base
        const notification = this.alertNotificationRepository.create({
          alertId: data.alertId,
          recipientId: contact.id,
          type: NotificationType.PUSH,
          status: NotificationStatus.PENDING,
        });
        await this.alertNotificationRepository.save(notification);

        // Envoyer les notifications selon les préférences
        if (contact.notificationPreferences.email) {
          await this.notificationsService.sendSosAlertResolvedEmail(
            contact.email,
            data.userName,
            data.resolutionReason as any,
          );
          this.logger.log(`SOS resolution email sent to ${contact.email}`);
        }

        if (contact.notificationPreferences.push) {
          const contactUser = await this.userRepository.findOne({
            where: { email: contact.email },
          });
          if (contactUser) {
            await this.notificationsService.sendPushNotification(
              contactUser.id,
              'Alerte SOS résolue',
              `${data.userName} a résolu son alerte SOS.`,
              {
                alertId: data.alertId,
                resolutionReason: data.resolutionReason,
              },
            );
            this.logger.log(
              `SOS resolution push notification sent to user ${contactUser.id}`,
            );
          }
        }

        // Mettre à jour le statut de la notification
        notification.status = NotificationStatus.SENT;
        await this.alertNotificationRepository.save(notification);
      } catch (error) {
        this.logger.error(
          `Failed to send SOS resolution to contact ${contact.email}: ${error.message}`,
        );
        // Continuer avec les autres contacts même si un échoue
      }
    }
  }

  private async processPushNotification(
    data: PushNotificationJobData,
  ): Promise<void> {
    this.logger.log(`Processing push notification for user ${data.userId}`);
    await this.notificationsService.sendPushNotification(
      data.userId,
      data.title,
      data.body,
      data.data,
    );
  }

  private async processSms(data: SmsJobData): Promise<void> {
    this.logger.log(`Processing SMS to ${data.phoneNumber}`);
    await this.notificationsService.sendSMS(data.phoneNumber, data.message);
  }

  private async processEmail(data: EmailJobData): Promise<void> {
    this.logger.log(`Processing email to ${data.to}`);
    await this.notificationsService.sendEmail(data.to, data.subject, data.html);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.name} with ID ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `Job ${job.name} with ID ${job.id} failed: ${err.message}`,
    );
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    this.logger.log(
      `Job ${job.name} with ID ${job.id} progress: ${JSON.stringify(progress)}`,
    );
  }
}
