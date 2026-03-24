import { APIClient } from '../utils/apiClient';
import { IBANAccount } from '../types/deposit';

export class DepositService {
  /**
   * Get IBAN account details for deposit
   */
  static async getIBANAccountDetails(): Promise<IBANAccount[]> {
    try {
      const response = await APIClient.post('/get-iban-account-details');
      // Handle both direct array response and wrapped response
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.accounts && Array.isArray(response.data.accounts)) {
        return response.data.accounts;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching IBAN account details:', error);
      throw error;
    }
  }
}
