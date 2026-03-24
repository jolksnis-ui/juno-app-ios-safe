# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
- **Start dev server**: `npm start` or `expo start`
- **iOS development**: `npm run dev:ios` (rebuilds and runs on iOS)
- **Android development**: `npm run dev:android` (rebuilds and runs on Android)
- **iOS simulator**: `npm run ios` or `expo run:ios`
- **Android emulator**: `npm run android` or `expo run:android`
- **Web**: `npm run web` or `expo start --web`

### Build Commands
- **Development build**: `npm run build:development`
- **Preview build**: `npm run build:preview`
- **Production build**: `npm run build:production`
- **iOS only**: `npm run build:ios`
- **Android only**: `npm run build:android`

### Deployment
- **Submit iOS**: `npm run submit:ios`
- **Submit Android**: `npm run submit:android`
- **Submit production**: `npm run submit:production`

## Architecture

### Technology Stack
- **Framework**: React Native with Expo (SDK ~53.0)
- **Language**: TypeScript with strict mode
- **Navigation**: Expo Router with file-based routing
- **Form Handling**: React Hook Form with Yup validation
- **State Management**: React Context (AuthContext, ThemeContext, ChatContext, NotificationContext)
- **Storage**: Expo SecureStore for sensitive data
- **Icons**: Expo Vector Icons
- **Theming**: Custom theme system with light/dark mode support

### Project Structure
```
src/
├── components/         # Reusable UI components
├── contexts/          # React Context providers
├── hooks/             # Custom hooks
├── screens/           # Screen components (legacy structure)
├── services/          # API services and business logic
├── types/            # TypeScript type definitions
└── utils/            # Helper functions and utilities

app/                   # Expo Router file-based routing
├── (auth)/           # Protected routes requiring authentication
├── (public)/         # Public routes (login, etc.)
├── _layout.tsx       # Root layout with providers
└── index.tsx         # App entry point
```

### Key Architectural Patterns

#### Context Architecture
The app uses a layered context provider structure in `app/_layout.tsx`:
```
ThemeProvider → AuthProvider → NotificationProvider → ChatProvider → ThemedStack
```

#### Authentication Flow
- Uses secure token-based authentication via `AuthContext`
- Token stored in Expo SecureStore
- Automatic session restoration on app startup
- Centralized auth error handling with `TokenExpiredError`

#### API Layer
- Centralized `APIClient` class in `src/utils/apiClient.ts`
- Base URL: `https://dev.junomoney.org/restapi`
- Automatic token injection for authenticated requests
- Built-in error handling for 401/403 responses
- **CRITICAL**: Always follow the established APIClient pattern for new API integrations

#### Navigation Structure
- Public routes: `(public)` group for unauthenticated users
- Protected routes: `(auth)` group for authenticated users
- Automatic redirect logic based on authentication state
- Stack navigation with custom header styling

#### Theme System
- Context-based theming with `ThemeContext`
- Supports light, dark, and system modes
- Theme preferences stored in SecureStore
- Automatic StatusBar styling based on theme

#### Chat/AI Integration
- Dual AI backend: Claude 3.5 Sonnet with mock service fallback
- Context-aware responses using real user financial data
- Secure conversation history storage
- Action buttons for navigation integration

### Service Layer Organization

#### Authentication Services
- `authService.ts`: Login/logout functionality
- `secureStorage.ts`: Encrypted data storage utilities
- `biometricService.ts`: Local authentication integration

#### Financial Services
- `balanceService.ts`: Fiat and crypto balance management
- `transactionService.ts`: Transaction history and management
- `cryptoPriceService.ts`: Real-time cryptocurrency pricing
- `exchangeService.ts`: Crypto-to-crypto exchanges
- `paymentService.ts`: Fiat payment processing

#### AI/Chat Services
- `chatService.ts`: Main chat service with Claude API integration
- `claudeAPI.ts`: Claude API client and utilities
- `mockChatService.ts`: Fallback service with intelligent responses
- `elevenLabsService.ts`: Voice synthesis integration

