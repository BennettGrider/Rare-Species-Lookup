
// Since main.js is included in all (1) html files, will register the service worker here
// Making sure service workers are supported, then registering it
// Use this cmd to develop on localhost: start chrome --unsafely-treat-insecure-origin-as-secure=http://127.0.0.1:5500/
if('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('../sw_cached_site.js')
            .then(reg => console.log('Service worker registered'))
            .catch(err => console.log(`Service worker: error: ${err}`)) // Example of using a template string
    })
}



// Select2 as a jQuery function, call on any jQuery selector when initializing Select2
$(document).ready(function() {
    $('.county-selection-dropdown').select2({
        placeholder: "Select a county",
        width: 'resolve' // Overriding the default width
    });
});


// *****************
// LEAFLET MAP STUFF
// *****************

// Initializing leaflet map
var map = L.map('mapid').setView([46.7,- 94.7], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 18,
    minZoom: 6,
    id: 'osm.streets'
}).addTo(map);


// Setting up custom location marker
var locIcon = L.icon({
    iconUrl: 'images/location-icon-v2.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30] // Anchor is based on [0, 0] being the top left corner
});

// Getting user location
var userLat = 0;
var userLng = 0;
var locMarker; // locMarker and locCircle must be declared here to be present outside of a single onLocationFound function call
var locCircle;
var markerPresent = false; // For tracking if a marker and accuracy circle have been created yet
var locErrorMsg = false; // For tracking if a location error message has already been generated

function onLocationFound(e) {

    userLat = e.latlng.lat;
    userLng = e.latlng.lng;
    var radius = e.accuracy / 2;

    // First, if the 'location cannot be found' message exists, removes it
    if (locErrorMsg == true) {
        $('#loc-error').remove();
    }

    // If the location marker doesn't exist, creates one, otherwise updates the marker position
    if (markerPresent == false) {
        locMarker = L.marker(e.latlng, {icon: locIcon}).addTo(map);
        locCircle = L.circle(e.latlng, radius).addTo(map);
        map.setView(e.latlng, 10); // Centers the map on the location, but only initially
        markerPresent = true;
        var accuracyRounded = e.accuracy.toFixed(2);
        $('#get-from-map-col').append(`<p id="loc-accuracy">Location accuracy: ${accuracyRounded} m</p>`);
    } else {
        locMarker.setLatLng(e.latlng);
        locCircle.setLatLng(e.latlng);
        $('#loc-accuracy').html('Location accuracy: ' + e.accuracy + 'm');
    }
}
map.on('locationfound', onLocationFound);
map.locate({setView: false, maxZoom: 12, enableHighAccuracy: true, watch: true});

// If geolocation fails
map.on('locationerror', function onLocationError(e){
    if (locErrorMsg == false) {
        $('#get-from-map-col').append('<p id="loc-error">Location cannot be found. Select a county on the map or dropdown to generate results.</p>');
        locErrorMsg = true;
    }
});


// When the GeoJSON is loaded, onEachFeature determines what happens when a layer is clicked
var clickedCounty = '';
function onEachFeature(feature, layer) {
    layer.bindPopup(feature.properties.CTY_NAME + ' County');

    // coords.push(feature.geometry.coordinates); // Storing the coordinates of each feature as an array

    // Handling the county labels
    var label = L.marker(layer.getBounds().getCenter(), {
        icon: L.divIcon({
            className: 'county-labels',
            html: feature.properties.CTY_NAME,
            iconSize: null,
            iconAnchor: [5, 10],
            popupAnchor: [-5, -25]
        })
    }).addTo(map);

    layer.on({
        click: function(e) { // This function is used to store the clicked county in the clickedCounty variable
            clickedCounty = e.target.feature.properties.CTY_NAME;
            // Also needs to set the Select2 dropdown to the clicked county name
            $('.county-selection-dropdown').val(clickedCounty).trigger('change');
        }
    });
}

// Adding the counties geojson normally, without AJAX
// This is done so that leaflet-pip can correctly interpret the object, and thus run pointInLayer properly
var countiesLayer;
$.getJSON('data/mn_counties_500.geojson', function(data){
    countiesLayer = L.geoJSON(data, {
        style: {
            color: "#F5860F",
            weight: 2.5,
            opacity: 0.7,
            fillOpacity: 0
        },
        onEachFeature: onEachFeature
    });
    countiesLayer.addTo(map);
});


// For adding the counties GeoJSON data to the map as polygons. Possibly useful later, but not currently needed
// countiesLayer.forEach(function(county) {
//     var polygon = L.polygon(state.geometry.coordinates, {
//         weight: 2,
//         fillOpacity: 0,
//         opacity: 0.8,
//         color: '#F5860F'
//     }).addTo(map);
// });


