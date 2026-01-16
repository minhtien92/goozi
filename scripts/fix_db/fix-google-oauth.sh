#!/usr/bin/env bash
set -euo pipefail

# Fix Google OAuth issues
# Usage: bash scripts/fix_db/fix-google-oauth.sh

echo "🔧 Fix Google OAuth Configuration"
echo "==================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    exit 1
fi

echo "📋 Current Google OAuth configuration:"
echo ""

# Check GOOGLE_CLIENT_ID
if grep -q "GOOGLE_CLIENT_ID" .env; then
    CLIENT_ID=$(grep "^GOOGLE_CLIENT_ID=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    echo "✅ GOOGLE_CLIENT_ID found: ${CLIENT_ID:0:30}..."
else
    echo "❌ GOOGLE_CLIENT_ID not found in .env"
    echo ""
    read -p "Enter your Google Client ID: " CLIENT_ID
    echo "GOOGLE_CLIENT_ID=$CLIENT_ID" >> .env
    echo "✅ Added GOOGLE_CLIENT_ID to .env"
fi

echo ""
echo "🌐 Current frontend URLs:"
FRONTEND_URL=$(grep "^FRONTEND_URL=" .env 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "http://localhost:3000")
CMS_URL=$(grep "^CMS_URL=" .env 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "http://localhost:3002")
echo "   Web: $FRONTEND_URL"
echo "   CMS: $CMS_URL"

echo ""
echo "📝 Google Cloud Console Configuration:"
echo ""
echo "1. Go to: https://console.cloud.google.com/apis/credentials"
echo "2. Select your project"
echo "3. Find OAuth 2.0 Client ID: ${CLIENT_ID:0:30}..."
echo "4. Click Edit"
echo ""
echo "5. In 'Authorized JavaScript origins', add:"
echo "   - $FRONTEND_URL"
echo "   - $CMS_URL"
if [[ "$FRONTEND_URL" == *"https://"* ]]; then
    HTTP_URL=$(echo "$FRONTEND_URL" | sed 's/https:/http:/')
    echo "   - $HTTP_URL (if you also use HTTP)"
fi
echo ""
echo "6. Click SAVE"
echo "7. Wait 5-10 minutes for changes to propagate"
echo ""
echo "🔍 Troubleshooting:"
echo ""
echo "If you still get 401 Unauthorized:"
echo "1. Check that GOOGLE_CLIENT_ID in .env matches Google Cloud Console"
echo "2. Verify the token is being sent correctly from frontend"
echo "3. Check backend logs: docker-compose logs backend | grep -i google"
echo ""
echo "If you get Cross-Origin-Opener-Policy error:"
echo "1. Backend now includes COOP headers (rebuild if needed)"
echo "2. Clear browser cache and hard refresh (Ctrl+Shift+R)"
echo ""
echo "✅ Configuration check complete!"
echo ""
echo "Next steps:"
echo "1. Update Google Cloud Console as shown above"
echo "2. Rebuild backend if you just added COOP headers:"
echo "   docker-compose build backend"
echo "   docker-compose up -d backend"
echo "3. Test Google Sign In again"
