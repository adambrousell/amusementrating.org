export async function onRequestGet(context) {
  var env = context.env;
  var PAT = env.AIRTABLE_PAT;
  var BASE_ID = env.AIRTABLE_BASE_ID;
  var headers = { Authorization: 'Bearer ' + PAT };
  var cors = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  var fields = ['Name', 'QT_ParkID', 'Country', 'Continent', 'Latitude', 'Longitude', 'Timezone', 'Active'];
  var url = 'https://api.airtable.com/v0/' + BASE_ID + '/Parks?pageSize=100&filterByFormula=' + encodeURIComponent('{Active}=TRUE()');
  for (var i = 0; i < fields.length; i++) url += '&fields%5B%5D=' + encodeURIComponent(fields[i]);
  url += '&sort%5B0%5D%5Bfield%5D=Name&sort%5B0%5D%5Bdirection%5D=asc';

  var allRecords = [];
  var offset = null;
  do {
    var fetchUrl = offset ? url + '&offset=' + encodeURIComponent(offset) : url;
    var res = await fetch(fetchUrl, { headers: headers });
    var data = await res.json();
    if (data.records) allRecords = allRecords.concat(data.records);
    offset = data.offset || null;
  } while (offset);

  var parks = allRecords.map(function(r) {
    return { id: r.id, name: r.fields.Name, parkId: r.fields.QT_ParkID, country: r.fields.Country, continent: r.fields.Continent, lat: r.fields.Latitude, lng: r.fields.Longitude };
  });

  return new Response(JSON.stringify({ parks: parks, count: parks.length }), { headers: cors });
}
