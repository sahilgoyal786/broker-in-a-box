#!/bin/bash

# Add environment variables to Vercel
# Run this if you have Vercel CLI authenticated
# Requires MATON_API_KEY to be set in your shell (source .env.local first)

echo "Adding MATON_API_KEY..."
echo "$MATON_API_KEY" | npx vercel env add MATON_API_KEY production --force

echo "Adding GOOGLE_CALENDAR_CONNECTION_ID..."
echo "90a653bd-3851-4860-aa62-e9d905df9c05" | npx vercel env add GOOGLE_CALENDAR_CONNECTION_ID production --force

echo "✅ Environment variables added!"
echo "Now redeploying..."
npx vercel deploy --prod
