import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'Ancien mot de passe',
    example: 'oldPassword123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'Nouveau mot de passe',
    example: 'newPassword123',
  })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Le mot de passe doit contenir au moins 1 majuscule, 1 minuscule et 1 chiffre ou caractère spécial',
  })
  newPassword: string;
}