### TypeScript Configuration
- Strict mode enabled
- Path aliases: `@/*` maps to `./src/*`
- Extends Expo's base TypeScript configuration
- Custom type definitions in `src/types/`

### Security Considerations
- All sensitive data stored in Expo SecureStore
- No hardcoded API keys or credentials
- Token-based authentication with automatic refresh
- Environment variables for configuration
- Input validation using Yup schemas

### Development Workflow
1. Use TypeScript strict mode for all new code
2. Follow the existing context pattern for state management
3. Use the centralized `APIClient` for all API calls
4. Implement proper error handling with user feedback
5. Follow the established file structure and naming conventions
6. Use path aliases (`@/`) for imports from `src/`
7. **IMPORTANT**: After completing any code changes, always run `npx tsc --noEmit` to check for TypeScript compilation errors and fix them before finishing

### API Integration Pattern (IMPORTANT)
**ALWAYS follow this established pattern for new API endpoints:**

```typescript
// Standard JSON API calls - use APIClient
export const yourAPIFunction = async (params): Promise<ResponseType> => {
  try {
    const response = await APIClient.post<ResponseType>('/your-endpoint', {
      // request body
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to call API:', error);
    throw error;
  }
};

// Special cases (blob responses, etc.) - follow APIClient authentication pattern
export const specialAPIFunction = async (params): Promise<void> => {
  try {
    // 1. Get authentication data (exactly like APIClient)
    const { getUserData, getToken } = await import('./secureStorage');
    const userData = await getUserData();
    const token = await getToken();
    
    if (!userData || !token) {
      const { clearAuthData } = await import('./secureStorage');
      await clearAuthData();
      throw new TokenExpiredError('Authentication required. Please login again.');
    }

    // 2. Clear cookies (exactly like APIClient)
    if (typeof document !== 'undefined') {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }

    // 3. Make fetch request (same headers as APIClient)
    const response = await fetch('https://dev.junomoney.org/restapi/your-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-interface-type': 'web',
      },
      body: JSON.stringify(requestBody),
    });

    // 4. Handle auth errors (exactly like APIClient)
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

    // 5. Handle other errors (exactly like APIClient)
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    // 6. Handle response (blob, text, etc.)
    // Your specific response handling here
  } catch (error) {
    console.error('Failed to call special API:', error);
    throw error;
  }
};
```

**Key Rules:**
- Use `APIClient.post/get/put/delete` for standard JSON APIs
- For special response types (blob, etc.), manually implement the EXACT same authentication pattern
- Never create custom authentication mechanisms
- Always use `TokenExpiredError` for auth failures
- Follow the same error handling and cookie clearing pattern
- Use the same headers: `Content-Type: application/json` and `x-interface-type: web`

### Environment Variables
Configuration through `.env` file:
- `EXPO_PUBLIC_CLAUDE_API_KEY`: Claude API integration (optional)
- `EXPO_PUBLIC_CLAUDE_MODEL`: AI model selection
- `EXPO_PUBLIC_CLAUDE_MAX_TOKENS`: Response length limit

### Platform-Specific Notes
- iOS bundle identifier: `com.bigpicture.juno`
- Android package: `com.bigpicture.juno`
- Requires camera and microphone permissions
- Push notification support configured
- Biometric authentication available on supported devices

<!-- ## JIRA Ticket Development Workflow (Claude Code Optimized)

When working on a JIRA ticket, follow this production-ready workflow optimized for Claude Code to ensure consistent, high-quality implementation.

### Phase 0: CONTEXT BOOTSTRAPPING (Pre-Work)
Before diving into implementation:
1. **Validate ticket readiness**:
   - Ensure clear acceptance criteria and definition of done
   - Verify mockups/designs are attached (for UI tickets)
   - Check dependencies and blockers
2. **Fetch and prepare**:
   ```bash
   # Fetch ticket with attachments
   node scripts/jira-workflow.js fetch JUNO-XXX --download
   
   # Auto-create feature branch
   git checkout -b feature/JUNO-XXX-short-description
   ```
