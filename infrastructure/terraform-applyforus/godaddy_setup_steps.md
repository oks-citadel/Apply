# GoDaddy Nameserver Configuration Guide

This guide provides step-by-step instructions for updating nameservers in GoDaddy to point to Azure DNS.

## Prerequisites

- Access to your GoDaddy account with domain management permissions
- Azure DNS nameservers from Terraform output (see `azure_nameservers.md`)
- Domain: applyforus.com registered in GoDaddy

## Step-by-Step Configuration

### Step 1: Login to GoDaddy

1. Navigate to https://www.godaddy.com
2. Click **Sign In** in the top right corner
3. Enter your GoDaddy username and password
4. Complete two-factor authentication if enabled

### Step 2: Access Domain Settings

1. After logging in, click on your profile icon/name in the top right
2. Select **My Products** from the dropdown menu
3. Scroll to the **Domains** section
4. Find **applyforus.com** in your domain list
5. Click the **DNS** button next to the domain
   - Alternative: Click the three dots menu (...) and select **Manage DNS**

### Step 3: Backup Current Configuration

Before making changes, document your current settings:

1. Take screenshots of:
   - Current nameservers
   - All DNS records (A, CNAME, MX, TXT records)
2. Export DNS records if GoDaddy provides this option
3. Save these backups in a secure location

### Step 4: Change Nameservers

1. On the DNS Management page, scroll to the **Nameservers** section
2. Click the **Change** button next to Nameservers
3. Select **I'll use my own nameservers** (or **Enter my own nameservers**)
4. You'll see input fields for nameservers

### Step 5: Enter Azure DNS Nameservers

Enter all four Azure DNS nameservers from your Terraform output:

```
Nameserver 1: ns1-XX.azure-dns.com
Nameserver 2: ns2-XX.azure-dns.net
Nameserver 3: ns3-XX.azure-dns.org
Nameserver 4: ns4-XX.azure-dns.info
```

**Important Notes**:
- Replace `XX` with the actual numbers from your Terraform output
- Do NOT include the trailing dot (`.`) in GoDaddy
- GoDaddy will automatically add it if needed
- Enter all four nameservers for redundancy

**Screenshot Placeholder**: [Image showing GoDaddy nameserver input fields with Azure nameservers entered]

### Step 6: Save Changes

1. Review the nameservers you entered for accuracy
2. Click **Save** or **Save Changes**
3. GoDaddy will display a warning that this change may take 24-48 hours
4. Click **Continue** or **Confirm** to proceed

**Screenshot Placeholder**: [Image showing GoDaddy confirmation dialog for nameserver changes]

### Step 7: Verify Configuration

1. After saving, you should see the new nameservers listed
2. Status will show "Pending" or similar initially
3. GoDaddy may send a confirmation email to your registered email address

**Screenshot Placeholder**: [Image showing updated nameserver configuration in GoDaddy]

## DNS Record Migration

Once nameservers are changed, all DNS records will be managed in Azure DNS, not GoDaddy.

### Existing DNS Records

If you have existing DNS records in GoDaddy that you want to keep:

1. **Before changing nameservers**, document all existing records:
   - A records
   - CNAME records
   - MX records (email)
   - TXT records (verification, SPF)
   - Other record types

2. **Recreate these records in Azure DNS** using either:
   - Azure Portal
   - Azure CLI
   - Terraform (recommended)

### Common Records to Migrate

**Email Records (if using GoDaddy email)**:
```
MX    @    10    mailstore1.secureserver.net
MX    @    20    mailstore2.secureserver.net
```

**Email Verification (SPF)**:
```
TXT   @    v=spf1 include:secureserver.net ~all
```

**DKIM Records** (if configured):
- Export from GoDaddy before changing nameservers

## Post-Configuration Steps

### 1. Monitor Nameserver Propagation

Check propagation status using online tools:

```bash
# Command line check
nslookup -type=NS applyforus.com

# Or use online tools:
# - https://www.whatsmydns.net/
# - https://dnschecker.org/
```

### 2. Expected Timeline

- **Immediate**: GoDaddy updates configuration
- **15-30 minutes**: Some DNS resolvers see changes
- **2-4 hours**: Most DNS resolvers updated
- **24-48 hours**: Full global propagation

### 3. Verify DNS Resolution

After propagation, verify your domains resolve correctly:

