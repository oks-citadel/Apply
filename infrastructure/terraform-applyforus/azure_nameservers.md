# Azure DNS Nameservers Configuration

After deploying the Terraform infrastructure, Azure DNS will provide you with nameservers for your domain. This guide explains how to retrieve and configure these nameservers.

## Retrieving Azure DNS Nameservers

### Option 1: From Terraform Output

After running `terraform apply`, the nameservers will be displayed in the output:

```bash
terraform output dns_zone_nameservers
```

Example output:
```
[
  "ns1-01.azure-dns.com.",
  "ns2-01.azure-dns.net.",
  "ns3-01.azure-dns.org.",
  "ns4-01.azure-dns.info."
]
```

### Option 2: From Azure Portal

1. Navigate to the Azure Portal (https://portal.azure.com)
2. Go to **Resource Groups** > Select your resource group (e.g., `applyforus-prod-rg`)
3. Click on the **DNS zone** resource (e.g., `applyforus.com`)
4. The nameservers are displayed on the Overview page under "Name servers"

### Option 3: Using Azure CLI

```bash
az network dns zone show \
  --name applyforus.com \
  --resource-group applyforus-prod-rg \
  --query nameServers \
  --output table
```

## Nameserver Format

Azure DNS nameservers follow this format:
- `ns1-XX.azure-dns.com.`
- `ns2-XX.azure-dns.net.`
- `ns3-XX.azure-dns.org.`
- `ns4-XX.azure-dns.info.`

Where `XX` is a unique number assigned to your DNS zone.

## Important Notes

1. **Include Trailing Dots**: Azure DNS nameservers include a trailing dot (`.`). Some domain registrars require this, while others automatically add it. Check your registrar's documentation.

2. **All Four Nameservers**: Configure all four nameservers in your domain registrar for redundancy and high availability.

3. **TTL Consideration**: Before changing nameservers, reduce the TTL (Time To Live) of your current DNS records to 300 seconds (5 minutes) at least 24 hours in advance. This ensures faster propagation.

4. **Backup Current Settings**: Before making changes, document your current nameserver configuration in case you need to revert.

## DNS Propagation

After updating nameservers:
- **Propagation Time**: Can take 24-48 hours for full global propagation
- **Typical Time**: Most changes propagate within 2-4 hours
- **Immediate Effect**: Some resolvers may cache old nameservers for up to 48 hours

## Verifying DNS Configuration

### Check Current Nameservers

```bash
# Using nslookup
nslookup -type=NS applyforus.com

# Using dig (Linux/Mac)
dig NS applyforus.com

# Using host command
host -t NS applyforus.com
```

### Check DNS Propagation Status

Use online tools to check propagation across different geographic locations:
- https://www.whatsmydns.net/
- https://dnschecker.org/
- https://mxtoolbox.com/SuperTool.aspx

### Verify A Records

After nameservers have propagated, verify your A records are resolving:

```bash
# Check root domain
nslookup applyforus.com

# Check www subdomain
nslookup www.applyforus.com

# Check api subdomain
nslookup api.applyforus.com
```

Expected output should show the Application Gateway public IP address.

## Troubleshooting

### Issue: Nameservers not updating

**Solution**:
- Wait at least 24-48 hours
- Clear your local DNS cache:
  ```bash
  # Windows
  ipconfig /flushdns

  # Mac
  sudo dscacheutil -flushcache
  sudo killall -HUP mDNSResponder

  # Linux
  sudo systemd-resolve --flush-caches
  ```

### Issue: Website not accessible after DNS change

**Solution**:
1. Verify nameservers are correctly configured in GoDaddy
2. Check DNS records in Azure DNS zone:
   ```bash
   az network dns record-set list \
     --resource-group applyforus-prod-rg \
     --zone-name applyforus.com \
     --output table
   ```
3. Ensure Application Gateway is running and healthy
4. Check Application Gateway backend health

### Issue: SSL certificate errors

**Solution**:
- Wait for DNS to fully propagate before requesting SSL certificates
- Use DNS validation method for Let's Encrypt certificates
- See `ssl_configuration.md` for detailed SSL setup

## Next Steps

After configuring nameservers in GoDaddy:
1. Wait for DNS propagation (check status using tools above)
2. Verify all DNS records are resolving correctly
3. Proceed with SSL certificate installation (see `ssl_configuration.md`)
4. Configure Application Gateway SSL bindings
5. Test your application endpoints

## Support Resources

- **Azure DNS Documentation**: https://docs.microsoft.com/en-us/azure/dns/
- **DNS Troubleshooting**: https://docs.microsoft.com/en-us/azure/dns/dns-troubleshoot
- **GoDaddy Support**: https://www.godaddy.com/help/

## Reference

- **DNS Zone Name**: applyforus.com
- **Resource Group**: applyforus-prod-rg
- **Location**: East US
- **TTL Recommendation**: 300 seconds (5 minutes) for A records
