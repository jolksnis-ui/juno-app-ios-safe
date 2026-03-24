# Juno Money - React Native Crypto/Fiat Transaction App

A React Native mobile application for cryptocurrency and fiat currency transactions, built with Expo and TypeScript.

## 🚀 Features

### ✅ Completed
- **Login Screen**: Beautiful, responsive login interface matching the provided design
  - Email/password authentication
  - Form validation with error handling
  - "Remember me" checkbox functionality
  - Password visibility toggle
  - Forgot password link
  - Sign up navigation
- **Dashboard Screen**: Clean dashboard with crypto/fiat transaction cards
  - Welcome message with user email
  - Wallet management card
  - Transaction history card
  - Trading functionality card
  - Profile settings card
  - Logout functionality

### 🔄 In Progress
- Additional screens (will be added step by step as requested)

## 🛠 Tech Stack

- **Framework**: React Native with Expo (managed workflow)
- **Language**: TypeScript
- **Form Handling**: React Hook Form with Yup validation
- **Icons**: Expo Vector Icons
- **Navigation**: React Navigation (ready to implement)
- **State Management**: React useState (Redux Toolkit ready for complex state)

## 📱 Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
│   ├── LoginScreen.tsx    # Login interface
│   └── DashboardScreen.tsx # Main dashboard
├── navigation/         # Navigation configuration (ready)
├── types/             # TypeScript type definitions
│   └── auth.ts           # Authentication types
├── utils/             # Helper functions (ready)
└── constants/         # App constants (ready)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or 20.x (LTS)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS testing) or Android Studio (for Android testing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bigpicture-cryptonyte/cp-juno-mobile-app.git
cd cp-juno-mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Run on your preferred platform:
   - **iOS Simulator**: Press `i` in the terminal
   - **Android Emulator**: Press `a` in the terminal
   - **Physical Device**: Scan the QR code with Expo Go app
   - **Web Browser**: Press `w` in the terminal

## 📱 How to Use

### Login Screen
1. Enter your email address
2. Enter your password (minimum 6 characters)
3. Optionally check "Remember for 30 days"
4. Tap "Log in" to authenticate
5. Use "Forgot password" for password recovery
6. Use "Sign up" to create a new account

### Dashboard Screen
- View welcome message with your email
- Access different sections via cards:
  - **Wallet**: Manage crypto & fiat currencies
  - **Transactions**: View transaction history
  - **Trading**: Buy & sell cryptocurrencies
  - **Profile**: Account settings
- Tap logout icon to sign out

## 🔧 Development

### Testing Login
For testing purposes, you can use any email and password combination (minimum 6 characters). The app will simulate successful authentication and navigate to the dashboard.

### Form Validation
- Email must be in valid email format
- Password must be at least 6 characters
- Real-time validation with error messages
- Form submission disabled during loading

## 🎨 Design Features

- **Modal-style login**: Matches the provided design exactly
- **Responsive layout**: Works on different screen sizes
- **Clean typography**: Professional and readable fonts
- **Consistent branding**: Juno Money branding throughout
- **Smooth interactions**: Loading states and animations
- **iOS-focused**: Optimized for iOS platform initially

## 🔮 Next Steps

The app is ready for the next phase of development. You can now:

1. **Add more screens** as needed (provide designs/requirements)
2. **Implement real authentication** with your backend API
3. **Add navigation** between screens
4. **Integrate crypto APIs** for real-time data
5. **Add payment processing** for fiat transactions
6. **Implement push notifications**
7. **Add biometric authentication**

## 📝 Notes

- The app uses TypeScript for better code quality and development experience
- Form validation is implemented with Yup schema validation
- The project structure is scalable and follows React Native best practices
- All components are properly typed for better maintainability

## 🤝 Contributing

This is a step-by-step development project. Each new feature will be implemented based on provided designs and requirements.

---

**Ready for the next screen implementation!** 🚀
