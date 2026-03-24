# E2E Testing Guide for Juno Mobile App

## Overview

This document provides a comprehensive guide for implementing End-to-End (E2E) testing for the Juno React Native/Expo mobile application. E2E testing ensures that the entire user journey works correctly across real device environments.

## Framework Comparison

### 1. **Detox** (⭐ Recommended)
- **Pros**: Industry standard, excellent React Native support, cross-platform, active community
- **Cons**: Requires prebuild for Expo apps, setup complexity
- **Best for**: Production apps requiring robust testing

### 2. **Maestro**
- **Pros**: Simple YAML syntax, fast setup, cross-platform, cloud testing
- **Cons**: Newer framework, smaller community
- **Best for**: Quick setup and simple test scenarios

### 3. **Appium**
- **Pros**: Cross-platform (mobile/web), mature framework, WebDriver standard
- **Cons**: Complex setup, slower execution, less React Native specific
- **Best for**: Multi-platform apps beyond mobile

### 4. **Cavy**
- **Pros**: React Native specific, component-based testing
- **Cons**: Less maintained, limited community
- **Best for**: Simple React Native apps with basic testing needs

## Detox Implementation Guide

### Prerequisites

```bash
# Install Detox CLI globally
npm install -g detox-cli

# Install Xcode command line tools (macOS only)
xcode-select --install

# Install Android development environment
# - Android Studio
# - Android SDK
# - Android emulator
```

### Installation

```bash
# Install Detox dependencies
npm install --save-dev detox jest

# For iOS testing
npm install --save-dev detox-cli

# For Android testing (if needed)
npm install --save-dev detox-android-cli
```

### Project Configuration

#### 1. Package.json Scripts
```json
{
  "scripts": {
    "test:e2e:build:ios": "detox build --configuration ios.sim.debug",
    "test:e2e:test:ios": "detox test --configuration ios.sim.debug",
    "test:e2e:build:android": "detox build --configuration android.emu.debug", 
    "test:e2e:test:android": "detox test --configuration android.emu.debug",
    "test:e2e:ci": "detox test --configuration ios.sim.release --cleanup"
  }
}
```

#### 2. Detox Configuration (.detoxrc.json)
```json
{
  "testRunner": {
    "args": {
      "config": "e2e/jest.config.js",
      "maxWorkers": 1
    }
  },
  "apps": {
    "ios.debug": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/Juno.app"
    },
    "ios.release": {
      "type": "ios.app", 
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/Juno.app"
    },
    "android.debug": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk"
    },
    "android.release": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/release/app-release.apk"
    }
  },
  "devices": {
    "simulator": {
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 15"
      }
    },
    "emulator": {
      "type": "android.emulator",
      "device": {
        "avdName": "Pixel_API_31"
      }
    }
  },
  "configurations": {
    "ios.sim.debug": {
      "device": "simulator",
      "app": "ios.debug"
    },
    "ios.sim.release": {
      "device": "simulator", 
      "app": "ios.release"
    },
    "android.emu.debug": {
      "device": "emulator",
      "app": "android.debug"
    },
    "android.emu.release": {
      "device": "emulator",
      "app": "android.release"
    }
  }
}
```

#### 3. Jest Configuration (e2e/jest.config.js)
```javascript
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'detox/runners/jest/reporter',
    ['jest-html-reporters', {
      publicPath: './e2e/reports',
      filename: 'test-report.html'
    }]
  ],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/e2e/setup.js']
};
```

### Expo Specific Setup

Since Juno uses Expo managed workflow, additional steps are required:

```bash
# Generate native code
npx expo prebuild --clean

# For iOS builds
npx expo run:ios --configuration Release --device simulator

# For Android builds  
npx expo run:android --variant release
```

### Test Structure

