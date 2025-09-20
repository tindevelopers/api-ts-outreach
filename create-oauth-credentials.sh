#!/bin/bash

# Google OAuth Credentials Creation Script
# This script helps you create OAuth 2.0 credentials for your API

echo "🔐 Creating Google OAuth Credentials"
echo "===================================="

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI (gcloud) is not installed. Please install it first."
    echo "   Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with Google Cloud CLI. Please run: gcloud auth login"
    exit 1
fi

echo "✅ Google Cloud CLI is available and authenticated"

# Get current project
PROJECT_ID=$(gcloud config get-value project)
echo "📋 Current project: $PROJECT_ID"

# Check if we have the right permissions
echo ""
echo "🔍 Checking permissions..."
if gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --format="table(bindings.role)" --filter="bindings.members:$(gcloud config get-value account)" | grep -q "roles/owner\|roles/editor"; then
    echo "✅ You have sufficient permissions"
else
    echo "⚠️  You may not have sufficient permissions to create OAuth credentials"
    echo "   You need Owner or Editor role on the project"
fi

echo ""
echo "🚀 Creating OAuth 2.0 Client ID..."
echo ""

# Try to create OAuth consent screen first
echo "1. Setting up OAuth consent screen..."
echo "   This needs to be done manually in the Google Cloud Console"
echo "   Go to: https://console.developers.google.com/apis/credentials/consent"
echo "   Select project: $PROJECT_ID"
echo "   Configure the consent screen with:"
echo "   - App name: API Outreach Service"
echo "   - User support email: $(gcloud config get-value account)"
echo "   - Developer contact: $(gcloud config get-value account)"
echo ""

# Try to create OAuth 2.0 client ID using gcloud
echo "2. Creating OAuth 2.0 Client ID..."
echo "   This also needs to be done manually in the Google Cloud Console"
echo "   Go to: https://console.developers.google.com/apis/credentials"
echo "   Select project: $PROJECT_ID"
echo "   Click 'Create Credentials' > 'OAuth 2.0 Client IDs'"
echo "   Choose 'Web application'"
echo "   Name: API Outreach Service"
echo "   Add authorized redirect URIs:"
echo "   - http://localhost:3000/auth/google/callback"
echo "   - https://$PROJECT_ID-xxxxx-uc.a.run.app/auth/google/callback"
echo ""

# Alternative: Try to use the Google Cloud Console API
echo "3. Alternative: Using Google Cloud Console API..."
echo "   Let me try to create the credentials programmatically..."

# Create a temporary file for the OAuth client configuration
cat > /tmp/oauth-client-config.json << EOF
{
  "web": {
    "client_id": "PLACEHOLDER_CLIENT_ID",
    "client_secret": "PLACEHOLDER_CLIENT_SECRET",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "redirect_uris": [
      "http://localhost:3000/auth/google/callback",
      "https://$PROJECT_ID-xxxxx-uc.a.run.app/auth/google/callback"
    ]
  }
}
EOF

echo "   Created OAuth client configuration template"
echo "   File: /tmp/oauth-client-config.json"
echo ""

# Try to use the Google Cloud Console API
echo "4. Attempting to create OAuth client via API..."
echo "   This may not work due to API limitations, but let's try..."

# Get access token
ACCESS_TOKEN=$(gcloud auth application-default print-access-token 2>/dev/null)

if [ -n "$ACCESS_TOKEN" ]; then
    echo "   ✅ Got access token"
    
    # Try to create OAuth client
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "web": {
                "redirect_uris": [
                    "http://localhost:3000/auth/google/callback",
                    "https://'$PROJECT_ID'-xxxxx-uc.a.run.app/auth/google/callback"
                ]
            }
        }' \
        "https://console.googleapis.com/v1/projects/$PROJECT_ID/oauthClients" 2>/dev/null)
    
    if echo "$RESPONSE" | grep -q "clientId"; then
        echo "   ✅ OAuth client created successfully!"
        echo "   Response: $RESPONSE"
    else
        echo "   ❌ Failed to create OAuth client via API"
        echo "   Response: $RESPONSE"
        echo "   This is expected - you'll need to create it manually"
    fi
else
    echo "   ❌ Could not get access token"
fi

echo ""
echo "📋 Manual Setup Required"
echo "========================"
echo ""
echo "Since the API approach may not work, please follow these steps:"
echo ""
echo "1. Go to: https://console.developers.google.com/apis/credentials/consent"
echo "2. Select project: $PROJECT_ID"
echo "3. Configure OAuth consent screen:"
echo "   - App name: API Outreach Service"
echo "   - User support email: $(gcloud config get-value account)"
echo "   - Developer contact: $(gcloud config get-value account)"
echo "   - Add scopes: userinfo.email, userinfo.profile"
echo ""
echo "4. Go to: https://console.developers.google.com/apis/credentials"
echo "5. Create OAuth 2.0 Client ID:"
echo "   - Type: Web application"
echo "   - Name: API Outreach Service"
echo "   - Redirect URIs:"
echo "     * http://localhost:3000/auth/google/callback"
echo "     * https://$PROJECT_ID-xxxxx-uc.a.run.app/auth/google/callback"
echo ""
echo "6. Copy the Client ID and Client Secret"
echo "7. Run the setup-secrets-now.sh script to set up GitHub secrets"
echo ""
echo "🎯 Once you have the credentials, run:"
echo "   ./setup-secrets-now.sh"
echo ""
echo "Or set them manually:"
echo "   gh secret set GOOGLE_CLIENT_ID --body 'YOUR_CLIENT_ID'"
echo "   gh secret set GOOGLE_CLIENT_SECRET --body 'YOUR_CLIENT_SECRET'"
