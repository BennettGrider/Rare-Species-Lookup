

// Select2 as a jQuery function, vall on any jQuery selector when initializing Select2
$(document).ready(function() {
    $('.county-selection-dropdown').select2({
        placeholder: "Select a county",
        width: 'resolve' // Overriding the default width
    });
});






// Rare species found in each county. Formatted as a collection (array of objects)
var all_counties = {
    'Aitkin': ['Panax quinquefolius', 
                'Littorella americana', 
                'Botrychium oneidense', 
                'Poa paludigena', 
                'Juglans cinerea'],
    'Anoka': ['']
};

// var county = {
//     name: 'Aitkin',
//     species: ['Panax quinquefolius', 
//     'Littorella americana', 
//     'Botrychium oneidense', 
//     'Poa paludigena', 
//     'Juglans cinerea']
// };
// all_counties.push(county);

// var county = {
//     name: 'Anoka',
//     species: ['', 
//     '']
// }
// all_counties.push(county);
console.log(all_counties);


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

    var selected_county = $('.county-selection-dropdown').val();
    var sp_list_title = $('<h5 class="rare-title"></h5>').text(selected_county + ' County rare species:');

    $('#county-species').prepend(sp_list_title); // Adding the title
    $('#county-species').append('<ul id="rare-list"></ul>'); // Adding the <ul> element the rare species list will be housed in

    // Adding each species in its own list element
    var county_species = all_counties[selected_county];
    for (var i = 0; i < county_species.length; i++) {
        var sp_to_append = county_species[i];
        var sp_common_name = sci_name_lookup[sp_to_append];
        $('#rare-list').append('<li>' + sp_to_append + ' (' + sp_common_name + ')' + '</li>');
    };

});