3. **Initial AI planning** - Claude Code will:
   - Propose initial subtasks based on ticket requirements
   - Identify potential risks and edge cases
   - Suggest testing scenarios

### Phase 1: UNDERSTAND & ANALYZE
1. **Fetch ticket details** using the jira-workflow script
   - Review description, acceptance criteria, and DoD
   - Check attachments (mockups, designs, screenshots)
   - Claude Code can read downloaded images to understand UI requirements
2. **Automated codebase analysis** using Claude Code tools:
   ```bash
   # Use Claude Code's powerful search capabilities instead of manual grep
   # Examples:
   # - Grep tool: Find all payment-related functions
   # - Glob tool: Locate all form components
   # - Task tool: Complex multi-step analysis for related features
   ```
3. **Analyze and document**:
   - Similar features/components for reuse
   - UI patterns and theme conventions
   - API services and endpoints
   - Security requirements and implications
   - Existing components (buttons, forms, modals, etc.)
4. **Decision logging** - Create `scratchpads/JUNO-XXX-decisions.md`:
   - Document architectural decisions and trade-offs
   - Note any deviations from standard patterns
   - Record assumptions made
5. **Generate clarification questions** if requirements are unclear
6. **Use TodoWrite extensively** to track all analysis tasks

### CRITICAL: SCOPE DISCIPLINE
**⚠️ IMPORTANT: STRICTLY FOLLOW TICKET REQUIREMENTS - NO SCOPE CREEP**
1. **Only implement features explicitly mentioned in the ticket**:
   - Do NOT add "nice-to-have" features
   - Do NOT implement features you think would be helpful but aren't requested
   - Do NOT add extra functionality beyond acceptance criteria
2. **If you identify potential improvements**:
   - Document them in `scratchpads/JUNO-XXX-suggestions.md`
   - Suggest creating follow-up tickets
   - NEVER implement them in the current ticket
3. **Before implementing ANY feature, verify**:
   - Is it explicitly mentioned in the ticket description?
   - Is it part of the acceptance criteria?
   - Is it shown in the mockups/designs?
   - If NO to all above → DON'T IMPLEMENT IT

### Phase 2: PLAN & DESIGN
1. **Create Work Breakdown Structure** in `scratchpads/JUNO-XXX-plan.md`:
   ```markdown
   | Task | Priority | Estimate | Dependencies | Acceptance Criteria |
   |------|----------|----------|--------------|---------------------|
   | Create user form | P0 | 2h | None | Form validates input |
   | Add API endpoint | P0 | 1h | Form | Returns user data |
   | Add tests | P1 | 1h | API | 100% coverage |
   ```
2. **Document technical approach** including:
   - Components to create/modify
   - API endpoints and data flow
   - State management strategy
   - Security considerations
   - **Observability hooks** (logging, metrics, error tracking)
   - Feature flag requirements (for risky features)
   - Testing scenarios for QA
3. **Architecture considerations**:
   - Reuse existing components from `src/components/`
   - Follow theme patterns from `ThemeContext`
   - Use established `APIClient` patterns
   - Implement proper TypeScript types in `src/types/`
   - Plan for error states and loading states
4. **Create comprehensive TodoWrite items** for each task
5. **Auto-create JIRA subtasks** (if applicable):
   ```bash
   # Future enhancement: auto-create subtasks from TodoWrite
   node scripts/jira-workflow.js create-subtasks JUNO-XXX --from-plan
   ```
6. **Present plan for approval** before implementation

### Phase 3: IMPLEMENT
1. **Setup and initial checks**:
   ```bash
   # Ensure clean working directory
   git status
   
   # Update dependencies if needed
   npm install
   ```
