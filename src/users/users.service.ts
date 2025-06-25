import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, AuthProvider } from './entities/user.entity';
import { TrustedContact } from './entities/trusted-contact.entity';
import { CreateTrustedContactDto } from './dto/create-trusted-contact.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateTrustedContactDto } from './dto/update-trusted-contact.dto';
import { TrustedContactDto } from './dto/trusted-contact.dto';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TrustedContact)
    private readonly trustedContactRepository: Repository<TrustedContact>,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private dataSource: DataSource,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUser = await queryRunner.manager.findOne(User, {
        where: [{ email: userData.email }],
      });

      if (existingUser) {
        throw new ConflictException('auth.email.exists');
      }

      const user = this.userRepository.create(userData);
      await user.hashPassword();
      const savedUser = await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: string, isValidation: boolean = false): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw isValidation
        ? new UnauthorizedException()
        : new NotFoundException('users.not_found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByProviderId(
    providerId: string,
    provider: AuthProvider,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: { providerId, provider },
    });
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, userData);
    return this.userRepository.save(user);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('users.not_found');
      }

      if (updateProfileDto.email && updateProfileDto.email !== user.email) {
        const existingUser = await queryRunner.manager.findOne(User, {
          where: { email: updateProfileDto.email },
        });
        if (existingUser) {
          throw new ConflictException('users.email.exists');
        }
      }

      Object.assign(user, updateProfileDto);
      const savedUser = await queryRunner.manager.save(User, user);
      await queryRunner.commitTransaction();
      return this.authService.login(savedUser);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('users.not_found');
      }

      if (user.provider !== AuthProvider.LOCAL) {
        throw new UnauthorizedException('auth.provider.not_local');
      }

      const isPasswordValid = await user.validatePassword(
        updatePasswordDto.currentPassword,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('auth.password.incorrect');
      }

      user.password = updatePasswordDto.newPassword;
      await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateFcmToken(userId: string, fcmToken: string): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('users.not_found');
      }

      user.fcmToken = fcmToken;
      const savedUser = await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTrustedContacts(userId: string): Promise<TrustedContact[]> {
    return this.trustedContactRepository.find({
      where: { user: { id: userId } },
    });
  }

  async addTrustedContact(
    userId: string,
    createTrustedContactDto: CreateTrustedContactDto,
  ): Promise<TrustedContact> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('users.not_found');
      }

      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email: createTrustedContactDto.email },
      });

      const trustedContact = this.trustedContactRepository.create({
        ...createTrustedContactDto,
        notificationPreferences: {
          email: true,
          push: existingUser !== null,
        },
        user,
      });

      const savedContact = await queryRunner.manager.save(
        TrustedContact,
        trustedContact,
      );
      await queryRunner.commitTransaction();
      return savedContact;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateTrustedContact(
    userId: string,
    contactId: string,
    updateTrustedContactDto: UpdateTrustedContactDto,
  ): Promise<TrustedContact> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const trustedContact = await queryRunner.manager.findOne(TrustedContact, {
        where: { id: contactId, user: { id: userId } },
      });

      if (!trustedContact) {
        throw new NotFoundException('users.trusted_contact.not_found');
      }

      if (
        updateTrustedContactDto.email &&
        updateTrustedContactDto.email !== trustedContact.email
      ) {
        const existingUser = await queryRunner.manager.findOne(User, {
          where: { email: updateTrustedContactDto.email },
        });
        updateTrustedContactDto.notificationPreferences = {
          email: true,
          push: existingUser !== null,
        };
      }

      Object.assign(trustedContact, updateTrustedContactDto);

      const savedContact = await queryRunner.manager.save(
        TrustedContact,
        trustedContact,
      );

      await queryRunner.commitTransaction();
      return savedContact;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async removeTrustedContact(userId: string, contactId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await queryRunner.manager.softDelete(TrustedContact, {
        id: contactId,
        user: { id: userId },
      });

      if (result.affected === 0) {
        throw new NotFoundException('users.trusted_contact.not_found');
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async search(userId: string, query: string): Promise<Partial<User>[]> {
    const results = await this.userRepository
      .createQueryBuilder('user')
      .where(
        '(user.id <> :userId AND (LOWER(user.firstName) LIKE LOWER(:query) OR LOWER(user.lastName) LIKE LOWER(:query) OR LOWER(user.email) LIKE LOWER(:query) OR LOWER(user.phoneNumber) LIKE LOWER(:query)))',
        { query: `%${query}%`, userId },
      )
      .getMany();

    return results.map((user) => {
      const { password, ...userData } = user;
      return userData;
    });
  }

  async getUserContacts(userId: string): Promise<TrustedContactDto[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['trustedContacts'],
    });

    if (!user) {
      throw new NotFoundException('users.not_found');
    }

    // Récupérer les utilisateurs correspondant aux contacts de confiance
    const contacts = await Promise.all(
      user.trustedContacts.map(async (contact) => {
        const userContact = await this.findByEmail(contact.email);

        return {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phoneNumber: contact.phoneNumber,
          isAppUser: userContact != null,
          notificationPreferences: contact.notificationPreferences,
          user: contact.user,
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
        } as TrustedContactDto;
      }),
    );

    return contacts;
  }
}
