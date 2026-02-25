# Setup RE Broker in a Box Google Calendar

## Step 1: Create New Maton Connection

Run this to create a connection for rebrokerinabox@gmail.com:

```bash
python <<'EOF'
import urllib.request, os, json

data = json.dumps({'app': 'google-calendar'}).encode()
req = urllib.request.Request('https://ctrl.maton.ai/connections', data=data, method='POST')
req.add_header('Authorization', f'Bearer {os.environ["MATON_API_KEY"]}')
req.add_header('Content-Type', 'application/json')

response = urllib.request.urlopen(req)
result = json.load(response)
print(json.dumps(result, indent=2))
print("\n\n🔗 Open this URL to authorize:")
print(result['connection']['url'])
print("\n📋 Connection ID:", result['connection']['connection_id'])
EOF
```

## Step 2: Authorize the Connection

1. Copy the URL from the output
2. Open it in your browser
3. **Sign in with rebrokerinabox@gmail.com** (not rob@aubrey.net!)
4. Grant calendar permissions
5. Copy the Connection ID

## Step 3: Update Environment Variable

Add this to your `.env.local`:

```
GOOGLE_CALENDAR_CONNECTION_ID=<paste-connection-id-here>
```

## Step 4: Update Code

I'll update the calendar sync code to use this specific connection.

---

**Notes:**
- Events will go to rebrokerinabox@gmail.com primary calendar
- You can share that calendar with rob@aubrey.net (view-only) if needed
- Agents won't see these events (they're just for the broker)
