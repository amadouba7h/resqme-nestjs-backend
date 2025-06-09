import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: this.configService.get('FIREBASE_PROJECT_ID'),
        clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
        privateKey: this.configService
          .get('FIREBASE_PRIVATE_KEY')
          .replace(/\\n/g, '\n'),
      }),
    });

    // Initialize Nodemailer
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: true,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    try {
      const user = await this.getUserFcmToken(userId);
      if (!user?.fcmToken) {
        this.logger.warn(`No FCM token found for user ${userId}`);
        return;
      }

      const message: admin.messaging.Message = {
        token: user.fcmToken,
        notification: {
          title,
          body,
        },
        data,
      };

      await admin.messaging().send(message);
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
      throw error;
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  async sendSMS(to: string, message: string): Promise<void> {
    // Implement SMS sending logic here
    // You can use services like Twilio, MessageBird, etc.
    this.logger.log(`SMS to ${to}: ${message}`);
    return await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }

  private async getUserFcmToken(
    userId: string,
  ): Promise<{ fcmToken: string } | null> {
    const user = await this.userService.findById(userId);
    if (user && user.fcmToken) {
      return { fcmToken: user.fcmToken };
    }
    return null; // Placeholder
  }
}
