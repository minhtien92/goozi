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
echo "🔍 Checking Client ID consistency:"
VITE_CLIENT_ID=$(grep "^VITE_GOOGLE_CLIENT_ID=" .env 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "")
BACKEND_CLIENT_ID=$(grep "^GOOGLE_CLIENT_ID=" .env 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "")

if [ -n "$VITE_CLIENT_ID" ] && [ -n "$BACKEND_CLIENT_ID" ]; then
    if [ "$VITE_CLIENT_ID" = "$BACKEND_CLIENT_ID" ]; then
        echo "✅ Frontend and Backend Client IDs match"
    else
        echo "❌ WARNING: Client IDs do NOT match!"
        echo "   Frontend (VITE_GOOGLE_CLIENT_ID): ${VITE_CLIENT_ID:0:30}..."
        echo "   Backend (GOOGLE_CLIENT_ID): ${BACKEND_CLIENT_ID:0:30}..."
        echo ""
        echo "⚠️  This will cause 'Wrong recipient' error!"
        echo "   They must be the SAME Client ID."
        echo ""
        read -p "Update backend GOOGLE_CLIENT_ID to match frontend? [y/N]: " update_backend
        if [[ "$update_backend" =~ ^[Yy]$ ]]; then
            # Update backend CLIENT_ID
            if grep -q "^GOOGLE_CLIENT_ID=" .env; then
                sed -i.bak "s|^GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$VITE_CLIENT_ID|" .env
            else
                echo "GOOGLE_CLIENT_ID=$VITE_CLIENT_ID" >> .env
            fi
            echo "✅ Updated GOOGLE_CLIENT_ID in .env"
            echo "   You need to restart backend: docker-compose restart backend"
        fi
    fi
elif [ -z "$VITE_CLIENT_ID" ]; then
    echo "⚠️  VITE_GOOGLE_CLIENT_ID not found in .env"
    echo "   Frontend needs this to initialize Google Sign In"
elif [ -z "$BACKEND_CLIENT_ID" ]; then
    echo "⚠️  GOOGLE_CLIENT_ID not found in .env"
    echo "   Backend needs this to verify Google tokens"
fi

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
echo "If you get 'Wrong recipient, payload audience != requiredAudience':"
echo "1. ✅ FIXED: Backend COOP header changed to 'unsafe-none'"
echo "2. Ensure GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID are IDENTICAL"
echo "3. Rebuild backend: docker-compose build backend && docker-compose up -d backend"
echo "4. Rebuild frontend: docker-compose build web && docker-compose up -d web"
echo ""
echo "If you get Cross-Origin-Opener-Policy error:"
echo "1. Backend now uses 'unsafe-none' for COOP (allows Google OAuth)"
echo "2. Clear browser cache and hard refresh (Ctrl+Shift+R)"
echo "3. Try incognito mode to rule out cache issues"
echo ""
echo "If you still get 401 Unauthorized:"
echo "1. Check backend logs: docker-compose logs backend | grep -i google"
echo "2. Verify token is being sent: Check browser Network tab"
echo "3. Ensure domain is in Google Cloud Console Authorized origins"
echo ""
echo "✅ Configuration check complete!"
echo ""
echo "Next steps:"
echo "1. Update Google Cloud Console as shown above"
echo "2. Rebuild backend (COOP header fix):"
echo "   docker-compose build backend"
echo "   docker-compose up -d backend"
echo "3. Rebuild frontend (if Client ID was updated):"
echo "   docker-compose build web"
echo "   docker-compose up -d web"
echo "4. Clear browser cache and test Google Sign In again"