// Rare species found in each county. Formatted as a collection (array of objects)
var all_counties = {
    'Aitkin': ["Cypripedium arietinum", "Rubus vermontanus", "Poa paludigena", "Rubus semisetosus", "Botrychium rugulosum", "Juncus articulatus", "Juglans cinerea", "Crocanthemum canadense", "Potamogeton bicupulatus", "Cardamine pratensis", "Botrychium mormo", "Najas gracillima", "Utricularia purpurea", "Torreyochloa pallida", "Malaxis monophyllos var. brachypoda", "Botrychium lanceolatum ssp. angustisegmentum", "Utricularia geminiscapa", "Floerkea proserpinacoides", "Potamogeton oakesianus", "Botrychium simplex", "Eleocharis flavescens var. olivacea", "Eleocharis robbinsii", "Botrychium oneidense", "Panax quinquefolius", "Littorella americana", "Platanthera clavellata", "Botrychium pallidum", "Bidens discoidea", "Alisma gramineum", "Ranunculus lapponicus"],
    'Anoka': ["Cypripedium arietinum", "Rubus vermontanus", "Oenothera rhombipetala", "Rubus semisetosus", "Botrychium rugulosum", "Juglans cinerea", "Aristida tuberculosa", "Hudsonia tomentosa", "Gaylussacia baccata", "Potamogeton bicupulatus", "Aristida longespica var. geniculata", "Besseya bullii", "Rotala ramosior", "Najas gracillima", "Orobanche uniflora", "Rubus missouricus", "Fimbristylis autumnalis", "Baptisia lactea var. lactea", "Rubus fulleri", "Bartonia virginica", "Trichophorum clintonii", "Minuartia dawsonensis", "Botrychium simplex", "Xyris torta", "Platanthera flava var. herbiola", "Scleria triglomerata", "Carex grayi", "Nuttallanthus canadensis", "Polygala cruciata", "Botrychium oneidense", "Panax quinquefolius", "Juncus marginatus", "Rubus multifer", "Viola lanceolata var. lanceolata", "Najas guadalupensis ssp. olivacea", "Triplasis purpurea var. purpurea", "Rubus stipulatus", "Platanthera clavellata", "Potamogeton diversifolius", "Decodon verticillatus var. laevigatus"],
    'Becker': ["Rhynchospora capillacea", "Cypripedium candidum", "Cypripedium arietinum", "Gymnocarpium robertianum", "Carex sterilis", "Ruppia cirrhosa", "Eleocharis rostellata", "Scleria verticillata", "Carex obtusata", "Botrychium mormo", "Orobanche ludoviciana var. ludoviciana", "Najas gracillima", "Malaxis monophyllos var. brachypoda", "Cladium mariscoides", "Botrychium minganense", "Carex scirpoidea", "Utricularia geminiscapa", "Gaillardia aristata", "Malaxis paludosa", "Botrychium campestre", "Berula erecta", "Cirsium pumilum var. hillii", "Minuartia dawsonensis", "Potamogeton oakesianus", "Eleocharis flavescens var. olivacea", "Panax quinquefolius", "Drosera anglica", "Najas guadalupensis ssp. olivacea", "Stuckenia vaginata", "Carex hookerana", "Botrychium pallidum", "Alisma gramineum", "Gentianella amarella"],
    'Beltrami': ["Cypripedium arietinum", "Carex exilis", "Gymnocarpium robertianum", "Nymphaea leibergii", "Ruppia cirrhosa", "Botrychium rugulosum", "Juncus articulatus", "Xyris montana", "Cardamine pratensis", "Botrychium lunaria", "Botrychium mormo", "Dryopteris goldiana", "Waldsteinia fragarioides var. fragarioides", "Torreyochloa pallida", "Malaxis monophyllos var. brachypoda", "Botrychium lanceolatum ssp. angustisegmentum", "Cladium mariscoides", "Botrychium minganense", "Malaxis paludosa", "Botrychium campestre", "Trichophorum clintonii", "Botrychium simplex", "Salix maccalliana", "Juncus stygius var. americanus", "Eleocharis quinqueflora", "Drosera linearis", "Drosera anglica", "Najas guadalupensis ssp. olivacea", "Stuckenia vaginata", "Botrychium pallidum", "Ranunculus lapponicus"],
    'Benton': ["Rubus vermontanus", "Poa paludigena", "Carex obtusata", "Juglans cinerea", "Cirsium pumilum var. hillii", "Trichophorum clintonii", "Platanthera flava var. herbiola", "Nuttallanthus canadensis", "Rubus multifer", "Silene drummondii ssp. drummondii"],
    'Big Stone': ["Rhynchospora capillacea", "Cypripedium candidum", "Ruppia cirrhosa", "Isoetes melanopoda", "Bacopa rotundifolia", "Xanthisma spinulosum var. spinulosum", "Elatine triandra", "Woodsia oregana ssp. cathcartiana", "Escobaria vivipara", "Agalinis auriculata", "Botrychium campestre", "Cyperus acuminatus", "Marsilea vestita", "Callitriche heterophylla", "Aristida purpurea var. longiseta", "Najas marina", "Limosella aquatica", "Eleocharis quinqueflora", "Astragalus missouriensis var. missouriensis", "Schedonnardus paniculatus", "Eleocharis coloradoensis", "Dalea candida var. oligophylla", "Solidago mollis", "Desmanthus illinoensis", "Astragalus flexuosus var. flexuosus", "Alisma gramineum"],
    'Blue Earth': ["Rhynchospora capillacea", "Cypripedium candidum", "Asclepias sullivantii", "Scleria verticillata", "Juglans cinerea", "Trillium nivale", "Dryopteris goldiana", "Rudbeckia triloba var. triloba", "Agalinis auriculata", "Berula erecta", "Gymnocladus dioica", "Aristida purpurea var. longiseta", "Opuntia macrorhiza", "Arnoglossum plantagineum", "Panax quinquefolius", "Arisaema dracontium", "Thaspium barbinode", "Eryngium yuccifolium", "Carex annectens", "Huperzia porophila", "Sagittaria calycina var. calycina", "Desmanthus illinoensis", "Elodea bifoliata"],
    'Brown': ["Cypripedium candidum", "Buchloe dactyloides", "Asclepias sullivantii", "Juglans cinerea", "Bacopa rotundifolia", "Trillium nivale", "Elatine triandra", "Woodsia oregana ssp. cathcartiana", "Lespedeza leptostachya", "Cyperus acuminatus", "Gymnocladus dioica", "Opuntia macrorhiza", "Arnoglossum plantagineum", "Panax quinquefolius", "Schedonnardus paniculatus", "Thaspium barbinode", "Eryngium yuccifolium"],
    'Carlton': ["Cypripedium arietinum", "Carex rossii", "Botrychium rugulosum", "Tsuga canadensis", "Xyris montana", "Pyrola minor", "Najas gracillima", "Waldsteinia fragarioides var. fragarioides", "Torreyochloa pallida", "Elatine triandra", "Malaxis monophyllos var. brachypoda", "Botrychium lanceolatum ssp. angustisegmentum", "Cladium mariscoides", "Shepherdia canadensis", "Persicaria careyi", "Fimbristylis autumnalis", "Allium schoenoprasum", "Botrychium simplex", "Juncus stygius var. americanus", "Botrychium oneidense", "Salix pseudomonticola", "Littorella americana", "Rubus quaesitus", "Carex ormostachya", "Botrychium pallidum", "Bidens discoidea", "Ranunculus lapponicus"],
    'Carver': ["Rhynchospora capillacea", "Cypripedium candidum", "Cypripedium arietinum", "Oenothera rhombipetala", "Desmodium cuspidatum var. longifolium", "Carex sterilis", "Eleocharis rostellata", "Scleria verticillata", "Juglans cinerea", "Rorippa sessiliflora", "Verbena simplex", "Besseya bullii", "Boechera laevigata", "Valeriana edulis var. ciliata", "Cladium mariscoides", "Botrychium campestre", "Berula erecta", "Gymnocladus dioica", "Panax quinquefolius", "Sagittaria brevirostra", "Carex annectens", "Erythronium propullans"],
    'Cass': ["Cypripedium arietinum", "Gymnocarpium robertianum", "Rubus vermontanus", "Poa paludigena", "Botrychium rugulosum", "Juncus articulatus", "Juglans cinerea", "Potamogeton bicupulatus", "Botrychium lunaria", "Botrychium mormo", "Dryopteris goldiana", "Najas gracillima", "Waldsteinia fragarioides var. fragarioides", "Potamogeton pulcher", "Utricularia purpurea", "Torreyochloa pallida", "Elatine triandra", "Malaxis monophyllos var. brachypoda", "Orobanche uniflora", "Botrychium lanceolatum ssp. angustisegmentum", "Cladium mariscoides", "Botrychium minganense", "Utricularia geminiscapa", "Fimbristylis autumnalis", "Malaxis paludosa", "Cirsium pumilum var. hillii", "Adlumia fungosa", "Potamogeton oakesianus", "Botrychium simplex", "Eleocharis flavescens var. olivacea", "Botrychium oneidense", "Littorella americana", "Eleocharis quinqueflora", "Najas guadalupensis ssp. olivacea", "Stuckenia vaginata", "Botrychium pallidum", "Bidens discoidea", "Ranunculus lapponicus"],
    'Chippewa': ["Rhynchospora capillacea", "Cypripedium candidum", "Orobanche ludoviciana var. ludoviciana", "Woodsia oregana ssp. cathcartiana", "Agalinis auriculata", "Botrychium campestre", "Berula erecta", "Opuntia macrorhiza", "Astragalus missouriensis var. missouriensis", "Sagittaria calycina var. calycina", "Astragalus flexuosus var. flexuosus"],
    'Chisago': ["Desmodium nudiflorum", "Hydrocotyle americana", "Poa paludigena", "Oenothera rhombipetala", "Lysimachia quadrifolia", "Antennaria parvifolia", "Carex typhina", "Juglans cinerea", "Phemeranthus rugospermus", "Aristida tuberculosa", "Hudsonia tomentosa", "Crataegus calpodendron", "Carex muskingumensis", "Besseya bullii", "Rotala ramosior", "Potamogeton pulcher", "Woodsia oregana ssp. cathcartiana", "Utricularia geminiscapa", "Floerkea proserpinacoides", "Berula erecta", "Rubus fulleri", "Bartonia virginica", "Botrychium simplex", "Crotalaria sagittalis", "Platanthera flava var. herbiola", "Hamamelis virginiana", "Nuttallanthus canadensis", "Polygala cruciata", "Panax quinquefolius", "Platanthera clavellata", "Decodon verticillatus var. laevigatus"],
    'Clay': ["Rhynchospora capillacea", "Cypripedium candidum", "Avenula hookeri", "Carex sterilis", "Calamagrostis montanensis", "Scleria verticillata", "Carex obtusata", "Platanthera praeclara", "Gentiana affinis", "Cymopterus glomeratus", "Orobanche ludoviciana var. ludoviciana", "Orobanche uniflora", "Carex scirpoidea", "Carex hallii", "Gaillardia aristata", "Orobanche fasciculata", "Botrychium campestre", "Cirsium pumilum var. hillii", "Carex xerantica", "Aristida purpurea var. longiseta", "Botrychium simplex", "Helianthus nuttallii ssp. rydbergii", "Sagittaria brevirostra", "Eleocharis quinqueflora", "Dalea candida var. oligophylla", "Silene drummondii ssp. drummondii", "Alisma gramineum", "Gentianella amarella"],
    'Clearwater': ["Rhynchospora capillacea", "Cypripedium arietinum", "Gymnocarpium robertianum", "Carex sterilis", "Ruppia cirrhosa", "Eleocharis rostellata", "Cardamine pratensis", "Botrychium mormo", "Najas gracillima", "Potamogeton pulcher", "Torreyochloa pallida", "Malaxis monophyllos var. brachypoda", "Cladium mariscoides", "Botrychium minganense", "Malaxis paludosa", "Trichophorum clintonii", "Botrychium simplex", "Salix maccalliana", "Eleocharis flavescens var. olivacea", "Carex formosa", "Eleocharis quinqueflora", "Poa wolfii", "Drosera anglica", "Najas guadalupensis ssp. olivacea", "Platanthera clavellata"],
    'Cook': ["Cypripedium arietinum", "Deschampsia flexuosa", "Nymphaea leibergii", "Calamagrostis purpurascens", "Woodsia scopulina ssp. laurentiana", "Subularia aquatica ssp. americana", "Rubus semisetosus", "Carex rossii", "Tofieldia pusilla", "Osmorhiza depauperata", "Carex pallescens", "Empetrum nigrum", "Selaginella selaginoides", "Sagina nodosa ssp. borealis", "Arnica lonchophylla", "Utricularia resupinata", "Botrychium rugulosum", "Muhlenbergia uniflora", "Pinguicula vulgaris", "Luzula parviflora", "Draba norvegica", "Xyris montana", "Boechera retrofracta", "Pyrola minor", "Carex media", "Asplenium trichomanes ssp. trichomanes", "Carex praticola", "Vaccinium uliginosum", "Bistorta vivipara", "Cardamine pratensis", "Botrychium lunaria", "Listera convallarioides", "Botrychium mormo", "Juncus subtilis", "Moehringia macrophylla", "Juniperus horizontalis", "Najas gracillima", "Waldsteinia fragarioides var. fragarioides", "Torreyochloa pallida", "Euphrasia hudsoniana var. ramosior", "Calamagrostis lacustris", "Carex novae-angliae", "Woodsia oregana ssp. cathcartiana", "Botrychium lanceolatum ssp. angustisegmentum", "Cladium mariscoides", "Botrychium minganense", "Utricularia geminiscapa", "Draba arabisans", "Shepherdia canadensis", "Botrychium acuminatum", "Allium schoenoprasum", "Saxifraga cernua", "Botrychium spathulatum", "Trisetum spicatum", "Eleocharis nitida", "Cirsium pumilum var. hillii", "Carex xerantica", "Rubus chamaemorus", "Trichophorum clintonii", "Listera auriculata", "Adlumia fungosa", "Osmorhiza berteroi", "Salix pellita", "Piptatherum canadense", "Botrychium simplex", "Eleocharis robbinsii", "Juncus stygius var. americanus", "Crataegus douglasii", "Huperzia appalachiana", "Oxytropis viscida", "Littorella americana", "Phacelia franklinii", "Prosartes trachycarpa", "Draba cana", "Eleocharis quinqueflora", "Saxifraga paniculata", "Castilleja septentrionalis", "Woodsia glabella", "Carex michauxiana", "Huperzia porophila", "Empetrum atropurpureum", "Platanthera clavellata", "Carex ormostachya", "Packera indecora", "Erigeron acris var. kamtschaticus", "Botrychium pallidum", "Woodsia alpina", "Polystichum braunii", "Bidens discoidea", "Ranunculus lapponicus", "Carex supina ssp. spaniocarpa", "Carex flava"],
    'Cottonwood': ["Rhynchospora capillacea", "Cypripedium candidum", "Buchloe dactyloides", "Eleocharis wolfii", "Asclepias sullivantii", "Bacopa rotundifolia", "Besseya bullii", "Orobanche ludoviciana var. ludoviciana", "Woodsia oregana ssp. cathcartiana", "Lespedeza leptostachya", "Agalinis auriculata", "Cyperus acuminatus", "Aristida purpurea var. longiseta", "Limosella aquatica", "Astragalus missouriensis var. missouriensis", "Schedonnardus paniculatus", "Plagiobothrys scouleri var. penicillatus", "Sagittaria calycina var. calycina"],
    'Crow Wing': ["Rubus vermontanus", "Poa paludigena", "Asclepias sullivantii", "Rubus semisetosus", "Botrychium rugulosum", "Botrychium ascendens", "Juglans cinerea", "Hudsonia tomentosa", "Potamogeton bicupulatus", "Botrychium mormo", "Najas gracillima", "Utricularia purpurea", "Elatine triandra", "Malaxis monophyllos var. brachypoda", "Botrychium lanceolatum ssp. angustisegmentum", "Cladium mariscoides", "Botrychium minganense", "Botrychium spathulatum", "Botrychium lineare", "Botrychium campestre", "Rubus fulleri", "Botrychium simplex", "Eleocharis robbinsii", "Platanthera flava var. herbiola", "Botrychium oneidense", "Panax quinquefolius", "Littorella americana", "Eleocharis quinqueflora", "Najas guadalupensis ssp. olivacea", "Platanthera clavellata", "Botrychium pallidum", "Bidens discoidea", "Decodon verticillatus var. laevigatus", "Alisma gramineum", "Ranunculus lapponicus"],
    'Dakota': ["Rhynchospora capillacea", "Cypripedium candidum", "Oenothera rhombipetala", "Asclepias sullivantii", "Desmodium cuspidatum var. longifolium", "Baptisia bracteata var. glabrescens", "Carex sterilis", "Antennaria parvifolia", "Scleria verticillata", "Platanthera praeclara", "Juglans cinerea", "Rorippa sessiliflora", "Crocanthemum canadense", "Aristida tuberculosa", "Hudsonia tomentosa", "Bacopa rotundifolia", "Trillium nivale", "Besseya bullii", "Scutellaria ovata var. versicolor", "Silene nivea", "Juniperus horizontalis", "Asclepias amplexicaulis", "Valeriana edulis var. ciliata", "Orobanche uniflora", "Cladium mariscoides", "Asplenium platyneuron", "Orobanche fasciculata", "Lespedeza leptostachya", "Agalinis auriculata", "Berula erecta", "Cirsium pumilum var. hillii", "Minuartia dawsonensis", "Gymnocladus dioica", "Crotalaria sagittalis", "Phlox maculata", "Platanthera flava var. herbiola", "Scleria triglomerata", "Carex grayi", "Lechea tenuifolia var. tenuifolia", "Nuttallanthus canadensis", "Carex conjuncta", "Botrychium oneidense", "Arnoglossum plantagineum", "Panax quinquefolius", "Arisaema dracontium", "Rubus multifer", "Polanisia jamesii", "Eryngium yuccifolium", "Sagittaria calycina var. calycina", "Taenidia integerrima", "Decodon verticillatus var. laevigatus"],
    'Dodge': ["Cypripedium candidum", "Asclepias sullivantii", "Baptisia bracteata var. glabrescens", "Carex sterilis", "Platanthera praeclara", "Juglans cinerea", "Boechera laevigata", "Valeriana edulis var. ciliata", "Lespedeza leptostachya", "Napaea dioica", "Baptisia lactea var. lactea", "Phlox maculata", "Platanthera flava var. herbiola", "Carex conjuncta", "Arnoglossum plantagineum", "Panax quinquefolius", "Parthenium integrifolium", "Arisaema dracontium", "Eryngium yuccifolium", "Carex annectens", "Hydrastis canadensis"],
    'Douglas': ["Cypripedium candidum", "Ruppia cirrhosa", "Platanthera praeclara", "Trillium nivale", "Malaxis monophyllos var. brachypoda", "Botrychium campestre", "Cirsium pumilum var. hillii", "Aristida purpurea var. longiseta", "Najas marina", "Panax quinquefolius", "Najas guadalupensis ssp. olivacea", "Alisma gramineum"],
    'Faribault': ["Cypripedium candidum", "Asclepias sullivantii", "Platanthera praeclara", "Crataegus calpodendron", "Baptisia lactea var. lactea", "Gymnocladus dioica", "Carex grayi", "Arnoglossum plantagineum", "Panax quinquefolius", "Arisaema dracontium", "Eryngium yuccifolium", "Carex davisii"],
    'Fillmore': ["Cypripedium candidum", "Desmodium nudiflorum", "Sullivantia sullivantii", "Sanicula trifoliata", "Dicentra canadensis", "Gymnocarpium robertianum", "Carex laevivaginata", "Asclepias sullivantii", "Desmodium cuspidatum var. longifolium", "Diplazium pycnocarpon", "Baptisia bracteata var. glabrescens", "Phegopteris hexagonoptera", "Platanthera praeclara", "Arnoglossum reniforme", "Juglans cinerea", "Pellaea atropurpurea", "Crocanthemum canadense", "Phemeranthus rugospermus", "Aristida tuberculosa", "Verbena simplex", "Trillium nivale", "Boechera laevigata", "Silene nivea", "Dryopteris goldiana", "Juniperus horizontalis", "Diarrhena obovata", "Asclepias amplexicaulis", "Tephrosia virginiana", "Valeriana edulis var. ciliata", "Orobanche uniflora", "Asplenium platyneuron", "Dryopteris marginalis", "Draba arabisans", "Orobanche fasciculata", "Napaea dioica", "Allium cernuum", "Floerkea proserpinacoides", "Baptisia lactea var. lactea", "Symphyotrichum shortii", "Botrychium campestre", "Melica nitens", "Jeffersonia diphylla", "Cirsium pumilum var. hillii", "Trichophorum clintonii", "Paronychia canadensis", "Minuartia dawsonensis", "Phlox maculata", "Hamamelis virginiana", "Lechea tenuifolia var. tenuifolia", "Nuttallanthus canadensis", "Arnoglossum plantagineum", "Panax quinquefolius", "Carex careyana", "Hasteola suaveolens", "Hybanthus concolor", "Parthenium integrifolium", "Chrysosplenium iowense", "Carex jamesii", "Iodanthus pinnatifidus", "Arisaema dracontium", "Psoralidium tenuiflorum", "Poa wolfii", "Eryngium yuccifolium", "Carex annectens", "Agrostis hyemalis", "Carex hookerana", "Deparia acrostichoides", "Carex laxiculmis var. copulata", "Hydrastis canadensis", "Taenidia integerrima", "Polytaenia nuttallii", "Rhodiola integrifolia ssp. leedyi"],
    'Freeborn': ["Cypripedium candidum", "Sanicula trifoliata", "Asclepias sullivantii", "Platanthera praeclara", "Juglans cinerea", "Valeriana edulis var. ciliata", "Phlox maculata", "Arnoglossum plantagineum", "Carex jamesii", "Eryngium yuccifolium", "Taenidia integerrima"],
    'Goodhue': ["Rhynchospora capillacea", "Cypripedium candidum", "Sanicula trifoliata", "Dicentra canadensis", "Baptisia bracteata var. glabrescens", "Carex sterilis", "Platanthera praeclara", "Arnoglossum reniforme", "Juglans cinerea", "Rorippa sessiliflora", "Phemeranthus rugospermus", "Hudsonia tomentosa", "Bacopa rotundifolia", "Carex muskingumensis", "Trillium nivale", "Asplenium trichomanes ssp. trichomanes", "Besseya bullii", "Scutellaria ovata var. versicolor", "Silene nivea", "Dryopteris goldiana", "Juniperus horizontalis", "Quercus bicolor", "Tephrosia virginiana", "Valeriana edulis var. ciliata", "Orobanche fasciculata", "Lespedeza leptostachya", "Napaea dioica", "Baptisia lactea var. lactea", "Berula erecta", "Physaria ludoviciana", "Jeffersonia diphylla", "Cirsium pumilum var. hillii", "Bartonia virginica", "Minuartia dawsonensis", "Gymnocladus dioica", "Aristida purpurea var. longiseta", "Phlox maculata", "Platanthera flava var. herbiola", "Carex grayi", "Arnoglossum plantagineum", "Panax quinquefolius", "Iodanthus pinnatifidus", "Arisaema dracontium", "Carex crus-corvi", "Eryngium yuccifolium", "Platanthera clavellata", "Sagittaria calycina var. calycina", "Deparia acrostichoides", "Taenidia integerrima", "Erythronium propullans"],
    'Grant': ["Cypripedium candidum", "Ruppia cirrhosa", "Panax quinquefolius", "Desmanthus illinoensis"],
    'Hennepin': ["Rhynchospora capillacea", "Cypripedium candidum", "Cypripedium arietinum", "Oenothera rhombipetala", "Desmodium cuspidatum var. longifolium", "Scleria verticillata", "Platanthera praeclara", "Arnoglossum reniforme", "Juglans cinerea", "Hudsonia tomentosa", "Gaylussacia baccata", "Crataegus calpodendron", "Trillium nivale", "Besseya bullii", "Boechera laevigata", "Carex plantaginea", "Rotala ramosior", "Dryopteris goldiana", "Quercus bicolor", "Valeriana edulis var. ciliata", "Orobanche uniflora", "Orobanche fasciculata", "Baptisia lactea var. lactea", "Cirsium pumilum var. hillii", "Bartonia virginica", "Trichophorum clintonii", "Gymnocladus dioica", "Xyris torta", "Carex formosa", "Platanthera flava var. herbiola", "Scleria triglomerata", "Nuttallanthus canadensis", "Polygala cruciata", "Panax quinquefolius", "Drosera linearis", "Aureolaria pedicularia", "Viola lanceolata var. lanceolata", "Najas guadalupensis ssp. olivacea", "Huperzia porophila", "Platanthera clavellata", "Erythronium propullans", "Decodon verticillatus var. laevigatus"],
    'Houston': ["Cypripedium candidum", "Desmodium nudiflorum", "Sullivantia sullivantii", "Sanicula trifoliata", "Dicentra canadensis", "Hydrocotyle americana", "Poa paludigena", "Oenothera rhombipetala", "Carex laevivaginata", "Desmodium cuspidatum var. longifolium", "Diplazium pycnocarpon", "Baptisia bracteata var. glabrescens", "Phegopteris hexagonoptera", "Carex typhina", "Platanthera praeclara", "Arnoglossum reniforme", "Juglans cinerea", "Pellaea atropurpurea", "Crocanthemum canadense", "Phemeranthus rugospermus", "Aristida tuberculosa", "Verbena simplex", "Gaylussacia baccata", "Crataegus calpodendron", "Carex muskingumensis", "Boechera laevigata", "Scutellaria ovata var. versicolor", "Silene nivea", "Dryopteris goldiana", "Juniperus horizontalis", "Asclepias amplexicaulis", "Quercus bicolor", "Tephrosia virginiana", "Woodsia oregana ssp. cathcartiana", "Valeriana edulis var. ciliata", "Orobanche uniflora", "Asplenium platyneuron", "Dryopteris marginalis", "Polystichum acrostichoides", "Rudbeckia triloba var. triloba", "Lespedeza leptostachya", "Napaea dioica", "Baptisia lactea var. lactea", "Symphyotrichum shortii", "Botrychium campestre", "Berula erecta", "Melica nitens", "Jeffersonia diphylla", "Cirsium pumilum var. hillii", "Paronychia canadensis", "Minuartia dawsonensis", "Eupatorium sessilifolium", "Leersia lenticularis", "Gymnocladus dioica", "Vitis aestivalis var. argentifolia", "Crotalaria sagittalis", "Asclepias stenophylla", "Hamamelis virginiana", "Carex grayi", "Nuttallanthus canadensis", "Botrychium oneidense", "Arnoglossum plantagineum", "Panax quinquefolius", "Sagittaria brevirostra", "Carex careyana", "Hasteola suaveolens", "Parthenium integrifolium", "Chrysosplenium iowense", "Carex jamesii", "Arisaema dracontium", "Psoralidium tenuiflorum", "Poa wolfii", "Eryngium yuccifolium", "Triplasis purpurea var. purpurea", "Huperzia porophila", "Deparia acrostichoides", "Carex laxiculmis var. copulata", "Taenidia integerrima", "Carex davisii", "Prenanthes crepidinea"],
    'Hubbard': ["Cypripedium arietinum", "Gymnocarpium robertianum", "Botrychium rugulosum", "Najas gracillima", "Torreyochloa pallida", "Malaxis monophyllos var. brachypoda", "Malaxis paludosa", "Cirsium pumilum var. hillii", "Trichophorum clintonii", "Potamogeton oakesianus", "Botrychium simplex", "Eleocharis quinqueflora", "Najas guadalupensis ssp. olivacea", "Stuckenia vaginata", "Alisma gramineum"],
    'Isanti': ["Cypripedium arietinum", "Hydrocotyle americana", "Poa paludigena", "Rubus semisetosus", "Juglans cinerea", "Hudsonia tomentosa", "Gaylussacia baccata", "Potamogeton bicupulatus", "Fimbristylis autumnalis", "Rubus fulleri", "Bartonia virginica", "Platanthera flava var. herbiola", "Polygala cruciata", "Panax quinquefolius", "Viola lanceolata var. lanceolata", "Najas guadalupensis ssp. olivacea", "Rubus stipulatus", "Decodon verticillatus var. laevigatus"],
    'Itasca': ["Cypripedium arietinum", "Gymnocarpium robertianum", "Nymphaea leibergii", "Subularia aquatica ssp. americana", "Spiranthes casei var. casei", "Ruppia cirrhosa", "Carex pallescens", "Utricularia resupinata", "Botrychium rugulosum", "Botrychium ascendens", "Tsuga canadensis", "Xyris montana", "Polemonium occidentale ssp. lacustre", "Cardamine pratensis", "Botrychium mormo", "Dryopteris goldiana", "Najas gracillima", "Waldsteinia fragarioides var. fragarioides", "Torreyochloa pallida", "Elatine triandra", "Malaxis monophyllos var. brachypoda", "Botrychium lanceolatum ssp. angustisegmentum", "Botrychium minganense", "Utricularia geminiscapa", "Fimbristylis autumnalis", "Malaxis paludosa", "Botrychium campestre", "Adlumia fungosa", "Potamogeton oakesianus", "Botrychium simplex", "Eleocharis flavescens var. olivacea", "Eleocharis robbinsii", "Platanthera flava var. herbiola", "Juncus stygius var. americanus", "Botrychium oneidense", "Littorella americana", "Eleocharis quinqueflora", "Drosera anglica", "Najas guadalupensis ssp. olivacea", "Platanthera clavellata", "Stuckenia vaginata", "Carex ormostachya", "Botrychium pallidum", "Bidens discoidea", "Ranunculus lapponicus"],
    'Jackson': ["Rhynchospora capillacea", "Cypripedium candidum", "Asclepias sullivantii", "Scleria verticillata", "Trillium nivale", "Lespedeza leptostachya", "Botrychium campestre", "Panax quinquefolius", "Thaspium barbinode", "Eryngium yuccifolium"],
    'Kanabec': ["Rubus vermontanus", "Poa paludigena", "Rubus semisetosus", "Juglans cinerea", "Potamogeton bicupulatus", "Najas gracillima", "Botrychium lanceolatum ssp. angustisegmentum", "Botrychium minganense", "Botrychium simplex", "Eleocharis robbinsii", "Viola lanceolata var. lanceolata", "Rubus stipulatus", "Bidens discoidea", "Decodon verticillatus var. laevigatus", "Ranunculus lapponicus"],
    'Kandiyohi': ["Rhynchospora capillacea", "Cypripedium candidum", "Carex sterilis", "Ruppia cirrhosa", "Platanthera praeclara", "Gaillardia aristata", "Botrychium campestre", "Cirsium pumilum var. hillii", "Gymnocladus dioica", "Najas marina", "Panax quinquefolius", "Helianthus nuttallii ssp. rydbergii", "Najas guadalupensis ssp. olivacea"],
    'Kittson': ["Cypripedium candidum", "Avenula hookeri", "Calamagrostis montanensis", "Antennaria parvifolia", "Carex obtusata", "Platanthera praeclara", "Stellaria longipes ssp. longipes", "Gentiana affinis", "Hudsonia tomentosa", "Boechera retrofracta", "Erigeron lonchophyllus", "Androsace septentrionalis", "Orobanche ludoviciana var. ludoviciana", "Juniperus horizontalis", "Lysimachia maritima", "Elatine triandra", "Cladium mariscoides", "Botrychium minganense", "Carex scirpoidea", "Shepherdia canadensis", "Carex hallii", "Gaillardia aristata", "Orobanche fasciculata", "Botrychium campestre", "Carex xerantica", "Trichophorum clintonii", "Botrychium simplex", "Salix maccalliana", "Salix pseudomonticola", "Limosella aquatica", "Botrychium gallicomontanum", "Eleocharis quinqueflora", "Salicornia rubra", "Silene drummondii ssp. drummondii", "Alisma gramineum", "Gentianella amarella", "Carex garberi"],
    'Koochiching': ["Rhynchospora capillacea", "Cypripedium arietinum", "Carex exilis", "Nymphaea leibergii", "Carex sterilis", "Eleocharis rostellata", "Carex pallescens", "Botrychium rugulosum", "Botrychium ascendens", "Juncus articulatus", "Xyris montana", "Cardamine pratensis", "Botrychium lunaria", "Torreyochloa pallida", "Malaxis monophyllos var. brachypoda", "Cladium mariscoides", "Botrychium minganense", "Shepherdia canadensis", "Achillea alpina", "Malaxis paludosa", "Eleocharis nitida", "Botrychium simplex", "Salix maccalliana", "Juncus stygius var. americanus", "Caltha natans", "Eleocharis quinqueflora", "Drosera linearis", "Drosera anglica", "Botrychium pallidum", "Ranunculus lapponicus"],
    'Lac Qui Parle': ["Cypripedium candidum", "Buchloe dactyloides", "Bacopa rotundifolia", "Xanthisma spinulosum var. spinulosum", "Orobanche ludoviciana var. ludoviciana", "Elatine triandra", "Woodsia oregana ssp. cathcartiana", "Escobaria vivipara", "Carex hallii", "Botrychium campestre", "Berula erecta", "Aristida purpurea var. longiseta", "Viola nuttallii", "Panax quinquefolius", "Limosella aquatica", "Astragalus missouriensis var. missouriensis", "Schedonnardus paniculatus", "Eleocharis coloradoensis", "Dalea candida var. oligophylla", "Salicornia rubra", "Carex annectens", "Solidago mollis", "Heteranthera limosa", "Astragalus flexuosus var. flexuosus"],
    'Lake': ["Cypripedium arietinum", "Carex exilis", "Rubus vermontanus", "Nymphaea leibergii", "Subularia aquatica ssp. americana", "Carex rossii", "Tofieldia pusilla", "Carex pallescens", "Sagina nodosa ssp. borealis", "Arnica lonchophylla", "Utricularia resupinata", "Botrychium rugulosum", "Muhlenbergia uniflora", "Pinguicula vulgaris", "Luzula parviflora", "Xyris montana", "Boechera retrofracta", "Pyrola minor", "Carex media", "Myriophyllum heterophyllum", "Asplenium trichomanes ssp. trichomanes", "Carex praticola", "Bistorta vivipara", "Botrychium lunaria", "Botrychium mormo", "Moehringia macrophylla", "Juniperus horizontalis", "Najas gracillima", "Waldsteinia fragarioides var. fragarioides", "Torreyochloa pallida", "Euphrasia hudsoniana var. ramosior", "Calamagrostis lacustris", "Carex novae-angliae", "Woodsia oregana ssp. cathcartiana", "Botrychium lanceolatum ssp. angustisegmentum", "Cladium mariscoides", "Botrychium minganense", "Carex scirpoidea", "Utricularia geminiscapa", "Draba arabisans", "Shepherdia canadensis", "Fimbristylis autumnalis", "Allium schoenoprasum", "Trisetum spicatum", "Astragalus alpinus var. alpinus", "Eleocharis nitida", "Rubus chamaemorus", "Listera auriculata", "Callitriche heterophylla", "Salix pellita", "Potamogeton oakesianus", "Piptatherum canadense", "Botrychium simplex", "Eleocharis flavescens var. olivacea", "Eleocharis robbinsii", "Juncus stygius var. americanus", "Crataegus douglasii", "Huperzia appalachiana", "Littorella americana", "Phacelia franklinii", "Draba cana", "Eleocharis quinqueflora", "Drosera linearis", "Saxifraga paniculata", "Viola lanceolata var. lanceolata", "Woodsia glabella", "Carex michauxiana", "Poa wolfii", "Drosera anglica", "Huperzia porophila", "Platanthera clavellata", "Carex ormostachya", "Erigeron acris var. kamtschaticus", "Botrychium pallidum", "Woodsia alpina", "Polystichum braunii", "Bidens discoidea", "Ranunculus lapponicus", "Carex flava"],
    'Lake of the Woods': ["Cypripedium arietinum", "Carex exilis", "Gymnocarpium robertianum", "Nymphaea leibergii", "Antennaria parvifolia", "Botrychium rugulosum", "Botrychium ascendens", "Botrychium lunaria", "Juniperus horizontalis", "Malaxis monophyllos var. brachypoda", "Cladium mariscoides", "Botrychium minganense", "Botrychium campestre", "Minuartia dawsonensis", "Botrychium simplex", "Salix maccalliana", "Juncus stygius var. americanus", "Eleocharis quinqueflora", "Drosera linearis", "Drosera anglica", "Botrychium pallidum", "Ranunculus lapponicus", "Gentianella amarella"],
    'Le Sueur': ["Rhynchospora capillacea", "Cypripedium candidum", "Oenothera rhombipetala", "Carex sterilis", "Eleocharis rostellata", "Scleria verticillata", "Juglans cinerea", "Crataegus calpodendron", "Dryopteris goldiana", "Cladium mariscoides", "Berula erecta", "Gymnocladus dioica", "Phlox maculata", "Arnoglossum plantagineum", "Panax quinquefolius", "Eryngium yuccifolium", "Sagittaria calycina var. calycina"],
    'Lincoln': ["Rhynchospora capillacea", "Cypripedium candidum", "Calamagrostis montanensis", "Antennaria parvifolia", "Botrychium campestre", "Aristida purpurea var. longiseta", "Helianthus nuttallii ssp. rydbergii", "Eleocharis quinqueflora", "Astragalus missouriensis var. missouriensis", "Eleocharis coloradoensis", "Dalea candida var. oligophylla", "Solidago mollis", "Desmanthus illinoensis", "Astragalus flexuosus var. flexuosus"],
    'Lyon': ["Rhynchospora capillacea", "Cypripedium candidum", "Ruppia cirrhosa", "Bacopa rotundifolia", "Trillium nivale", "Berula erecta", "Najas marina", "Opuntia macrorhiza", "Panax quinquefolius", "Astragalus missouriensis var. missouriensis", "Desmanthus illinoensis", "Astragalus flexuosus var. flexuosus", "Alisma gramineum"],
    'Mahnomen': ["Cypripedium candidum", "Asclepias sullivantii", "Juglans cinerea", "Agalinis auriculata", "Cirsium pumilum var. hillii", "Panax quinquefolius"],
    'Marshall': ["Rhynchospora capillacea", "Cypripedium candidum", "Carex sterilis", "Ruppia cirrhosa", "Eleocharis rostellata", "Scleria verticillata", "Botrychium mormo", "Cladium mariscoides", "Carex hallii", "Eleocharis quinqueflora", "Drosera linearis", "Drosera anglica", "Najas guadalupensis ssp. olivacea", "Stuckenia vaginata"],
    'Martin': ["Rhynchospora capillacea", "Cypripedium candidum", "Avenula hookeri", "Carex sterilis", "Antennaria parvifolia", "Carex obtusata", "Botrychium ascendens", "Stellaria longipes ssp. longipes", "Androsace septentrionalis", "Botrychium lunaria", "Orobanche ludoviciana var. ludoviciana", "Botrychium minganense", "Carex scirpoidea", "Gaillardia aristata", "Achillea alpina", "Botrychium spathulatum", "Botrychium lineare", "Botrychium campestre", "Packera cana", "Carex xerantica", "Minuartia dawsonensis", "Botrychium simplex", "Salix maccalliana", "Salix pseudomonticola", "Limosella aquatica", "Botrychium gallicomontanum", "Eleocharis quinqueflora", "Stuckenia vaginata", "Carex hookerana", "Silene drummondii ssp. drummondii"],
    'McLeod': ["Cypripedium candidum", "Asclepias sullivantii", "Lespedeza leptostachya", "Agalinis auriculata", "Arnoglossum plantagineum", "Sagittaria brevirostra", "Eryngium yuccifolium", "Sagittaria calycina var. calycina"],
    'Meeker': ["Cypripedium candidum", "Hudsonia tomentosa", "Aristida purpurea var. longiseta", "Panax quinquefolius", "Najas guadalupensis ssp. olivacea", "Alisma gramineum"],
    'Mille Lacs': ["Poa paludigena", "Botrychium rugulosum", "Juglans cinerea", "Tsuga canadensis", "Botrychium mormo", "Najas gracillima", "Botrychium lanceolatum ssp. angustisegmentum", "Floerkea proserpinacoides", "Botrychium simplex", "Carex grayi", "Polygala cruciata", "Botrychium oneidense", "Panax quinquefolius", "Platanthera clavellata", "Alisma gramineum", "Ranunculus lapponicus"],
    'Morrison': ["Poa paludigena", "Eleocharis wolfii", "Rubus semisetosus", "Carex obtusata", "Botrychium rugulosum", "Juglans cinerea", "Hudsonia tomentosa", "Carex muskingumensis", "Besseya bullii", "Najas gracillima", "Botrychium lanceolatum ssp. angustisegmentum", "Fimbristylis autumnalis", "Cirsium pumilum var. hillii", "Trichophorum clintonii", "Botrychium simplex", "Eleocharis flavescens var. olivacea", "Platanthera flava var. herbiola", "Panax quinquefolius", "Juncus marginatus", "Drosera linearis", "Najas guadalupensis ssp. olivacea", "Silene drummondii ssp. drummondii"],
    'Mower': ["Cypripedium candidum", "Asclepias sullivantii", "Desmodium cuspidatum var. longifolium", "Baptisia bracteata var. glabrescens", "Platanthera praeclara", "Arnoglossum reniforme", "Juglans cinerea", "Crataegus calpodendron", "Boechera laevigata", "Valeriana edulis var. ciliata", "Dodecatheon meadia", "Rudbeckia triloba var. triloba", "Lespedeza leptostachya", "Napaea dioica", "Allium cernuum", "Baptisia lactea var. lactea", "Asclepias hirtella", "Gymnocladus dioica", "Phlox maculata", "Platanthera flava var. herbiola", "Carex grayi", "Arnoglossum plantagineum", "Panax quinquefolius", "Hasteola suaveolens", "Parthenium integrifolium", "Arisaema dracontium", "Eryngium yuccifolium", "Carex annectens", "Taenidia integerrima"],
    'Murray': ["Rhynchospora capillacea", "Cypripedium candidum", "Asclepias sullivantii", "Carex hallii", "Botrychium campestre", "Aristida purpurea var. longiseta", "Eleocharis quinqueflora"],
    'Nicollet': ["Cypripedium candidum", "Eleocharis wolfii", "Platanthera praeclara", "Trillium nivale", "Elatine triandra", "Agalinis auriculata", "Berula erecta", "Cyperus acuminatus", "Callitriche heterophylla", "Gymnocladus dioica", "Phlox maculata", "Opuntia macrorhiza", "Arnoglossum plantagineum", "Panax quinquefolius", "Thaspium barbinode", "Eryngium yuccifolium", "Carex annectens", "Desmanthus illinoensis"],
    'Nobles': ["Rhynchospora capillacea", "Cypripedium candidum", "Asclepias sullivantii", "Platanthera praeclara", "Lespedeza leptostachya", "Eryngium yuccifolium"],
    'Norman': ["Rhynchospora capillacea", "Cypripedium candidum", "Avenula hookeri", "Carex sterilis", "Eleocharis rostellata", "Calamagrostis montanensis", "Antennaria parvifolia", "Scleria verticillata", "Carex obtusata", "Platanthera praeclara", "Gentiana affinis", "Hudsonia tomentosa", "Erigeron lonchophyllus", "Juniperus horizontalis", "Achnatherum hymenoides", "Cladium mariscoides", "Botrychium minganense", "Carex scirpoidea", "Carex hallii", "Gaillardia aristata", "Orobanche fasciculata", "Botrychium campestre", "Botrychium simplex", "Salix maccalliana", "Helianthus nuttallii ssp. rydbergii", "Botrychium gallicomontanum", "Eleocharis quinqueflora", "Triplasis purpurea var. purpurea", "Shinnersoseris rostrata"],
    'Olmsted': ["Rhynchospora capillacea", "Sanicula trifoliata", "Dicentra canadensis", "Diplazium pycnocarpon", "Baptisia bracteata var. glabrescens", "Carex sterilis", "Scleria verticillata", "Arnoglossum reniforme", "Juglans cinerea", "Trillium nivale", "Boechera laevigata", "Dryopteris goldiana", "Juniperus horizontalis", "Valeriana edulis var. ciliata", "Draba arabisans", "Rudbeckia triloba var. triloba", "Lespedeza leptostachya", "Napaea dioica", "Allium cernuum", "Floerkea proserpinacoides", "Baptisia lactea var. lactea", "Botrychium campestre", "Jeffersonia diphylla", "Cirsium pumilum var. hillii", "Eupatorium sessilifolium", "Phlox maculata", "Carex formosa", "Arnoglossum plantagineum", "Panax quinquefolius", "Hasteola suaveolens", "Carex jamesii", "Poa wolfii", "Eryngium yuccifolium", "Deparia acrostichoides", "Carex laxiculmis var. copulata", "Hydrastis canadensis", "Taenidia integerrima", "Rhodiola integrifolia ssp. leedyi"],
    'Otter Tail': ["Rhynchospora capillacea", "Cypripedium candidum", "Chamaesyce missurica", "Carex sterilis", "Ruppia cirrhosa", "Stellaria longipes ssp. longipes", "Gentiana affinis", "Orobanche ludoviciana var. ludoviciana", "Juniperus horizontalis", "Torreyochloa pallida", "Malaxis monophyllos var. brachypoda", "Gaillardia aristata", "Malaxis paludosa", "Botrychium campestre", "Cirsium pumilum var. hillii", "Aristida purpurea var. longiseta", "Najas marina", "Panax quinquefolius", "Eleocharis quinqueflora", "Najas guadalupensis ssp. olivacea", "Stuckenia vaginata", "Alisma gramineum"],
    'Pennington': ["Rhynchospora capillacea", "Cypripedium candidum", "Avenula hookeri", "Carex sterilis", "Carex obtusata", "Platanthera praeclara", "Gentiana affinis", "Carex scirpoidea", "Carex hallii", "Gaillardia aristata", "Salix maccalliana", "Salix pseudomonticola", "Eleocharis quinqueflora"],
    'Pine': ["Desmodium nudiflorum", "Hydrocotyle americana", "Poa paludigena", "Lysimachia quadrifolia", "Botrychium rugulosum", "Juglans cinerea", "Crocanthemum canadense", "Tsuga canadensis", "Carex media", "Gaylussacia baccata", "Potamogeton bicupulatus", "Najas gracillima", "Waldsteinia fragarioides var. fragarioides", "Utricularia purpurea", "Torreyochloa pallida", "Elatine triandra", "Malaxis monophyllos var. brachypoda", "Botrychium lanceolatum ssp. angustisegmentum", "Cladium mariscoides", "Persicaria careyi", "Fimbristylis autumnalis", "Rubus fulleri", "Cirsium pumilum var. hillii", "Botrychium simplex", "Eleocharis flavescens var. olivacea", "Eleocharis robbinsii", "Huperzia appalachiana", "Botrychium oneidense", "Panax quinquefolius", "Chrysosplenium iowense", "Viola lanceolata var. lanceolata", "Najas guadalupensis ssp. olivacea", "Carex ormostachya", "Bidens discoidea", "Decodon verticillatus var. laevigatus", "Ranunculus lapponicus"],
    'Pipestone': ["Rhynchospora capillacea", "Cypripedium candidum", "Buchloe dactyloides", "Eleocharis wolfii", "Platanthera praeclara", "Isoetes melanopoda", "Bacopa rotundifolia", "Elatine triandra", "Woodsia oregana ssp. cathcartiana", "Botrychium campestre", "Cyperus acuminatus", "Marsilea vestita", "Plantago elongata", "Callitriche heterophylla", "Aristida purpurea var. longiseta", "Opuntia macrorhiza", "Sagittaria brevirostra", "Limosella aquatica", "Eleocharis quinqueflora", "Schedonnardus paniculatus", "Plagiobothrys scouleri var. penicillatus", "Dalea candida var. oligophylla", "Solidago mollis", "Heteranthera limosa"],
    'Polk': ["Rhynchospora capillacea", "Cypripedium candidum", "Cypripedium arietinum", "Avenula hookeri", "Carex sterilis", "Ruppia cirrhosa", "Eleocharis rostellata", "Calamagrostis montanensis", "Antennaria parvifolia", "Scleria verticillata", "Carex obtusata", "Botrychium rugulosum", "Platanthera praeclara", "Gentiana affinis", "Hudsonia tomentosa", "Erigeron lonchophyllus", "Botrychium mormo", "Orobanche ludoviciana var. ludoviciana", "Juniperus horizontalis", "Achnatherum hymenoides", "Malaxis monophyllos var. brachypoda", "Cladium mariscoides", "Carex scirpoidea", "Carex hallii", "Gaillardia aristata", "Orobanche fasciculata", "Botrychium campestre", "Packera cana", "Aristida purpurea var. longiseta", "Salix maccalliana", "Carex formosa", "Najas marina", "Eleocharis quinqueflora", "Botrychium pallidum", "Shinnersoseris rostrata", "Silene drummondii ssp. drummondii", "Gentianella amarella"],
    'Pope': ["Rhynchospora capillacea", "Cypripedium candidum", "Carex sterilis", "Ruppia cirrhosa", "Scleria verticillata", "Juniperus horizontalis", "Botrychium campestre", "Berula erecta", "Cirsium pumilum var. hillii", "Botrychium simplex", "Najas marina", "Panax quinquefolius", "Eleocharis quinqueflora", "Eleocharis coloradoensis", "Dalea candida var. oligophylla"],
    'Ramsey': ["Cypripedium candidum", "Rubus semisetosus", "Juncus articulatus", "Juglans cinerea", "Crocanthemum canadense", "Aristida tuberculosa", "Hudsonia tomentosa", "Gaylussacia baccata", "Besseya bullii", "Rotala ramosior", "Najas gracillima", "Quercus bicolor", "Orobanche uniflora", "Agalinis gattingeri", "Fimbristylis autumnalis", "Baptisia lactea var. lactea", "Cirsium pumilum var. hillii", "Bartonia virginica", "Trichophorum clintonii", "Gymnocladus dioica", "Crotalaria sagittalis", "Carex formosa", "Platanthera flava var. herbiola", "Scleria triglomerata", "Polygala cruciata", "Eleocharis quinqueflora", "Rubus multifer", "Aureolaria pedicularia", "Viola lanceolata var. lanceolata", "Najas guadalupensis ssp. olivacea", "Platanthera clavellata", "Potamogeton diversifolius", "Taenidia integerrima", "Decodon verticillatus var. laevigatus"],
    'Red Lake': ["Rhynchospora capillacea", "Cypripedium candidum", "Avenula hookeri", "Carex sterilis", "Platanthera praeclara", "Gentiana affinis", "Carex scirpoidea", "Carex hallii", "Gaillardia aristata", "Trichophorum clintonii", "Salix maccalliana"],
    'Redwood': ["Rhynchospora capillacea", "Cypripedium candidum", "Eleocharis wolfii", "Asclepias sullivantii", "Scleria verticillata", "Bacopa rotundifolia", "Elatine triandra", "Woodsia oregana ssp. cathcartiana", "Cladium mariscoides", "Lespedeza leptostachya", "Gymnocladus dioica", "Fimbristylis puberula var. interior", "Opuntia macrorhiza", "Eleocharis quinqueflora", "Schedonnardus paniculatus", "Psoralidium tenuiflorum", "Astragalus flexuosus var. flexuosus"],
    'Renville': ["Cypripedium candidum", "Buchloe dactyloides", "Eleocharis wolfii", "Asclepias sullivantii", "Bacopa rotundifolia", "Besseya bullii", "Woodsia oregana ssp. cathcartiana", "Lespedeza leptostachya", "Agalinis auriculata", "Gymnocladus dioica", "Aristida purpurea var. longiseta", "Opuntia macrorhiza", "Panax quinquefolius", "Astragalus missouriensis var. missouriensis", "Psoralidium tenuiflorum"],
    'Rice': ["Cypripedium candidum", "Dicentra canadensis", "Asclepias sullivantii", "Desmodium cuspidatum var. longifolium", "Baptisia bracteata var. glabrescens", "Carex sterilis", "Juglans cinerea", "Crocanthemum canadense", "Phemeranthus rugospermus", "Crataegus calpodendron", "Besseya bullii", "Scutellaria ovata var. versicolor", "Najas gracillima", "Valeriana edulis var. ciliata", "Orobanche uniflora", "Agalinis gattingeri", "Lespedeza leptostachya", "Berula erecta", "Cirsium pumilum var. hillii", "Gymnocladus dioica", "Carex grayi", "Lechea tenuifolia var. tenuifolia", "Carex conjuncta", "Panax quinquefolius", "Arisaema dracontium", "Eryngium yuccifolium", "Rubus stipulatus", "Hydrastis canadensis", "Taenidia integerrima", "Erythronium propullans", "Carex davisii"],
    'Rock': ["Cypripedium candidum", "Buchloe dactyloides", "Eleocharis wolfii", "Platanthera praeclara", "Isoetes melanopoda", "Bacopa rotundifolia", "Verbena simplex", "Elatine triandra", "Woodsia oregana ssp. cathcartiana", "Lespedeza leptostachya", "Cyperus acuminatus", "Marsilea vestita", "Plantago elongata", "Callitriche heterophylla", "Opuntia macrorhiza", "Limosella aquatica", "Schedonnardus paniculatus", "Plagiobothrys scouleri var. penicillatus", "Crassula aquatica", "Heteranthera limosa"],
    'Roseau': ["Rhynchospora capillacea", "Cypripedium arietinum", "Gymnocarpium robertianum", "Nymphaea leibergii", "Carex sterilis", "Antennaria parvifolia", "Carex obtusata", "Botrychium rugulosum", "Botrychium ascendens", "Gentiana affinis", "Androsace septentrionalis", "Botrychium lunaria", "Malaxis monophyllos var. brachypoda", "Cladium mariscoides", "Botrychium minganense", "Shepherdia canadensis", "Gaillardia aristata", "Achillea alpina", "Botrychium campestre", "Carex xerantica", "Minuartia dawsonensis", "Botrychium simplex", "Salix maccalliana", "Helianthus nuttallii ssp. rydbergii", "Eleocharis quinqueflora", "Drosera linearis", "Drosera anglica", "Botrychium pallidum", "Ranunculus lapponicus"],
    'Scott': ["Cypripedium arietinum", "Deschampsia flexuosa", "Carex exilis", "Gymnocarpium robertianum", "Hydrocotyle americana", "Rubus vermontanus", "Nymphaea leibergii", "Subularia aquatica ssp. americana", "Spiranthes casei var. casei", "Carex pallescens", "Utricularia resupinata", "Potamogeton confervoides", "Botrychium rugulosum", "Muhlenbergia uniflora", "Botrychium ascendens", "Tsuga canadensis", "Xyris montana", "Hudsonia tomentosa", "Pyrola minor", "Polemonium occidentale ssp. lacustre", "Ammophila breviligulata ssp. breviligulata", "Myriophyllum heterophyllum", "Bistorta vivipara", "Cardamine pratensis", "Botrychium lunaria", "Botrychium mormo", "Juniperus horizontalis", "Najas gracillima", "Waldsteinia fragarioides var. fragarioides", "Torreyochloa pallida", "Euphrasia hudsoniana var. ramosior", "Calamagrostis lacustris", "Carex novae-angliae", "Elatine triandra", "Woodsia oregana ssp. cathcartiana", "Malaxis monophyllos var. brachypoda", "Botrychium lanceolatum ssp. angustisegmentum", "Cladium mariscoides", "Botrychium minganense", "Utricularia geminiscapa", "Shepherdia canadensis", "Fimbristylis autumnalis", "Botrychium acuminatum", "Allium schoenoprasum", "Botrychium spathulatum", "Trisetum spicatum", "Botrychium lineare", "Botrychium campestre", "Eleocharis nitida", "Rubus chamaemorus", "Listera auriculata", "Adlumia fungosa", "Callitriche heterophylla", "Salix pellita", "Potamogeton oakesianus", "Piptatherum canadense", "Botrychium simplex", "Eleocharis flavescens var. olivacea", "Eleocharis robbinsii", "Juncus stygius var. americanus", "Huperzia appalachiana", "Botrychium oneidense", "Salix pseudomonticola", "Caltha natans", "Littorella americana", "Phacelia franklinii", "Eleocharis quinqueflora", "Viola lanceolata var. lanceolata", "Carex michauxiana", "Drosera anglica", "Huperzia porophila", "Platanthera clavellata", "Stuckenia vaginata", "Carex ormostachya", "Crassula aquatica", "Packera indecora", "Botrychium pallidum", "Woodsia alpina", "Bidens discoidea", "Ranunculus lapponicus", "Carex flava", "Carex garberi", "Elodea bifoliata"],
    'Sherburne': ["Rhynchospora capillacea", "Cypripedium candidum", "Oenothera rhombipetala", "Eleocharis wolfii", "Desmodium cuspidatum var. longifolium", "Carex sterilis", "Eleocharis rostellata", "Scleria verticillata", "Juglans cinerea", "Phemeranthus rugospermus", "Bacopa rotundifolia", "Verbena simplex", "Besseya bullii", "Orobanche ludoviciana var. ludoviciana", "Valeriana edulis var. ciliata", "Cladium mariscoides", "Baptisia lactea var. lactea", "Berula erecta", "Cirsium pumilum var. hillii", "Gymnocladus dioica", "Panax quinquefolius", "Sagittaria brevirostra", "Polanisia jamesii", "Eryngium yuccifolium"],
    'Sibley': ["Rubus semisetosus", "Antennaria parvifolia", "Botrychium rugulosum", "Juglans cinerea", "Crocanthemum canadense", "Aristida tuberculosa", "Hudsonia tomentosa", "Juniperus horizontalis", "Fimbristylis autumnalis", "Cirsium pumilum var. hillii", "Bartonia virginica", "Trichophorum clintonii", "Minuartia dawsonensis", "Botrychium simplex", "Platanthera flava var. herbiola", "Scleria triglomerata", "Nuttallanthus canadensis", "Polygala cruciata", "Botrychium oneidense", "Viola lanceolata var. lanceolata", "Shinnersoseris rostrata"],
    'St. Louis': ["Asclepias sullivantii", "Juglans cinerea", "Gymnocladus dioica", "Panax quinquefolius", "Carex annectens", "Sagittaria calycina var. calycina"],
    'Stearns': ["Rhynchospora capillacea", "Cypripedium candidum", "Cypripedium arietinum", "Sanicula trifoliata", "Carex sterilis", "Ruppia cirrhosa", "Juglans cinerea", "Botrychium mormo", "Cladium mariscoides", "Floerkea proserpinacoides", "Cirsium pumilum var. hillii", "Trichophorum clintonii", "Platanthera flava var. herbiola", "Najas marina", "Panax quinquefolius", "Eleocharis quinqueflora", "Rubus multifer", "Najas guadalupensis ssp. olivacea"],
    'Steele': ["Cypripedium candidum", "Asclepias sullivantii", "Baptisia bracteata var. glabrescens", "Crataegus calpodendron", "Carex muskingumensis", "Valeriana edulis var. ciliata", "Phlox maculata", "Arnoglossum plantagineum", "Parthenium integrifolium", "Arisaema dracontium", "Eryngium yuccifolium", "Taenidia integerrima", "Erythronium propullans", "Carex davisii"],
    'Stevens': ["Cypripedium candidum", "Desmanthus illinoensis", "Alisma gramineum"],
    'Swift': ["Rhynchospora capillacea", "Cypripedium candidum", "Carex sterilis", "Bacopa rotundifolia", "Xanthisma spinulosum var. spinulosum", "Elatine triandra", "Cyperus acuminatus", "Najas marina", "Desmanthus illinoensis", "Astragalus flexuosus var. flexuosus"],
    'Todd': ["Cypripedium candidum", "Rubus semisetosus", "Botrychium rugulosum", "Rubus fulleri", "Cirsium pumilum var. hillii", "Eleocharis flavescens var. olivacea", "Panax quinquefolius", "Najas guadalupensis ssp. olivacea"],
    'Traverse': ["Eleocharis wolfii", "Asclepias sullivantii", "Calamagrostis montanensis", "Antennaria parvifolia", "Bacopa rotundifolia", "Xanthisma spinulosum var. spinulosum", "Botrychium campestre", "Cyperus acuminatus", "Aristida purpurea var. longiseta", "Viola nuttallii", "Astragalus missouriensis var. missouriensis", "Dalea candida var. oligophylla", "Solidago mollis", "Desmanthus illinoensis", "Astragalus flexuosus var. flexuosus", "Alisma gramineum"],
    'Wabasha': ["Desmodium nudiflorum", "Sanicula trifoliata", "Dicentra canadensis", "Oenothera rhombipetala", "Carex laevivaginata", "Diplazium pycnocarpon", "Baptisia bracteata var. glabrescens", "Phegopteris hexagonoptera", "Carex typhina", "Arnoglossum reniforme", "Juglans cinerea", "Pellaea atropurpurea", "Crocanthemum canadense", "Phemeranthus rugospermus", "Aristida tuberculosa", "Hudsonia tomentosa", "Crataegus calpodendron", "Carex muskingumensis", "Trillium nivale", "Besseya bullii", "Boechera laevigata", "Carex plantaginea", "Scutellaria ovata var. versicolor", "Dryopteris goldiana", "Juniperus horizontalis", "Asclepias amplexicaulis", "Quercus bicolor", "Tephrosia virginiana", "Commelina erecta", "Valeriana edulis var. ciliata", "Orobanche uniflora", "Agalinis gattingeri", "Asplenium platyneuron", "Orobanche fasciculata", "Napaea dioica", "Floerkea proserpinacoides", "Baptisia lactea var. lactea", "Botrychium campestre", "Jeffersonia diphylla", "Cirsium pumilum var. hillii", "Trichophorum clintonii", "Minuartia dawsonensis", "Leersia lenticularis", "Gymnocladus dioica", "Vitis aestivalis var. argentifolia", "Phlox maculata", "Platanthera flava var. herbiola", "Carex grayi", "Nuttallanthus canadensis", "Panax quinquefolius", "Carex careyana", "Hasteola suaveolens", "Carex jamesii", "Arisaema dracontium", "Carex crus-corvi", "Eryngium yuccifolium", "Carex annectens", "Triplasis purpurea var. purpurea", "Sagittaria calycina var. calycina", "Deparia acrostichoides", "Carex laxiculmis var. copulata", "Taenidia integerrima", "Carex davisii", "Bidens discoidea"],
    'Wadena': ["Cypripedium arietinum", "Rubus vermontanus", "Rubus semisetosus", "Malaxis monophyllos var. brachypoda", "Rubus fulleri", "Cirsium pumilum var. hillii", "Potamogeton oakesianus", "Botrychium simplex", "Najas guadalupensis ssp. olivacea", "Botrychium pallidum"],
    'Waseca': ["Cypripedium candidum", "Asclepias sullivantii", "Juglans cinerea", "Dryopteris goldiana", "Valeriana edulis var. ciliata", "Gymnocladus dioica", "Arnoglossum plantagineum", "Eryngium yuccifolium"],
    'Washington': ["Desmodium nudiflorum", "Hydrocotyle americana", "Poa paludigena", "Rubus semisetosus", "Carex typhina", "Botrychium rugulosum", "Juglans cinerea", "Crocanthemum canadense", "Aristida tuberculosa", "Hudsonia tomentosa", "Bacopa rotundifolia", "Gaylussacia baccata", "Potamogeton bicupulatus", "Paronychia fastigiata var. fastigiata", "Besseya bullii", "Rotala ramosior", "Orobanche ludoviciana var. ludoviciana", "Dryopteris goldiana", "Juniperus horizontalis", "Orobanche uniflora", "Agalinis gattingeri", "Fimbristylis autumnalis", "Baptisia lactea var. lactea", "Berula erecta", "Rubus fulleri", "Cirsium pumilum var. hillii", "Bartonia virginica", "Trichophorum clintonii", "Minuartia dawsonensis", "Gymnocladus dioica", "Botrychium simplex", "Crotalaria sagittalis", "Platanthera flava var. herbiola", "Scleria triglomerata", "Lechea tenuifolia var. tenuifolia", "Nuttallanthus canadensis", "Polygala cruciata", "Botrychium oneidense", "Opuntia macrorhiza", "Panax quinquefolius", "Sagittaria brevirostra", "Ruellia humilis", "Arisaema dracontium", "Rubus multifer", "Polanisia jamesii", "Aureolaria pedicularia", "Viola lanceolata var. lanceolata", "Triplasis purpurea var. purpurea", "Platanthera clavellata", "Sagittaria calycina var. calycina", "Decodon verticillatus var. laevigatus"],
    'Watonwan': ["Asclepias sullivantii", "Arnoglossum plantagineum", "Eryngium yuccifolium"],
    'Wilkin': ["Rhynchospora capillacea", "Cypripedium candidum", "Carex sterilis", "Scleria verticillata", "Gentiana affinis", "Bacopa rotundifolia", "Erigeron lonchophyllus", "Carex scirpoidea", "Carex hallii", "Fimbristylis puberula var. interior", "Helianthus nuttallii ssp. rydbergii", "Eleocharis quinqueflora"],
    'Winona': ["Rhynchospora capillacea", "Cypripedium candidum", "Desmodium nudiflorum", "Sullivantia sullivantii", "Sanicula trifoliata", "Dicentra canadensis", "Gymnocarpium robertianum", "Carex laevivaginata", "Diplazium pycnocarpon", "Baptisia bracteata var. glabrescens", "Carex sterilis", "Phegopteris hexagonoptera", "Carex typhina", "Arnoglossum reniforme", "Juglans cinerea", "Pellaea atropurpurea", "Rorippa sessiliflora", "Crocanthemum canadense", "Phemeranthus rugospermus", "Aristida tuberculosa", "Hudsonia tomentosa", "Gaylussacia baccata", "Carex muskingumensis", "Trillium nivale", "Paronychia fastigiata var. fastigiata", "Boechera laevigata", "Carex plantaginea", "Scutellaria ovata var. versicolor", "Silene nivea", "Orobanche ludoviciana var. ludoviciana", "Dryopteris goldiana", "Juniperus horizontalis", "Asclepias amplexicaulis", "Quercus bicolor", "Tephrosia virginiana", "Woodsia oregana ssp. cathcartiana", "Valeriana edulis var. ciliata", "Orobanche uniflora", "Agalinis gattingeri", "Asplenium platyneuron", "Polystichum acrostichoides", "Orobanche fasciculata", "Napaea dioica", "Allium cernuum", "Floerkea proserpinacoides", "Symphyotrichum shortii", "Botrychium campestre", "Berula erecta", "Jeffersonia diphylla", "Cirsium pumilum var. hillii", "Trichophorum clintonii", "Eupatorium sessilifolium", "Leersia lenticularis", "Gymnocladus dioica", "Montia chamissoi", "Vitis aestivalis var. argentifolia", "Phlox maculata", "Hamamelis virginiana", "Carex grayi", "Nuttallanthus canadensis", "Polygala cruciata", "Botrychium oneidense", "Arnoglossum plantagineum", "Panax quinquefolius", "Carex careyana", "Hybanthus concolor", "Carex jamesii", "Arisaema dracontium", "Aureolaria pedicularia", "Viola lanceolata var. lanceolata", "Thaspium barbinode", "Poa wolfii", "Eryngium yuccifolium", "Triplasis purpurea var. purpurea", "Huperzia porophila", "Agrostis hyemalis", "Sagittaria calycina var. calycina", "Deparia acrostichoides", "Carex laxiculmis var. copulata", "Hydrastis canadensis", "Taenidia integerrima", "Bidens discoidea"],
    'Wright': ["Cypripedium arietinum", "Ruppia cirrhosa", "Juglans cinerea", "Aristida tuberculosa", "Najas gracillima", "Cirsium pumilum var. hillii", "Panax quinquefolius", "Najas guadalupensis ssp. olivacea", "Bidens discoidea"],
    'Yellow Medicine': ["Rhynchospora capillacea", "Cypripedium candidum", "Asclepias sullivantii", "Bacopa rotundifolia", "Xanthisma spinulosum var. spinulosum", "Woodsia oregana ssp. cathcartiana", "Carex hallii", "Orobanche fasciculata", "Botrychium campestre", "Berula erecta", "Cyperus acuminatus", "Gymnocladus dioica", "Viola nuttallii", "Opuntia macrorhiza", "Panax quinquefolius", "Astragalus missouriensis var. missouriensis", "Dalea candida var. oligophylla", "Carex annectens", "Astragalus flexuosus var. flexuosus"]
};

