import { User } from '../entities/user.entity';

export class TrustedContactDto {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  isAppUser: boolean;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  user?: User;
  createdAt: Date;
  updatedAt?: Date;
}
