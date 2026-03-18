export async function onRequestPost(context) {
  var env = context.env;
  var PAT = env.AIRTABLE_PAT;
  var BASE_ID = env.AIRTABLE_BASE_ID;
  var BASE_URL = 'https://api.airtable.com/v0/' + BASE_ID;
  var headers = { Authorization: 'Bearer ' + PAT, 'Content-Type': 'application/json' };
  var cors = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  var body = await context.request.json();
  var username = body.username;
  var email = body.email;
  var homePark = body.homePark;
  var intent = body.intent;

  if (!username || !email) {
    return new Response(JSON.stringify({ error: 'Missing username or email' }), { status: 400, headers: cors });
  }

  // Check if username taken
  var checkRes = await fetch(BASE_URL + '/Users?filterByFormula=' + encodeURIComponent('{Username}="' + username + '"') + '&maxRecords=1', { headers: headers });
  var checkData = await checkRes.json();
  if (checkData.records && checkData.records.length > 0) {
    return new Response(JSON.stringify({ error: 'Username already taken' }), { status: 400, headers: cors });
  }

  // Count users for founding 100
  var countRes = await fetch(BASE_URL + '/Users?pageSize=100&fields%5B%5D=Username', { headers: headers });
  var countData = await countRes.json();
  var userCount = countData.records ? countData.records.length : 0;
  var isFounding = userCount < 100;

  // Create user
  var createRes = await fetch(BASE_URL + '/Users', {
    method: 'POST', headers: headers,
    body: JSON.stringify({
      records: [{ fields: {
        Username: username, Email: email, Intent: intent || 'Explore',
        XP_Total: 50, IsFounding100: isFounding,
        JoinDate: new Date().toISOString().split('T')[0], ProfileEmoji: '🎢'
      }}]
    })
  });

  var result = await createRes.json();
  if (!result.records || result.records.length === 0) {
    return new Response(JSON.stringify({ error: 'Failed to create user' }), { status: 500, headers: cors });
  }

  var userId = result.records[0].id;

  // Create XP transaction
  await fetch(BASE_URL + '/XP_Transactions', {
    method: 'POST', headers: headers,
    body: JSON.stringify({
      records: [{ fields: {
        User: [userId], Amount: 50, Source: 'Signup',
        Description: 'Welcome bonus — 50 XP', Timestamp: new Date().toISOString()
      }}]
    })
  });

  // Award founding badge if eligible
  if (isFounding) {
    var badgeRes = await fetch(BASE_URL + '/Badges?filterByFormula=' + encodeURIComponent('{Name}="FOUNDING 100"') + '&maxRecords=1', { headers: headers });
    var badgeData = await badgeRes.json();
    if (badgeData.records && badgeData.records.length > 0) {
      await fetch(BASE_URL + '/UserBadges', {
        method: 'POST', headers: headers,
        body: JSON.stringify({
          records: [{ fields: {
            User: [userId], Badge: [badgeData.records[0].id], EarnedDate: new Date().toISOString()
          }}]
        })
      });
    }
  }

  return new Response(JSON.stringify({
    success: true, userId: userId, isFounding100: isFounding,
    xp: 50, userNumber: userCount + 1, foundingSpotsLeft: isFounding ? (100 - userCount - 1) : 0
  }), { headers: cors });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
  });
}
