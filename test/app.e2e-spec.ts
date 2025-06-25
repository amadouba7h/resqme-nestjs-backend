import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { User, AuthProvider } from '../src/users/entities/user.entity';
import { UsersService } from '../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let dataSource: DataSource;
  let createdUser: User;
  let resetToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    // Mocking external services if necessary, or use a test database
    .overrideProvider(AuthService)
    .useValue({
        // Add mocks for other AuthService methods if your tests trigger them indirectly
        // For now, we primarily test the controller's interaction with these specific methods
        forgotPassword: jest.fn(),
        resetPassword: jest.fn(),
        login: jest.fn(), // Keep existing mocks if any
        register: jest.fn(),
        validateUser: jest.fn(),
        refreshToken: jest.fn(),
        logout: jest.fn(),
        validateGoogleToken: jest.fn(),
    })
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService); // For potential setup
    jwtService = moduleFixture.get<JwtService>(JwtService); // For generating tokens if needed by mocks
    configService = moduleFixture.get<ConfigService>(ConfigService); // For config values
    dataSource = moduleFixture.get<DataSource>(DataSource); // For direct DB manipulation if needed

    // It's often better to mock the service layer as shown above for controller tests
    // rather than hitting the real service and DB.
    // If you need to test the full flow, ensure your test DB is properly set up and cleaned.
  });

  afterAll(async () => {
    // Clean up database if necessary
    // e.g., await dataSource.getRepository(User).delete({});
    await app.close();
  });

  describe('/auth/forgot-password (POST)', () => {
    it('should call authService.forgotPassword and return OK', async () => {
      const email = 'test@example.com';
      (authService.forgotPassword as jest.Mock).mockResolvedValueOnce(undefined);

      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email })
        .expect(HttpStatus.OK);

      expect(authService.forgotPassword).toHaveBeenCalledWith(email);
      expect(response.body).toEqual({ message: 'auth.forgot_password.email_sent' });
    });

    it('should return BAD_REQUEST for invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/auth/reset-password (POST)', () => {
    it('should call authService.resetPassword and return OK', async () => {
      const token = 'valid-reset-token';
      const newPassword = 'NewPassword123!';
      (authService.resetPassword as jest.Mock).mockResolvedValueOnce(undefined);

      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token, newPassword })
        .expect(HttpStatus.OK);

      expect(authService.resetPassword).toHaveBeenCalledWith(token, newPassword);
      expect(response.body).toEqual({ message: 'auth.reset_password.success' });
    });

    it('should return BAD_REQUEST if token is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ newPassword: 'NewPassword123!' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return BAD_REQUEST if newPassword is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'valid-token' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return BAD_REQUEST if newPassword is not strong enough (example validation)', async () => {
        // This test assumes your ResetPasswordDto has password strength validation
        // For this e2e test, we are checking the validation pipe.
        // If authService.resetPassword itself throws a BadRequest for weak password,
        // that would be covered by unit tests for AuthService.
        // Here, we rely on DTO validation.

        // Let's assume ResetPasswordDto has @Matches for password complexity
        // and the service mock doesn't get called due to DTO validation failure.

        // To make this test meaningful for e2e, the DTO would need appropriate decorators.
        // Since we are mocking authService.resetPassword, we can't directly test its internal password validation here.
        // This test primarily ensures the DTO validation works for missing or malformed fields.
        // For actual password strength, that's usually handled by the service or entity.
        // If ResetPasswordDto had IsStrongPassword decorator:
        const response = await request(app.getHttpServer())
            .post('/auth/reset-password')
            .send({ token: 'valid-token', newPassword: 'weak' })
            .expect(HttpStatus.BAD_REQUEST);

        // Example: if ResetPasswordDto had IsStrongPassword, the response might look like:
        // expect(response.body.message).toContain('newPassword must be a strong password');
        // For now, this will pass if 'weak' fails any basic string validation like MinLength.
        // If ResetPasswordDto.newPassword only has @IsNotEmpty() and @IsString(), 'weak' is valid.
        // We'll assume the DTO has @MinLength(8) for this example.
        expect(response.body.message).toBeDefined(); // Check that there is some error message
    });
  });
});
