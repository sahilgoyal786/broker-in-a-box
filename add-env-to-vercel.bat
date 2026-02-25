@echo off
echo Adding environment variables to Vercel...

REM Add MATON_API_KEY
echo Adding MATON_API_KEY...
echo ***REMOVED-MATON-API-KEY*** | npx vercel env add MATON_API_KEY production

REM Add GOOGLE_CALENDAR_CONNECTION_ID
echo Adding GOOGLE_CALENDAR_CONNECTION_ID...
echo 90a653bd-3851-4860-aa62-e9d905df9c05 | npx vercel env add GOOGLE_CALENDAR_CONNECTION_ID production

echo.
echo Done! Now redeploying...
npx vercel deploy --prod

echo.
echo All set! Calendar will sync to rebrokerinabox@gmail.com
pause
