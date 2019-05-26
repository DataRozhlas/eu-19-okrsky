import { partys } from "./partys";
import { reslts } from "./reslts";

var host = 'https://data.irozhlas.cz'
if (window.location.hostname == 'localhost') {
    host = 'http://localhost'
}

var sel = '<select>'
sel += '<option value="ucast">Účast (celá ČR 28,7 %)</option>';
reslts.forEach(function(p) {
    sel += '<option value="part_' + p[0] + '">' + partys[p[0]].naz + ' (celkem ' + p[1] + ' %)' +  '</option>';
});
sel += '</select>'
document.getElementById('party_select').innerHTML = sel;

var map = new mapboxgl.Map({
    container: "map",
    style: "https://data.irozhlas.cz/mapa-domu/map_styl/style.json",
    zoom: 6.85,
    maxZoom: 14,
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

var party_id = 'ucast';

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
                ['has', 'hlasy_platne'],
                [
                    'interpolate', 
                    ['linear'], 
                    ['/', ['get', 'hlasy_platne'], ['get', 'zapsani']],
                    0, '#f2f0f7',
                    0.05, '#2166ac',
                    0.1, '#67a9cf',
                    0.15, '#d1e5f0',
                    0.30, '#fddbc7',
                    0.60, '#ef8a62',
                    1.0, '#b2182b',
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
        if (party_id == 'ucast') {
            if (d.length > 0) {
                var ucast = Math.round((d[0].properties.hlasy_platne / d[0].properties.zapsani) * 1000)/10 || 0;
                document.getElementById('legend').innerHTML = 'Účast '  
                + ' v okrsku č. ' 
                + d[0].properties.Cislo
                + ' v obci ' 
                + d[0].properties.nazob
                + ' byla ' 
                + ucast 
                + ' % (' 
                + (d[0].properties.hlasy_platne | 0)
                + ' ze ' 
                + d[0].properties.zapsani + ' zapsaných voličů).'
            } else {
                document.getElementById('legend').innerHTML = 'Vyberte okrsek v mapě';
            }
        } else {
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
                document.getElementById('legend').innerHTML = 'Vyberte okrsek v mapě';
            }
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
                    0.05, '#2166ac',
                    0.1, '#67a9cf',
                    0.15, '#d1e5f0',
                    0.30, '#fddbc7',
                    0.60, '#ef8a62',
                    1.0, '#b2182b',
                ],
            'white',
        ]
        if (party_id == 'ucast') {
            var stl = [
                'case', 
                ['has', sel_part],
                    [
                        'interpolate', 
                        ['linear'], 
                        ['/', ['get', 'hlasy_platne'], ['get', 'zapsani']],
                        0, '#f2f0f7',
                        0.5, '#2166ac',
                        0.20, '#67a9cf',
                        0.30, '#d1e5f0',
                        0.50, '#fddbc7',
                        0.70, '#ef8a62',
                        1.0, '#b2182b',
                    ],
                'white',
            ]
        }
        map.setPaintProperty('data', 'fill-color', stl);
    });
});
  
$("#inp-geocode").on("focus input", () => $("#inp-geocode").css("border-color", "black"));
  // geocoder
  const form = document.getElementById("frm-geocode");
  form.onsubmit = function submitForm(event) {
    event.preventDefault();
    const text = document.getElementById("inp-geocode").value;
    if (text === "") {
      map.flyTo({
        center: [15.3350758, 49.7417517],
        zoom: 7,
      });
    } else {
      $.get(`https://api.mapy.cz/geocode?query=${text}`, (data) => {
        if (typeof $(data).find("item").attr("x") === "undefined") {
          $("#inp-geocode").css("border-color", "red");
          return;
        }
        const x = parseFloat($(data).find("item").attr("x"));
        const y = parseFloat($(data).find("item").attr("y"));
        if (x < 12 || x > 19 || y < 48 || y > 52) { // omezení geosearche na česko, plus mínus
          $("#inp-geocode").css("border-color", "red");
          return;
        }
        map.flyTo({
          center: [x, y],
          zoom: 12,
        });
      }, "xml");
    }
  };
