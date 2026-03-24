export interface NotificationPreferences {
  transactionAlerts: boolean;
  securityAlerts: boolean;
  amountThreshold: number;
}

export interface TransactionNotification {
  type: 'transaction_alert';
  title: string;
  body: string;
  data: {
    transactionId: string;
    amount: number;
    currency: string;
    timestamp: string;
    requiresAction?: boolean;
  };
}

export interface SecurityNotification {
  type: 'security_alert';
  title: string;
  body: string;
  data: {
    alertType: 'login' | 'password_change' | 'device_added';
    timestamp: string;
  };
}

export type NotificationData = TransactionNotification | SecurityNotification;

export interface DeviceRegistration {
  deviceToken: string;
  deviceName?: string;
  registeredAt: string;
  isActive: boolean;
}

export enum NotificationStatus {
  NOT_REGISTERED = 'not_registered',
  REGISTERING = 'registering',
  REGISTERED = 'registered',
  FAILED = 'failed'
}
