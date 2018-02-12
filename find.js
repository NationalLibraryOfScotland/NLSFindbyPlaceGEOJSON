
var map;
var overlay; //current historic overlay node
var overlayLayers;
var baseLayer;
var baseLayers; // base layers include Bing, Stamen and OpenStreetMap
var overlaySelected;


// The parameters for the British National Grid - EPSG:27700

	proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs");


// This code below converts the lat lon into a British National Grid Reference. With thanks from http://www.movable-type.co.uk/scripts/latlong-gridref.html NT261732

    function gridrefNumToLet(e, n, digits) {
        // get the 100km-grid indices
        var e100k = Math.floor(e / 100000),
        n100k = Math.floor(n / 100000);

        if (e100k < 0 || e100k > 6 || n100k < 0 || n100k > 12) return '';

        // translate those into numeric equivalents of the grid letters
        var l1 = (19 - n100k) - (19 - n100k) % 5 + Math.floor((e100k + 10) / 5);
        var l2 = (19 - n100k) * 5 % 25 + e100k % 5;

        // compensate for skipped 'I' and build grid letter-pairs
        if (l1 > 7) l1++;
        if (l2 > 7) l2++;
        var letPair = String.fromCharCode(l1 + 'A'.charCodeAt(0), l2 + 'A'.charCodeAt(0));

        // strip 100km-grid indices from easting & northing, and reduce precision
        e = Math.floor((e % 100000) / Math.pow(10, 5 - digits / 2));
        n = Math.floor((n % 100000) / Math.pow(10, 5 - digits / 2));

        Number.prototype.padLZ = function(w) {
            var n = this.toString();
            while (n.length < w) n = '0' + n;
            return n;
        }

        var gridRef = letPair + e.padLZ(digits / 2) + n.padLZ(digits / 2);

        return gridRef;
    }
	function gridrefLetToNum(gridref) {
	  // get numeric values of letter references, mapping A->0, B->1, C->2, etc:
	  var l1 = gridref.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
	  var l2 = gridref.toUpperCase().charCodeAt(1) - 'A'.charCodeAt(0);
	  // shuffle down letters after 'I' since 'I' is not used in grid:
	  if (l1 > 7) l1--;
	  if (l2 > 7) l2--;

	  // convert grid letters into 100km-square indexes from false origin (grid square SV):
	  var e = ((l1-2)%5)*5 + (l2%5);
	  var n = (19-Math.floor(l1/5)*5) - Math.floor(l2/5);

	  // skip grid letters to get numeric part of ref, stripping any spaces:
	  gridref = gridref.slice(2).replace(/ /g,'');

	  // append numeric part of references to grid index:
	  e += gridref.slice(0, gridref.length/2);
	  n += gridref.slice(gridref.length/2);

	  // normalise to 1m grid, rounding up to centre of grid square:
	  switch (gridref.length) {
		case 2: e += '5000'; n += '5000'; break;
	    case 4: e += '500'; n += '500'; break;
	    case 6: e += '50'; n += '50'; break;
	    case 8: e += '5'; n += '5'; break;
	    // 10-digit refs are already 1m
	  }

	  return [e, n];
	}


// the base map layers

// OpenStreetMap
	var osm = new ol.layer.Tile({
	  title: 'Background map - OpenStreetMap',
	  mosaic_id: '4',
    	  visible: false,	
	  source: new ol.source.OSM({
	    // attributions: [ol.source.OSM.DATA_ATTRIBUTION],
	    url: 'http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
	  })/*,
	  opacity: 0.7*/
	});


   	var stamentoner = new ol.layer.Tile({
		title: 'Background map - Stamen Toner',
	        mosaic_id: '10',
		type: 'base', 
	        source: new ol.source.Stamen({
	        layer: 'toner'
	      })
	    });

