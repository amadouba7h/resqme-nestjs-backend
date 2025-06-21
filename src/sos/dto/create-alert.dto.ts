import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAlertDto {
  @ApiProperty({
    example: 'Je me sens en danger dans cette zone',
    description: 'Description de la situation',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 48.8566,
    description: 'Latitude de la position',
    required: true,
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    example: 2.3522,
    description: 'Longitude de la position',
    required: true,
  })
  @IsNumber()
  longitude: number;

  @ApiProperty({
    example: 10.5,
    description: 'Précision de la position en mètres',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  accuracy?: number;

  @ApiProperty({
    example: 5.2,
    description: 'Vitesse en km/h',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  speed?: number;

  @ApiProperty({
    example: 90,
    description: 'Direction en degrés',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  heading?: number;
}
