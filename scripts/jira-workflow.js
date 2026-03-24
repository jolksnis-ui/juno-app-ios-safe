#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const JIRA_HOST = process.env.JIRA_HOST;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
    
    const options = {
      hostname: JIRA_HOST,
      path: `/rest/api/3${path}`,
      method: method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function fetchTicket(ticketId) {
  try {
    log(`\nFetching ticket ${ticketId}...`, 'cyan');
    
    const ticket = await makeRequest('GET', `/issue/${ticketId}?expand=names,renderedFields,attachment`);
    
    // Format ticket data for Claude
    const formattedTicket = {
      key: ticket.key,
      summary: ticket.fields.summary,
      description: ticket.fields.description || ticket.renderedFields?.description || 'No description provided',
      status: ticket.fields.status.name,
      priority: ticket.fields.priority?.name || 'Not set',
      assignee: ticket.fields.assignee?.displayName || 'Unassigned',
      reporter: ticket.fields.reporter?.displayName || 'Unknown',
      created: ticket.fields.created,
      updated: ticket.fields.updated,
      issueType: ticket.fields.issuetype.name,
      labels: ticket.fields.labels || [],
      components: (ticket.fields.components || []).map(c => c.name),
      acceptanceCriteria: extractAcceptanceCriteria(ticket),
      attachments: (ticket.fields.attachment || []).map(att => ({
        filename: att.filename,
        size: att.size,
        mimeType: att.mimeType,
        created: att.created,
        author: att.author?.displayName || 'Unknown',
        content: att.content,
        thumbnail: att.thumbnail
      })),
      subtasks: (ticket.fields.subtasks || []).map(st => ({
        key: st.key,
        summary: st.fields.summary,
        status: st.fields.status.name
      }))
    };

    // Output formatted ticket data
    log('\n=== JIRA TICKET DETAILS ===', 'bright');
    log(`\nTicket: ${formattedTicket.key}`, 'green');
    log(`Summary: ${formattedTicket.summary}`, 'green');
    log(`\nStatus: ${formattedTicket.status}`);
    log(`Priority: ${formattedTicket.priority}`);
    log(`Type: ${formattedTicket.issueType}`);
    log(`Assignee: ${formattedTicket.assignee}`);
    log(`Reporter: ${formattedTicket.reporter}`);
    
    if (formattedTicket.labels.length > 0) {
      log(`\nLabels: ${formattedTicket.labels.join(', ')}`);
    }
    
    if (formattedTicket.components.length > 0) {
      log(`Components: ${formattedTicket.components.join(', ')}`);
    }
    
    log('\n--- Description ---', 'yellow');
    console.log(formattedTicket.description);
    
    if (formattedTicket.acceptanceCriteria) {
      log('\n--- Acceptance Criteria ---', 'yellow');
      console.log(formattedTicket.acceptanceCriteria);
    }
    
    if (formattedTicket.subtasks.length > 0) {
      log('\n--- Subtasks ---', 'yellow');
      formattedTicket.subtasks.forEach(st => {
        log(`  • ${st.key}: ${st.summary} [${st.status}]`);
      });
    }
    
    // Handle attachments
    if (formattedTicket.attachments.length > 0) {
      log('\n--- Attachments ---', 'yellow');
      const attachmentsDir = path.join(__dirname, '..', 'scratchpads', `${ticketId}-attachments`);
      
      // Create attachments directory if it doesn't exist
      if (!fs.existsSync(attachmentsDir)) {
        fs.mkdirSync(attachmentsDir, { recursive: true });
      }
      
      for (const attachment of formattedTicket.attachments) {
        const fileSize = formatFileSize(attachment.size);
        log(`  📎 ${attachment.filename} (${fileSize}, ${attachment.mimeType})`);
        log(`     Author: ${attachment.author}, Created: ${new Date(attachment.created).toLocaleDateString()}`);
        
        // Download attachment if requested (add --download flag support later)
        if (process.argv.includes('--download')) {
          await downloadAttachment(attachment.content, attachmentsDir, attachment.filename);
        }
      }
      
      if (!process.argv.includes('--download') && formattedTicket.attachments.length > 0) {
        log(`\n💡 Tip: Use --download flag to download attachments`, 'cyan');
        log(`   Example: node scripts/jira-workflow.js fetch ${ticketId} --download`);
      }
    }
    
    // Save to file for reference
    const outputPath = path.join(__dirname, '..', 'scratchpads', `${ticketId}-details.json`);
    fs.writeFileSync(outputPath, JSON.stringify(formattedTicket, null, 2));
    log(`\n✓ Ticket details saved to: scratchpads/${ticketId}-details.json`, 'green');
    
    return formattedTicket;
  } catch (error) {
    log(`\n✗ Error fetching ticket: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function addComment(ticketId, comment) {
  try {
    log(`\nAdding comment to ${ticketId}...`, 'cyan');
    
    const data = {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: comment
              }
            ]
          }
        ]
      }
    };
    
    await makeRequest('POST', `/issue/${ticketId}/comment`, data);
    log(`✓ Comment added successfully`, 'green');
  } catch (error) {
    log(`✗ Error adding comment: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function transitionTicket(ticketId, transitionName) {
  try {
    log(`\nTransitioning ${ticketId} to ${transitionName}...`, 'cyan');
    
    // First, get available transitions
    const transitions = await makeRequest('GET', `/issue/${ticketId}/transitions`);
    
    const transition = transitions.transitions.find(
      t => t.name.toLowerCase() === transitionName.toLowerCase()
    );
    
    if (!transition) {
      log(`✗ Transition '${transitionName}' not found. Available transitions:`, 'red');
      transitions.transitions.forEach(t => {
        log(`  • ${t.name} (id: ${t.id})`);
      });
      process.exit(1);
    }
    
    // Perform transition
    await makeRequest('POST', `/issue/${ticketId}/transitions`, {
      transition: { id: transition.id }
    });
    
    log(`✓ Ticket transitioned to ${transitionName}`, 'green');
  } catch (error) {
    log(`✗ Error transitioning ticket: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function listTransitions(ticketId) {
  try {
    log(`\nFetching available transitions for ${ticketId}...`, 'cyan');
    
    const transitions = await makeRequest('GET', `/issue/${ticketId}/transitions`);
    
    log('\n--- Available Transitions ---', 'yellow');
    transitions.transitions.forEach(t => {
      log(`  • ${t.name} (id: ${t.id})`);
    });
  } catch (error) {
    log(`✗ Error fetching transitions: ${error.message}`, 'red');
    process.exit(1);
  }
}

function extractAcceptanceCriteria(ticket) {
  // Try to find acceptance criteria in description or custom fields
  const description = ticket.fields.description || '';
  const descriptionText = ticket.renderedFields?.description || '';
  
  // Look for common patterns
  const patterns = [
    /acceptance criteria:?([\s\S]*?)(?:\n\n|\z)/i,
    /ac:?([\s\S]*?)(?:\n\n|\z)/i,
    /given.*when.*then/i
  ];
  
  for (const pattern of patterns) {
    const match = descriptionText.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  // Check custom fields (common field names for acceptance criteria)
  const customFields = Object.keys(ticket.fields)
    .filter(key => key.startsWith('customfield_'));
  
  for (const field of customFields) {
    const value = ticket.fields[field];
    if (value && typeof value === 'string' && value.toLowerCase().includes('acceptance')) {
      return value;
    }
  }
  
  return null;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function downloadAttachment(url, dir, filename) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
    const filePath = path.join(dir, filename);
    
    log(`  ⬇️  Downloading ${filename}...`);
    
    const urlParts = new URL(url);
    const options = {
      hostname: urlParts.hostname,
      path: urlParts.pathname + urlParts.search,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    };
    
    const file = fs.createWriteStream(filePath);
    
    https.get(options, (response) => {
      // Handle all redirect status codes (301, 302, 303, 307, 308)
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Handle redirect
        file.close();
        fs.unlinkSync(filePath);
        downloadAttachment(response.headers.location, dir, filename)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filePath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        log(`  ✓ Downloaded to: scratchpads/${path.basename(dir)}/${filename}`, 'green');
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(filePath);
      reject(err);
    });
  });
}

function validateEnvironment() {
  if (!JIRA_HOST || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    log('\n✗ Missing JIRA configuration!', 'red');
    log('\nPlease create a .env file with the following variables:', 'yellow');
    log('  JIRA_HOST=yourcompany.atlassian.net');
    log('  JIRA_EMAIL=your.email@company.com');
    log('  JIRA_API_TOKEN=your_api_token_here');
    log('\nYou can generate an API token at: https://id.atlassian.com/manage-profile/security/api-tokens');
    process.exit(1);
  }
}

function showHelp() {
  log('\n=== JIRA Workflow CLI ===', 'bright');
  log('\nUsage: node scripts/jira-workflow.js <command> [options]', 'cyan');
  log('\nCommands:');
  log('  fetch <ticket-id> [--download]     Fetch ticket details (with attachments)');
  log('  comment <ticket-id> "<comment>"    Add comment to ticket');
  log('  transition <ticket-id> <status>    Change ticket status');
  log('  transitions <ticket-id>            List available transitions');
  log('\nOptions:');
  log('  --download                         Download attachments when fetching ticket');
  log('\nExamples:');
  log('  node scripts/jira-workflow.js fetch JUNO-123');
  log('  node scripts/jira-workflow.js fetch JUNO-123 --download');
  log('  node scripts/jira-workflow.js comment JUNO-123 "Started implementation"');
  log('  node scripts/jira-workflow.js transition JUNO-123 "In Progress"');
  log('  node scripts/jira-workflow.js transitions JUNO-123');
}

// Main execution
async function main() {
  const command = process.argv[2];
  const ticketId = process.argv[3];
  
  if (!command || command === 'help' || command === '--help') {
    showHelp();
    process.exit(0);
  }
  
  validateEnvironment();
  
  if (!ticketId) {
    log('\n✗ Please provide a ticket ID', 'red');
    showHelp();
    process.exit(1);
  }
  
  switch (command.toLowerCase()) {
    case 'fetch':
      await fetchTicket(ticketId);
      process.exit(0);
      break;
      
    case 'comment':
      const comment = process.argv[4];
      if (!comment) {
        log('\n✗ Please provide a comment', 'red');
        process.exit(1);
      }
      await addComment(ticketId, comment);
      break;
      
    case 'transition':
      const status = process.argv[4];
      if (!status) {
        log('\n✗ Please provide a status', 'red');
        process.exit(1);
      }
      await transitionTicket(ticketId, status);
      break;
      
    case 'transitions':
      await listTransitions(ticketId);
      break;
      
    default:
      log(`\n✗ Unknown command: ${command}`, 'red');
      showHelp();
      process.exit(1);
  }
}

main().catch(error => {
  log(`\n✗ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});