2. **Implement systematically**:
   - **CRITICAL**: Cross-reference EVERY feature against the original ticket before implementing
   - Only implement features that are EXPLICITLY requested in the ticket
   - Work through TodoWrite items one at a time
   - Mark tasks as `in_progress` before starting
   - Follow existing code patterns religiously
   - Use TypeScript strict mode for all code
   - Implement feature flags for risky features:
     ```typescript
     if (featureFlags.enableNewFeature) {
       // New implementation
     }
     ```
3. **Progressive commits**:
   ```bash
   # Commit early and often with descriptive messages
   git add .
   git commit -m "feat(JUNO-XXX): implement user authentication flow"
   ```
4. **Create draft PR early** (for complex features):
   - Get early feedback on approach
   - Avoid "big bang" reviews
   - Mark as ready when complete

### Phase 4: TEST & VALIDATE
1. **Self-review checklist** before marking complete:
   - [ ] TypeScript compilation passes (`npx tsc --noEmit`)
   - [ ] Unit tests updated and passing
   - [ ] Manual testing completed
   - [ ] Edge cases handled
   - [ ] Error states implemented
   - [ ] Loading states implemented
   - [ ] Accessibility considered
2. **Document testing** in `scratchpads/JUNO-XXX-testing.md`:
   ```markdown
   ## Test Scenarios
   1. Happy path: [steps]
   2. Error handling: [steps]
   3. Edge cases: [steps]
   
   ## Manual QA Steps
   - [ ] Test on iOS simulator
   - [ ] Test on Android emulator
   - [ ] Test with slow network
   - [ ] Test with no network
   ```
3. **Update JIRA with implementation status**:
   ```bash
   node scripts/jira-workflow.js comment JUNO-XXX "Implementation complete. 
   - All acceptance criteria met
   - TypeScript/Lint checks passing
   - Manual testing completed
   - Ready for code peer review"
   
   node scripts/jira-workflow.js transition JUNO-XXX "Dev Testing"
   ```

### Phase 4.1: CODE PEER REVIEW (Claude Code)
**IMPORTANT: Execute internal code review BEFORE committing to ensure production quality**

1. **Automated Code Review** - Claude Code performs:
   ```bash
   # Run comprehensive code analysis
   npx tsc --noEmit           # TypeScript checks
   npm run lint               # Code style
   npm audit                  # Security vulnerabilities
   ```

2. **Code Quality Review** - Generate focused review in `scratchpads/JUNO-XXX-code-review.md`:
   ```markdown
   # Code Review for JUNO-XXX
   
   ## Security Issues
   - [Specific security concerns found, if any]
   
   ## Performance Issues  
   - [Specific performance concerns found, if any]
   
   ## Code Quality Issues
   - [Specific code quality issues found, if any]
   
   ## Architecture Violations
   - [Deviations from established patterns, if any]
   
   ## Recommendations
   - [Specific actionable fixes]
   
   ## Review Status: APPROVED/NEEDS_FIXES
   ```

3. **Review Criteria** - Claude Code checks:
   - **Security**: No hardcoded secrets, proper input validation, auth patterns followed
   - **Performance**: No obvious performance bottlenecks, efficient API usage
   - **Architecture**: Follows established patterns (APIClient, theme, navigation)
   - **Error Handling**: Proper try-catch blocks, user-friendly error messages
   - **TypeScript**: Strict mode compliance, proper typing
   - **Code Style**: Consistent with existing codebase
   - **API Integration**: Follows established APIClient authentication patterns

4. **Review Outcomes**:
   - **APPROVED**: Proceed to commit and PR creation
   - **NEEDS_FIXES**: Address issues before proceeding, re-run review

5. **Fix Implementation** (if needed):
   - Address specific issues identified in review
   - Re-run automated checks
   - Update TodoWrite with fix status
   - Re-run code review until approved

### Phase 4.5: E2E TEST SCENARIO GENERATION
**IMPORTANT: Execute this phase AFTER manual verification confirms the implementation works correctly**

