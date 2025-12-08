# Application Details Page - Usage Guide

## Quick Start

### Accessing the Page

Navigate to the application details page using one of these methods:

1. **From Applications List**: Click on any job title or the "View" button
2. **Direct URL**: `/applications/{applicationId}`
3. **From Dashboard**: Click on a recent application

```typescript
// Example navigation
import Link from 'next/link';

<Link href="/applications/abc-123-def-456">
  View Application Details
</Link>

// Or programmatically
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/applications/abc-123-def-456');
```

## Page Features

### 1. Viewing Application Details

The page automatically loads and displays:
- Job title and company
- Current application status
- Location and salary information
- Application submission date
- Complete timeline of events
- Cover letter (if submitted)
- All notes and comments
- Employer responses (if received)

**No action required** - everything loads automatically!

### 2. Adding Notes

**Steps:**
1. Click the "Add Note" button (top right or in Notes section)
2. Enter your note in the text area
3. Click "Add Note" to save

**Use Cases:**
- Record phone call details
- Note interview feedback
- Track follow-up actions
- Document communication
- Save research about the company

**Example Notes:**
```
Called HR department - spoke with Jane Smith
Interview scheduled for next Tuesday at 2 PM
Need to prepare presentation on cloud architecture
```

```
Company culture seems great based on Glassdoor reviews
Average salary for this role is $140k according to Levels.fyi
Should highlight my AWS certification
```

### 3. Updating Application Status

**Steps:**
1. Scroll to the "Update Status" card in the sidebar
2. Click the button for the new status
3. Status updates immediately

**Available Status Transitions:**
- Applied → Screening
- Screening → Assessment
- Assessment → Interview
- Interview → Offer
- Any → Rejected
- Any → Accepted

**When to Update:**
- Received screening email → Change to "Screening"
- Completed assessment → Change to "Assessment"
- Scheduled interview → Change to "Interview"
- Received offer → Change to "Offer"
- Accepted position → Change to "Accepted"
- Received rejection → Change to "Rejected"

### 4. Withdrawing an Application

**Steps:**
1. Click "Withdraw Application" button (top right)
2. Optionally enter a reason
3. Click "Withdraw" to confirm

**Common Reasons:**
```
Accepted another offer
Position no longer of interest
Salary below expectations
Company culture not a good fit
Relocation not possible
Timeline doesn't work
```

**Important Notes:**
- ⚠️ This action cannot be undone
- You'll be redirected back to applications list
- Status will change to "Withdrawn"
- Cannot withdraw if already rejected/accepted

### 5. Viewing Timeline

The timeline shows all major events chronologically:

**Timeline Events Include:**
- Initial application submission
- Status changes
- Employer responses
- System updates
- Your manual status updates

**Reading the Timeline:**
- Most recent events at the top
- Dates shown in relative format ("2 days ago")
- Optional notes attached to events
- Visual connector lines show progression

### 6. Checking Employer Response

If an employer has responded, you'll see a "Response Received" card showing:

**For Interview Invitations:**
- Interview date and time
- Interview type (phone, video, onsite, technical)
- Any special instructions

**For Offers:**
- Offered salary
- Benefits summary
- Expected start date
- Response deadline

**For Rejections:**
- Rejection message (if provided)
- Date received

## Integration with Other Features

### Resume Details
- Click the resume name to view/edit your resume
- Ensure it's up-to-date before interviews

### Job Search
- After withdrawing, return to job search
- Apply similar positions with improved resume

### Analytics
- All status changes tracked
- Contributes to your success metrics
- Helps identify patterns

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close any open modal |
| `Backspace` | Return to applications list (when not in input) |
| `N` | Open Add Note modal (planned) |
| `U` | Focus Update Status section (planned) |

## Mobile Experience

### Optimizations for Mobile:
- Single column layout
- Larger touch targets
- Swipe gestures (planned)
- Simplified navigation
- Bottom action sheet (planned)

### Mobile-Specific Features:
- Call company directly (planned)
- Share application status (planned)
- Calendar integration (planned)
- Location-based reminders (planned)

## Best Practices

### Note-Taking Tips
1. **Be Specific**: Include names, dates, and details
2. **Use Timestamps**: System adds them automatically
3. **Track Actions**: Note what you need to do next
4. **Record Impressions**: Save your thoughts immediately
5. **Link Resources**: Add relevant links or references

### Status Management
1. **Update Promptly**: Change status when things happen
2. **Be Accurate**: Don't skip statuses
3. **Add Context**: Use notes to explain status changes
4. **Track Timing**: Notice how long each stage takes
5. **Learn Patterns**: Identify your successful timelines

### Organization Tips
1. **Regular Reviews**: Check applications weekly
2. **Follow Up**: Add notes for follow-up dates
3. **Compare**: Look at timeline across applications
4. **Archive**: Withdraw old applications
5. **Reflect**: Learn from rejected applications