// Bing API key - please generate your own

	var BingapiKey = "AgS4SIQqnI-GRV-wKAQLwnRJVcCXvDKiOzf9I1QpUQfFcnuV82wf1Aw6uw5GJPRz";

	var BingSatellite =   new ol.layer.Tile({
		title: 'Background map - Bing Satellite',
		mosaic_id: '2',
		type: 'base', 
    		visible: false,	
	        source: new ol.source.BingMaps({
			key: BingapiKey,
			imagerySet: 'Aerial'
		    })
	});

	var BingRoad = new ol.layer.Tile({
	         title: 'Background map - Bing Road',
		 mosaic_id: '1',
	         type: 'base',
    		 visible: false,	
	         source: new ol.source.BingMaps({
		      key: BingapiKey,
		      imagerySet: 'Road'
		    })
	});

	var BingAerialWithLabels = new ol.layer.Tile({
	          title: 'Background map - Bing Hybrid',
		  mosaic_id: '3',
	          type: 'base',
    		  visible: false,	
	          source: new ol.source.BingMaps({
			key: BingapiKey,
			imagerySet: 'AerialWithLabels'
		})
	});

	var StamenWatercolor =  new ol.layer.Tile({
	           title: 'Background map - Water color',
	           type: 'base',
	           source: new ol.source.Stamen({
	                  layer: 'watercolor'
	           })
	});

	var OSOpendata = new ol.layer.Tile({
	              title: 'Background map - OS Opendata',
	              type: 'base',
		      source: new ol.source.XYZ({
				    attributions: [new ol.Attribution({html: 'Contains OS data &copy; Crown copyright and database right 2011'})],
				    url: 'http://geo.nls.uk/maps/opendata/{z}/{x}/{y}.png',
				    // minZoom: 10,
				    maxZoom: 16,
				    tilePixelRatio: 1
				  })
	                    });

// an array of the base layers listed above

	var baseLayers = [BingRoad, BingSatellite, BingAerialWithLabels, osm, OSOpendata, stamentoner];

	BingRoad.setVisible(true);

        setResults();

// sets up the base layers as a drop-down list

	    var layerSelect = document.getElementById('layerSelect');
	    for (var x = 0; x < baseLayers.length; x++) {
	        // if (!baseLayers[x].displayInLayerSwitcher) continue;
	        var option = document.createElement('option');
		option.appendChild(document.createTextNode(baseLayers[x].get('title')));
	        option.setAttribute('value', x);
	        option.setAttribute('id', 'baseOption' + baseLayers[x].get('title'));
	        layerSelect.appendChild(option);
	    }




	// the style for the blue lines

            var blue_line_thick = new ol.style.Style({
    		stroke: new ol.style.Stroke({
      			color: 'rgba(41, 15, 195, 0.9)',
      			width: 2
    		})
  	    });


	// the layer definition for One Inch Popular sheetlines

		var one_inch_popular_json = new ol.layer.Vector({
		  title: "Scotland, OS One inch Popular, 1921-1930",
		  source: new ol.source.Vector({
		    url: 'https://github.com/NationalLibraryOfScotland/NLSFindbyPlaceGEOJSON/one-inch-popular.js',
    		    format: new ol.format.GeoJSON(),

		  }),
	        style: blue_line_thick,
	      });


	// the style for the green lines

            var green_line_thick = new ol.style.Style({
    		stroke: new ol.style.Stroke({
      			color: 'rgba(15, 195, 41, 0.9)',
      			width: 2
    		})
  	    });


	// the layer definition for One Inch Popular sheetlines

		var one_inch_seventh_json = new ol.layer.Vector({
		  title: "Great Britain, OS One inch, 1952-61",
		  source: new ol.source.Vector({
		    url: 'https://github.com/NationalLibraryOfScotland/NLSFindbyPlaceGEOJSON/one-inch-seventh.js',
    		    format: new ol.format.GeoJSON(),

		  }),
		visible: false,
	        style: green_line_thick,
	      });

// an array of the overlay layers listed above

    overlayLayers = [  one_inch_popular_json, one_inch_seventh_json ]


		var attribution = new ol.control.Attribution({
		  collapsible: true,
		  label: 'i',
		  collapsed: true,
		  tipLabel: 'Attributions'
		});


		var map = new ol.Map({
		  target: document.getElementById('map'),
		  renderer: 'canvas',
		  controls: ol.control.defaults({ attributionOptions: { collapsed: true, collapsible: true }}),
		  interactions : ol.interaction.defaults({doubleClickZoom :false}),
		  layers: [BingRoad, one_inch_popular_json ],
		  logo: false,
		  view: new ol.View({
		    center: ol.proj.transform([-4.0, 56.0], 'EPSG:4326', 'EPSG:3857'),
		    zoom: 5
		  })
		});


