import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

/**
 * DTO pour le changement de mot de passe
 */
export class ChangePasswordDto {
  /**
   * Mot de passe actuel de l'utilisateur
   */
  @ApiProperty({
    description: "Mot de passe actuel de l'utilisateur",
    example: 'CurrentPassword123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Le mot de passe actuel est requis' })
  @IsString({
    message: 'Le mot de passe actuel doit être une chaîne de caractères',
  })
  currentPassword: string;

  /**
   * Nouveau mot de passe (minimum 8 caractères, au moins une majuscule, une minuscule, un chiffre et un caractère spécial)
   */
  @ApiProperty({
    description:
      'Nouveau mot de passe (minimum 8 caractères, au moins une majuscule, une minuscule, un chiffre et un caractère spécial)',
    example: 'NewPassword123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Le nouveau mot de passe est requis' })
  @IsString({
    message: 'Le nouveau mot de passe doit être une chaîne de caractères',
  })
  @MinLength(8, {
    message: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
  })
  newPassword: string;
}