## Common Workflows

### After Applying
```
1. Application submitted
2. Add note: "Applied via LinkedIn - referral from John"
3. Wait for response
4. Check daily for updates
```

### Interview Prep
```
1. Status changed to "Interview"
2. Add note: "Interview scheduled for Dec 15, 2PM"
3. Add note: "Research: Company focused on AI/ML"
4. Add note: "Prepare: System design question likely"
5. Review timeline before interview
```

### Offer Negotiation
```
1. Status changed to "Offer"
2. Add note: "Initial offer: $150k"
3. Add note: "Researched: Market rate is $165k"
4. Add note: "Counter-offer sent: $160k + equity"
5. Update status when resolved
```

### Post-Interview Follow-up
```
1. Add note: "Interview went well - team seems great"
2. Add note: "Sent thank you email to Jane and Bob"
3. Add note: "Expected response: within 1 week"
4. Check back in 5-7 days
5. Add note if no response: "Following up via email"
```

## Troubleshooting

### Page Won't Load
- Check your internet connection
- Verify the application ID is correct
- Try refreshing the page
- Clear browser cache if persistent

### Can't Add Notes
- Ensure you've entered text
- Check if you're logged in
- Try again in a few seconds
- Report if issue persists

### Status Won't Update
- Check your connection
- Verify you have permission
- Try refreshing the page
- Check application isn't withdrawn/rejected

### Missing Information
- Some fields are optional
- Cover letter only shown if submitted
- Response section only for employer replies
- Timeline builds over time

## Data Privacy

### What's Stored
- All information you enter
- Status changes and timestamps
- Notes and comments
- System-generated events

### What's Shared
- Nothing shared without your permission
- Data used only for your tracking
- Secure storage and transmission
- GDPR compliant (EU users)

### Data Retention
- Active applications: Indefinitely
- Withdrawn applications: 90 days (configurable)
- Rejected applications: 1 year (for analytics)
- Accepted applications: Archived, not deleted

## Performance Tips

### Faster Loading
- Modern browser recommended
- Good internet connection helps
- Cache clears on logout
- Pagination for large note lists (future)

### Efficient Usage
- Batch status updates
- Write detailed notes less frequently vs many short notes
- Use search to find applications (list page)
- Bookmark frequently accessed applications

## Accessibility

### Screen Reader Support
- All buttons labeled
- Card sections announced
- Timeline navigation support
- Form field descriptions

### Keyboard Navigation
- Tab through all interactive elements
- Enter to activate buttons
- Escape to close modals
- Arrow keys for navigation (planned)

### Visual Accessibility
- High contrast mode support
- Text sizing respects browser settings
- Color not sole indicator
- Focus indicators visible

## Future Enhancements

Coming soon:
- [ ] Email integration for auto-updates
- [ ] Calendar sync for interviews
- [ ] Document attachments
- [ ] Application comparison view
- [ ] Export to PDF
- [ ] Sharing capabilities
- [ ] Reminder notifications
- [ ] AI insights and suggestions
- [ ] Interview question bank
- [ ] Salary negotiation tools

## Support

### Getting Help
- Check this guide first
- Review main documentation
- Contact support via email
- Join community forum (coming soon)

### Reporting Issues
Include:
- Application ID
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS version
- Screenshots if applicable

### Feature Requests
Submit via:
- GitHub Issues
- Support email
- User feedback form
- Community voting board (coming soon)

## Examples

### Example 1: Active Application
```
Status: Interview
Applied: 2 days ago
Timeline: 3 events
Notes: 2 notes
Response: Interview scheduled

Next Action: Prepare for interview
```

### Example 2: Waiting for Response
```
Status: Applied
Applied: 1 week ago
Timeline: 1 event (application)
Notes: 1 note
Response: None yet

Next Action: Follow up if no response by Friday
```

### Example 3: Offer Received
```
Status: Offer
Applied: 3 weeks ago
Timeline: 5 events
Notes: 8 notes
Response: Offer details available

Next Action: Review offer, prepare negotiation
```

## Quick Reference

| Task | Steps |
|------|-------|
| Add Note | Click "Add Note" → Type → Submit |
| Update Status | Sidebar → Click status button |
| Withdraw | Top right → "Withdraw" → Confirm |
| View Resume | Click resume name in sidebar |
| Go Back | Top left → "Back to Applications" |
| See Timeline | Scroll to Timeline card |
| Check Response | Scroll to Response card (if available) |

## Tips for Success

1. **Stay Organized**: Update status promptly
2. **Document Everything**: Add notes liberally
3. **Follow Up**: Track response timelines
4. **Learn**: Review past applications
5. **Prepare**: Use notes for interview prep
6. **Network**: Note referrals and connections
7. **Research**: Save company insights
8. **Track Metrics**: Notice your patterns
9. **Stay Positive**: Learn from rejections
10. **Celebrate**: Note your wins!