// sets up the overlay layers as a set of radio buttons

       var overlaySelect = document.getElementById('overlaySelect');
           for (var x = 0; x < overlayLayers.length; x++) {
              var checked = (overlayLayers[x].getVisible()) ? "checked" : "";
              overlaySelect.innerHTML += '<p><input type="radio" name="overlay" id="overlayRadio'+ overlayLayers[x].get('title') + '" value="' + x + '" onClick="changeOverlay(this.value)" ' + checked + '><span>' + overlayLayers[x].get('title') + '</span></p>';
       }


// function to change the overlay layer

	var changeOverlay = function(index) {
	  if (map.getLayers().getLength() > 2) map.getLayers().removeAt(2);
	  map.getLayers().getArray()[1].setVisible(false);
	  map.getLayers().removeAt(1);
	  setResults();
	  map.getLayers().insertAt(1,overlayLayers[index]);
	  overlaySelected = overlayLayers[index];
	  overlaySelected.setVisible(true);
	}




// selected style when points are selected


            var selectedStyle = new ol.style.Style({
    		stroke: new ol.style.Stroke({
      			color: 'rgba(255, 0, 0, 0.9)',
      			width: 5
    		}),
	    	fill: new ol.style.Fill({
			color: 'rgba(250, 0, 0, 0.1)'
                    }),
  	    });

// the featureOverlay for the selected vector features

            var selectedFeatures = [];



// function to unselect previous selected features

            function unselectPreviousFeatures() {
                var i;
                for(i=0; i< selectedFeatures.length; i++) {
                    selectedFeatures[i].setStyle(null);
                }
                selectedFeatures = [];
            }




// function to select point features and display geoJSON information on them

	var displayFeatureInfo = function(pixel) {	

		 var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {


  			// unselectPreviousFeatures(); 
			              feature.setStyle([
			                     selectedStyle
			                ]);
               			selectedFeatures.push(feature);
										 
				 },  {hitTolerance: 1});

			// display selectedFeatures fields in the geoJSON_tour_results div

				
			var info = document.getElementById('results');
				  if (selectedFeatures.length > 0) {
					var results = "";
			                var k;
			                for(k=0; k< selectedFeatures.length; k++) {
						results += '<p><a href="' + selectedFeatures[k].get("IMAGEURL") + '" target="remotes"><img src="' + selectedFeatures[k].get("IMAGETHUMB") + '" width="150" /><br />'  + selectedFeatures[k].get("SHEET") + 
				'</a><br />' + selectedFeatures[k].get("DATES") + '</p>';
			                }

					info.innerHTML = results;
				
				  } else {

				        {info.innerHTML = 'No maps selected - please click on a coloured shape on the map to the left that covers the area you are interested in';}
				  }
							
	};


// unselects any selected features and selects new ones on the user clicking the left-hand map

	        map.on('click', function(evt) {
			      var pixel = evt.pixel;
			      unselectPreviousFeatures();
			      displayFeatureInfo(pixel);

		});


// Change base layer

	var changemap = function(index) {
	  map.getLayers().getArray()[0].setVisible(false);
	  map.getLayers().removeAt(0);
	  map.getLayers().insertAt(0,baseLayers[index]);
	  map.getLayers().getArray()[0].setVisible(true);
	}



