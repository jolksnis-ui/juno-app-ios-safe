export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface User {
  name: string;
  clientEmail: string;
  clientId: string;
  accountNumber: string;
  clientObjId?: string;
}

export interface LoginResponse {
  name: string;
  clientEmail: string;
  clientId: string;
  accountNumber: string;
  parentClient?: string;
  is2faActivated: {
    secret: string | null;
    encoding: string | null;
    enabled: boolean;
  };
  accountType: string;
  onboardingStatus: string;
  kyc: {
    rejectLabels: string[];
    status: string;
  };
}

export interface GetLoggedInClientResponse {
  _id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  country?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  [key: string]: any;
}

export interface ChangePasswordRequest {
  clientEmail: string;
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
