import { APIClient, TokenExpiredError } from '../utils/apiClient';
import { APIStatement, Statement, GetStatementListRequest, CreateStatementRequest, GeneratePDFRequest } from '../types/statement';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Convert API statement to UI statement
 */
const convertAPIStatementToStatement = (apiStatement: APIStatement): Statement => {
  // Extract month and year from fromDate for filename generation
  const fromDate = new Date(apiStatement.timePeriod.fromDate);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[fromDate.getMonth()];
  const year = fromDate.getFullYear();
  
  return {
    id: apiStatement._id,
    type: apiStatement.currencyType,
    currency: apiStatement.currency,
    currencyShortName: apiStatement.currencyShortName,
    openingBalance: apiStatement.openingBalance,
    closingBalance: apiStatement.closingBalance,
    timePeriod: apiStatement.timePeriod,
    generatedDate: apiStatement.createdAt,
    status: 'generated', // All fetched statements are generated
    fileName: `${apiStatement.currencyShortName}_Statement_${monthName}_${year}.pdf`
  };
};

/**
 * Get client statements
 */
export const getClientStatements = async (currencyType: 'fiat' | 'crypto'): Promise<Statement[]> => {
  try {
    const request: GetStatementListRequest = {
      currencyType
    };

    const response = await APIClient.post<APIStatement[]>('/get-client-statement', request);
    
    // Convert API response to UI format
    const statements = response.data.map(convertAPIStatementToStatement);
    
    // Sort by creation date (newest first)
    statements.sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime());
    
    return statements;
  } catch (error) {
    console.error('Failed to fetch client statements:', error);
    throw error;
  }
};

/**
 * Generate client statement
 */
export const generateClientStatement = async (
  fromDate: string, 
  currency: string, 
  currencyType: 'fiat' | 'crypto'
): Promise<void> => {
  try {
    // Generate statement name
    const [year, month] = fromDate.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[parseInt(month) - 1];
    const name = `Statement ${currency} ${year}-${month.padStart(2, '0')}`;

    const request: CreateStatementRequest = {
      fromDate,
      currency,
      currencyType,
      name
    };

    await APIClient.post('/generate-client-statement', request);
    
    // If we reach here, the request was successful (status 200)
    console.log('Statement generation request submitted successfully');
  } catch (error) {
    console.error('Failed to generate client statement:', error);
    throw error;
  }
};

/**
 * Download statement PDF
 */
export const downloadStatement = async (statement: Statement): Promise<void> => {
  try {
    const request: GeneratePDFRequest = {
      statementId: statement.id,
      fromDate: statement.timePeriod.fromDate,
      endDate: statement.timePeriod.endDate,
      currency: statement.currency,
      activeCurrencyPage: statement.type,
      downloadType: 'pdf'
    };

    // Since APIClient expects JSON response but we need blob, we'll use the raw fetch
    // but follow the exact same pattern as APIClient for authentication
    const { getUserData, getToken } = await import('./secureStorage');
    const userData = await getUserData();
    const token = await getToken();
    
    if (!userData || !token) {
      const { clearAuthData } = await import('./secureStorage');
      await clearAuthData();
      throw new TokenExpiredError('Authentication required. Please login again.');
    }

    // Clear existing cookies to prevent duplication (exactly like APIClient does)
    if (typeof document !== 'undefined') {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }

    const response = await fetch('https://dev.junomoney.org/restapi/generate-statement-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-interface-type': 'web',
      },
      body: JSON.stringify(request),
    });

    // Handle authentication errors exactly like APIClient does
    if (response.status === 401 || response.status === 403) {
      const { clearAuthData } = await import('./secureStorage');
      try {
        const errorData = await response.clone().json();
        if (errorData.success === false && (errorData.message === 'Invalid Token' || response.status === 401)) {
          await clearAuthData();
          throw new TokenExpiredError('Session expired. Please login again.');
        }
      } catch (parseError) {
        if (response.status === 401 || response.status === 403) {
          await clearAuthData();
          throw new TokenExpiredError('Session expired. Please login again.');
        }
      }
    }

    // Handle other HTTP errors exactly like APIClient does
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    // Get the PDF blob
    const blob = await response.blob();
    
    // Convert blob to base64 for file system
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        if (reader.result) {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert PDF to base64'));
        }
      };
      reader.onerror = reject;
    });
    
    reader.readAsDataURL(blob);
    const base64Data = await base64Promise;

    // Save file to device
    const fileName = statement.fileName;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Statement PDF',
      });
    } else {
      console.log('PDF saved to:', fileUri);
      // On platforms where sharing isn't available, the file is still saved
      throw new Error('PDF saved to device, but sharing is not available on this platform');
    }

    console.log('Statement PDF downloaded and shared successfully');
  } catch (error) {
    console.error('Failed to download statement:', error);
    throw error;
  }
};