// add the OL ZoomSlider and ScaleLine controls

    map.addControl(new ol.control.ZoomSlider());
    map.addControl(new ol.control.ScaleLine({ units:'metric' }));

    map.removeInteraction(new ol.interaction.DoubleClickZoom({
		duration: 1000
		})
   	);	

    var mouseposition = new ol.control.MousePosition({
            projection: 'EPSG:4326',
            coordinateFormat: function(coordinate) {
	    // BNG: ol.extent.applyTransform([x, y], ol.proj.getTransform("EPSG:4326", "EPSG:27700"), 
		var coord27700 = ol.proj.transform(coordinate, 'EPSG:4326', 'EPSG:27700');
		var templatex = '{x}';
		var outx = ol.coordinate.format(coord27700, templatex, 0);
		var templatey = '{y}';
		var outy = ol.coordinate.format(coord27700, templatey, 0);
		NGR = gridrefNumToLet(outx, outy, 6);
		var hdms = ol.coordinate.toStringHDMS(coordinate);
		if ((outx  < 0) || (outx > 700000 ) || (outy < 0) || (outy > 1300000 )) {
	        return '<strong>' + ol.coordinate.format(coordinate, '{x}, {y}', 4) + '&nbsp; <br/>&nbsp;' + hdms + ' &nbsp;'; 
		}
		else 
                { return '<strong>' + NGR + '</strong>&nbsp; <br/>' + ol.coordinate.format(coord27700, '{x}, {y}', 0) + 
			'&nbsp; <br/>' + ol.coordinate.format(coordinate, '{x}, {y}', 4) + '&nbsp; <br/>&nbsp;' + hdms + ' &nbsp;'; }
            	}
    });

    map.addControl(mouseposition);


function ngrgaz(value) {

	if (( parseInt(value.length) < 2) || (value == 'Type Grid Ref...'))
		{
		return;
		}

         var osgbnum = gridrefLetToNum(value);
	 // console.log(osgbnum);
         // var osgb = new OpenLayers.LonLat(osgbnum[0], osgbnum[1]);
	 point27700 = [];
	 point27700.push(parseFloat(osgbnum[0]), parseFloat(osgbnum[1]));
	 // console.log(point27700);
	 point3857 = [];
	 point3857 = ol.proj.transform(point27700,"EPSG:27700", "EPSG:3857");
	 var a = map.getView().setCenter(point3857);
    	 var b = map.getView().setZoom(10+value.length);
	 var zoom1 = (10+value.length);
	// return b;
	 var zoom = Math.round(zoom1);

	var x = point3857[0].toFixed(0);
	var y = point3857[1].toFixed(0);

        map.getView().animate({
	  center: [x, y],
	  zoom: zoom,
          duration: 2000
        });

      }
	

	document.getElementById("ngrgaz")
	    .addEventListener("keyup", function(event) {
	    event.preventDefault();
		document.getElementById('search-button-ngrgaz').style.color = 'blue';
	    if (event.keyCode === 13) {
	       // document.getElementById("ngrgaz").click();
		ngrgaz(document.getElementById("ngrgaz").value);


	    }
	});

     // Initialize the Gazetteer with autocomplete and County+Parish selector

     nlsgaz(function(minx,miny,maxx,maxy){

	 var currentZoom = map.getView().getZoom();
         var extent = [minx, miny, maxx, maxy];
         extent = ol.extent.applyTransform(extent, ol.proj.getTransform("EPSG:4326", "EPSG:3857"));

	 var x = extent[0] + (extent[2] - extent[0]) / 2; 
	 var y = extent[1] + (extent[3] - extent[1]) / 2; 
	
  	 var resolution = map.getView().getResolutionForExtent(extent, map.getSize());
	 var zoom1 = map.getView().getZoomForResolution(resolution);
	 var zoom = Math.round(zoom1);

     
	 if ((zoom > 17 ) || (zoom < 3) || (isNaN(zoom)))
		{ zoom = 17; }


	      function flyTo(location, done) {
	        var duration = 3000;
	        var parts = 2;
	        var called = false;
	        function callback(complete) {
	          --parts;
	          if (called) {
	            return;
	          }
	          if (parts === 0 || !complete) {
	            called = true;
	            done(complete);
	          }
	        }
	        map.getView().animate({
	          center: location,
	          duration: duration
	        }, callback);
	        map.getView().animate({
	          zoom: zoom - 1,
	          duration: duration / 2
	        }, {
	          zoom: zoom,
	          duration: duration / 2
	        }, callback);
	      }

	if (parseInt(currentZoom) > 8)
		{
		flyTo([x, y], function() {});
		}
	else
		{

		
			map.getView().animate({
				center: [x , y ],
				zoom: zoom,
			        duration: 2000
			});
		}
	}
    );



// the populates the results div on the right with default text 


function setResults(str) {
    if (!str) str = "<p>No maps selected - please click on a coloured shape on the map to the left that covers the area you are interested in</p>";
    document.getElementById('results').innerHTML = str;
}




