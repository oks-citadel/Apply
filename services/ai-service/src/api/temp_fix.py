import sys

# Read the file
with open('dependencies.py', 'r') as f:
    lines = f.readlines()

# Find the line with the secret assignment and add validation after it
new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if i == 71 and 'secret = os.environ.get("JWT_SECRET", "") or settings.jwt_secret' in line:
        # Add validation after the secret line
        new_lines.append('        \n')
        new_lines.append('        # Validate that secret is not empty\n')
        new_lines.append('        if not secret:\n')
        new_lines.append('            logger.error("JWT_SECRET is not configured")\n')
        new_lines.append('            raise HTTPException(\n')
        new_lines.append('                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,\n')
        new_lines.append('                detail="Authentication service is not properly configured",\n')
        new_lines.append('            )\n')

# Write the modified content back
with open('dependencies.py', 'w') as f:
    f.writelines(new_lines)

print("Security fix applied successfully")
