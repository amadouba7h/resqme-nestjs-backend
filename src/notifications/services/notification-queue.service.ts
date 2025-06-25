import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  SosAlertJobData,
  SosResolvedJobData,
  PushNotificationJobData,
  SmsJobData,
  EmailJobData,
} from '../dto/notification-job.dto';
import { SosAlert } from '../../sos/entities/sos-alert.entity';
import { AlertLocation } from '../../sos/entities/alert-location.entity';

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(
    @InjectQueue('notifications')
    private readonly notificationQueue: Queue,
  ) {}

  async addSosAlertJob(
    alert: SosAlert,
    userName: string,
    contacts: any[],
    lastLocation?: AlertLocation,
  ): Promise<void> {
    try {
      const jobData: SosAlertJobData = {
        alertId: alert.id,
        userId: alert.userId,
        userName,
        contacts: contacts.map((contact) => ({
          id: contact.id,
          email: contact.email,
          phoneNumber: contact.phoneNumber,
          notificationPreferences: contact.notificationPreferences,
        })),
        location: lastLocation
          ? {
              coordinates: lastLocation.location.coordinates as [
                number,
                number,
              ],
              accuracy: lastLocation.accuracy,
              speed: lastLocation.speed,
              heading: lastLocation.heading,
            }
          : undefined,
      };

      await this.notificationQueue.add('sos-alert', jobData, {
        priority: 1, // Haute priorité pour les alertes SOS
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      this.logger.log(`SOS alert job added to queue for alert ${alert.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to add SOS alert job to queue: ${error.message}`,
      );
      throw error;
    }
  }

  async addSosResolvedJob(
    alert: SosAlert,
    userName: string,
    contacts: any[],
  ): Promise<void> {
    try {
      const jobData: SosResolvedJobData = {
        alertId: alert.id,
        userId: alert.userId,
        userName,
        resolutionReason: alert.resolutionReason,
        contacts: contacts.map((contact) => ({
          id: contact.id,
          email: contact.email,
          phoneNumber: contact.phoneNumber,
          notificationPreferences: contact.notificationPreferences,
        })),
      };

      await this.notificationQueue.add('sos-resolved', jobData, {
        priority: 2, // Priorité élevée pour les résolutions
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      this.logger.log(`SOS resolved job added to queue for alert ${alert.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to add SOS resolved job to queue: ${error.message}`,
      );
      throw error;
    }
  }

  async addPushNotificationJob(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    try {
      const jobData: PushNotificationJobData = {
        userId,
        title,
        body,
        data,
      };

      await this.notificationQueue.add('push-notification', jobData, {
        priority: 5,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 1000,
        },
      });

      this.logger.log(
        `Push notification job added to queue for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add push notification job to queue: ${error.message}`,
      );
      throw error;
    }
  }

  async addSmsJob(phoneNumber: string, message: string): Promise<void> {
    try {
      const jobData: SmsJobData = {
        phoneNumber,
        message,
      };

      await this.notificationQueue.add('sms', jobData, {
        priority: 3,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 1000,
        },
      });

      this.logger.log(`SMS job added to queue for ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Failed to add SMS job to queue: ${error.message}`);
      throw error;
    }
  }

  async addEmailJob(
    to: string,
    subject: string,
    template: string, // Nom du template Handlebars
    context?: Record<string, any>, // Données pour le template
    attachments?: Array<{
      filename: string;
      path: string;
      cid: string;
    }>,
  ): Promise<void> {
    try {
      const jobData: EmailJobData = {
        to,
        subject,
        template,
        context,
        attachments,
      };

      await this.notificationQueue.add('email', jobData, {
        priority: 4,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 1000,
        },
      });

      this.logger.log(`Email job added to queue for ${to}`);
    } catch (error) {
      this.logger.error(`Failed to add email job to queue: ${error.message}`);
      throw error;
    }
  }

  // Méthodes utilitaires pour la gestion de la queue
  async getQueueStats(): Promise<any> {
    const waiting = await this.notificationQueue.getWaiting();
    const active = await this.notificationQueue.getActive();
    const completed = await this.notificationQueue.getCompleted();
    const failed = await this.notificationQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async pauseQueue(): Promise<void> {
    await this.notificationQueue.pause();
    this.logger.log('Notification queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.notificationQueue.resume();
    this.logger.log('Notification queue resumed');
  }

  async clearQueue(): Promise<void> {
    await this.notificationQueue.drain();
    this.logger.log('Notification queue cleared');
  }

  async getFailedJobs(): Promise<any[]> {
    return await this.notificationQueue.getFailed();
  }

  async retryFailedJobs(): Promise<void> {
    const failedJobs = await this.notificationQueue.getFailed();
    for (const job of failedJobs) {
      await job.retry();
    }
    this.logger.log(`Retried ${failedJobs.length} failed jobs`);
  }

  async cleanQueue(grace: number = 24 * 60 * 60 * 1000): Promise<void> {
    // Nettoie les jobs terminés depuis plus de 24h par défaut
    await this.notificationQueue.clean(grace, 100, 'completed');
    await this.notificationQueue.clean(grace, 100, 'failed');
    this.logger.log('Notification queue cleaned');
  }
}