// Lookup for getting common names as well
var sci_name_lookup = {
    "Cypripedium arietinum": "Ram's Head Orchid",
    "Rubus vermontanus": "Vermont Bristle-berry",
    "Poa paludigena": "Bog Bluegrass",
    "Rubus semisetosus": "Swamp Blackberry",
    "Botrychium rugulosum": "St. Lawrence Grapefern",
    "Juncus articulatus": "Jointed Rush",
    "Juglans cinerea": "Butternut",
    "Crocanthemum canadense": "Canada Frostweed",
    "Potamogeton bicupulatus": "Snailseed Pondweed",
    "Cardamine pratensis": "Cuckoo Flower",
    "Botrychium mormo": "Goblin Fern",
    "Najas gracillima": "Slender Naiad",
    "Utricularia purpurea": "Purple-flowered Bladderwort",
    "Torreyochloa pallida": "Torrey's Mannagrass",
    "Malaxis monophyllos var. brachypoda": "White Adder's Mouth",
    "Botrychium lanceolatum ssp. angustisegmentum": "Narrow Triangle Moonwort",
    "Utricularia geminiscapa": "Hidden-fruit Bladderwort",
    "Floerkea proserpinacoides": "False Mermaid",
    "Potamogeton oakesianus": "Oakes' Pondweed",
    "Botrychium simplex": "Least Moonwort",
    "Eleocharis flavescens var. olivacea": "Olivaceous Spikerush",
    "Eleocharis robbinsii": "Robbins' Spikerush",
    "Botrychium oneidense": "Blunt-lobed Grapefern",
    "Panax quinquefolius": "American Ginseng",
    "Littorella americana": "American Shore Plantain",
    "Platanthera clavellata": "Small Green Wood Orchid",
    "Botrychium pallidum": "Pale Moonwort",
    "Bidens discoidea": "Discoid Beggarticks",
    "Alisma gramineum": "Narrow-leaved Water Plantain",
    "Ranunculus lapponicus": "Lapland Buttercup",
    "Oenothera rhombipetala": "Rhombic Evening Primrose",
    "Aristida tuberculosa": "Seaside Three-awn",
    "Hudsonia tomentosa": "Beach Heather",
    "Gaylussacia baccata": "Black Huckleberry",
    "Aristida longespica var. geniculata": "Slimspike Three-awn",
    "Besseya bullii": "Kitten-tails",
    "Rotala ramosior": "Toothcup",
    "Orobanche uniflora": "One-flowered Broomrape",
    "Rubus missouricus": "Missouri Bristle-berry",
    "Fimbristylis autumnalis": "Autumn Fimbry",
    "Baptisia lactea var. lactea": "White Wild Indigo",
    "Rubus fulleri": "a bristle-berry",
    "Bartonia virginica": "Yellow Bartonia",
    "Trichophorum clintonii": "Clinton's Bulrush",
    "Minuartia dawsonensis": "Rock Sandwort",
    "Xyris torta": "Twisted Yellow-eyed Grass",
    "Platanthera flava var. herbiola": "Tubercled Rein Orchid",
    "Scleria triglomerata": "Tall Nutrush",
    "Carex grayi": "Gray's Sedge",
    "Nuttallanthus canadensis": "Old Field Toadflax",
    "Polygala cruciata": "Cross-leaved Milkwort",
    "Juncus marginatus": "Marginated Rush",
    "Rubus multifer": "Kinnickinnick Dewberry",
    "Viola lanceolata var. lanceolata": "Lance-leaf Violet",
    "Najas guadalupensis ssp. olivacea": "Olive-colored Southern Naiad",
    "Triplasis purpurea var. purpurea": "Purple Sandgrass",
    "Rubus stipulatus": "A Bristle-berry",
    "Potamogeton diversifolius": "Diverse-leaved Pondweed",
    "Decodon verticillatus var. laevigatus": "Water-willow",
    "Rhynchospora capillacea": "Hair-like Beak Rush",
    "Cypripedium candidum": "Small White Lady's-slipper",
    "Gymnocarpium robertianum": "Northern Oak Fern",
    "Carex sterilis": "Sterile Sedge",
    "Ruppia cirrhosa": "Spiral Ditchgrass",
    "Eleocharis rostellata": "Beaked Spikerush",
    "Scleria verticillata": "Whorled Nutrush",
    "Carex obtusata": "Blunt Sedge",
    "Orobanche ludoviciana var. ludoviciana": "Louisiana Broomrape",
    "Cladium mariscoides": "Twig Rush",
    "Botrychium minganense": "Mingan Moonwort",
    "Carex scirpoidea": "Northern Single-spike Sedge",
    "Gaillardia aristata": "Blanketflower",
    "Malaxis paludosa": "Bog Adder's Mouth",
    "Botrychium campestre": "Prairie Moonwort",
    "Berula erecta": "Stream Parsnip",
    "Cirsium pumilum var. hillii": "Hill's Thistle",
    "Drosera anglica": "English Sundew",
    "Stuckenia vaginata": "Sheathed Pondweed",
    "Carex hookerana": "Hooker's Sedge",
    "Gentianella amarella": "Felwort",
    "Carex exilis": "Coastal Sedge",
    "Nymphaea leibergii": "Small White Waterlily",
    "Xyris montana": "Montane Yellow-eyed Grass",
    "Botrychium lunaria": "Common Moonwort",
    "Dryopteris goldiana": "Goldie's Fern",
    "Waldsteinia fragarioides var. fragarioides": "Barren Strawberry",
    "Salix maccalliana": "McCalla's Willow",
    "Juncus stygius var. americanus": "Bog Rush",
    "Eleocharis quinqueflora": "Few-flowered Spikerush",
    "Drosera linearis": "Linear-leaved Sundew",
    "Silene drummondii ssp. drummondii": "Drummond's Campion",
    "Isoetes melanopoda": "Prairie Quillwort",
    "Bacopa rotundifolia": "Waterhyssop",
    "Xanthisma spinulosum var. spinulosum": "Cutleaf Ironplant",
    "Elatine triandra": "Three-stamened Waterwort",
    "Woodsia oregana ssp. cathcartiana": "Oregon Woodsia",
    "Escobaria vivipara": "Ball Cactus",
    "Agalinis auriculata": "Eared False Foxglove",
    "Cyperus acuminatus": "Short-pointed Umbrella-sedge",
    "Marsilea vestita": "Hairy Waterclover",
    "Callitriche heterophylla": "Larger Water Starwort",
    "Aristida purpurea var. longiseta": "Red Three-awn",
    "Najas marina": "Sea Naiad",
    "Limosella aquatica": "Mudwort",
    "Astragalus missouriensis var. missouriensis": "Missouri Milk-vetch",
    "Schedonnardus paniculatus": "Tumble Grass",
    "Eleocharis coloradoensis": "Dwarf Spikerush",
    "Dalea candida var. oligophylla": "Western White Prairie-clover",
    "Solidago mollis": "Soft Goldenrod",
    "Desmanthus illinoensis": "Prairie Mimosa",
    "Astragalus flexuosus var. flexuosus": "Slender Milk-vetch",
    "Asclepias sullivantii": "Sullivant's Milkweed",
    "Trillium nivale": "Snow Trillium",
    "Rudbeckia triloba var. triloba": "Three-leaved Coneflower",
    "Gymnocladus dioica": "Kentucky Coffee Tree",
    "Opuntia macrorhiza": "Devil's Tongue",
    "Arnoglossum plantagineum": "Tuberous Indian-plantain",
    "Arisaema dracontium": "Green Dragon",
    "Thaspium barbinode": "Hairy-jointed Meadow-parsnip",
    "Eryngium yuccifolium": "Rattlesnake Master",
    "Carex annectens": "Yellow-fruit Sedge",
    "Huperzia porophila": "Rock Fir Moss",
    "Sagittaria calycina var. calycina": "Hooded Arrowhead",
    "Elodea bifoliata": "Two Leaf Waterweed",
    "Buchloe dactyloides": "Buffalo Grass",
    "Lespedeza leptostachya": "Prairie Bush Clover",
    "Carex rossii": "Ross' Sedge",
    "Tsuga canadensis": "Eastern Hemlock",
    "Pyrola minor": "Small Shinleaf",
    "Shepherdia canadensis": "Soapberry",
    "Persicaria careyi": "Carey's Smartweed",
    "Allium schoenoprasum": "Wild Chives",
    "Salix pseudomonticola": "False Mountain Willow",
    "Rubus quaesitus": "Prince Edward Island Blackberry",
    "Carex ormostachya": "Necklace Sedge",
    "Desmodium cuspidatum var. longifolium": "Big Tick Trefoil",
    "Rorippa sessiliflora": "Sessile-flowered Yellow Cress",
    "Verbena simplex": "Narrow-leaved Vervain",
    "Boechera laevigata": "Smooth Rock Cress",
    "Valeriana edulis var. ciliata": "Edible Valerian",
    "Sagittaria brevirostra": "Short-beaked Arrowhead",
    "Erythronium propullans": "Dwarf Trout Lily",
    "Potamogeton pulcher": "Spotted Pondweed",
    "Adlumia fungosa": "Allegheny Vine",
    "Desmodium nudiflorum": "Stemless Tick Trefoil",
    "Hydrocotyle americana": "American Water-pennywort",
    "Lysimachia quadrifolia": "Whorled Loosestrife",
    "Antennaria parvifolia": "Small-leaved Pussytoes",
    "Carex typhina": "Cattail Sedge",
    "Phemeranthus rugospermus": "Rough-seeded Fameflower",
    "Crataegus calpodendron": "Late Hawthorn",
    "Carex muskingumensis": "Muskingum Sedge",
    "Crotalaria sagittalis": "Rattlebox",
    "Hamamelis virginiana": "Witch-hazel",
    "Avenula hookeri": "Spike Oat",
    "Calamagrostis montanensis": "Plains Reedgrass",
    "Platanthera praeclara": "Western Prairie Fringed Orchid",
    "Gentiana affinis": "Northern Gentian",
    "Cymopterus glomeratus": "Plains Spring Parsley",
    "Carex hallii": "Hall's Sedge",
    "Orobanche fasciculata": "Clustered Broomrape",
    "Carex xerantica": "Dry Sedge",
    "Helianthus nuttallii ssp. rydbergii": "Nuttall's Sunflower",
    "Carex formosa": "Handsome Sedge",
    "Poa wolfii": "Wolf's Bluegrass",
    "Deschampsia flexuosa": "Slender Hair Grass",
    "Calamagrostis purpurascens": "Purple Reedgrass",
    "Woodsia scopulina ssp. laurentiana": "Rocky Mountain Woodsia",
    "Subularia aquatica ssp. americana": "Awlwort",
    "Tofieldia pusilla": "Small False Asphodel",
    "Osmorhiza depauperata": "Blunt-fruited Sweet Cicely",
    "Carex pallescens": "Pale Sedge",
    "Empetrum nigrum": "Black Crowberry",
    "Selaginella selaginoides": "Northern Spikemoss",
    "Sagina nodosa ssp. borealis": "Knotty Pearlwort",
    "Arnica lonchophylla": "Long-leaved Arnica",
    "Utricularia resupinata": "Lavender Bladderwort",
    "Muhlenbergia uniflora": "One-flowered Muhly",
    "Pinguicula vulgaris": "Butterwort",
    "Luzula parviflora": "Small-flowered Woodrush",
    "Draba norvegica": "Norwegian Whitlow Grass",
    "Boechera retrofracta": "Reflexed Rock-cress",
    "Carex media": "Intermediate Sedge",
    "Asplenium trichomanes ssp. trichomanes": "Maidenhair Spleenwort",
    "Carex praticola": "Prairie-dweller Sedge",
    "Vaccinium uliginosum": "Alpine Bilberry",
    "Bistorta vivipara": "Alpine Bistort",
    "Listera convallarioides": "Broad-leaved Twayblade",
    "Juncus subtilis": "Slender Rush",
    "Moehringia macrophylla": "Large-leaved Sandwort",
    "Juniperus horizontalis": "Creeping Juniper",
    "Euphrasia hudsoniana var. ramosior": "Hudson Bay Eyebright",
    "Calamagrostis lacustris": "Narrow Reedgrass",
    "Carex novae-angliae": "New England Sedge",
    "Draba arabisans": "Arabian Whitlow Grass",
    "Botrychium acuminatum": "Tailed Grapefern",
    "Saxifraga cernua": "Nodding Saxifrage",
    "Botrychium spathulatum": "Spatulate Moonwort",
    "Trisetum spicatum": "Spike Trisetum",
    "Eleocharis nitida": "Neat Spikerush",
    "Rubus chamaemorus": "Cloudberry",
    "Listera auriculata": "Auricled Twayblade",
    "Osmorhiza berteroi": "Chilean Sweet Cicely",
    "Salix pellita": "Satiny Willow",
    "Piptatherum canadense": "Canadian Ricegrass",
    "Crataegus douglasii": "Black Hawthorn",
    "Huperzia appalachiana": "Appalachian Fir Moss",
    "Oxytropis viscida": "Sticky Locoweed",
    "Phacelia franklinii": "Franklin's Phacelia",
    "Prosartes trachycarpa": "Rough-fruited Fairybells",
    "Draba cana": "Hoary Whitlow Grass",
    "Saxifraga paniculata": "Encrusted Saxifrage",
    "Castilleja septentrionalis": "Northern Paintbrush",
    "Woodsia glabella": "Smooth Woodsia",
    "Carex michauxiana": "Michaux's Sedge",
    "Empetrum atropurpureum": "Purple Crowberry",
    "Packera indecora": "Elegant Groundsel",
    "Erigeron acris var. kamtschaticus": "Bitter Fleabane",
    "Woodsia alpina": "Alpine Woodsia",
    "Polystichum braunii": "Braun's Holly Fern",
    "Carex supina ssp. spaniocarpa": "Weak Arctic Sedge",
    "Carex flava": "Yellow Sedge",
    "Eleocharis wolfii": "Wolf's Spikerush",
    "Plagiobothrys scouleri var. penicillatus": "Scouler's Popcornflower",
    "Botrychium ascendens": "Upswept Moonwort",
    "Botrychium lineare": "Slender Moonwort",
    "Baptisia bracteata var. glabrescens": "Plains Wild Indigo",
    "Scutellaria ovata var. versicolor": "Ovate-leaved Skullcap",
    "Silene nivea": "Snowy Campion",
    "Asclepias amplexicaulis": "Clasping Milkweed",
    "Asplenium platyneuron": "Ebony Spleenwort",
    "Phlox maculata": "Wild Sweetwilliam",
    "Lechea tenuifolia var. tenuifolia": "Narrow-leaved Pinweed",
    "Carex conjuncta": "Jointed Sedge",
    "Polanisia jamesii": "James' Polanisia",
    "Taenidia integerrima": "Yellow Pimpernel",
    "Napaea dioica": "Glade Mallow",
    "Parthenium integrifolium": "Wild Quinine",
    "Hydrastis canadensis": "Goldenseal",
    "Carex davisii": "Davis' Sedge",
    "Sullivantia sullivantii": "Reniform Sullivantia",
    "Sanicula trifoliata": "Beaked Snakeroot",
    "Dicentra canadensis": "Squirrel Corn",
    "Carex laevivaginata": "Smooth-sheathed Sedge",
    "Diplazium pycnocarpon": "Narrow-leaved Spleenwort",
    "Phegopteris hexagonoptera": "Broad Beech Fern",
    "Arnoglossum reniforme": "Great Indian Plantain",
    "Pellaea atropurpurea": "Purple Cliff Brake",
    "Diarrhena obovata": "Obovate Beakgrain",
    "Tephrosia virginiana": "Goat's Rue",
    "Dryopteris marginalis": "Marginal Shield Fern",
    "Allium cernuum": "Nodding Wild Onion",
    "Symphyotrichum shortii": "Short's Aster",
    "Melica nitens": "Three-flowered Melic",
    "Jeffersonia diphylla": "Twinleaf",
    "Paronychia canadensis": "Canada Forked Chickweed",
    "Carex careyana": "Carey's Sedge",
    "Hasteola suaveolens": "Sweet-smelling Indian plantain",
    "Hybanthus concolor": "Eastern Green-violet",
    "Chrysosplenium iowense": "Iowa Golden Saxifrage",
    "Carex jamesii": "James' Sedge",
    "Iodanthus pinnatifidus": "Purple Rocket",
    "Psoralidium tenuiflorum": "Slender-leaved Scurfpea",
    "Agrostis hyemalis": "Winter Bentgrass",
    "Deparia acrostichoides": "Silvery Spleenwort",
    "Carex laxiculmis var. copulata": "Spreading Sedge",
    "Polytaenia nuttallii": "Prairie Parsley",
    "Rhodiola integrifolia ssp. leedyi": "Leedy's Roseroot",
    "Quercus bicolor": "Swamp White Oak",
    "Physaria ludoviciana": "Bladderpod",
    "Carex crus-corvi": "Raven's Foot Sedge",
    "Carex plantaginea": "Plantain-leaved Sedge",
    "Aureolaria pedicularia": "Fernleaf False Foxglove",
    "Polystichum acrostichoides": "Christmas Fern",
    "Eupatorium sessilifolium": "Upland Boneset",
    "Leersia lenticularis": "Catchfly Grass",
    "Vitis aestivalis var. argentifolia": "Silverleaf Grape",
    "Asclepias stenophylla": "Narrow-leaved Milkweed",
    "Prenanthes crepidinea": "Nodding Rattlesnake-root",
    "Spiranthes casei var. casei": "Case's Ladies' Tresses",
    "Polemonium occidentale ssp. lacustre": "Western Jacob's-ladder",
    "Stellaria longipes ssp. longipes": "Long-stalked Chickweed",
    "Erigeron lonchophyllus": "Short Ray Fleabane",
    "Androsace septentrionalis": "Northern Androsace",
    "Lysimachia maritima": "Sea Milkwort",
    "Botrychium gallicomontanum": "Frenchman's Bluff Moonwort",
    "Salicornia rubra": "Red Saltwort",
    "Carex garberi": "Garber's Sedge",
    "Achillea alpina": "Siberian Yarrow",
    "Caltha natans": "Floating Marsh Marigold",
    "Viola nuttallii": "Yellow Prairie Violet",
    "Heteranthera limosa": "Mud Plantain",
    "Myriophyllum heterophyllum": "Broadleaf Water Milfoil",
    "Astragalus alpinus var. alpinus": "Alpine Milk-vetch",
    "Packera cana": "Gray Ragwort",
    "Dodecatheon meadia": "Prairie Shooting Star",
    "Asclepias hirtella": "Prairie Milkweed",
    "Achnatherum hymenoides": "Indian Ricegrass",
    "Shinnersoseris rostrata": "Annual Skeletonweed",
    "Chamaesyce missurica": "Missouri Spurge",
    "Plantago elongata": "Slender Plantain",
    "Agalinis gattingeri": "Round-stemmed False Foxglove",
    "Fimbristylis puberula var. interior": "Hairy Fimbry",
    "Crassula aquatica": "Water Pygmyweed",
    "Potamogeton confervoides": "Algae-like Pondweed",
    "Ammophila breviligulata ssp. breviligulata": "Beach Grass",
    "Commelina erecta": "Slender Dayflower",
    "Paronychia fastigiata var. fastigiata": "Forked Chickweed",
    "Ruellia humilis": "Wild Petunia",
    "Montia chamissoi": "Montia"
};

