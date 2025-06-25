export interface SosAlertJobData {
  alertId: string;
  userId: string;
  userName: string;
  contacts: Array<{
    id: string;
    email: string;
    phoneNumber?: string;
    notificationPreferences: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  }>;
  location?: {
    coordinates: [number, number];
    accuracy?: number;
    speed?: number;
    heading?: number;
  };
}

export interface SosResolvedJobData {
  alertId: string;
  userId: string;
  userName: string;
  resolutionReason: string;
  contacts: Array<{
    id: string;
    email: string;
    phoneNumber?: string;
    notificationPreferences: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  }>;
}

export interface PushNotificationJobData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface SmsJobData {
  phoneNumber: string;
  message: string;
}

export interface EmailJobData {
  to: string;
  subject: string;
  template: string; // Nom du template (ex: 'reset-password')
  context?: Record<string, any>; // Données pour le template
  attachments?: Array<{
    filename: string;
    path: string;
    cid: string;
  }>;
}
