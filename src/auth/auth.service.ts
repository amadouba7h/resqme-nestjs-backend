import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
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
}
