import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { TrustedContact } from './entities/trusted-contact.entity';
import { CreateTrustedContactDto } from './dto/create-trusted-contact.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateTrustedContactDto } from './dto/update-trusted-contact.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TrustedContact)
    private readonly trustedContactRepository: Repository<TrustedContact>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const existingUser = await this.findByEmail(userData.email!);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, userData);
    return this.userRepository.save(user);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.findById(userId);

    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateProfileDto.email);
      if (existingUser) {
        throw new ConflictException('Cette adresse email est déjà utilisée');
      }
    }

    Object.assign(user, updateProfileDto);
    return this.userRepository.save(user);
  }

  async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    const user = await this.findById(userId);

    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    user.password = hashedPassword;

    await this.userRepository.save(user);
  }

  async updateFcmToken(userId: string, fcmToken: string): Promise<User> {
    const user = await this.findById(userId);
    user.fcmToken = fcmToken;
    return this.userRepository.save(user);
  }

  async getTrustedContacts(userId: string): Promise<TrustedContact[]> {
    return this.trustedContactRepository.find({
      where: { user: { id: userId } },
    });
  }

  async addTrustedContacts(
    userId: string,
    createTrustedContactDtos: CreateTrustedContactDto[],
  ): Promise<TrustedContact[]> {
    const user = await this.findById(userId);

    const trustedContacts = await Promise.all(
      createTrustedContactDtos.map(async (dto) => {
        // Vérifier si l'email correspond à un utilisateur existant
        const existingUser = await this.findByEmail(dto.email);

        // Créer le contact avec les préférences de notification appropriées
        const trustedContact = this.trustedContactRepository.create({
          ...dto,
          notificationPreferences: {
            email: true, // Toujours activer les notifications par email
            push: existingUser !== null, // Activer les notifications push si l'utilisateur existe
          },
          user,
        });

        return trustedContact;
      }),
    );

    return this.trustedContactRepository.save(trustedContacts);
  }

  async updateTrustedContact(
    userId: string,
    contactId: string,
    updateTrustedContactDto: UpdateTrustedContactDto,
  ): Promise<TrustedContact> {
    const trustedContact = await this.trustedContactRepository.findOne({
      where: { id: contactId, user: { id: userId } },
    });

    if (!trustedContact) {
      throw new NotFoundException('Contact de confiance non trouvé');
    }

    // Si l'email est mis à jour, vérifier s'il correspond à un utilisateur existant
    if (
      updateTrustedContactDto.email &&
      updateTrustedContactDto.email !== trustedContact.email
    ) {
      const existingUser = await this.findByEmail(
        updateTrustedContactDto.email,
      );

      // Mettre à jour les préférences de notification
      updateTrustedContactDto.notificationPreferences = {
        email: true, // Toujours activer les notifications par email
        push: existingUser !== null, // Activer les notifications push si l'utilisateur existe
      };
    }

    Object.assign(trustedContact, updateTrustedContactDto);
    return this.trustedContactRepository.save(trustedContact);
  }

  async removeTrustedContact(userId: string, contactId: string): Promise<void> {
    const result = await this.trustedContactRepository.delete({
      id: contactId,
      user: { id: userId },
    });

    if (result.affected === 0) {
      throw new NotFoundException('Contact de confiance non trouvé');
    }
  }
}