1. **Generate comprehensive test scenarios** in `scratchpads/JUNO-XXX-test-scenarios.md`:
   ```markdown
   # E2E Test Scenarios for JUNO-XXX
   
   ## Feature: [Feature Name]
   
   ### Test Case Structure
   | ID | Description | Priority | Preconditions | Steps | Expected Result | Test Data |
   |----|-------------|----------|---------------|-------|-----------------|-----------|
   
   ### Happy Path Scenarios
   - Complete user journey with valid data
   - All acceptance criteria coverage
   - Positive flow validations
   
   ### Unhappy Path Scenarios  
   - Invalid input handling
   - Required field validation
   - Business rule violations
   - Authentication/authorization failures
   
   ### Edge Cases
   - Boundary value testing
   - Special characters handling
   - Maximum/minimum limits
   - Concurrent operations
   - Race conditions
   
   ### Error Scenarios
   - Network failures (offline, timeout, slow)
   - Server errors (500, 503)
   - API validation errors
   - Session expiry during operation
   
   ### Security Test Cases
   - Input sanitization
   - XSS prevention
   - SQL injection prevention
   - Authentication bypasses
   - Authorization checks
   
   ### Performance Scenarios
   - Load time expectations
   - Response time for actions
   - Memory usage patterns
   - Battery consumption
   
   ### Platform-Specific Cases
   - iOS specific behaviors
   - Android specific behaviors
   - Different screen sizes
   - Device orientation changes
   ```

2. **Test scenario generation guidelines**:
   - **Map to acceptance criteria**: Every AC must have corresponding test cases
   - **Use Gherkin format** for clarity:
     ```gherkin
     Given [precondition]
     When [action]
     Then [expected result]
     ```
   - **Include test data**: Specify exact values for reproducibility
   - **Priority levels**:
     - P0: Critical path, blocks release
     - P1: Important functionality
     - P2: Nice to have, edge cases
   - **Automation readiness**: Note which scenarios are ready for E2E automation

3. **Integration with E2E frameworks**:
   - Structure scenarios for easy conversion to:
     - Detox test cases (React Native standard)
     - Maestro YAML flows (simple syntax)
     - Appium scripts (cross-platform)
   - Include element identifiers (testID) where applicable
   - Note any special setup/teardown requirements

4. **Update JIRA with test scenarios**:
   ```bash
   node scripts/jira-workflow.js comment JUNO-XXX "E2E test scenarios generated:
   - [X] happy path scenarios
   - [X] unhappy path scenarios  
   - [X] edge cases
   - [X] error handling cases
   - Test scenarios document: scratchpads/JUNO-XXX-test-scenarios.md"
   ```

5. **Handoff to QA/Automation**:
   - Ensure scenarios are clear and unambiguous
   - Include any discovered bugs or limitations
   - Note areas requiring special attention
   - Provide sample test data sets

### Phase 5: REVIEW & DELIVERY
1. **Create concise PR** with specific template:
   ```markdown
   ## JIRA: [JUNO-XXX](link)
   
   ## Changes
   - [Specific change 1]
   - [Specific change 2]
   - [Breaking change, if any]
   
   ## Files
   - `path/file.ts` - [specific purpose]
   - `path/file.tsx` - [specific purpose]
   
   ## Testing
   - [X] Manual testing completed
   - [X] TypeScript compilation passes
   - [X] Code review approved
   
   ## Security/Performance
   - [Specific security consideration, if any]
   - [Performance impact, if any]
   ```
2. **Post-merge automation**:
   ```bash
   # Auto-transition JIRA on merge
   node scripts/jira-workflow.js transition JUNO-XXX "Done"
   
   # Update changelog
   npm run generate-changelog
   ```
3. **Hotfix workflow** (if needed):
   ```bash
   git checkout -b hotfix/JUNO-XXX-description
   # Follow expedited review process
   ``` -->

### Sub-Agent Prompts
Quick prompts for triggering specialized agents:

**Task-Planner Agent:**
```
Analyze JUNO-XXXX and create implementation plan for [feature description]
```

**Mobile-App-Developer Agent:**
```
Implement JUNO-XXXX [feature] following the plan in scratchpads/JUNO-XXXX-plan.md
```

