import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Account types
export type AccountType = 'personal' | 'business';

// Personal account form data
export interface PersonalFormData {
  // Step 1: Personal Details
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  country: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Step 2: Email Verification
  emailVerified: boolean;
  verificationCode: string;
  
  // Step 3: Password
  password: string;
  confirmPassword: string;
  
  // Step 4: Account Purpose
  accountPurpose: string;
  fundFlowExplanation: string;
  sourceOfFunds: string;
  
  // Step 5: Transaction Activity (optional)
  expectedMonthlyVolume: string;
  primaryTransactionType: string;
  transactionPurpose: string;
}

// Business account form data
export interface BusinessFormData {
  // Step 1: Business Details
  email: string;
  businessName: string;
  representativeName: string;
  businessWebsite: string;
  businessType: string;
  registrationNumber: string;
  taxId: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZipCode: string;
  businessCountry: string;
  
  // Step 2: Email Verification
  emailVerified: boolean;
  verificationCode: string;
  
  // Step 3: Password
  password: string;
  confirmPassword: string;
  
  // Step 4: Business Documentation (Figma design – 9 document types)
  businessDocuments?: Record<string, string>;
  // Legacy fields kept for backward compatibility
  businessLicense: string;
  taxDocument: string;
  proofOfAddress: string;
  
  // Step 5: Account Purpose (same structure as personal flow – Figma)
  businessPurpose: string;
  fundFlowExplanation: string;
  sourceOfFunds: string;
  industryType: string;
  businessSize: string;

  // Step 6: Transaction Activity
  expectedMonthlyVolume: string;
  primaryTransactionType: string;
  transactionPurpose: string;
}

// Union type for form data
export type FormData = PersonalFormData | BusinessFormData;

// Signup state
export interface SignupState {
  accountType: AccountType | null;
  currentStep: number;
  totalSteps: number;
  personalData: PersonalFormData;
  businessData: BusinessFormData;
  errors: Record<string, string>;
  isLoading: boolean;
}

// Action types
export type SignupAction =
  | { type: 'SET_ACCOUNT_TYPE'; payload: AccountType }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'UPDATE_PERSONAL_DATA'; payload: Partial<PersonalFormData> }
  | { type: 'UPDATE_BUSINESS_DATA'; payload: Partial<BusinessFormData> }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_STATE' };

// Initial state
const initialPersonalData: PersonalFormData = {
  fullName: '',
  email: '',
  phoneNumber: '',
  dateOfBirth: '',
  country: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  emailVerified: false,
  verificationCode: '',
  password: '',
  confirmPassword: '',
  accountPurpose: '',
  fundFlowExplanation: '',
  sourceOfFunds: '',
  expectedMonthlyVolume: '',
  primaryTransactionType: '',
  transactionPurpose: '',
};

const initialBusinessData: BusinessFormData = {
  email: '',
  businessName: '',
  representativeName: '',
  businessWebsite: '',
  businessType: '',
  registrationNumber: '',
  taxId: '',
  businessAddress: '',
  businessCity: '',
  businessState: '',
  businessZipCode: '',
  businessCountry: '',
  emailVerified: false,
  verificationCode: '',
  password: '',
  confirmPassword: '',
  businessLicense: '',
  taxDocument: '',
  proofOfAddress: '',
  businessPurpose: '',
  fundFlowExplanation: '',
  sourceOfFunds: '',
  industryType: '',
  businessSize: '',
  expectedMonthlyVolume: '',
  primaryTransactionType: '',
  transactionPurpose: '',
};

const initialState: SignupState = {
  accountType: null,
  currentStep: 1,
  totalSteps: 5,
  personalData: initialPersonalData,
  businessData: initialBusinessData,
  errors: {},
  isLoading: false,
};

// Required document keys for Business Documentation (step 4) – Figma design
const REQUIRED_BUSINESS_DOC_KEYS = [
  'commercialRegistryExtract',
  'certificateOfIncorporation',
  'articlesMemorandum',
  'proofOfBusinessAddress',
  'ownershipStructure',
  'directorsRegister',
  'bankStatement',
  'operatingLicenses',
] as const;

function canContinueBusinessDocumentation(data: BusinessFormData): boolean {
  const docs = data.businessDocuments;
  if (docs && typeof docs === 'object') {
    return REQUIRED_BUSINESS_DOC_KEYS.every((key) => !!docs[key]);
  }
  return !!(data.businessLicense || data.taxDocument);
}

// Reducer
const signupReducer = (state: SignupState, action: SignupAction): SignupState => {
  switch (action.type) {
    case 'SET_ACCOUNT_TYPE':
      return {
        ...state,
        accountType: action.payload,
        totalSteps: action.payload === 'personal' ? 5 : 6,
        currentStep: 1,
      };
    
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: Math.max(1, Math.min(action.payload, state.totalSteps)),
      };
    
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.totalSteps),
      };
    
    case 'PREVIOUS_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 1),
      };
    
    case 'UPDATE_PERSONAL_DATA':
      return {
        ...state,
        personalData: {
          ...state.personalData,
          ...action.payload,
        },
      };
    
    case 'UPDATE_BUSINESS_DATA':
      return {
        ...state,
        businessData: {
          ...state.businessData,
          ...action.payload,
        },
      };
    
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload,
      };
    
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: {},
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
};

