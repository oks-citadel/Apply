#!/bin/bash
set -e

PAT_TOKEN="3cFdmiCJityL6Dq5PEETFaet6KuUdDlvgQOZSGDEMatTgXwOB94eJQQJ99BLACAAAAAAAAAAAAASAZDO13vZ"
AZP_URL="https://dev.azure.com/citadelcloudmanagement"
AZP_POOL="Default"
AZP_AGENT="devops-agent-vm"

# Create agent directory
sudo rm -rf /azp/agent
sudo mkdir -p /azp/agent
cd /azp/agent

# Download agent using Azure DevOps packages API
echo "Getting agent download URL..."
AUTH_HEADER=$(echo -n ":${PAT_TOKEN}" | base64 -w0)

RESPONSE=$(curl -s -H "Authorization: Basic ${AUTH_HEADER}" \
  "${AZP_URL}/_apis/distributedtask/packages/agent?platform=linux-x64&top=1" 2>/dev/null)

echo "API Response: ${RESPONSE:0:200}..."

DOWNLOAD_URL=$(echo "$RESPONSE" | grep -o '"downloadUrl":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$DOWNLOAD_URL" ]; then
  echo "Failed to get download URL from API, trying fallback..."
  # Fallback to known working URL
  DOWNLOAD_URL="https://vstsagentpackage.azureedge.net/agent/4.264.0/pipelines-agent-linux-x64-4.264.0.tar.gz"
fi

echo "Downloading from: $DOWNLOAD_URL"
sudo curl -fkSL -o vstsagent.tar.gz "$DOWNLOAD_URL"

echo "Extracting agent..."
sudo tar -zxvf vstsagent.tar.gz

# Set ownership
sudo chown -R azureuser:azureuser /azp

# Configure agent
echo "Configuring agent..."
sudo -u azureuser ./config.sh --unattended \
  --url "$AZP_URL" \
  --auth pat \
  --token "$PAT_TOKEN" \
  --pool "$AZP_POOL" \
  --agent "$AZP_AGENT" \
  --acceptTeeEula \
  --replace

# Install and start service
echo "Installing service..."
sudo ./svc.sh install azureuser
sudo ./svc.sh start

echo "Agent setup complete!"
sudo ./svc.sh status
