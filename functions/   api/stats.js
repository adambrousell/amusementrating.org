export async function onRequestGet(context) {
  var env = context.env;
  var PAT = env.AIRTABLE_PAT;
  var BASE_ID = env.AIRTABLE_BASE_ID;
  var BASE_URL = 'https://api.airtable.com/v0/' + BASE_ID;
  var headers = { Authorization: 'Bearer ' + PAT };
  var cors = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' };

  // Count rides (paginate)
  var rideCount = 0;
  var offset = null;
  do {
    var url = BASE_URL + '/Rides?pageSize=100&fields%5B%5D=Name';
    if (offset) url += '&offset=' + encodeURIComponent(offset);
    var res = await fetch(url, { headers: headers });
    var data = await res.json();
    rideCount += (data.records || []).length;
    offset = data.offset || null;
  } while (offset);

  // Count users
  var userRes = await fetch(BASE_URL + '/Users?pageSize=100&fields%5B%5D=Username', { headers: headers });
  var userData = await userRes.json();
  var userCount = (userData.records || []).length;

  // Count parks
  var parkRes = await fetch(BASE_URL + '/Parks?pageSize=100&fields%5B%5D=Name&filterByFormula=' + encodeURIComponent('{Active}=TRUE()'), { headers: headers });
  var parkData = await parkRes.json();
  var parkCount = (parkData.records || []).length;

  return new Response(JSON.stringify({
    rideCount: rideCount, parkCount: parkCount, userCount: userCount,
    foundingSpotsLeft: Math.max(0, 100 - userCount)
  }), { headers: cors });
}