// Context
interface SignupContextType {
  state: SignupState;
  dispatch: React.Dispatch<SignupAction>;
  
  // Helper functions
  setAccountType: (type: AccountType) => void;
  nextStep: () => void;
  previousStep: () => void;
  updatePersonalData: (data: Partial<PersonalFormData>) => void;
  updateBusinessData: (data: Partial<BusinessFormData>) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  setLoading: (loading: boolean) => void;
  resetState: () => void;
  
  // Validation helpers
  validateCurrentStep: () => boolean;
  getStepTitle: (step: number) => string;
  canSkipCurrentStep: () => boolean;
}

const SignupContext = createContext<SignupContextType | undefined>(undefined);

// Provider component
export const SignupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(signupReducer, initialState);

  // Helper functions
  const setAccountType = (type: AccountType) => {
    dispatch({ type: 'SET_ACCOUNT_TYPE', payload: type });
  };

  const nextStep = () => {
    dispatch({ type: 'NEXT_STEP' });
  };

  const previousStep = () => {
    dispatch({ type: 'PREVIOUS_STEP' });
  };

  const updatePersonalData = (data: Partial<PersonalFormData>) => {
    dispatch({ type: 'UPDATE_PERSONAL_DATA', payload: data });
  };

  const updateBusinessData = (data: Partial<BusinessFormData>) => {
    dispatch({ type: 'UPDATE_BUSINESS_DATA', payload: data });
  };

  const setErrors = (errors: Record<string, string>) => {
    dispatch({ type: 'SET_ERRORS', payload: errors });
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  // Validation helper
  const validateCurrentStep = (): boolean => {
    const { accountType, currentStep } = state;
    
    if (accountType === 'personal') {
      const data = state.personalData;
      switch (currentStep) {
        case 1:
          return !!(data.fullName && data.email && data.phoneNumber && data.dateOfBirth && data.country && data.address && data.city && data.state && data.zipCode);
        case 2:
          return !!(data.emailVerified);
        case 3:
          return !!(data.password && data.confirmPassword && data.password === data.confirmPassword);
        case 4:
          return !!(data.accountPurpose && data.fundFlowExplanation && data.sourceOfFunds);
        case 5:
          return true; // Optional step
        default:
          return false;
      }
    } else if (accountType === 'business') {
      const data = state.businessData;
      switch (currentStep) {
        case 1:
          return !!(data.email && data.businessName && data.representativeName && data.businessWebsite && data.businessCountry && data.businessAddress && data.businessCity && data.businessState && data.businessZipCode);
        case 2:
          return !!(data.email && data.emailVerified);
        case 3:
          return !!(data.password && data.confirmPassword && data.password === data.confirmPassword);
        case 4:
          return canContinueBusinessDocumentation(data);
        case 5:
          return !!(data.businessPurpose && data.fundFlowExplanation && data.sourceOfFunds);
        case 6:
          return true; // Optional step
        default:
          return false;
      }
    }
    
    return false;
  };

  // Get step title
  const getStepTitle = (step: number): string => {
    const { accountType } = state;
    
    if (accountType === 'personal') {
      const titles = [
        'Personal Details',
        'Verify Email',
        'Create Password',
        'Account Purpose',
        'Transaction Activity',
      ];
      return titles[step - 1] || '';
    } else if (accountType === 'business') {
      const titles = [
        'Business Details',
        'Verify Email',
        'Create Password',
        'Business Documentation',
        'Account Purpose',
        'Transaction Activity',
      ];
      return titles[step - 1] || '';
    }
    
    return '';
  };

  // Check if current step can be skipped
  const canSkipCurrentStep = (): boolean => {
    const { accountType, currentStep } = state;
    
    if (accountType === 'personal') {
      return currentStep === 4 || currentStep === 5;
    } else if (accountType === 'business') {
      return currentStep === 6;
    }
    
    return false;
  };

  const value: SignupContextType = {
    state,
    dispatch,
    setAccountType,
    nextStep,
    previousStep,
    updatePersonalData,
    updateBusinessData,
    setErrors,
    clearErrors,
    setLoading,
    resetState,
    validateCurrentStep,
    getStepTitle,
    canSkipCurrentStep,
  };

  return <SignupContext.Provider value={value}>{children}</SignupContext.Provider>;
};

// Custom hook to use the signup context
export const useSignupContext = (): SignupContextType => {
  const context = useContext(SignupContext);
  if (context === undefined) {
    throw new Error('useSignupContext must be used within a SignupProvider');
  }
  return context;
};