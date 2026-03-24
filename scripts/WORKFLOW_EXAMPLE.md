# JIRA Workflow Example with Claude Code

## Example Workflow: Working on a UI Feature Ticket

### Scenario
You have a JIRA ticket JUNO-456 that asks you to implement a new "Quick Actions" menu for the dashboard with attached mockup designs.

### How Claude Code Works with This:

#### 1. User Request
```
User: "Please work on JIRA ticket JUNO-456"
```

#### 2. Claude Code's Process

**Step 1: Fetch Ticket**
```bash
node scripts/jira-workflow.js fetch JUNO-456 --download
```

Claude reads:
- Ticket summary: "Add Quick Actions menu to dashboard"
- Description with requirements
- Attachments: `quick-actions-mockup.png`, `interaction-flow.pdf`
- Downloads attachments to `scratchpads/JUNO-456-attachments/`

**Step 2: Analyze Attachments**
Claude uses the Read tool to view the mockup:
```
Read: scratchpads/JUNO-456-attachments/quick-actions-mockup.png
```
Claude can now see the visual design and understand:
- Button placement
- Color scheme
- Icons to use
- Layout requirements

**Step 3: Analyze Codebase**
Claude searches for similar components:
```
Grep: "ActionButton" 
Grep: "QuickAction"
Read: src/components/FloatingActionButtons.tsx
Read: src/contexts/ThemeContext.tsx
```

**Step 4: Create Plan**
Claude creates `scratchpads/JUNO-456-plan.md`:
```markdown
# JUNO-456: Quick Actions Menu Implementation

## Requirements (from ticket)
- Floating action button in bottom right
- Expands to show 4 quick actions
- Actions: Send Money, Request, Scan QR, Settings

## Design Analysis (from mockup)
- Primary color: Theme accent color
- Button size: 56px diameter
- Spacing: 16px between buttons
- Animation: Fade and scale on expand

## Implementation Plan
1. Create QuickActionsMenu component
2. Add to DashboardScreen
3. Integrate with navigation
4. Add haptic feedback
5. Follow existing FloatingActionButtons pattern
```

**Step 5: Use TodoWrite**
```
TodoWrite:
- [ ] Create QuickActionsMenu component
- [ ] Add animations using Expo Reanimated
- [ ] Integrate with DashboardScreen
- [ ] Add navigation handlers
- [ ] Test on iOS simulator
```

**Step 6: Implement**
- Creates branch: `feature/JUNO-456-quick-actions`
- Implements component following the mockup design
- Uses existing theme patterns
- Runs TypeScript checks after each file

**Step 7: Update JIRA**
```bash
node scripts/jira-workflow.js comment JUNO-456 "Implementation complete. Component matches mockup design."
node scripts/jira-workflow.js transition JUNO-456 "Ready for QA"
```

### Key Benefits

1. **Visual Understanding**: Claude can see mockups and understand exact UI requirements
2. **Context Awareness**: Analyzes existing code to maintain consistency
3. **Systematic Approach**: Uses TodoWrite to track all tasks
4. **Design Compliance**: Implements exactly what's shown in attachments
5. **Full Integration**: Updates JIRA ticket throughout the process

### Commands Summary

```bash
# Claude Code automatically runs these as needed:
node scripts/jira-workflow.js fetch JUNO-456 --download  # Get ticket with designs
git checkout -b feature/JUNO-456-quick-actions           # Create branch
npx tsc --noEmit                                        # Check TypeScript
node scripts/jira-workflow.js comment JUNO-456 "..."    # Update ticket
node scripts/jira-workflow.js transition JUNO-456 "..." # Change status
```

This workflow ensures that Claude Code can work with complete context, including visual designs, to implement features that match exactly what's requested in JIRA tickets.