**Code-Reviewer Agent:**
```
Review JUNO-XXXX implementation for mobile best practices, security, and code quality
```

**General-Purpose Agent:**
```
Search codebase for [specific pattern/functionality] to understand current implementation approach
```

### Enhanced Claude Code Commands
```bash
# JIRA Integration
node scripts/jira-workflow.js fetch JUNO-123 --download
node scripts/jira-workflow.js comment JUNO-123 "message"
node scripts/jira-workflow.js transition JUNO-123 "status"
node scripts/jira-workflow.js transitions JUNO-123

# Quality Checks (run these frequently)
npx tsc --noEmit           # TypeScript compilation
npm run lint               # Code style
npm audit                  # Security vulnerabilities
npm test                   # Unit tests

# Development
npm start                  # Start dev server
npm run dev:ios           # iOS development
npm run dev:android       # Android development
```

### Claude Code-Specific Best Practices
1. **Scope Discipline**:
   - **NEVER add features not explicitly mentioned in the JIRA ticket**
   - Resist the temptation to add "improvements" or "nice-to-haves"
   - If you think of additional features, document them for follow-up tickets
   - Always verify features against acceptance criteria before implementing
2. **Leverage Claude Code's tools**:
   - Use `Grep` for pattern searching instead of manual grep
   - Use `Glob` for file discovery
   - Use `Task` for complex multi-step analysis
   - Use parallel tool execution for faster analysis
3. **TodoWrite is critical**:
   - Create todos BEFORE starting work
   - Update status in real-time
   - Mark completed immediately after finishing
   - One task `in_progress` at a time
3. **Automated analysis**:
   - Let Claude Code search for similar implementations
   - Use Claude Code to identify potential issues
   - Leverage AI for test scenario generation
4. **Documentation discipline**:
   - Decision logs for architectural choices
   - Testing documentation for QA
   - Plan documentation for complex features
5. **Security-first mindset**:
   - Run `npm audit` regularly
   - Never commit secrets or API keys
   - Follow established auth patterns
   - Implement proper input validation
6. **Feature flags for safety**:
   - Use for risky or experimental features
   - Allows quick rollback if issues arise
   - Enables gradual rollout

### Common Patterns Reference
- **New Screen**: `app/(auth)/` or `app/(public)/` examples
- **New Component**: `src/components/` patterns
- **API Integration**: `APIClient` from `src/utils/apiClient.ts`
- **State Management**: Contexts from `src/contexts/`
- **Form Handling**: React Hook Form + Yup validation
- **Error Handling**: Toast notifications with user-friendly messages
- **TypeScript Types**: `src/types/` following existing patterns
- **Security**: Expo SecureStore for sensitive data
- **UI Form Patterns**: 
  - ❌ **NEVER use login/signup forms as UI reference** - these use FloatingLabelInput and dark theme patterns
  - ✅ **Use transaction forms as UI reference** - withdrawal, payment, transfer forms use proper patterns:
    - Standard `TextInput` components with `inputGroup` styling 
    - Theme-aware colors from `useTheme` hook
    - `inputLabel` + `textInput` + `errorText` pattern
    - `Switch` components for toggles (not dropdowns)
    - Proper validation with inline error display
  - **Recommended reference forms**: `withdraw-fiat.tsx`, `payment-out.tsx`, `transfer-fiat.tsx`

### Workflow Quality Gates Summary
| Phase | Quality Checks | Tools |
|-------|---------------|-------|
| Pre-Work | Ticket validation | JIRA script |
| Analyze | Code search & patterns | Grep, Glob, Task |
| Plan | Architecture review | TodoWrite, Markdown |
| Implement | TypeScript, Lint | tsc, eslint |
| Test | Security, Manual QA | npm audit, simulators |
| **Code Review** | **Security, Performance, Architecture** | **Claude Code Analysis** |
| Test Scenarios | E2E coverage, All paths | Claude Code, Markdown |
| Deliver | Concise PR, Automation | GitHub, JIRA script |