```
e2e/
├── jest.config.js
├── setup.js
├── utils/
│   ├── helpers.js
│   ├── auth.js
│   └── navigation.js
├── specs/
│   ├── auth/
│   │   ├── login.test.js
│   │   └── biometric.test.js
│   ├── dashboard/
│   │   ├── balance.test.js
│   │   └── transactions.test.js
│   ├── chat/
│   │   ├── ai-interaction.test.js
│   │   └── voice-features.test.js
│   └── payments/
│       ├── crypto-transactions.test.js
│       ├── fiat-payments.test.js
│       └── withdrawals.test.js
└── reports/
```

### Test Examples

#### 1. Authentication Test
```javascript
// e2e/specs/auth/login.test.js
describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should login with valid credentials', async () => {
    // Navigate to login screen
    await expect(element(by.id('login-screen'))).toBeVisible();
    
    // Enter credentials
    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('password-input')).typeText('password123');
    
    // Tap login button
    await element(by.id('login-button')).tap();
    
    // Verify successful login
    await expect(element(by.id('dashboard-screen'))).toBeVisible();
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('email-input')).typeText('invalid@example.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-button')).tap();
    
    await expect(element(by.text('Invalid credentials'))).toBeVisible();
  });
});
```

#### 2. Chat Interaction Test
```javascript
// e2e/specs/chat/ai-interaction.test.js
describe('AI Chat Functionality', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Login helper
    await loginUser('user@example.com', 'password123');
  });

  it('should send message and receive AI response', async () => {
    // Navigate to chat
    await element(by.id('chat-tab')).tap();
    await expect(element(by.id('chat-screen'))).toBeVisible();
    
    // Send message
    await element(by.id('chat-input')).typeText('What is my balance?');
    await element(by.id('send-button')).tap();
    
    // Verify message sent
    await expect(element(by.text('What is my balance?'))).toBeVisible();
    
    // Wait for AI response
    await waitFor(element(by.id('ai-response')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
```

#### 3. Transaction Flow Test
```javascript
// e2e/specs/payments/crypto-transactions.test.js
describe('Crypto Transaction Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    await loginUser('user@example.com', 'password123');
  });

  it('should complete crypto buy transaction', async () => {
    // Navigate to buy crypto
    await element(by.id('buy-crypto-button')).tap();
    
    // Select cryptocurrency
    await element(by.id('crypto-selector')).tap();
    await element(by.text('Bitcoin')).tap();
    
    // Enter amount
    await element(by.id('amount-input')).typeText('100');
    
    // Confirm transaction
    await element(by.id('confirm-button')).tap();
    
    // Verify confirmation screen
    await expect(element(by.id('transaction-success'))).toBeVisible();
  });
});
```

### Utility Functions

#### Setup File (e2e/setup.js)
```javascript
const detox = require('detox');

beforeAll(async () => {
  await detox.init();
});

afterAll(async () => {
  await detox.cleanup();
});

beforeEach(async () => {
  await device.reloadReactNative();
});
```

#### Helper Functions (e2e/utils/helpers.js)
```javascript
// Authentication helper
export const loginUser = async (email, password) => {
  await element(by.id('email-input')).typeText(email);
  await element(by.id('password-input')).typeText(password);
  await element(by.id('login-button')).tap();
  await expect(element(by.id('dashboard-screen'))).toBeVisible();
};

// Navigation helper
export const navigateToScreen = async (screenId) => {
  await element(by.id(screenId)).tap();
  await expect(element(by.id(`${screenId}-content`))).toBeVisible();
};

// Wait for element
export const waitForElement = async (elementId, timeout = 10000) => {
  await waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(timeout);
};
```

## Critical Test Scenarios for Juno App

### 1. **Authentication & Security**
- Login with email/password
- Biometric authentication
- Session timeout handling
- Logout functionality
- Invalid credential handling

### 2. **Dashboard & Balance**
- Display account balances
- Refresh balance data
- Portfolio overview
- Transaction history loading

### 3. **AI Chat Features**
- Send text messages
- Receive AI responses
- Voice message recording
- Text-to-speech playback
- Transaction intent parsing
- Quotation bubble interactions

### 4. **Crypto Transactions**
- Buy cryptocurrency flow
- Sell cryptocurrency flow
- Exchange between cryptos
- Transaction confirmation
- Transaction history

