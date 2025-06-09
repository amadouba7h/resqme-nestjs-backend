import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration CORS
  app.enableCors({
    origin: ['*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const formattedErrors: Record<string, string[]> = {};

        errors.forEach((error) => {
          if (error.constraints) {
            formattedErrors[error.property] = Object.values(error.constraints);
          }

          // Handle nested validation if needed (optional)
          if (error.children && error.children.length > 0) {
            error.children.forEach((childError) => {
              if (childError.constraints) {
                const field = `${error.property}.${childError.property}`;
                formattedErrors[field] = Object.values(childError.constraints);
              }
            });
          }
        });

        return new UnprocessableEntityException(formattedErrors);
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('ResQme API')
    .setDescription('API documentation for the ResQme platform')
    .setVersion('1.0')
    .addBearerAuth() // pour auth via JWT dans Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // ⬅️ expose sur /api

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
