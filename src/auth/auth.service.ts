import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { NotificationQueueService } from '../notifications/services/notification-queue.service';
import { ConfigService } from '@nestjs/config';
import { User, AuthProvider, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { DataSource } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private dataSource: DataSource,
    private notificationQueueService: NotificationQueueService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI'),
    );
  }

  async validateUser(email: string, password: string): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new UnauthorizedException('auth.invalid_credentials');
      }

      // Vérifier si l'utilisateur utilise l'authentification locale
      if (user.provider !== AuthProvider.LOCAL) {
        throw new UnauthorizedException('auth.provider.mismatch');
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('auth.invalid_credentials');
      }

      await queryRunner.commitTransaction();
      return this.login(user);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async login(user: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payload = {
        email: user.email,
        sub: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        provider: user.provider,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      const accessToken = this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRATION'),
      });

      const refreshToken = this.jwtService.sign(
        { sub: user.id },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
        },
      );

      // Mettre à jour le refresh token de l'utilisateur
      await queryRunner.manager.update(User, { id: user.id }, { refreshToken });

      await queryRunner.commitTransaction();

      return {
        accessToken,
        refreshToken,
        userId: user.id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async register(userData: RegisterDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.usersService.create({
        ...userData,
        provider: AuthProvider.LOCAL,
      });

      await queryRunner.commitTransaction();
      return this.login(user);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async refreshToken(refreshToken: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await queryRunner.manager.findOne(User, {
        where: { id: payload.sub, refreshToken },
      });

      if (!user) {
        throw new UnauthorizedException('auth.token.invalid');
      }

      const newAccessToken = this.jwtService.sign(
        {
          email: user.email,
          sub: user.id,
          role: user.role,
          provider: user.provider,
        },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_EXPIRATION'),
        },
      );

      const newRefreshToken = this.jwtService.sign(
        { sub: user.id },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
        },
      );

      // Mettre à jour le refresh token
      await queryRunner.manager.update(
        User,
        { id: user.id },
        { refreshToken: newRefreshToken },
      );

      await queryRunner.commitTransaction();

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('auth.token.invalid');
    } finally {
      await queryRunner.release();
    }
  }

  async logout(userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(
        User,
        { id: userId },
        { refreshToken: null },
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async validateGoogleToken(idToken: string) {
    try {
      // Préparer l'audience
      const audience = [
        this.configService.get('GOOGLE_CLIENT_ID'),
        this.configService.get('GOOGLE_WEB_CLIENT_ID'),
        this.configService.get('GOOGLE_ANDROID_CLIENT_ID'),
        this.configService.get('GOOGLE_IOS_CLIENT_ID'),
      ].filter(Boolean);

      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('auth.google.invalid_token');
      }

      const { email, given_name, family_name, sub } = payload;

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        let user = await queryRunner.manager.findOne(User, {
          where: [
            { email },
            { providerId: sub, provider: AuthProvider.GOOGLE },
          ],
        });

        if (!user) {
          user = await queryRunner.manager.save(User, {
            email,
            firstName: given_name,
            lastName: family_name,
            provider: AuthProvider.GOOGLE,
            providerId: sub,
            role: UserRole.USER,
          });
        } else if (user.provider !== AuthProvider.GOOGLE) {
          throw new BadRequestException('auth.provider.already_exists');
        }

        await queryRunner.commitTransaction();
        return this.login(user);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new UnauthorizedException('auth.google.invalid_token');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.usersService.findByEmail(email);

      if (!user || user.provider !== AuthProvider.LOCAL) {
        // Ne pas révéler si l'email existe ou non pour des raisons de sécurité,
        // ou si le compte n'est pas local.
        // On fait semblant que l'email a été envoyé.
        this.logPasswordResetRequest(email, !!user);
        await queryRunner.commitTransaction(); // Commit pour terminer la transaction même si rien n'est fait.
        return;
      }

      // Générer un token de réinitialisation
      const resetToken = this.jwtService.sign(
        { sub: user.id, email: user.email },
        {
          secret: this.configService.get('JWT_RESET_PASSWORD_SECRET'),
          expiresIn: this.configService.get('JWT_RESET_PASSWORD_EXPIRATION'),
        },
      );

      const expires = new Date();
      expires.setSeconds(
        expires.getSeconds() +
          parseInt(this.configService.get('JWT_RESET_PASSWORD_EXPIRATION')),
      );

      user.passwordResetToken = resetToken;
      user.passwordResetExpires = expires;

      await queryRunner.manager.save(User, user);

      // Envoyer l'email de réinitialisation
      const resetLink = `${this.configService.get(
        'CLIENT_URL',
      )}/reset-password?token=${resetToken}`;
      const appName = this.configService.get('APP_NAME') || 'Votre Application';
      const expirationTime =
        this.configService.get('JWT_RESET_PASSWORD_EXPIRATION_HUMAN') ||
        'un certain temps';

      await this.notificationQueueService.addEmailJob(
        user.email,
        `Réinitialisation de mot de passe pour ${appName}`,
        'reset-password', // Nom du template
        {
          firstName: user.firstName,
          resetLink,
          appName,
          expirationTime,
        },
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      // Log l'erreur mais ne la relance pas pour ne pas donner d'indices à un attaquant
      console.error('Error in forgotPassword:', error);
      // On peut choisir de ne rien faire ou de lancer une erreur générique si nécessaire
      // throw new InternalServerErrorException('auth.forgot_password.failed');
    } finally {
      await queryRunner.release();
    }
  }

  private logPasswordResetRequest(email: string, userExists: boolean): void {
    // Simule une opération pour rendre le temps de réponse similaire
    // que l'utilisateur existe ou non.
    // Ceci est une mesure de sécurité pour éviter l'énumération d'utilisateurs.
    const randomDelay = Math.random() * (150 - 50) + 50; // Délai entre 50ms et 150ms
    setTimeout(() => {
      if (!userExists) {
        console.log(
          `Password reset requested for non-existent or non-local email: ${email}`,
        );
      } else {
        console.log(`Password reset email supposedly sent to: ${email}`);
      }
    }, randomDelay);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let userIdFromToken: string;
      try {
        const decodedToken = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_RESET_PASSWORD_SECRET'),
        });
        userIdFromToken = decodedToken.sub;
      } catch (error) {
        throw new BadRequestException('auth.reset_password.token_invalid');
      }

      const user = await queryRunner.manager.findOne(User, {
        where: {
          id: userIdFromToken,
          passwordResetToken: token,
        },
      });

      if (!user) {
        throw new BadRequestException('auth.reset_password.token_invalid');
      }

      if (
        !user.passwordResetExpires ||
        user.passwordResetExpires < new Date()
      ) {
        // Effacer le token expiré pour éviter sa réutilisation
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await queryRunner.manager.save(User, user);
        await queryRunner.commitTransaction(); // Commit avant de lancer l'erreur
        throw new BadRequestException('auth.reset_password.token_expired');
      }

      // Vérifier si le compte est local
      if (user.provider !== AuthProvider.LOCAL) {
        throw new BadRequestException(
          'auth.reset_password.provider_not_local',
        );
      }

      user.password = newPassword; // Le hook @BeforeUpdate s'occupera du hashage
      user.passwordResetToken = null;
      user.passwordResetExpires = null;

      // Forcer le hashage du mot de passe si le hook ne se déclenche pas correctement pour une raison ou une autre
      // (normalement, il devrait avec queryRunner.manager.save)
      // await user.hashPassword(); // Redondant si le hook fonctionne bien

      await queryRunner.manager.save(User, user);
      await queryRunner.commitTransaction();

      // Optionnel: envoyer un email de confirmation de changement de mot de passe
      const appName = this.configService.get('APP_NAME') || 'Votre Application';
      const supportEmail =
        this.configService.get('SUPPORT_EMAIL') || 'support@example.com';
      await this.notificationQueueService.addEmailJob(
        user.email,
        `Confirmation de réinitialisation de mot de passe - ${appName}`,
        'password-reset-confirmation', // Nom du template
        {
          firstName: user.firstName,
          appName,
          supportEmail,
        },
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Log l'erreur interne
      console.error('Error in resetPassword:', error);
      throw new BadRequestException('auth.reset_password.failed');
    } finally {
      await queryRunner.release();
    }
  }
}
