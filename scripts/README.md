# JIRA Workflow for Mobile App Development

This directory contains scripts to integrate JIRA ticket management with the development workflow.

## Setup

1. **Configure JIRA credentials**:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your JIRA credentials:
   - `JIRA_HOST`: Your Atlassian domain (e.g., yourcompany.atlassian.net)
   - `JIRA_EMAIL`: Your Atlassian email
   - `JIRA_API_TOKEN`: Generate at https://id.atlassian.com/manage-profile/security/api-tokens

2. **Test the connection**:
   ```bash
   node scripts/jira-workflow.js fetch JUNO-123
   ```

## Usage

### Fetch Ticket Details
```bash
node scripts/jira-workflow.js fetch JUNO-123
```
- Fetches and displays ticket information
- Shows list of attachments if present
- Saves details to `scratchpads/JUNO-123-details.json`

### Fetch with Attachments
```bash
node scripts/jira-workflow.js fetch JUNO-123 --download
```
- Downloads all attachments (mockups, designs, screenshots)
- Saves them to `scratchpads/JUNO-123-attachments/`
- Claude Code can read these images to understand UI requirements

### Add Comment to Ticket
```bash
node scripts/jira-workflow.js comment JUNO-123 "Started implementation"
```

### Change Ticket Status
```bash
node scripts/jira-workflow.js transition JUNO-123 "In Progress"
```

### List Available Transitions
```bash
node scripts/jira-workflow.js transitions JUNO-123
```

## Development Workflow with Claude Code

When Claude Code works on a JIRA ticket, it will:

1. **Fetch the ticket** to understand requirements
2. **Analyze the codebase** for similar patterns
3. **Create a plan** in `scratchpads/JUNO-XXX-plan.md`
4. **Use TodoWrite** to track implementation progress
5. **Create a feature branch** for the work
6. **Implement the solution** following established patterns
7. **Run TypeScript checks** after changes
8. **Update the JIRA ticket** with progress

## Files Generated

- `scratchpads/JUNO-XXX-details.json` - Ticket information
- `scratchpads/JUNO-XXX-plan.md` - Implementation plan
- `scratchpads/JUNO-XXX-testing.md` - Testing instructions

These files are gitignored and only used during development.