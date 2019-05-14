import { partys } from "./partys";

var host = 'https://data.irozhlas.cz'
if (window.location.hostname == 'localhost') {
    host = 'http://localhost'
}

var sel = '<select>'
Object.keys(partys).forEach(function(p) {
    sel += '<option value="part_' + p + '">' + partys[p].naz + '</option>'
})
sel += '</select>'
document.getElementById('party_select').innerHTML = sel;

var map = new mapboxgl.Map({
    container: "map",
    style: "https://data.irozhlas.cz/mapa-domu/map_styl/style.json",
    zoom: 6.85,
    maxZoom: 15,
    attributionControl: false,
    center: [15.3350758, 49.7417517],
});

map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.AttributionControl({
    compact: true,
    customAttribution: 'obrazový podkres <a target="_blank" href="https://samizdat.cz">Samizdat</a>, data <a target="_blank" href="http://vdp.cuzk.cz/">ČÚZK</a> a <a target="_blank" href="http://volby.cz/">ČSÚ</a>',
}));

map.scrollZoom.disable(); // zoom myší teprve až po interakci s mapou
map.on("click", function(e) {
    map.scrollZoom.enable();
});

var party_id = 'part_1';

map.on('load', function() {
    map.addLayer({
        id: 'data',
        type: 'fill',
        source: {
            type: 'vector',
            tiles: [host + "/eu-19-okrsky/tiles/{z}/{x}/{y}.pbf"],
        },
        'source-layer': 'data',
        paint: {
            'fill-color': [
                'case', 
                ['has', 'part_1'],
                    [
                        'interpolate', 
                        ['linear'], 
                        ['/', ['get', 'part_1'], ['get', 'hlasy_platne']],
                        0, '#f2f0f7',
                        0.1, '#dadaeb',
                        0.3, '#bcbddc',
                        0.5, '#9e9ac8',
                        0.7, '#807dba',
                        0.8, '#6a51a3',
                        1.0, '#4a1486',
                    ],
                'white',
            ], 
            "fill-opacity": 0.8,
            "fill-outline-color": "hsl(0, 0%, 52%)",
        }
    });

    map.on('mousemove', function(e) {
        var d = map.queryRenderedFeatures(e.point, {
            layers: ['data']
        });
        if (d.length > 0) {
            var hlasy_pct = Math.round((d[0].properties[party_id] / d[0].properties.hlasy_platne) * 1000)/10 || 0;
            document.getElementById('legend').innerHTML = 'Strana ' 
            + partys[party_id.replace('part_', '')].zkr 
            + ' získala v okrsku č. ' 
            + d[0].properties.Cislo
            + ' v obci ' 
            + d[0].properties.nazob
            + ' ' 
            + hlasy_pct 
            + ' % hlasů (' 
            + (d[0].properties[party_id] | 0)
            + ' ze ' 
            + d[0].properties.hlasy_platne + ' platných).'
        } else {
            document.getElementById('legend').innerHTML = 'Vyberte obec v mapě';
        }
    });

    document.getElementById('party_select').addEventListener("change", function(e) {
        var sel_part = e.target.selectedOptions[0].value;
        party_id = sel_part;
        var stl = [
            'case', 
            ['has', sel_part],
                [
                    'interpolate', 
                    ['linear'], 
                    ['/', ['get', sel_part], ['get', 'hlasy_platne']],
                    0, '#f2f0f7',
                    0.1, '#dadaeb',
                    0.3, '#bcbddc',
                    0.5, '#9e9ac8',
                    0.7, '#807dba',
                    0.8, '#6a51a3',
                    1.0, '#4a1486',
                ],
            'white',
        ]
        map.setPaintProperty('data', 'fill-color', stl);
    });
});
  
  
