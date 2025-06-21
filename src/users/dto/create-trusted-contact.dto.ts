import { IsEmail, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTrustedContactDto {
  @ApiProperty({
    example: 'Marie Martin',
    description: 'Nom du contact de confiance',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'trusted.contact@example.com',
    description: 'Email du contact de confiance',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '+22370540470',
    description: 'Numéro de téléphone du contact de confiance',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    example: {
      email: true,
      push: false,
    },
    description: 'Préférences de notification',
    required: false,
  })
  @IsOptional()
  notificationPreferences?: {
    email?: boolean;
    push?: boolean;
  };
}