### 5. **Fiat Operations**  
- Deposit fiat currency
- Withdraw to bank account
- Transfer between accounts
- Payment processing
- Saved recipient management

### 6. **Statement Management**
- Generate PDF statements
- Download statements
- Statement history viewing

### 7. **Settings & Profile**
- Theme switching (light/dark)
- Notification preferences
- Security settings
- Profile information update

## CI/CD Integration

### GitHub Actions Configuration
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  ios-e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Prebuild Expo app
        run: npx expo prebuild --clean
        
      - name: Build iOS app
        run: npm run test:e2e:build:ios
        
      - name: Run iOS E2E tests
        run: npm run test:e2e:test:ios
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: e2e-test-results-ios
          path: e2e/reports/

  android-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Setup Android SDK
        uses: android-actions/setup-android@v2
        
      - name: Create AVD
        run: |
          $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "system-images;android-31;google_apis;x86_64"
          $ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd -n Pixel_API_31 -k "system-images;android-31;google_apis;x86_64"
          
      - name: Install dependencies
        run: npm ci
        
      - name: Prebuild Expo app
        run: npx expo prebuild --clean
        
      - name: Build Android app
        run: npm run test:e2e:build:android
        
      - name: Run Android E2E tests
        run: npm run test:e2e:test:android
```

### EAS Build Integration
```json
// eas.json
{
  "build": {
    "test": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug :app:assembleAndroidTest"
      },
      "ios": {
        "simulator": true
      }
    }
  }
}
```

## Best Practices

### 1. **Test Organization**
- Group tests by feature/screen
- Use descriptive test names
- Keep tests focused and atomic
- Avoid test interdependencies

### 2. **Element Selection**
- Use testID props for reliable element selection
- Avoid text-based selectors that may change
- Use accessibility labels as fallbacks

### 3. **Test Data Management**
- Use mock data for consistent testing
- Reset app state between tests
- Handle network requests appropriately

### 4. **Error Handling**
- Add proper timeouts for async operations
- Handle flaky tests with retries
- Implement proper cleanup in teardown

### 5. **Performance**
- Run tests in parallel where possible
- Use device.reloadReactNative() judiciously
- Optimize test execution time

## Maintenance and Debugging

### Common Issues
1. **Element not found**: Check testID props and timing
2. **Flaky tests**: Add proper waits and error handling
3. **Build failures**: Ensure native dependencies are properly configured
4. **Slow tests**: Optimize element selection and reduce unnecessary operations

### Debugging Tools
- Detox Element Inspector
- Device logs and screenshots
- Test artifacts and reports
- Metro bundler logs

### Monitoring
- Track test execution time
- Monitor test success rates
- Set up alerts for failing tests
- Regular test suite maintenance

## Implementation Timeline

### Phase 1 (Week 1-2): Foundation
- [ ] Install and configure Detox
- [ ] Set up basic test structure
- [ ] Create utility functions
- [ ] Implement authentication tests

### Phase 2 (Week 3-4): Core Features  
- [ ] Dashboard and balance tests
- [ ] Transaction flow tests
- [ ] Chat functionality tests
- [ ] Error handling tests

### Phase 3 (Week 5-6): Advanced Features
- [ ] Voice and TTS tests
- [ ] Statement generation tests
- [ ] Settings and profile tests
- [ ] Edge case scenarios

### Phase 4 (Week 7-8): CI/CD & Optimization
- [ ] GitHub Actions integration
- [ ] EAS Build configuration
- [ ] Performance optimization
- [ ] Documentation and training

## Next Steps

1. **Evaluate and choose framework** (Detox recommended)
2. **Set up development environment** with required tools
3. **Implement basic test structure** and authentication flows
4. **Gradually expand test coverage** for critical user journeys
5. **Integrate with CI/CD pipeline** for automated testing
6. **Establish maintenance procedures** and monitoring

This guide provides a comprehensive foundation for implementing robust E2E testing in the Juno mobile application, ensuring quality and reliability across all user interactions.