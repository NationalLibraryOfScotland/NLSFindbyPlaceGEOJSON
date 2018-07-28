NLSFindByPlaceGEOJSON
=====================

This <a href="https://geo.nls.uk/maps/dev/NLSFindByPlaceGEOJSON/index.html">demonstration application</a> uses <a href="https://openlayers.org/">OpenLayers v 4.6</a>, and GEOJSON graphic index files to form a geographical retrieval interface for historical maps. Searching is possible by zooming in on the map, with an option to change the map base layer between Bing, Ordnance Survey and OpenStreetMap layers. Searching is also possible by using a Nominatim gazetteer, a British National Grid Reference, as well as historic county and parish drop-down lists. 

The boundaries of historic maps are held as <a href="https://geojson.org/">GEOSJON</a> files. Clicking on the map initiates an forEachFeatureAtPixel query, returning features that intersect with the point clicked upon. Selected fields from these features are returned to a right-hand 'Results' div/panel, and the features are highlighted on the map by creating a temporary vector layer overlay.

The <a href="https://github.com/NationalLibraryOfScotland/NLSFindByPlaceOL3">NLSFindByPlaceOL3</a> Github repository and application uses a similar interface, but stores the map indexes in GeoServer, which is likely to be better for larger graphic indexes.

The application accompanies the <a href="https://github.com/NationalLibraryOfScotland/NLSExploreGeoreferencedMapsOL3">NLSExploreGeoreferencedMaps</a> Github repository and application, sharing a similar interface, use of OpenLayers, gazetteer search and css.



