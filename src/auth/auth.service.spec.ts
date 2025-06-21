import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { NotificationQueueService } from '../notifications/services/notification-queue.service';
import { User, AuthProvider } from '../users/entities/user.entity';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: DeepMocked<UsersService>;
  let jwtService: DeepMocked<JwtService>;
  let configService: DeepMocked<ConfigService>;
  let dataSource: DeepMocked<DataSource>;
  let notificationQueueService: DeepMocked<NotificationQueueService>;
  let mockQueryRunner: any;

  // Helper type for deep mocking
  type DeepMocked<T> = {
    [P in keyof T]: T[P] extends (...args: any[]) => any
      ? jest.MockedFunction<T[P]>
      : DeepMocked<T[P]>;
  } & T;

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          } as DeepMocked<UsersService>,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          } as DeepMocked<JwtService>,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_RESET_PASSWORD_SECRET') return 'reset-secret';
              if (key === 'JWT_RESET_PASSWORD_EXPIRATION') return '3600'; // 1 hour
              if (key === 'JWT_RESET_PASSWORD_EXPIRATION_HUMAN') return '1 heure';
              if (key === 'CLIENT_URL') return 'http://localhost:3000';
              if (key === 'APP_NAME') return 'TestApp';
              if (key === 'SUPPORT_EMAIL') return 'support@test.com';
              return null;
            }),
          } as DeepMocked<ConfigService>,
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(() => mockQueryRunner),
          } as DeepMocked<DataSource>,
        },
        {
          provide: NotificationQueueService,
          useValue: {
            addEmailJob: jest.fn(),
          } as DeepMocked<NotificationQueueService>,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    dataSource = module.get(DataSource);
    notificationQueueService = module.get(NotificationQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('forgotPassword', () => {
    const email = 'test@example.com';
    let user: User;

    beforeEach(() => {
      user = new User();
      user.id = 'user-id';
      user.email = email;
      user.firstName = 'Test';
      user.provider = AuthProvider.LOCAL;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;

      // Mock de setTimeout pour qu'il s'exécute immédiatement dans les tests
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers(); // Restaurer les vrais timers
    });

    it('should send a password reset email if user exists and is local', async () => {
      usersService.findByEmail.mockResolvedValue(user);
      jwtService.sign.mockReturnValue('reset-token');
      mockQueryRunner.manager.save.mockResolvedValue(user);

      await service.forgotPassword(email);

      // Avancer les timers pour exécuter le setTimeout dans logPasswordResetRequest
      jest.runAllTimers();

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: user.id, email: user.email },
        {
          secret: 'reset-secret',
          expiresIn: '3600',
        },
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(User, expect.objectContaining({
        id: user.id,
        passwordResetToken: 'reset-token',
        passwordResetExpires: expect.any(Date),
      }));
      expect(notificationQueueService.addEmailJob).toHaveBeenCalledWith(
        email,
        'Réinitialisation de mot de passe pour TestApp',
        'reset-password',
        {
          firstName: user.firstName,
          resetLink: 'http://localhost:3000/reset-password?token=reset-token',
          appName: 'TestApp',
          expirationTime: '1 heure',
        },
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should not send email if user does not exist and log the attempt', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const consoleSpy = jest.spyOn(console, 'log');

      await service.forgotPassword(email);
      jest.runAllTimers(); // Pour le setTimeout dans logPasswordResetRequest

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).not.toHaveBeenCalled();
      expect(notificationQueueService.addEmailJob).not.toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled(); // Commit est appelé même si rien n'est fait
      expect(consoleSpy).toHaveBeenCalledWith(
        `Password reset requested for non-existent or non-local email: ${email}`
      );
      consoleSpy.mockRestore();
    });

    it('should not send email if user is not local and log the attempt', async () => {
      user.provider = AuthProvider.GOOGLE;
      usersService.findByEmail.mockResolvedValue(user);
      const consoleSpy = jest.spyOn(console, 'log');

      await service.forgotPassword(email);
      jest.runAllTimers();

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).not.toHaveBeenCalled();
      expect(notificationQueueService.addEmailJob).not.toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        `Password reset requested for non-existent or non-local email: ${email}`
      );
      consoleSpy.mockRestore();
    });

    it('should rollback transaction on error during findByEmail', async () => {
      usersService.findByEmail.mockRejectedValue(new Error('DB error'));
      const consoleErrorSpy = jest.spyOn(console, 'error');

      await service.forgotPassword(email);
      // Le service ne relance pas l'erreur, il la logue

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in forgotPassword:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

     it('should rollback transaction on error during token generation', async () => {
      usersService.findByEmail.mockResolvedValue(user);
      jwtService.sign.mockImplementation(() => { throw new Error('JWT error'); });
      const consoleErrorSpy = jest.spyOn(console, 'error');

      await service.forgotPassword(email);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in forgotPassword:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('resetPassword', () => {
    const token = 'valid-reset-token';
    const newPassword = 'newStrongPassword123!';
    let user: User;

    beforeEach(() => {
      user = new User();
      user.id = 'user-id';
      user.email = 'test@example.com';
      user.firstName = 'Test';
      user.provider = AuthProvider.LOCAL;
      user.passwordResetToken = token;
      user.passwordResetExpires = new Date(Date.now() + 3600 * 1000); // Expires in 1 hour
      user.password = 'oldPassword'; // Le hashage sera géré par le hook
    });

    it('should reset password if token is valid and not expired', async () => {
      jwtService.verify.mockReturnValue({ sub: user.id, email: user.email });
      mockQueryRunner.manager.findOne.mockResolvedValue(user);
      mockQueryRunner.manager.save.mockImplementation(async (entityClass, entityInstance) => entityInstance); // Simule le save

      await service.resetPassword(token, newPassword);

      expect(jwtService.verify).toHaveBeenCalledWith(token, { secret: 'reset-secret' });
      expect(mockQueryRunner.manager.findOne).toHaveBeenCalledWith(User, {
        where: { id: user.id, passwordResetToken: token },
      });
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(User, expect.objectContaining({
        id: user.id,
        password: newPassword, // Le mot de passe est assigné, le hashage est fait par le hook
        passwordResetToken: null,
        passwordResetExpires: null,
      }));
      expect(notificationQueueService.addEmailJob).toHaveBeenCalledWith(
        user.email,
        'Confirmation de réinitialisation de mot de passe - TestApp',
        'password-reset-confirmation',
        {
          firstName: user.firstName,
          appName: 'TestApp',
          supportEmail: 'support@test.com',
        },
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if token is invalid (jwt verify fails)', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid JWT');
      });

      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(
        new BadRequestException('auth.reset_password.token_invalid'),
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if token is not found for user', async () => {
      jwtService.verify.mockReturnValue({ sub: user.id, email: user.email });
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(
        new BadRequestException('auth.reset_password.token_invalid'),
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException and clear token if token is expired', async () => {
      user.passwordResetExpires = new Date(Date.now() - 3600 * 1000); // Expired 1 hour ago
      jwtService.verify.mockReturnValue({ sub: user.id, email: user.email });
      mockQueryRunner.manager.findOne.mockResolvedValue(user);
      mockQueryRunner.manager.save.mockImplementation(async (entityClass, entityInstance) => entityInstance);

      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(
        new BadRequestException('auth.reset_password.token_expired'),
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(User, expect.objectContaining({
        id: user.id,
        passwordResetToken: null,
        passwordResetExpires: null,
      }));
      // Important: commitTransaction est appelé AVANT de lancer l'erreur dans ce cas précis
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      // Le rollback global sera appelé par le catch du service, mais la modif du token est commitée
      // Pour tester cela plus finement, il faudrait espionner le commit DANS le bloc if (expired)
    });

    it('should throw BadRequestException if user provider is not local', async () => {
      user.provider = AuthProvider.GOOGLE;
      jwtService.verify.mockReturnValue({ sub: user.id, email: user.email });
      mockQueryRunner.manager.findOne.mockResolvedValue(user);

      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(
        new BadRequestException('auth.reset_password.provider_not_local'),
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction on general error during save', async () => {
      jwtService.verify.mockReturnValue({ sub: user.id, email: user.email });
      mockQueryRunner.manager.findOne.mockResolvedValue(user);
      mockQueryRunner.manager.save.mockRejectedValue(new Error('DB save error'));
      const consoleErrorSpy = jest.spyOn(console, 'error');

      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(
         new BadRequestException('auth.reset_password.failed'), // Erreur générique du service
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in resetPassword:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });
});