// Lookup for getting each adjacent county
var adjacent_counties = {
    'Lake of the Woods': ['Roseau', 'Beltrami', 'Koochiching'],
    'Kittson': ['Roseau', 'Marshall'],
    'Roseau': ['Kittson', 'Lake of the Woods', 'Marshall', ''],
    'Koochiching': ['Beltrami', 'St. Louis', 'Itasca', 'St. Louis'],
    'Marshall': ['Kittson', 'Roseau', 'Beltrami', 'Pennington'],
    'St. Louis': ['Itasca', 'Lake', 'Aitkin', 'Carlton'],
    'Beltrami': ['Roseau', 'Lake of the Woods', 'Koochiching', 'Pennington', 'Mahnomen', 'Hubbard', 'Cass'],
    'Polk': ['Marshall', 'Beltrami', 'Norman', 'Clearwater'],
    'Pennington': ['Marshall', 'Beltrami', 'Polk', 'Red Lake', 'Clearwater'],
    'Cook': ['Lake'],
    'Lake': ['Cook', 'St. Louis'],
    'Clearwater': ['Pennington', 'Beltrami', 'Polk', 'Becker', 'Hubbard'],
    'Red Lake': ['Pennington', 'Polk', ''],
    'Itasca': ['Beltrami', 'Koochiching', 'St. Louis', 'Cass', 'Aitkin'],
    'Norman': ['Polk', 'Mahnomen', 'Clay', 'Becker'],
    'Mahnomen': ['Polk', 'Clearwater', 'Norman', 'Becker', ''],
    'Cass': ['Beltrami', 'Itasca', 'Itasca', 'Hubbard', 'Aitkin', 'Todd', 'Crow Wing'],
    'Hubbard': ['Clearwater', 'Beltrami', 'Becker', 'Cass', 'Wadena'],
    'Clay': ['Norman', 'Becker', 'Wilkin', 'Otter Tail'],
    'Becker': ['Norman', 'Mahnomen', 'Hubbard', 'Clay', 'Otter Tail', 'Wadena'],
    'Aitkin': ['Cass', 'Itasca', 'St. Louis', 'Crow Wing', 'Carlton', 'Morrison', 'Kanabec', 'Pine'],
    'Wadena': ['Becker', 'Hubbard', 'Otter Tail', 'Cass', 'Todd'],
    'Crow Wing': ['Cass', 'Aitkin', 'Morrison', 'Mille Lacs'],
    'Carlton': ['St. Louis', 'Aitkin', 'Pine'],
    'Otter Tail': ['Clay', 'Becker', 'Wadena', 'Wilkin', 'Douglas', 'Todd'],
    'Wilkin': ['Clay', 'Otter Tail', 'Traverse', 'Grant'],
    'Pine': ['Aitkin', 'Carlton', 'Kanabec', 'Isanti'],
    'Todd': ['Otter Tail', 'Wadena', 'Cass', 'Douglas', 'Morrison', 'Stearns'],
    'Morrison': ['Todd', 'Crow Wing', 'Aitkin', 'Todd', 'Mille Lacs', 'Stearns', 'Benton'],
    'Mille Lacs': ['Crow Wing', 'Aitkin', 'Morrison', 'Kanabec', 'Sherburne', 'Isanti'],
    'Kanabec': ['Mille Lacs', 'Aitkin', 'Pine', 'Isanti', 'Chisago'],
    'Grant': ['Wilkin', 'Otter Tail', 'Traverse', 'Douglas', 'Stevens', 'Pope'],
    'Douglas': ['Otter Tail', 'Todd', 'Grant', 'Stevens', 'Pope', 'Stearns'],
    'Traverse': ['Wilkin', 'Grant', 'Big Stone', 'Stevens'],
    'Benton': ['Morrison', 'Mille Lacs', 'Stearns', 'Sherburne'],
    'Stevens': ['Traverse', 'Grant', 'Douglas', 'Big Stone', 'Pope', 'Swift'],
    'Stearns': ['Douglas', 'Morrison', 'Benton', 'Pope', 'Sherburne', 'Kandiyohi', 'Meeker', 'Wright'],
    'Pope': ['Grant', 'Douglas', 'Todd', 'Stevens', 'Stearns', 'Swift', 'Kandiyohi'],
    'Isanti': ['Mille Lacs', 'Kanabec', 'Pine', 'Chisago', 'Sherburne', 'Anoka'],
    'Chisago': ['Kanabec', 'Pine', 'Isanti', 'Anoka', 'Washington'],
    'Big Stone': ['Traverse', 'Stevens', 'Swift'],
    'Sherburne': ['Benton', 'Isanti', 'Stearns', 'Anoka', 'Wright', ''],
    'Swift': ['Stevens', 'Pope', 'Big Stone', 'Kandiyohi', 'Lac qui Parle', 'Chippewa'],
    'Kandiyohi': ['Pope', 'Stearns', 'Chippewa', 'Meeker', 'Renville', ''],
    'Wright': ['Stearns', 'Sherburne', 'Meeker', 'Hennepin', 'McLeod', 'Carver', 'Hennepin'],
    'Anoka': ['Sherburne', 'Isanti', 'Chisago', 'Hennepin', 'Washington', 'Ramsey'],
    'Meeker': ['Kandiyohi', 'Stearns', 'Wright', 'Renville', 'McLeod'],
    'Lac qui Parle': ['Swift', 'Chippewa', 'Yellow Medicine'],
    'Washington': ['Anoka', 'Chisago', 'Ramsey', 'Dakota'],
    'Hennepin': ['Wright', 'Anoka', 'Ramsey', 'Carver', 'Scott', 'Dakota'],
    'Chippewa': ['Swift', 'Kandiyohi', 'Lac qui Parle', 'Yellow Medicine', 'Renville'],
    'Ramsey': ['Anoka', 'Washington', 'Hennepin', 'Dakota'],
    'McLeod': ['Meeker', 'Wright', 'Renville', 'Carver', 'Sibley', ''],
    'Carver': ['Wright', 'McLeod', 'Hennepin', 'Sibley', 'Scott'],
    'Yellow Medicine': ['Lac qui Parle', 'Chippewa', 'Renville', 'Lincoln', 'Lyon', 'Redwood'],
    'Dakota': ['Hennepin', 'Ramsey', 'Scott', 'Rice', 'Goodhue'],
    'Renville': ['Chippewa', 'Kandiyohi', 'Yellow Medicine', 'McLeod', 'Redwood', 'Nicollet'],
    'Scott': ['Carver', 'Hennepin', 'Sibley', 'Dakota', 'Le Sueur'],
    'Sibley': ['Renville', 'McLeod', 'Carver', 'Scott', 'Nicollet', 'Le Sueur'],
    'Redwood': ['Yellow Medicine', 'Renville', 'Lyon', 'Brown', 'Murray', 'Cottonwood'],
    'Goodhue': ['Dakota', 'Rice', 'Dodge', 'Olmsted', 'Wabasha'],
    'Lincoln': ['Yellow Medicine', 'Lyon', 'Pipestone', 'Murray'],
    'Lyon': ['Yellow Medicine', 'Lincoln', 'Redwood', 'Pipestone', 'Murray'],
    'Le Sueur': ['Sibley', 'Scott', 'Nicollet', 'Rice', 'Blue Earth', 'Waseca'],
    'Rice': ['Scott', 'Dakota', 'Le Sueur', 'Goodhue', 'Waseca', 'Steele', 'Dodge'],
    'Brown': ['Renville', 'Sibley', 'Redwood', 'Nicollet', 'Cottonwood', 'Watonwan', 'Blue Earth'],
    'Nicollet': ['Sibley', 'Le Sueur', 'Brown', 'Blue Earth'],
    'Wabasha': ['Goodhue', 'Olmsted', 'Winona'],
    'Blue Earth': ['Nicollet', 'Le Sueur', 'Watonwan', 'Waseca', 'Martin', 'Faribault'],
    'Pipestone': ['Lincoln', 'Lyon', 'Murray', 'Rock', 'Nobles'],
    'Murray': ['Lincoln', 'Lyon', 'Redwood', 'Pipestone', 'Cottonwood', 'Rock', 'Nobles', 'Jackson'],
    'Cottonwood': ['Redwood', 'Brown', 'Murray', 'Watonwan', 'Nobles', 'Jackson', 'Martin'],
    'Winona': ['Wabasha', 'Olmsted', 'Fillmore', 'Houston'],
    'Waseca': ['Le Sueur', 'Rice', 'Blue Earth', 'Steele', 'Faribault', 'Freeborn'],
    'Steele': ['Rice', 'Waseca', 'Dodge', 'Freeborn', 'Mower'],
    'Dodge': ['Rice', 'Goodhue', 'Steele', 'Olmsted', 'Mower', ''],
    'Olmsted': ['Goodhue', 'Wabasha', 'Dodge', 'Winona', 'Mower', 'Fillmore'],
    'Watonwan': ['Brown', 'Blue Earth', 'Cottonwood', 'Jackson', 'Martin'],
    'Rock': ['Pipestone', 'Murray', 'Nobles'],
    'Nobles': ['Pipestone', 'Murray', 'Cottonwood', 'Rock', 'Jackson'],
    'Jackson': ['Murray', 'Cottonwood', 'Watonwan', 'Nobles'],
    'Martin': ['Cottonwood', 'Watonwan', 'Blue Earth', 'Jackson', 'Faribault'],
    'Houston': ['Winona', 'Fillmore'],
    'Faribault': ['Blue Earth', 'Waseca', 'Martin', 'Freeborn'],
    'Fillmore': ['Olmsted', 'Winona', 'Mower', 'Houston'],
    'Freeborn': ['Waseca', 'Steele', 'Faribault', 'Mower'],
    'Mower': ['Steele', 'Dodge', 'Olmsted', 'Freeborn', 'Fillmore']
};

