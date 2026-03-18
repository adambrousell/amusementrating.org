export async function onRequestGet(context) {
  var env = context.env;
  var PAT = env.AIRTABLE_PAT;
  var BASE_ID = env.AIRTABLE_BASE_ID;
  var headers = { Authorization: 'Bearer ' + PAT };
  var cors = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  var fields = ['Username', 'XP_Total', 'GlobalRank', 'ProfileEmoji', 'AuditorTier'];
  var url = 'https://api.airtable.com/v0/' + BASE_ID + '/Users?maxRecords=100';
  for (var i = 0; i < fields.length; i++) url += '&fields%5B%5D=' + encodeURIComponent(fields[i]);
  url += '&sort%5B0%5D%5Bfield%5D=XP_Total&sort%5B0%5D%5Bdirection%5D=desc';

  var res = await fetch(url, { headers: headers });
  var data = await res.json();

  var leaderboard = (data.records || []).map(function(r, idx) {
    var xp = r.fields.XP_Total || 0;
    return {
      rank: idx + 1, username: r.fields.Username, xp: xp,
      level: Math.floor(Math.sqrt(xp / 100)),
      emoji: r.fields.ProfileEmoji || '🎢', tier: r.fields.AuditorTier || 0
    };
  });

  return new Response(JSON.stringify({ leaderboard: leaderboard }), { headers: cors });
}
