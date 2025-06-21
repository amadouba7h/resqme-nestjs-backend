import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { UsersService } from 'src/users/users.service';
import { DataSource, Repository } from 'typeorm';
import { AlertLocation } from '../sos/entities/alert-location.entity';
import { AlertResolutionReason } from '../sos/entities/sos-alert.entity';
import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly logoPath: string;
  private readonly appName = 'ResQme';

  constructor(
    private configService: ConfigService,
    private readonly userService: UsersService,
    private dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    if (!admin.apps.length) {
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
    }

    // Initialize Nodemailer
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_PORT') === 465,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    // Set logo path
    this.logoPath = path.join(process.cwd(), 'assets', 'logo.png');
  }

  private generateAppDeepLink(alertId: string, userId: string): string {
    return `resqme://alert?id=${alertId}&user=${userId}`;
  }

  private generateDeepLink(alertId: string, userId: string): string {
    // Utiliser l'adresse IP publique du serveur
    const serverIp = this.configService.get('SERVER_PUBLIC_IP');
    const protocol = this.configService.get('SERVER_PROTOCOL') || 'http';

    // Utiliser un chemin spécifique pour identifier l'application mobile
    // Ce chemin doit être configuré dans le serveur web pour rediriger vers l'application appropriée
    const appPath = this.configService.get('APP_PATH') || 'resqme-api';

    if (!serverIp) {
      this.logger.warn(
        'SERVER_PUBLIC_IP not configured, using localhost as fallback',
      );
      return `${protocol}://localhost/${appPath}/redirect?alertId=${alertId}&userId=${userId}`;
    }

    // Construire l'URL avec l'IP publique et le chemin spécifique
    return `${protocol}://${serverIp}/${appPath}/redirect?alertId=${alertId}&userId=${userId}`;
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.getUserFcmToken(userId);
      if (!user?.fcmToken) {
        this.logger.warn(`No FCM token found for user ${userId}`);
        return;
      }

      // If we have alert data, use the app deep link for push notifications
      if (data && data.alertId) {
        data.deepLink = this.generateAppDeepLink(
          data.alertId,
          data.userId || userId,
        );
        this.logger.log(
          `Generated app deep link for push notification: ${data.deepLink}`,
        );
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
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to send push notification: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to,
        subject,
        html,
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async sendSMS(to: string, message: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Implement SMS sending logic here
      // You can use services like Twilio, MessageBird, etc.
      this.logger.log(`SMS to ${to}: ${message}`);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to send SMS: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async sendSosAlertEmail(
    to: string,
    alertUserName: string,
    alertId: string,
    userId: string,
    lastLocation?: AlertLocation,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const googleMapsUrl = lastLocation
        ? `https://www.google.com/maps?q=${lastLocation.location.coordinates[1]},${lastLocation.location.coordinates[0]}`
        : null;
      const webLink = this.generateDeepLink(alertId, userId);
      this.logger.log(
        `Generated web link: ${webLink} for alert ${alertId} and user ${userId}`,
      );

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Alerte SOS - ${this.appName}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 20px 0;
              background-color: #ff4444;
              color: white;
              border-radius: 8px 8px 0 0;
            }
            .logo {
              max-width: 150px;
              margin-bottom: 15px;
              background-color: white;
              padding: 10px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .content {
              background-color: #ffffff;
              padding: 30px;
              border-radius: 0 0 8px 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .alert-title {
              color: #ff4444;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .user-info {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 20px;
            }
            .location-info {
              margin-top: 20px;
            }
            .map-button {
              display: inline-block;
              background-color: #4285f4;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;
              margin-top: 15px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${fs.existsSync(this.logoPath) ? `<img src="cid:app-logo" alt="${this.appName} Logo" class="logo">` : ''}
              <h1>Alerte SOS - ${this.appName}</h1>
            </div>
            <div class="content">
              <h2 class="alert-title">⚠️ Alerte SOS Détectée</h2>
              
              <div class="user-info">
                <p><strong>${alertUserName}</strong> a déclenché une alerte SOS.</p>
                <p>Cette personne a besoin d'aide immédiatement.</p>
              </div>

              ${
                lastLocation
                  ? `
                <div class="location-info">
                  <h3>Dernière position connue :</h3>
                  <p>Précision : ${lastLocation.accuracy ? lastLocation.accuracy.toFixed(2) + ' mètres' : 'Non disponible'}</p>
                  <p>Vitesse : ${lastLocation.speed ? lastLocation.speed.toFixed(2) + ' km/h' : 'Non disponible'}</p>
                  <p>Direction : ${lastLocation.heading ? lastLocation.heading.toFixed(2) + '°' : 'Non disponible'}</p>
                  <a href="${webLink}" class="app-button" style="
                  display: inline-block;
                  background-color: #ff4444;
                  color: white;
                  padding: 15px 30px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                  margin: 10px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  ">📱 Ouvrir dans l'app ResQme</a>
                  <a href="${googleMapsUrl}" class="map-button" target="_blank">Voir sur Google Maps</a>
                </div>
              `
                  : `
                <div class="location-info">
                  <p>⚠️ Aucune position n'est actuellement disponible.</p>
                </div>
              `
              }

              <div class="footer">
                <p>Ce message a été envoyé automatiquement par ${this.appName}.</p>
                <p>Veuillez répondre à cette alerte dès que possible.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions: nodemailer.SendMailOptions = {
        from: `${this.appName} <${this.configService.get('SMTP_FROM')}>`,
        to,
        subject: `🚨 Alerte SOS - ${alertUserName} - ${this.appName}`,
        html,
      };

      // Add logo attachment only if the file exists
      if (fs.existsSync(this.logoPath)) {
        mailOptions.attachments = [
          {
            filename: 'logo.png',
            path: this.logoPath,
            cid: 'app-logo',
          },
        ];
      }

      await this.transporter.sendMail(mailOptions);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to send SOS alert email: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async sendSosAlertResolvedEmail(
    to: string,
    alertUserName: string,
    resolutionReason: AlertResolutionReason,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Alerte SOS Résolue - ${this.appName}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 20px 0;
              background-color: #4CAF50;
              color: white;
              border-radius: 8px 8px 0 0;
            }
            .logo {
              max-width: 150px;
              margin-bottom: 15px;
            }
            .content {
              background-color: #ffffff;
              padding: 30px;
              border-radius: 0 0 8px 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .alert-title {
              color: #4CAF50;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .user-info {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${fs.existsSync(this.logoPath) ? `<img src="cid:app-logo" alt="${this.appName} Logo" class="logo">` : ''}
              <h1>Alerte SOS Résolue - ${this.appName}</h1>
            </div>
            <div class="content">
              <h2 class="alert-title">✅ Alerte SOS Résolue</h2>
              
              <div class="user-info">
                <p><strong>${alertUserName}</strong> a résolu son alerte SOS.</p>
                <p>Raison : ${this.getResolutionReasonText(resolutionReason)}</p>
              </div>

              <div class="footer">
                <p>Ce message a été envoyé automatiquement par ${this.appName}.</p>
                <p>Vous pouvez maintenant considérer cette alerte comme terminée.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions: nodemailer.SendMailOptions = {
        from: `${this.appName} <${this.configService.get('SMTP_FROM')}>`,
        to,
        subject: `✅ Alerte SOS Résolue - ${alertUserName} - ${this.appName}`,
        html,
      };

      // Add logo attachment only if the file exists
      if (fs.existsSync(this.logoPath)) {
        mailOptions.attachments = [
          {
            filename: 'logo.png',
            path: this.logoPath,
            cid: 'app-logo',
          },
        ];
      }

      await this.transporter.sendMail(mailOptions);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to send SOS alert resolution email: ${error.message}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private getResolutionReasonText(reason: AlertResolutionReason): string {
    const reasons = {
      [AlertResolutionReason.SITUATION_RESOLVED]: 'La situation a été résolue',
      [AlertResolutionReason.FALSE_ALARM]: 'Fausse alerte',
    };
    return reasons[reason] || 'Raison non spécifiée';
  }

  private async getUserFcmToken(
    userId: string,
  ): Promise<{ fcmToken: string } | null> {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
    if (user && user.fcmToken) {
      return { fcmToken: user.fcmToken };
    }
    return null; // Placeholder
  }

  async sendEmailWithTemplate(
    to: string,
    subject: string,
    templateName: string,
    context?: Record<string, any>,
    attachments?: Array<{
      filename: string;
      path: string;
      cid: string;
    }>,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'notifications',
        'templates',
        'emails',
        `${templateName}.hbs`,
      );
      const templateSource = await fs.promises.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateSource);

      // Enrich context with default values
      const fullContext = {
        appName: this.configService.get('APP_NAME') || 'Votre Application',
        supportEmail:
          this.configService.get('SUPPORT_EMAIL') || 'support@example.com',
        logoCid: 'app-logo', // Default CID for the logo
        ...context,
      };

      const html = template(fullContext);

      const mailOptions: nodemailer.SendMailOptions = {
        from: `${this.appName} <${this.configService.get('SMTP_FROM')}>`,
        to,
        subject,
        html,
        attachments: attachments || [],
      };

      // Add logo attachment if it exists and not already in attachments
      if (
        fs.existsSync(this.logoPath) &&
        !mailOptions.attachments.some((att) => att.cid === 'app-logo')
      ) {
        mailOptions.attachments.push({
          filename: 'logo.png',
          path: this.logoPath,
          cid: 'app-logo', // Make sure this CID matches what's in your templates
        });
      }

      await this.transporter.sendMail(mailOptions);
      await queryRunner.commitTransaction();
      this.logger.log(
        `Email with template ${templateName} sent to ${to} successfully.`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to send email with template ${templateName} to ${to}: ${error.message}`,
      );
      // Ne pas relancer l'erreur ici pour que le job BullMQ puisse la gérer
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
