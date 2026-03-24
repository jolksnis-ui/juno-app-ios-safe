import { APIClient } from '../utils/apiClient';
import { 
  GetClientAssociatedUserResponse, 
  CreateClientAssociatedUserRequest, 
  CreateClientAssociatedUserResponse 
} from '../types/additionalAccounts';

export const getClientAssociatedUsers = async (): Promise<GetClientAssociatedUserResponse> => {
  try {
    const response = await APIClient.post<GetClientAssociatedUserResponse>('/get-client-associated-user', {});
    return response.data;
  } catch (error) {
    console.error('Failed to get client associated users:', error);
    throw error;
  }
};

export const createClientAssociatedUser = async (
  requestData: CreateClientAssociatedUserRequest
): Promise<CreateClientAssociatedUserResponse> => {
  try {
    const response = await APIClient.post<CreateClientAssociatedUserResponse>(
      '/create-client-associated-user', 
      requestData
    );
    return response.data;
  } catch (error) {
    console.error('Failed to create client associated user:', error);
    throw error;
  }
};