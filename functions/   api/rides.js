export async function onRequestGet(context) {
  var env = context.env;
  var PAT = env.AIRTABLE_PAT;
  var BASE_ID = env.AIRTABLE_BASE_ID;
  var headers = { Authorization: 'Bearer ' + PAT };
  var cors = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  var url = new URL(context.request.url);
  var parkRecordId = url.searchParams.get('parkId') || '';
  if (!parkRecordId) {
    return new Response(JSON.stringify({ error: 'Missing parkId' }), { status: 400, headers: cors });
  }

  var fields = ['Name', 'QT_RideID', 'Park', 'Land', 'IsOpen', 'WaitTime', 'LastUpdated', 'Manufacturer', 'Model', 'Height_ft', 'Speed_mph', 'Length_ft', 'Inversions', 'Year_Opened', 'RideType'];
  var formula = encodeURIComponent('FIND("' + parkRecordId + '", ARRAYJOIN(Park))');
  var apiUrl = 'https://api.airtable.com/v0/' + BASE_ID + '/Rides?pageSize=100&filterByFormula=' + formula;
  for (var i = 0; i < fields.length; i++) apiUrl += '&fields%5B%5D=' + encodeURIComponent(fields[i]);
  apiUrl += '&sort%5B0%5D%5Bfield%5D=Name&sort%5B0%5D%5Bdirection%5D=asc';

  var allRecords = [];
  var offset = null;
  do {
    var fetchUrl = offset ? apiUrl + '&offset=' + encodeURIComponent(offset) : apiUrl;
    var res = await fetch(fetchUrl, { headers: headers });
    var data = await res.json();
    if (data.records) allRecords = allRecords.concat(data.records);
    offset = data.offset || null;
  } while (offset);

  var rides = allRecords.map(function(r) {
    return {
      id: r.id, name: r.fields.Name, land: r.fields.Land,
      isOpen: r.fields.IsOpen || false, waitTime: r.fields.WaitTime || 0,
      lastUpdated: r.fields.LastUpdated, manufacturer: r.fields.Manufacturer,
      model: r.fields.Model, height: r.fields.Height_ft, speed: r.fields.Speed_mph,
      length: r.fields.Length_ft, inversions: r.fields.Inversions,
      yearOpened: r.fields.Year_Opened, type: r.fields.RideType
    };
  });

  return new Response(JSON.stringify({ rides: rides, count: rides.length }), { headers: cors });
}
