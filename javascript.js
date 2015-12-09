var imports = [
    "leaflet.leaflet.js", 
    "leaflet.angular-leaflet-directive.js", 
    "leaflet.leaflet-routing-machine.js", 
    "leaflet.lrm-valhalla.js", 
    "leaflet.leaflet-control-geocoder.js", 
    "leaflet.leaflet-plugins.layer.tile.Google.js", 
    "leaflet.leaflet-plugins.Leaflet.fullscreen.js", 
    "leaflet.campus-map-data-layers.js", 
    "leaflet.leaflet.markercluster.js", 
    "lodash.js", 
    "angular-simple-logger.light.js", 
    "angular-google-maps.js"
];

var app = angular.module('PortalApp');
app.requires.push('uiGmapgoogle-maps', 'leaflet-directive');

app.config(['uiGmapGoogleMapApiProvider', function (GoogleMapApi) {
        GoogleMapApi.configure({
            key: 'AIzaSyD59-BEGjOcxc20VoMap0jYkCuVaUq9yTM',
            v: '3.17',
            libraries: 'visualization'
        });
    }])
.controller('campusMapCtrl', ['$scope', '$http', '$q', "leafletData", 'alertService', 'directionsService', 'uiGmapGoogleMapApi', function ($scope, $http, $q, leafletData, alertService, directionsService, GoogleMapApi) {
    // ---------- SETUP -----------------------------------------------------
    // Initial variable creation
    $scope.firstLoad = true;
    $scope.onCampusMap = true;
    $scope.loadingCampusMap = true;
    $scope.placesOpen = false;
    $scope.transitOpen = false;
    $scope.infoOpen = false;
    $scope.parkOpen = false;
    $scope.accessOpen = false;
    $scope.campusMapMessage = "";
    $scope.directionsService;
  	$scope.directionsDisplay;
  	$scope.isLeafletMap = true;
  	$scope.lastCenter = {};
  	$scope.cMapLayers = {
  	    Places: {},
  	    Transit: {},
  	    Information: {},
  	    Parking: {},
  	    Accessibility: {}
  	};
  	$scope.cMapLayersVis = [];
  	$scope.cMapLayersName = [];

    // Location of text files used to create many of the data layers
  	var sphere_info_path = '/Content/leaflet/data/photospheres.txt';
  	var grt_info_path = '/Content/leaflet/data/grt.txt';
  	var entr_info_path = '/Content/leaflet/data/production_json/schema_accessible_entrances.txt';
  	var go_info_path = '/Content/leaflet/data/go_stops.txt';
  	var info_info_path = '/Content/leaflet/data/production_json/schema_information.txt';
  	var construction_info_path = '/Content/leaflet/data/production_json/schema_construction_sites.txt';
  	var help_info_path = '/Content/leaflet/data/production_json/schema_help_lines.txt';
  	var visitor_info_path = '/Content/leaflet/data/production_json/schema_visitor_parking.txt';
  	var meter_info_path = '/Content/leaflet/data/production_json/schema_meter_parking.txt';
  	var acc_park_info_path = '/Content/leaflet/data/production_json/schema_accessible_parking.txt';
  	var greyhound_info_path = '/Content/leaflet/data/production_json/schema_greyhound.txt';
  	var atm_info_path = '/Content/leaflet/data/production_json/schema_atm.txt';
  	var pub_phones_info_path = '/Content/leaflet/data/public_telephones.txt';
  	var library_info_path = '/Content/leaflet/data/production_json/schema_libraries.txt';
  	var stp_info_path = '/Content/leaflet/data/short_term_parking.txt';
  	var mc_info_path = '/Content/leaflet/data/production_json/schema_motorcycle_parking.txt';
  	var carshare_info_path = '/Content/leaflet/data/community_carshare.txt';
  	var permit_info_path = '/Content/leaflet/data/production_json/schema_permit_parking.txt';
    
    // Required to setup google directional services after the google library has loaded
    GoogleMapApi.then(function (maps) {
        $scope.directionsService = new maps.DirectionsService();
        $scope.directionsDisplay = new maps.DirectionsRenderer();
        $scope.directionsDisplay.setOptions({preserveViewport: true});
        $scope.mapsReady = true;
    });
    
    // Google map main object
    $scope.gMap = {
    "map": {
      center: {
        latitude: 43.474070,
        longitude: -80.544659
      },
      zoom: 15,
      control: {}
    },
    "options": {
      zoomControl: false,
      panControl: false
    }
    };

    $scope.showMap = true;
    $scope.showMapSettings = false;
    $scope.leafletRouter = {};
    $scope.campusMapStuff = {
        ak: ""
    };

    $scope.searchableObj = { value: {} };
    $scope.search = { value: "" };

    // Campus map bounds object used to determine if a point exists inside the bounds
    $scope.campusMapBoundsObj = L.latLngBounds(L.latLng(43.25057933422427, -81.04459762573242), L.latLng(43.709315225531824, -80.1532244682312))

    // Max bounds object used for binding the campus map layer
    $scope.campusMapBounds = {
        northEast: {
            lat: 43.709315225531824,
            lng: -80.1532244682312
        },
        southWest: {
            lat: 43.25057933422427,
            lng: -81.04459762573242
        }
    }

    // Initial leaflet variables including layer addresses and attributions
    angular.extend($scope, {
        leafletCenter: {
            zoom: 16,
            lat: 43.471203500018326,
            lng: -80.54394721984863
        },
        maxBounds: $scope.campusMapBounds,
        layers: {
            baselayers: {
                default: {
                    name: 'Campus Map',
                    url: "https://uwaterloo.ca/map-beta/tiles/default/{z}/{x}/{y}.png",
                    type: 'xyz',
                    layerOptions: {
                        attribution: "Map data &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors | Powered by <a href='https://mapzen.com/projects/valhalla'>Valhalla</a>",
                        minZoom: 11
                    },
                    doRefresh: true
                },
                xyz: {
                    name: 'Open Street Map',
                    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    type: 'xyz',
                    layerOptions: {
                        attribution: "Map data &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors | Powered by <a href='https://mapzen.com/projects/valhalla'>Valhalla</a>"
                    }
                },
                highContrast: {
                    name: 'High Contrast',
                    url: "https://uwaterloo.ca/map-beta/tiles/hc/{z}/{x}/{y}.png",
                    type: 'xyz',
                    layerOptions: {
                        attribution: "Map data &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors | Powered by <a href='https://mapzen.com/projects/valhalla'>Valhalla</a>",
                        minZoom: 11
                    },
                    doRefresh: true
                },
                googleRoadmap: {
                    name: 'Google Streets',
                    layerType: 'ROADMAP',
                    type: 'google',
                    layerOptions: {
                        attribution: "Map data &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors | Powered by <a href='https://mapzen.com/projects/valhalla'>Valhalla</a>"
                    }
                }
            }
        },
        controls: {
            fullscreen: {
                position: 'topleft'
            }
        },
        defaults: {
            tap: false
        }
    });
    
    // Custom Plan object created to allow for custom direction buttons (i.e. walking vs driving buttons)
    var CustomPlan = L.Routing.Plan.extend({
        createGeocoders: function () {
            var container = L.Routing.Plan.prototype.createGeocoders.call(this),
                reverseButton = $scope.createButton('<i class="icon-exchange"></i>', container),
                walkingButton = $scope.createButton('<i id="walkBtn" class="icon-pitch"></i>', container),
                drivingButton = $scope.createButton('<i id="driveBtn" class="icon-car"></i>', container),
                bikingButton = $scope.createButton('<i id="bikeBtn" class="icon-bicycle"></i>', container);

            L.DomEvent.on(reverseButton, 'click', function () {
                var waypoints = this.getWaypoints();
                this.setWaypoints(waypoints.reverse());
            }, this);

            L.DomEvent.on(walkingButton, 'click', function () {
                $scope.leafletRouter._router._transitmode = "pedestrian";
                directionsService.setTravelMethod('pedestrian');

                var waypoints = this.getWaypoints();
                this.setWaypoints(waypoints);
            }, this);

            L.DomEvent.on(drivingButton, 'click', function () {
                $scope.leafletRouter._router._transitmode = "auto";
                directionsService.setTravelMethod('auto');

                var waypoints = this.getWaypoints();
                this.setWaypoints(waypoints);
            }, this);

            L.DomEvent.on(bikingButton, 'click', function () {
                $scope.leafletRouter._router._transitmode = "bicycle";
                directionsService.setTravelMethod('bicycle');

                var waypoints = this.getWaypoints();
                this.setWaypoints(waypoints);
            }, this);

            return container;
        }
    })

    // Initially set the view to the campus map
    $scope.portalHelpers.showView('campusMap.html', 1);

    // Access the map object to set the custom plan and routing information. As well as pass the map object to the layers
    leafletData.getMap("campusMap").then(function (map) {

        // Initialize custom plan
        var plan = new CustomPlan([], {
            geocoder: L.Control.Geocoder.nominatim()
        });

        // Handle vehicle setting for router
        var vehicle = { vehicle: 'auto' };

        if (directionsService.travelMethod() != "" && directionsService.travelMethod() != 'transit') {
            vehicle = { vehicle: directionsService.travelMethod() };
        }
        else if (directionsService.travelMethod() == "") {
            directionsService.setTravelMethod('auto');
        }

        $scope.router = L.Routing.valhalla('valhalla-C-Sr1nM', vehicle.vehicle),

        $scope.leafletRouter = L.Routing.control({
            router: $scope.router,
            plan: plan,
            formatter: new L.Routing.Valhalla.Formatter()
        }).addTo(map);

        // Esri routing
        $scope.latLong = null;
        console.log('campus map', isRouting);
        
        if (directionsService.itemType() == "esri") {
            var dataLocation = "/Routes/EsriBuildingRoomCoords";
            var args = { building: directionsService.item1(), room: directionsService.item2() };
            $.getJSON(dataLocation, args)
                .done(function (json) {
                    if (json != undefined && json.EndLocation != undefined) {
                        $scope.latLong = L.latLng(json.EndLocation.Latitude, json.EndLocation.Longitude);
                        $scope.leafletRouter.spliceWaypoints($scope.leafletRouter.getWaypoints().length - 1, 1, $scope.latLong);
                    } else {
                        alertService.alert("Sorry, we could not find the location you are looking for", 'danger');
                    }
                })
                .fail(function () {
                    alertService.alert("Sorry, our routing service is currently experiencing issues.", 'danger');
                });
        }

        // Set latLong coords for routing, start locating
        if ($scope.latLong == null && directionsService.itemType() == "latlng") {
            $scope.latLong = L.latLng(directionsService.item1(), directionsService.item2());
            $scope.leafletRouter.spliceWaypoints($scope.leafletRouter.getWaypoints().length - 1, 1, $scope.latLong);
        }

        // Set Menu Button control
        var menuBtn = L.control({ position: "topright" });
        menuBtn.onAdd = function (map) {
            var div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
            div.innerHTML = '<div class="leaflet-bar-part leaflet-menu-button" style="padding: 0px; line-height: inherit; height: 36px!important;"><i style="font-size: 25px;" class="icon-menu"></i></div>';
            L.DomEvent.on(div, 'click', function (e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                $scope.portalHelpers.showView('campusMapSettings.html', 2);
                setTimeout(function () {
                    $scope.invalidateMapSize();
                }, 1500);
                $('.widgetCloseButton').click(function () {
                    setTimeout(function () {
                        $scope.invalidateMapSize();
                    }, 1100);
                });
            });
            return div;
        }
        menuBtn.addTo(map);

        // ------- Layer Creation -----------
        // Buildings
        $scope.building_layer = new BuildingLayer(map, $scope.campusMapStuff.ak, $scope.searchableObj.value, $scope.leafletRouter);
        $scope.building_layer.prepare(buildLookupList);

        // Residences (Custom)
        $scope.cMapLayers.Places["residence_layer"] = new ResidenceLayer(map, $scope.campusMapStuff.ak, $scope.searchableObj.value, $scope.leafletRouter);
        $scope.cMapLayers.Places["residence_layer"].prepare(buildLookupList);
        $scope.cMapLayersVis["residence_layer"] = { value: false };
        $scope.cMapLayersName["residence_layer"] = { name: "Residences" };

        // Food Services (Custom)
        $scope.cMapLayers.Places["fs_layer"] = new FoodServicesLayer(map, $scope.campusMapStuff.ak, $scope.leafletRouter);
        $scope.cMapLayers.Places["fs_layer"].prepare();
        $scope.cMapLayersVis["fs_layer"] = { value: false };
        $scope.cMapLayersName["fs_layer"] = { name: "Food Services" };

        // Used to create layer html and custom layers
        var icon_source;
        var icon;

        // GRT Layer (Custom)
        icon_source = (!Modernizr.svg) ? '/Scripts/images/container-icon.png' : '/Scripts/images/container-icon.svg';
        icon = L.divIcon({
            iconSize: [60, 70],
            className: "marker-container",
            iconAnchor: [30, 70],
            html: '<div class="marker-subcontainer"><p class="map-marker-label">GRT</p><i class="map-marker-with-label icon-bus" alt="GRT map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>'
        });
        $scope.cMapLayers.Transit["grt_layer"] = new GRTLayer(icon, grt_info_path, map, $scope.leafletRouter);
        $scope.cMapLayers.Transit["grt_layer"].prepare();
        $scope.cMapLayersVis["grt_layer"] = { value: false };
        $scope.cMapLayersName["grt_layer"] = { name: "GRT Stops" };

        // Photosphere Layer (Custom)
        icon = L.divIcon({
            iconSize: [60, 70],
            className: "marker-container",
            iconAnchor: [30, 70],
            html: '<div class="marker-subcontainer"><i class="map-marker icon-camera" alt="Photospheres map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>'
        });
        $scope.cMapLayers.Information["ps_layer"] = new PhotosphereLayer(icon, sphere_info_path, map);
        $scope.cMapLayers.Information["ps_layer"].prepare();
        $scope.cMapLayersVis["ps_layer"] = { value: false };
        $scope.cMapLayersName["ps_layer"] = { name: "Photospheres" };

        // Accessible Entrances
        $scope.createGeoJSONLayer("acc_entr_layer", $scope.cMapLayers.Places, "Accessible Entrances", '<div class="marker-subcontainer"><i class="map-marker icon-accessibility" alt="Accessibile entrances map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            entr_info_path, 55, 'icon-accessibility', map, $scope.leafletRouter);
        // Additional layer created for accessibility category
        $scope.createGeoJSONLayer("acc_entr_layer_access", $scope.cMapLayers.Accessibility, "Accessible Entrances", '<div class="marker-subcontainer"><i class="map-marker icon-accessibility" alt="Accessibile entrances map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            entr_info_path, 55, 'icon-accessibility', map, $scope.leafletRouter);

        // Library
        $scope.createGeoJSONLayer("lib_layer", $scope.cMapLayers.Places, "Libraries", '<div class="marker-subcontainer"><i class="map-marker icon-library" alt="Libraries map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            library_info_path, 60, 'icon-library', map, $scope.leafletRouter);

        // Go Bus
        $scope.createGeoJSONLayer("go_layer", $scope.cMapLayers.Transit, "Go Transit", '<div class="marker-subcontainer"><p class="map-marker-label">GO</p><i class="map-marker-with-label icon-bus" alt="GO Transit map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            go_info_path, 60, 'icon-bus', map, $scope.leafletRouter);

        // Information
        $scope.createGeoJSONLayer("info_layer", $scope.cMapLayers.Information, "Visitor Information", '<div class="marker-subcontainer"><i class="map-marker icon-info" alt="Visitor information map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            info_info_path, 50, 'icon-info', map, $scope.leafletRouter);

        // Construction Sites
        $scope.createGeoJSONLayer("const_layer", $scope.cMapLayers.Information, "Construction Sites", '<div class="marker-subcontainer"><i class="map-marker icon-construction" alt="Construction sites map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            construction_info_path, 25, 'icon-construction', map, $scope.leafletRouter);

        // Help Lines
        $scope.createGeoJSONLayer("help_layer", $scope.cMapLayers.Information, "Help Lines", '<div class="marker-subcontainer"><i class="map-marker icon-help-phone" alt="Help lines map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            help_info_path, 50, 'icon-help-phone', map, $scope.leafletRouter);

        // Visitor Parking (Custom)
        icon = L.divIcon({
            iconSize: [60, 70],
            className: "marker-container",
            iconAnchor: [30, 70],
            html: '<div class="marker-subcontainer"><p class="map-marker-label">VISITOR</p><i class="map-marker-with-label icon-parking" alt="Meter parking map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>'
        });
        $scope.cMapLayers.Parking["vpark_layer"] = new VisitorParkingLayer(icon, icon, visitor_info_path, map, $scope.campusMapStuff.ak, $scope.leafletRouter);
        $scope.cMapLayers.Parking["vpark_layer"].prepare();
        $scope.cMapLayersVis["vpark_layer"] = { value: false };
        $scope.cMapLayersName["vpark_layer"] = { name: "Visitor Parking" };

        // Meter Parking
        $scope.createGeoJSONLayer("mpark_layer", $scope.cMapLayers.Parking, "Meter Parking", '<div class="marker-subcontainer"><p class="map-marker-label">METER</p><i class="map-marker-with-label icon-parking" alt="Meter parking map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            meter_info_path, 40, 'icon-parking', map, $scope.leafletRouter);

        // Permit Parking
        $scope.createGeoJSONLayer("ppark_layer", $scope.cMapLayers.Parking, "Permit Parking", '<div class="marker-subcontainer"><p class="map-marker-label">PERMIT</p><i class="map-marker-with-label icon-parking" alt="Permit parking map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            permit_info_path, 40, 'icon-parking', map, $scope.leafletRouter);

        // Accessible Parking
        $scope.createGeoJSONLayer("apark_layer", $scope.cMapLayers.Parking, "Accessible Parking", '<div class="marker-subcontainer"><p class="map-marker-label-small">ACCESSIBLE</p><i class="map-marker-with-label icon-parking" alt="Accessible parking map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            acc_park_info_path, 45, 'icon-parking', map, $scope.leafletRouter);
        // Additional layer created for accessibility category
        $scope.createGeoJSONLayer("apark_layer_access", $scope.cMapLayers.Accessibility, "Accessible Parking", '<div class="marker-subcontainer"><p class="map-marker-label-small">ACCESSIBLE</p><i class="map-marker-with-label icon-parking" alt="Accessible parking map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            acc_park_info_path, 45, 'icon-parking', map, $scope.leafletRouter);

        // Carshare
        $scope.createGeoJSONLayer("cshare_layer", $scope.cMapLayers.Transit, "Community Car Share", '<div class="marker-subcontainer"><i class="map-marker icon-cab" alt="Carshare map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            carshare_info_path, 50, 'icon-cab', map, $scope.leafletRouter);

        // Greyhound
        $scope.createGeoJSONLayer("greyhound_layer", $scope.cMapLayers.Transit, "Greyhound", '<div class="marker-subcontainer"><p class="map-marker-label-small">GREYHOUND</p><i class="map-marker-with-label icon-bus" alt="Greyhound map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            greyhound_info_path, 50, 'icon-bus', map, $scope.leafletRouter);

        // ATMs
        $scope.createGeoJSONLayer("atm_layer", $scope.cMapLayers.Information, "ATMs", '<div class="marker-subcontainer"><i class="map-marker icon-credit-card" alt="ATMs map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            atm_info_path, 50, 'icon-credit-card', map, $scope.leafletRouter);

        // Public Phones
        $scope.createGeoJSONLayer("phone_layer", $scope.cMapLayers.Information, "Public Telephones", '<div class="marker-subcontainer"><i class="map-marker icon-phone" alt="Public phones map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            pub_phones_info_path, 50, 'icon-phone', map, $scope.leafletRouter);

        // Short Term Parking
        $scope.createGeoJSONLayer("stp_layer", $scope.cMapLayers.Parking, "Short Term Parking", '<div class="marker-subcontainer"><p class="map-marker-label-small">SHORT TERM</p><i class="map-marker-with-label icon-parking" alt="Short term parking map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            stp_info_path, 50, 'icon-parking', map, $scope.leafletRouter);

        // Motorcycle Parking
        $scope.createGeoJSONLayer("mc_layer", $scope.cMapLayers.Parking, "Motorcycle Parking", '<div class="marker-subcontainer"><p class="map-marker-label-small">MOTORCYCLE</p><i class="map-marker-with-label icon-parking" alt="Motorcycle parking map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>',
            mc_info_path, 45, 'icon-parking', map, $scope.leafletRouter);

        // Custom map click event creates popup that allows user to choose that location as a start or end point for routing
        map.on('click', function (e) {
            var container = L.DomUtil.create('div'),
                startBtn = $scope.createPopupButton('Start from', container),
                destBtn = $scope.createPopupButton('Go to', container);

            L.DomEvent.on(startBtn, 'click', function () {
                console.log(directionsService.travelMethod());
                $scope.leafletRouter.spliceWaypoints(0, 1, e.latlng);

                map.closePopup();
            });

            L.DomEvent.on(destBtn, 'click', function () {
                $scope.leafletRouter.spliceWaypoints($scope.leafletRouter.getWaypoints().length - 1, 1, e.latlng);

                map.closePopup();
            });

            L.popup()
                .setContent(container)
                .setLatLng(e.latlng)
                .openOn(map);
            startBtn.setAttribute('style', 'width: 100%;');
            destBtn.setAttribute('style', 'width: 100%;');
        });

        // Handle the base layer change which requires changing the bounds of the map if the user is on campus map
        map.on('baselayerchange', function (e) {
            if (e.layer._url == "https://uwaterloo.ca/map-beta/tiles/default/{z}/{x}/{y}.png" || e.layer._url == "https://uwaterloo.ca/map-beta/tiles/hc/{z}/{x}/{y}.png") {
                $scope.lastCenter = {
                    lat: map.getCenter().lat,
                    lng: map.getCenter().lng,
                    zoom: map.getZoom()
                }
                $scope.loadingCampusMap = true;
                $scope.onCampusMap = true;
                $scope.maxBounds = $scope.campusMapBounds;
            } else {
                console.log("settings max bounds to nothing");
                $scope.maxBounds = {};
                $scope.loadingCampusMap = false;
                $scope.onCampusMap = false;
            }
        });

        // Handle special cases for map loading
        map.on('zoomend', function (e) {

            // On first load ensure user is zoomed into campus
            if ($scope.firstLoad) {
                $scope.firstLoad = false;
                map.setView(new L.LatLng(43.471203500018326, -80.54394721984863), 16);

                return;
            }

            // if campus map is being loaded, check to see if existing center point is inside the map bounds and preserve the center if possible
            if ($scope.loadingCampusMap) {
                if (!(jQuery.isEmptyObject($scope.lastCenter)) && $scope.campusMapBoundsObj.contains(new L.LatLng($scope.lastCenter.lat, $scope.lastCenter.lng)))
                    map.setView(new L.LatLng($scope.lastCenter.lat, $scope.lastCenter.lng), $scope.lastCenter.zoom);

                $scope.loadingCampusMap = false;
                return;
            }
            // Campus map only supports up to zoom level 11 so notify user if they are at a lower zoom level (zoomed out further) than the map can handle
            if (map.getZoom() <= 11 && $scope.onCampusMap) {
                alertService.alert("Campus map does not support areas other than Kitchener/Waterloo. Switch to Open Street Maps or Google to view a larger map.");
            }
        });

        // Setup locator control
        $scope.locator_control = new LocatorControl(map, $scope.leafletRouter);
        map.addControl($scope.locator_control);

        $scope.travelMethod = directionsService.travelMethod;

        // Watch travel method and change the selected method button accordingly
        $scope.$watch(function ($scope) {
            return $scope.travelMethod();
        }, function (newVal) {

            $(".widgetButtonSmall").removeClass("light-background");

            if (newVal == "auto") {
                $("#driveBtn").parent().addClass("light-background");
            }
            else if (newVal == "bicycle") {
                $("#bikeBtn").parent().addClass("light-background");
            }
            else if (newVal == "pedestrian") {
                $("#walkBtn").parent().addClass("light-background");
            }
        });

        $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            map.stopLocate();
            watching_position = false;
        });
    });

    // ---------- FUNCTIONS -----------------------------------------------------
    
    // Create map layer using standard geoJSONlayer function
    // Setup cMap variables for menu
    $scope.createGeoJSONLayer = function (layerKey, layer, layerName, iconHtml, path, clusterTolerance, iconClass, map, router) {
        var icon_source = (!Modernizr.svg) ? '/Scripts/images/container-icon.png' : '/Scripts/images/container-icon.svg';
        var icon = L.divIcon({
            iconSize: [60, 70],
            className: "marker-container",
            iconAnchor: [30, 70],
            html: iconHtml
        });

        layer[layerKey] = new GeoJSONLayer(icon, path, clusterTolerance, iconClass, map, router);
        layer[layerKey].prepare();
        $scope.cMapLayersVis[layerKey] = { value: false };
        $scope.cMapLayersName[layerKey] = { name: layerName };
    }

    // Transition to google maps section and retrieve directions
    $scope.transitRoute = function () {
        var wPoints = $scope.leafletRouter.getWaypoints();
        var startLL = wPoints[0].latLng;
        var endLocationLL = wPoints[wPoints.length - 1].latLng;
        if ((startLL != null && typeof startLL != 'undefined') && (endLocationLL != null && typeof endLocationLL != 'undefined')) {
            var start = new google.maps.LatLng(startLL.lat, startLL.lng);
            var endLocation = new google.maps.LatLng(endLocationLL.lat, endLocationLL.lng);
            if ($scope.directionsDisplay == null) {
                $scope.directionsDisplay = new google.maps.DirectionsRenderer();
            }
            $scope.directionsDisplay.setMap($scope.getGMap());
            if (endLocation != "") {
                var request = {
                    origin: start,
                    destination: endLocation,
                    travelMode: 'TRANSIT',
                    provideRouteAlternatives: true
                };
                $scope.directionsService.route(request, function (response, status) {
                    console.log(status);
                    if (status == google.maps.DirectionsStatus.OK) {
                        var route = response.routes[0];
                        //var routeStart = route.legs[0].start_location;
                        $scope.directionsDisplay.setDirections(response);
                        $scope.directionsDisplay.setPanel(document.getElementById("directionsContainer"));
                    }
                });
            }
        } else {
            alertService.alert("Please select a route before switching to transit mode.", 'danger');
        }
    }

    // Access the google map object
    $scope.getGMap = function () {
        return $scope.gMap.map.control.getGMap();
    };

    // Display google map page
    $scope.showGMap = function () {
        $("#directionsPage").hide();
        $("#mapPage").show();
    }

    // Select a building from the building search to highlight and display the popup
    // This will switch the user back to the campus map
    $scope.buildingSelect = function (id, code, altNames) {
        $scope.portalHelpers.closeLastView();
        setTimeout(function () {
            $scope.invalidateMapSize();
            if ($.inArray(id, residence_building_ids) >= 0) {
                $scope.cMapLayers.Places["residence_layer"].selectBuilding(id, code, altNames);
            } else {
                $scope.building_layer.selectBuilding(id, code);
            }
        }, 400);
    };

    // Toggle selected building in building search menu
    $scope.toggleSelected = function (div) {
        if ($(div.currentTarget).hasClass("selectedBuilding"))
            $(div.currentTarget).removeClass("selectedBuilding");
        else {
            $(".selectedBuilding").removeClass("selectedBuilding");
            $(div.currentTarget).addClass("selectedBuilding");
        }
    }

    // Function passed through to custom layers in order to generate the list for building search
    // Could be optimized in the future (left the same as was completed on the official campus map)
    function buildLookupList() {
        //FIXME: This is hacky and should be done in an event-driven way
        if (buildings_retrieved && residences_retrieved) {
            var abbreviations = [];
            $.each($scope.searchableObj.value, function (key, value) {
                abbreviations.push([value.building_code, value.building_id]);
            })
            abbreviations.sort();

            $.each(abbreviations, function (i, abbv) {
                var value = $scope.searchableObj.value[abbv[1]];
                //Build list box for searching
                var new_list_item = document.createElement('a');
                new_list_item.innerHTML = value.building_code + " - " + value.building_name;
                new_list_item.setAttribute("class", "list-group-item building-toc");
                new_list_item.setAttribute("href", "#");
                if ($.inArray(value.building_id, residence_building_ids) >= 0) {
                    new_list_item.setAttribute("onclick", "cMapLayers.Places['residence_layer'].selectBuilding('" + value.building_id + "');");
                }
                else {
                    new_list_item.setAttribute("onclick", "building_layer.selectBuilding('" + value.building_id + "');");
                }

                new_list_item.setAttribute("id", value.building_id + "_toc");
            });
        }
    }

    // Create button function used to create direction type buttons
    $scope.createButton = function (label, container) {
        var btn = L.DomUtil.create('button', '', container);
        btn.setAttribute('type', 'button');
        btn.setAttribute('class', 'widgetButtonSmall');
        btn.innerHTML = label;
        return btn;
    }

    // Create button function used to create custom popup button (start from/go to)
    $scope.createPopupButton = function (label, container) {
        var containerDiv = L.DomUtil.create('div', '', container);
        containerDiv.setAttribute('style', 'padding: 5px; text-align: center;');
        var btn = L.DomUtil.create('button', '', containerDiv);
        btn.setAttribute('type', 'button');
        btn.setAttribute('class', 'widgetButtonSmall');
        //btn.setAttribute('style', 'width: 100%;');
        btn.innerHTML = label;
        return btn;
    }

    // Regenerates tiles on campus map (used when transitioning from other views
    $scope.invalidateMapSize = function () {
        leafletData.getMap("campusMap").then(function (map) {
            map.invalidateSize();
        });
    };

    // Center the center of the map on the campus
    $scope.centerMapOnCampus = function () {
        leafletData.getMap("campusMap").then(function (map) {
            if (map.getZoom() < 11) {
                map.setView(new L.LatLng(43.471203500018326, -80.54394721984863), 11);
            } else {
                map.setView(new L.LatLng(43.471203500018326, -80.54394721984863), map.getZoom());
            }
        });
    };

    // Clear all selected layers in the layers menu
    $scope.clearAllLayers = function () {
        for (var index in $scope.cMapLayers.Places) {
            if($scope.cMapLayersVis[index].value)
            {
                $scope.cMapLayersVis[index].value = false;
                $scope.cMapLayers.Places[index].toggleLayer();
            }
        }
        for (var index in $scope.cMapLayers.Transit) {
            if ($scope.cMapLayersVis[index].value) {
                $scope.cMapLayersVis[index].value = false;
                $scope.cMapLayers.Transit[index].toggleLayer();
            }
        }
        for (var index in $scope.cMapLayers.Information) {
            if ($scope.cMapLayersVis[index].value) {
                $scope.cMapLayersVis[index].value = false;
                $scope.cMapLayers.Information[index].toggleLayer();
            }
        }
        for (var index in $scope.cMapLayers.Parking) {
            if ($scope.cMapLayersVis[index].value) {
                $scope.cMapLayersVis[index].value = false;
                $scope.cMapLayers.Parking[index].toggleLayer();
            }
        }
        for (var index in $scope.cMapLayers.Accessibility) {
            if ($scope.cMapLayersVis[index].value) {
                $scope.cMapLayersVis[index].value = false;
                $scope.cMapLayers.Accessibility[index].toggleLayer();
            }
        }

        $scope.showAlertMessage("Layers Cleared");
    }

    // Custom alert function used inside campus-map-data-layers to allow better error message handling
    $scope.showAlertMessage = function (message, isDanger) {
        if (isDanger) {
            alertService.alert(message, 'danger');
        } else {
            alertService.alert(message);
        }
    }

    // Google map refreshing function
    $scope.refreshGMap = function () {
        $scope.gMap.map.control.refresh();
    };

    // Toggle transit mode, used to preserve centers on both maps and provide a consistant experience
    $scope.transitMode = function (toggleOn) {
        if (toggleOn) {
            $("#campusMap").hide();
            $("#mapPage").show();
            $("#transitModeLink").text("Switch to Campus Map");
            $("#transitModeIcon").addClass("widget-icon");
            $scope.refreshGMap();
            $scope.isLeafletMap = false;
            leafletData.getMap("campusMap").then(function (map) {
                $scope.gMap.map.zoom = map.getZoom();
                $scope.gMap.map.center.latitude = map.getCenter().lat;
                $scope.gMap.map.center.longitude = map.getCenter().lng;
            });
            $scope.transitRoute();
        } else {
            $("#mapPage").hide();
            $("#campusMap").show();
            $("#transitModeLink").text("Switch to Transit Mode");
            $("#transitModeIcon").removeClass("widget-icon");
            $scope.invalidateMapSize();
            leafletData.getMap("campusMap").then(function (map) {
                map.setView(new L.LatLng($scope.gMap.map.center.latitude, $scope.gMap.map.center.longitude), $scope.gMap.map.zoom);
            });
            $scope.isLeafletMap = true;
        }
    }

    // Grabs leaflet map center via the leafletData object
    $scope.getLeafletMapCenter = function () {
        leafletData.getMap("campusMap").then(function (map) {
            console.log(map.getZoom());
        });
    }

    }])
// Filter building results by a search query
.filter('buildingSearch', function () {
    return function (input, search) {
        var out = [];
        
        if (typeof search=='undefined' || search == '' || search == "")
        {
            for (var i in input) {
            	var item = input[i];
                out.push(item);
            }
            return out;
        }

        console.log("performing search instead of skip");
        for (var i in input) {
            var item = input[i];

            if (item.building_name.toLowerCase().indexOf(search.toLowerCase()) > -1 ||
                (item.building_code != null && item.building_code.toLowerCase().indexOf(search.toLowerCase()) > -1))
                out.push(item);
        }

      console.log(out);
        return out;
    }
})
// used for the custom control in the google map (for showing directions page)
.controller('transitDirectionsCtrl', ['$scope', function ($scope) {
                    $scope.showDirections = function ()
                    {
                        $("#mapPage").hide();
                        $("#transitModeLink").parent().hide();
                    $("#directionsPage").show();
                    };
                }]);
                              
/*
angular.module('PortalApp', ['uiGmapgoogle-maps', 'leaflet-directive'])
.config(['uiGmapGoogleMapApiProvider', function (GoogleMapApi) {
        GoogleMapApi.configure({
            key: 'AIzaSyD59-BEGjOcxc20VoMap0jYkCuVaUq9yTM',
            v: '3.17',
            libraries: 'visualization'
        });
    }])

                */