export interface AdditionalAccount {
  _id: string;
  parentClient: string;
  readOnly: boolean;
  clientEmail: string;
  clientId: string;
  createdAt: string;
  __v: number;
  twoFA: {
    secret: string | null;
    encoding: string | null;
    enabled: boolean;
  };
}

export interface GetClientAssociatedUserResponse {
  clientsData: AdditionalAccount[];
}

export interface CreateClientAssociatedUserRequest {
  clientEmail: string;
  password: string;
  readOnly: boolean;
  parentClient: string;
}

export interface CreateClientAssociatedUserResponse {
  success: boolean;
  message?: string;
}

export interface AddAdditionalAccountFormData {
  clientEmail: string;
  password: string;
  confirmPassword: string;
  readOnly: boolean;
}