var selected_col_id = '#county-species';
var adjacent_col_id = '#adjacent-county-species';



// Function used for adding the species lists to the rare species container columns
function appendRareData(selected_col_id, selectedCounty, all_counties, sci_name_lookup) {
    // Made the title for each county into a button, so that each one can be collapsed
    var uniqueDivId = selectedCounty.split(' ').join('-').split('.').join('').toLowerCase() + '-species-list';
    var sp_list_title = $('<button class="btn btn-link county-button" data-toggle="collapse" data-target="#' + uniqueDivId + '" aria-expanded="false" aria-controls="' + uniqueDivId + '">' + selectedCounty + ' County rare species:</button>');
    $(selected_col_id).append(sp_list_title);
    $(selected_col_id).append('<div id="' + uniqueDivId + '" class="collapse show county-species-div" data-parent="' + selected_col_id + '"></div>'); // Housing the collapsable species info for each county
    $('.county-species-div').collapse(); // Making the county <div> groups start collapsed

    var county_species = all_counties[selectedCounty];
    county_species.sort();
    for (var i = 0; i < county_species.length; i++) {
        var sp_to_append = county_species[i];
        var sp_common_name = sci_name_lookup[sp_to_append];
        var species_image = 'images/species/' + sp_to_append + '.jpg';
        var species_image_popup = '<a tabindex="0" class="species-popup" data-toggle="popover" data-trigger="focus" title="' + sp_to_append + '" data-content="<img src=\'' + species_image + '\' class=\'species-image\' width=\'200\' />">' + sp_to_append + '</a>';
        $('.species-popup').popover({
            html: true
        });
        $('#' + uniqueDivId).append('<p class="species-entry"><em>' + species_image_popup + '</em> (' + sp_common_name + ')' + '</p>');
        // $('#county-species').append('<p class="species-entry"><em>' + sp_to_append + '</em> (' + sp_common_name + ')' + '</p>');
    };
};


