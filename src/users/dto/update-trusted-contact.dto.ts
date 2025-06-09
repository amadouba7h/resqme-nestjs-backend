import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class UpdateTrustedContactDto {
  @ApiProperty({
    description: 'Nom du contact de confiance',
    example: 'Marie Martin',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Email du contact de confiance',
    example: 'trusted.contact@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Numéro de téléphone du contact de confiance',
    example: '+22370540470',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Préférences de notification',
    example: {
      email: true,
      sms: true,
      push: false,
    },
    required: false,
  })
  @IsOptional()
  notificationPreferences?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
}
