


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
        map.setView(e.latlng, 12); // Centers the map on the location, but only initially
        markerPresent = true;
        $('#get-from-map-col').append('<p id="loc-accuracy">Location accuracy: ' + e.accuracy + 'm</p>');
    } else {
        locMarker.setLatLng(e.latlng);
        locCircle.setLatLng(e.latlng);
        $('#loc-accuracy').html('Location accuracy: ' + e.accuracy + 'm');
    }
}
map.on('locationfound', onLocationFound);
map.locate({setView: false, maxZoom: 16, enableHighAccuracy: true, watch: true});

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
            iconAnchor: [0, 0],
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
            opacity: 0.6,
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
    Aitkin: ['Panax quinquefolius', 
            'Littorella americana', 
            'Botrychium oneidense', 
            'Poa paludigena', 
            'Juglans cinerea'],
    Anoka: ['aaa'],
    Ramsey: ['Aaaa', 'BBbBb']
};


// Lookup for getting common names as well
var sci_name_lookup = {
    'Panax quinquefolius': 'American Ginseng',
    'Littorella americana': 'American Shore Plantain',
    'Botrychium oneidense': 'Blunt-lobed Grapefern',
    'Poa paludigena': 'Bog Bluegrass',
    'Juglans cinerea': 'Butternut'
};


// On clicking the 'Get Rare Species' button, adds the list of scientific/common species names to the county species div
$('#get-rares-button').on('click', function (e) {

    // If elements have already been generated, removes them all
    if ($('.rare-title').length) {
        $('.rare-title').remove();
        $('#rare-list').empty(); // Use .empty() to also remove all child <li> elements
    };

    // First, unhiding the result columns on button click
    $('.result-cols').show();

    var selectedCounty = $('.county-selection-dropdown').val();
    var sp_list_title = $('<h5 class="rare-title"></h5>').text(selectedCounty + ' County rare species:');

    $('#county-species').prepend(sp_list_title); // Adding the title
    $('#county-species').append('<ul id="rare-list"></ul>'); // Adding the <ul> element the rare species list will be housed in

    // Adding each species in its own list element
    var county_species = all_counties[selectedCounty];
    for (var i = 0; i < county_species.length; i++) {
        var sp_to_append = county_species[i];
        var sp_common_name = sci_name_lookup[sp_to_append];
        $('#rare-list').append('<li>' + sp_to_append + ' (' + sp_common_name + ')' + '</li>');
    };

});


// On clicking 'Get from Location' button, does the same thing. Separate function because it handles getting data slightly differently
$('#get-from-map-button').on('click', function (e) {
    if ($('.rare-title').length) {
        $('.rare-title').remove();
        $('#rare-list').empty(); // Use .empty() to also remove all child <li> elements
    };

    $('.result-cols').show();
    var selectedCounty = '';

    // appendRareData function is used to ensure that none of this executes until the geolocation getCurrentPosition callback
    function appendRareData(selectedCounty, all_counties, sci_name_lookup) {
        var sp_list_title = $('<h5 class="rare-title"></h5>').text(selectedCounty + ' County rare species:');
        $('#county-species').prepend(sp_list_title);
        $('#county-species').append('<ul id="rare-list"></ul>');

        var county_species = all_counties[selectedCounty];
        for (var i = 0; i < county_species.length; i++) {
            var sp_to_append = county_species[i];
            var sp_common_name = sci_name_lookup[sp_to_append];
            $('#rare-list').append('<li>' + sp_to_append + ' (' + sp_common_name + ')' + '</li>');
        };
    };
    
    // Checking to see if geolocation is available. If so, pressing the 'Get from Location' button grabs the county the user is located in using leaflet-pip
    function geo_found(position) { 
        // Using leaflet-pip to get the county at the position
        var countyResult = leafletPip.pointInLayer([userLng, userLat], countiesLayer);
        var countyGeoloc = countyResult[0].feature.properties.CTY_NAME;
        selectedCounty = countyGeoloc;

        // console.log('Found position');
        appendRareData(selectedCounty, all_counties, sci_name_lookup);
    }
    function geo_error() {
        selectedCounty = clickedCounty;
        // console.log('Cant find position');
        appendRareData(selectedCounty, all_counties, sci_name_lookup);
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