// Adding rare species data for the adjacent counties
function appendAdjacentCountyData(adjacent_col_id, selectedCounty, all_counties, sci_name_lookup, adjacent_counties) {
    var adj_counties_array = adjacent_counties[selectedCounty];

    // For each adjacent county, adds the data to the col with div id=adjacent_col_id (#adjacent-county-species)
    for (cty in adj_counties_array) {
        appendRareData(adjacent_col_id, adj_counties_array[cty], all_counties, sci_name_lookup);
    }
}



// On clicking the 'Get Rare Species' button, adds the list of scientific/common species names to the county species div
$('#get-rares-button').on('click', function (e) {
    // First, unhiding the result columns on button click
    $('.result-cols').show();
    var selectedCounty = $('.county-selection-dropdown').val();

    // If elements have already been generated, removes them all
    if ($('.county-button').length) {
        $('.county-button').remove();
        $('.county-species-div').empty(); // Use .empty() to also remove all child <li> elements
    };
    
    // Adding rare species data for the county in question
    appendRareData(selected_col_id, selectedCounty, all_counties, sci_name_lookup);

    // Adding rare species data for adjacent counties
    appendAdjacentCountyData(adjacent_col_id, selectedCounty, all_counties, sci_name_lookup, adjacent_counties);


});

// On clicking 'Get from Location' button, does the same thing. Separate function because it handles getting data slightly differently
$('#get-from-map-button').on('click', function (e) {

    $('.result-cols').show();
    var selectedCounty = '';

    // If elements have already been generated, removes them all
    if ($('.county-button').length) {
        $('.county-button').remove();
        $('.county-species-div').empty(); // Use .empty() to also remove all child <li> elements
    };
    
    // Checking to see if geolocation is available. If so, pressing the 'Get from Location' button grabs the county the user is located in using leaflet-pip
    function geo_found(position) { 
        // Using leaflet-pip to get the county at the position
        var countyResult = leafletPip.pointInLayer([userLng, userLat], countiesLayer);
        var countyGeoloc = countyResult[0].feature.properties.CTY_NAME;
        selectedCounty = countyGeoloc;

        // console.log('Found position');
        // appendRareData function is used to ensure that none of this executes until the geolocation getCurrentPosition callback
        appendRareData(selected_col_id, selectedCounty, all_counties, sci_name_lookup);
        appendAdjacentCountyData(adjacent_col_id, selectedCounty, all_counties, sci_name_lookup, adjacent_counties);
    }
    function geo_error() {
        selectedCounty = clickedCounty;
        // console.log('Cant find position');
        appendRareData(selected_col_id, selectedCounty, all_counties, sci_name_lookup);
        appendAdjacentCountyData(adjacent_col_id, selectedCounty, all_counties, sci_name_lookup, adjacent_counties);
    }
    
    // Kind of janky workaround. If the marker object has been properly defined as L.marker (i.e. location is available, calls the geo_found function)
    if (typeof locMarker == 'object') {
        geo_found();
    } else {
        geo_error();
    }
    // Ideally would do this instead of the if else above, but is not quick enough of a result output
    // navigator.geolocation.getCurrentPosition(geo_found, geo_error);
    
});