```bash
# Check root domain
nslookup applyforus.com

# Check www subdomain
nslookup www.applyforus.com

# Check API subdomain
nslookup api.applyforus.com
```

Expected result: All should resolve to your Application Gateway public IP.

## Common Issues and Solutions

### Issue 1: "Invalid Nameserver" Error

**Symptoms**: GoDaddy shows error when trying to save nameservers

**Solutions**:
- Ensure nameservers are spelled correctly
- Remove the trailing dot (.) if you added it
- Check that nameservers are reachable (Azure DNS zone must be created first)
- Try entering one nameserver at a time

### Issue 2: Changes Not Saving

**Symptoms**: Nameservers revert to GoDaddy defaults after saving

**Solutions**:
- Clear browser cache and cookies
- Try a different browser or incognito mode
- Disable browser extensions that might interfere
- Contact GoDaddy support if issue persists

### Issue 3: Domain Still Showing GoDaddy Parking Page

**Symptoms**: After 24+ hours, domain shows GoDaddy parking page

**Solutions**:
- Verify nameservers are correctly entered in GoDaddy
- Check that Azure DNS zone is active
- Ensure A records exist in Azure DNS pointing to Application Gateway
- Clear local DNS cache (see `azure_nameservers.md`)

### Issue 4: Email Stops Working

**Symptoms**: Email delivery fails after nameserver change

**Solutions**:
- This is expected if email DNS records weren't migrated
- Recreate MX, TXT (SPF), and DKIM records in Azure DNS
- See `dns_records_production.md` for email record examples
- Allow 24 hours for email records to propagate

### Issue 5: Subdomain Not Resolving

**Symptoms**: www or api subdomains don't resolve

**Solutions**:
- Verify A or CNAME records exist in Azure DNS
- Check DNS records in Azure Portal:
  ```bash
  az network dns record-set list \
    --resource-group applyforus-prod-rg \
    --zone-name applyforus.com
  ```
- Wait for full DNS propagation (up to 48 hours)

## Reverting Changes

If you need to revert to GoDaddy nameservers:

1. Login to GoDaddy
2. Go to DNS Management for applyforus.com
3. Click **Change** next to Nameservers
4. Select **Use GoDaddy's nameservers** (or **Default**)
5. Click **Save**

**GoDaddy Default Nameservers** (for reference):
```
ns01.domaincontrol.com
ns02.domaincontrol.com
```

## Best Practices

1. **Timing**: Make nameserver changes during low-traffic periods
2. **Communication**: Notify your team before making changes
3. **Documentation**: Keep records of old and new configurations
4. **Testing**: Test DNS resolution from multiple locations
5. **Monitoring**: Monitor website and API availability after changes
6. **Email**: Test email delivery if you use custom email

## Support and Resources

### GoDaddy Support
- **Phone**: 1-480-505-8877 (US)
- **Support Portal**: https://www.godaddy.com/help/
- **Live Chat**: Available 24/7 through GoDaddy account

### Azure Support
- **Azure DNS Documentation**: https://docs.microsoft.com/en-us/azure/dns/
- **Azure Support Portal**: https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade

### Online DNS Tools
- **DNS Checker**: https://dnschecker.org/
- **What's My DNS**: https://www.whatsmydns.net/
- **MX Toolbox**: https://mxtoolbox.com/

## Checklist

Before starting:
- [ ] Have Azure DNS nameservers from Terraform output
- [ ] Backed up current GoDaddy DNS configuration
- [ ] Documented all existing DNS records
- [ ] Migrated necessary records to Azure DNS
- [ ] Notified team of planned changes

During configuration:
- [ ] Logged into GoDaddy
- [ ] Accessed DNS Management for applyforus.com
- [ ] Entered all four Azure nameservers
- [ ] Saved changes successfully
- [ ] Received confirmation from GoDaddy

After configuration:
- [ ] Verified nameservers in GoDaddy show Azure DNS
- [ ] Monitored DNS propagation status
- [ ] Tested domain resolution (root, www, api)
- [ ] Verified Application Gateway is reachable
- [ ] Tested email delivery (if applicable)
- [ ] Documented completion date and time

## Next Steps

After successfully configuring nameservers:
1. Wait 24-48 hours for full propagation
2. Verify all DNS records are resolving
3. Proceed with SSL certificate installation
4. See `ssl_configuration.md` for next steps
