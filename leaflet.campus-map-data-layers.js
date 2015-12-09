var buildings_retrieved = false;
var residences_retrieved = false;
var current_selection = "";
var current_code = "";
var current_altNames = "";
var isRouting = false;
var locator_marker;
var locator_accuracy_marker;
var geo_watch_id;
var watching_position = false;
var locate_icon;
var zoom_to = false; //track if we have zoomed to the user's location yet
var accurate_location = true; //don't display alerts until we have an accurate location
var locateRouter;
var locatorMap;
var isLocatorBtnClick = false;

function GeoJSONLayer(icon, json_file_path, cluster_tolerance, icon_class, map, router) {
    //Private variables
    var json_response;
    var json_layer;
    var layer_icon = icon;
    var icon_source = (!Modernizr.svg) ? '/Scripts/images/container-icon.png' : '/Scripts/images/container-icon.svg';
    var markers;
    if (cluster_tolerance > 0) {
        markers = new L.MarkerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: cluster_tolerance,
            iconCreateFunction: function (cluster) {
                icon = L.divIcon({
                    iconSize: [60, 70],
                    className: "marker-container",
                    iconAnchor: [30, 70],
                    html: '<div class="marker-subcontainer"><p class="map-marker-label-inv"><span class="map-marker-label-bak">' + cluster.getChildCount() + '</span></p><i class="map-marker-with-label ' + icon_class + '" alt="Accessible entrance map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>'
                });
                return icon;
            }
        });
    }

    //Private functions
    var getData = function (callback) {
        $.get(json_file_path, function (data) {
            json_response = $.parseJSON(data);
        })
        .done(function () {
            createLayer(callback);
            if (callback) callback();
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log("Error fetching " + json_file_path + " from server: " + errorThrown);
        });
    };

    var createLayer = function (callback) {
        json_layer = new L.geoJson(json_response, {
            pointToLayer: function (feature, latlng) {

                var marker = L.marker(latlng, { icon: icon });

                if ((feature.properties != null) && (feature.properties.name != null) && (feature.properties.name != "")) {
                    var popup_container = L.DomUtil.create("div", "large-popup"); // "<div class='large-popup'>"
                    L.DomUtil.addClass(popup_container, 'campus-map-popup');
                    var popup_content = "";
                    popup_content += "<div class='large-popup-header'>" + feature.properties.name + "</div>";
                    popup_content += '<br><i class="large-popup-icon-no-label ' + icon_class + '" alt="Library map icon"></i>';
                    popup_content += "</div>";
                    popup_container.innerHTML = popup_content;

                    var directionsButton = L.DomUtil.create("div", "campus-map-directions-button", popup_container);
                    directionsButton.innerHTML = "<i class='icon-direction'></i><div class='large-popup-header'>Directions</div>";

                    L.DomEvent.on(directionsButton, 'click', function () {
                        router.spliceWaypoints(router.getWaypoints().length - 1, 1, latlng);
                        var curStart = router.getWaypoints()[0].latLng;
                        if (!watching_position && curStart == null) {
                            map.stopLocate();
                            isRouting = true;
                            map.locate({
                                timeout: 10000,
                                enableHighAccuracy: true,
                                maxZoom: 16
                            });
                        }
                        map.closePopup();
                    });

                    marker.bindPopup(popup_container);
                }
                if (cluster_tolerance > 0) {
                    markers.addLayer(marker);
                }
                return marker;
            }
        });
        if (cluster_tolerance > 0) {
            json_layer = markers;
        }
        json_layer.getAttribution = function () { return '<a href="#" data-toggle="modal" data-target="#termsModal">UWaterloo Open Data</a>' };

        if (callback) callback();
    };
    return {

        //Public functions
        prepare: function (callback) {
            getData(callback);
        },

        getLayer: function () {
            return json_layer;
        },

        showLayer: function () {
            map.addLayer(json_layer);
        },

        hideLayer: function () {
            map.removeLayer(json_layer);
        },

        toggleLayer: function () {
            map.hasLayer(json_layer) ? map.removeLayer(json_layer) : map.addLayer(json_layer);
        }
    }
};

function VisitorParkingLayer(icon, watpark_icon, json_file_path, map, uw_api_key, router) {
    //Private variables
    var vpark_json_response;
    var watpark_data;
    var watpark_lots = [];
    var json_layer;
    var layer_icon = icon;
    var icon_source = (!Modernizr.svg) ? '/Scripts/images/container-icon.png' : '/Scripts/images/container-icon.svg';
    var markers = new L.MarkerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        iconCreateFunction: function (cluster) {
            icon = L.divIcon({
                iconSize: [60, 70],
                className: "marker-container",
                iconAnchor: [30, 70],
                html: '<div class="marker-subcontainer"><p class="map-marker-label-inv"><span class="map-marker-label-bak">' + cluster.getChildCount() + '</span></p><i class="map-marker-with-label icon-parking" alt="Visitor parking map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>'
            });
            return icon;
        }
    });

    //Private functions
    var getData = function (callback) {
        $.get(json_file_path, function (data) {
            vpark_json_response = $.parseJSON(data);
        })
        .done(function () {

            var watpark_url = "https://api.uwaterloo.ca/public/v1/?key=" + uw_api_key + "&service=WatPark&output=json";
            $.ajax({
                dataType: "json",
                cache: false,
                url: "/Develop/ExecuteServerScriptProd",
                data: { id: 'campusMap', functionName: 'getOpenDataV1', sqlArgs: { endPoint: 'service=WatPark&output=json' }, reviewing: false },
                method: "POST",
                success: function (data) {
                    if (data.response.data != undefined) {
                        watpark_data = sortResults(data.response.data.result, "LotName");
                        $.each(watpark_data, function (i, lot) {
                            watpark_lots.push(lot.LotName);
                        });
                    }
                },
                crossDomain: true,
                xhr: window.IEXMLHttpRequest || jQuery.ajaxSettings.xhr
            })
            .done(function () {
                createLayer(callback);
                if (callback) callback();
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log("Error fetching WatPark information from server: " + errorThrown);
                if (callback) callback();
            });
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log("Error fetching " + json_file_path + " from server: " + errorThrown);
        });
    };

    var createLayer = function (callback) {
        json_layer = new L.geoJson(vpark_json_response, {
            pointToLayer: function (feature, latlng) {
                var marker;
                var popup_container = L.DomUtil.create('div', 'wp-layer-popup');
                L.DomUtil.addClass(popup_container, 'campus-map-popup');
                if (feature.properties != null) {
                    if ($.inArray(feature.properties.name, watpark_lots) >= 0) {
                        //If the lot is a watpark lot, bulid a popup

                        var popup_content;
                        var perc;
                        var cap;
                        var used;
                        var avail;

                        $.each(watpark_data, function (i, v) {
                            if (v.LotName == feature.properties.name && v.PercentFilled != null) {
                                perc = v.PercentFilled;
                                cap = v.Capacity;
                                used = v.LatestCount;
                                avail = cap - used;
                            }
                        });
                        if (perc != null) {
                            var popup_content = "<div class='large-popup'>"
                            popup_content += "<div class='large-popup-header'>Lot " + feature.properties.name + "</div>";
                            popup_content += "<div class='large-popup-subheader'>" + avail + " Spots Left</div>";
                            popup_content += '<div class="progress"><div class="progress-bar" role="progressbar" aria-valuenow="' + used + '" aria-valuemin="0" aria-valuemax="' + cap + '" style="width: ' + perc + '%;">' + perc + '% Full</div></div>';
                            popup_content += '<span class="large-popup-label">VISITOR</span><br><i class="large-popup-icon icon-parking" alt="Parking map icon"></i>'
                            popup_content += "</div>"

                            // popup_content += '<div class="progress"><div class="progress-bar" role="progressbar" aria-valuenow="'+ used + '" aria-valuemin="0" aria-valuemax="' + cap + '" style="width: ' + perc + '%;">' + perc + '% Full</div></div>';
                        }
                        popup_container.innerHTML = popup_content;

                        var directionsButton = L.DomUtil.create("div", "campus-map-directions-button", popup_container);
                        directionsButton.innerHTML = "<i class='icon-direction'></i><div class='large-popup-header'>Directions</div>";

                        L.DomEvent.on(directionsButton, 'click', function () {
                            router.spliceWaypoints(router.getWaypoints().length - 1, 1, latlng);
                            var curStart = router.getWaypoints()[0].latLng;
                            if (!watching_position && curStart == null) {
                                map.stopLocate();
                                isRouting = true;
                                map.locate({
                                    timeout: 10000,
                                    enableHighAccuracy: true,
                                    maxZoom: 16
                                });
                            }
                            map.closePopup();
                        });

                        marker = L.marker(latlng, { icon: watpark_icon }).bindPopup(popup_container, { maxWidth: 150, maxHeight: 200 });
                    }
                    else {
                        var popup_content = "<div class='large-popup'>"
                        popup_content += "<div class='large-popup-header'>Lot " + feature.properties.name + "</div>";
                        popup_content += '<span class="large-popup-label">VISITOR</span><br><i class="large-popup-icon icon-parking" alt="Parking map icon"></i>'
                        popup_content += "</div>"
                        popup_container.innerHTML = popup_content;

                        var directionsButton = L.DomUtil.create("div", "campus-map-directions-button", popup_container);
                        directionsButton.innerHTML = "<i class='icon-direction'></i><div class='large-popup-header'>Directions</div>";

                        L.DomEvent.on(directionsButton, 'click', function () {
                            router.spliceWaypoints(router.getWaypoints().length - 1, 1, latlng);
                            var curStart = router.getWaypoints()[0].latLng;
                            if (!watching_position && curStart == null) {
                                map.stopLocate();
                                isRouting = true;
                                map.locate({
                                    timeout: 10000,
                                    enableHighAccuracy: true,
                                    maxZoom: 16
                                });
                            }
                            map.closePopup();
                        });

                        marker = L.marker(latlng, { icon: icon }).bindPopup(popup_container, { maxWidth: 150, maxHeight: 200 });
                    }
                }
                else {
                    marker = L.marker(latlng, { icon: icon });
                }
                markers.addLayer(marker);
                return marker;
            }
        });
        json_layer = markers;
        json_layer.getAttribution = function () { return '<a href="#" data-toggle="modal" data-target="#termsModal">UWaterloo Open Data</a>' };
        if (callback) callback();

    };
    return {

        //Public functions
        prepare: function (callback) {
            getData(callback);
        },

        getLayer: function () {
            return json_layer;
        },

        showLayer: function () {
            map.addLayer(json_layer);
        },

        hideLayer: function () {
            map.removeLayer(json_layer);
        },

        toggleLayer: function () {
            map.hasLayer(json_layer) ? map.removeLayer(json_layer) : map.addLayer(json_layer);
        }
    }
};

function CarShareLayer(icon, carshare_info_path, map, router) {
    //Private variables

    var carshare_json;
    var carshare_layer;
    var icon_source = (!Modernizr.svg) ? '/Scripts/images/container-icon.png' : '/Scripts/images/container-icon.svg';
    var markers = new L.MarkerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        iconCreateFunction: function (cluster) {
            icon = L.divIcon({
                iconSize: [60, 70],
                className: "marker-container",
                iconAnchor: [30, 70],
                html: '<div class="marker-subcontainer"><p class="map-marker-label-inv"><span class="map-marker-label-bak">' + cluster.getChildCount() + '</span></p><i class="map-marker-with-label icon-cab" alt="Carshare map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>'
            });
            return icon;
        }
    });


    //Private functions
    var getData = function (callback) {
        $.get(carshare_info_path, function (data) {
            carshare_json = $.parseJSON(data);
        })
        .done(function () {
            createLayer(callback);
            if (callback) callback();
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log("Error fetching GRT information from server: " + errorThrown);
        });
    };

    var createLayer = function (callback) {
        carshare_layer = L.geoJson(carshare_json, {
            pointToLayer: function (feature, latlng) {
                var marker = L.marker(latlng, { icon: icon });
                var popup_container = L.DomUtil.create("div");
                L.DomUtil.addClass(popup_container, 'campus-map-popup');
                var popup_content = "<div class='large-popup'>"
                popup_content += '<div class="large-popup-label"><a target="_blank" href="http://communitycarshare.ca/">Community Carshare</div></a><br>';
                popup_content += '<i class="large-popup-icon icon-cab" alt="Carshare map icon"></i>'
                popup_content += "</div>"
                popup_container.innerHTML = popup_content;
                var directionsButton = L.DomUtil.create("div", "campus-map-directions-button", popup_container);
                directionsButton.innerHTML = "<i class='icon-direction'></i><div class='large-popup-header'>Directions</div>";

                L.DomEvent.on(directionsButton, 'click', function () {
                    router.spliceWaypoints(router.getWaypoints().length - 1, 1, latlng);
                    var curStart = router.getWaypoints()[0].latLng;
                    if (!watching_position && curStart == null) {
                        map.stopLocate();
                        isRouting = true;
                        map.locate({
                            timeout: 10000,
                            enableHighAccuracy: true,
                            maxZoom: 16
                        });
                    }
                    map.closePopup();
                });

                marker.bindPopup(popup_container);
                markers.addLayer(marker);
                return marker;
            }
        });
        carshare_layer = markers;
        carshare_layer.getAttribution = function () { return '<a href="#" data-toggle="modal" data-target="#termsModal">Community CarShare</a>' };
        if (callback) callback();
    };

    return {

        //Public functions
        prepare: function (callback) {
            getData(callback);
        },

        getLayer: function () {
            return carshare_layer;
        },

        showLayer: function () {
            map.addLayer(carshare_layer);
        },

        hideLayer: function () {
            map.removeLayer(carshare_layer);
        },

        toggleLayer: function () {
            map.hasLayer(carshare_layer) ? map.removeLayer(carshare_layer) : map.addLayer(carshare_layer);
        }
    }

};

var residence_building_ids = [
"841", "843", "845", "4601", "4602", "4603", "4604", "4605", "4606", "4607", "4608", "4609", "4610", "4611", "4612", "4613", "4614", "4615", "4616",
"4617", "4618", "4619", "4620", "4621", "4622", "4623", "4624", "4625", "4626", "4627", "4628", "4629", "4630", "4631", "4632", "4633", "4634", "4635",
"43A", "43B", "43C", "43D", "43E", "43F", "43G", "43H", "43I", "43J", "43K", "43L", "43M", "43N", "43O", "43P", "43Q", "811", "834",
"26CC", "26EC", "26ET", "26NC", "26SC", "26WC", "26WT", "20CC", "20E1", "20E2", "20E3", "20E4", "20E5", "20E6", "20N1", "20N2", "20N3", "20N4", "20N5", "20N6",
"20W1", "20W2", "20W3", "20W4", "20W5", "20W6", "20S1", "20S2", "20S3", "20S4", "20S5", "20S6", "20S7", "20S8", "25CC", "25EA", "25EB", "25EC", "25ED", "25EE", "25EL",
"25NA", "25NB", "25NC", "25ND", "25NE", "25NL", "25SA", "25SB", "25SC", "25SD", "25SE", "25SL", "25WA", "25WB", "25WC", "25WD", "25WE", "25WL", "44", "44E", "44W"
];

function BuildingLayer(map, uw_api_key, searchableObj, router) {
    //Private variables
    var buildings_layer;
    var buildings_data;
    var bldg_markers = [];
    var bldg_obj = {};
    var icon_source;

    var icon_source = (!Modernizr.svg) ? '/Scripts/images/container-icon.png' : '/Scripts/images/container-icon.svg';
    //Private functions
    var getData = function (callback) {
        var bldg_url = "https://api.uwaterloo.ca/v2/buildings/list.json?key=" + uw_api_key;
        $.ajax({
            dataType: "json",
            cache: false,
            url: "/Develop/ExecuteServerScriptProd",
            data: { id: 'campusMap', functionName: 'getOpenData', sqlArgs: { endPoint: 'buildings/list.json' }, reviewing: false },
            method: "POST",
            success: function (data) {
                buildings_data = sortResults(data.data, "building_code");
            },
            crossDomain: true,
            xhr: window.IEXMLHttpRequest || jQuery.ajaxSettings.xhr
        })
          .done(function () {
              createLayers(callback);
          })
          .fail(function (jqXHR, textStatus, errorThrown) {
              console.log("Error fetching building information from server: " + errorThrown);
              if (callback) callback();
          });
    };

    var createLayers = function (callback) {
        $.each(buildings_data, function (index, value) {
            if (value.longitude != null && value.latitude != null) {
                var xloc = value.longitude;
                var yloc = value.latitude;
                var icon_source = (!Modernizr.svg) ? '/Scripts/images/bldg-bak.png' : '/Scripts/images/bldg-bak.svg';
                if ($.inArray(value.building_id, residence_building_ids) === -1 && value.building_id != 140) {

                    var popup_container = L.DomUtil.create('div', 'bldg-layer-popup');
                    L.DomUtil.addClass(popup_container, 'campus-map-popup');
                    var popup_content = "";
                    
                    if (value.building_name != null) {
                        popup_content = "<div class='large-popup'>"
                        popup_content += "<div class='large-popup-header'>" + value.building_name + "</div>";
                        //popup_content += directionsButton;
                        popup_content += "</div>"
                    }
                    popup_container.innerHTML = popup_content;

                    var directionsButton = L.DomUtil.create("div", "campus-map-directions-button", popup_container);
                    directionsButton.innerHTML = "<i class='icon-direction'></i><div class='large-popup-header'>Directions</div>";

                    L.DomEvent.on(directionsButton, 'click', function () {
                        var latLong = L.latLng(yloc, xloc);
                        router.spliceWaypoints(router.getWaypoints().length - 1, 1, latLong);
                        var curStart = router.getWaypoints()[0].latLng;
                        if (curStart == null || typeof curStart === 'undefined')
                        {
                            map.stopLocate();
                            isRouting = true;
                            map.locate({
                                timeout: 10000,
                                enableHighAccuracy: true,
                                maxZoom: 16
                            });
                        }
                        
                        map.closePopup();
                    });

                    var b_popup = L.popup().setContent(popup_container);
                    var icon = L.divIcon({
                        className: "building-label-container",
                        iconSize: [40, 40],
                        popupAnchor: [0, -20],
                        html: "<div class='building-label-subcontainer'><span class='building-label'>" + value.building_code.substr(0, 3) + "</span><img height=40 width=40 src='" + icon_source + "'></div>"
                    });
                    var marker = L.marker([yloc, xloc], { icon: icon });
                    marker.setZIndexOffset(1000); //Ensure buildings are always on top
                    // marker.bindPopup(popup_container,{maxWidth: 150, maxHeight: 200});
                    marker.bindPopup(b_popup, { maxWidth: 150, maxHeight: 200 });
                    bldg_markers.push(marker);
                    bldg_obj[value.building_code] = marker;
                    searchableObj[value.building_id] = value;
                }
            }

        });

        building_markers = bldg_obj;
        buildings_layer = L.layerGroup(bldg_markers);
        buildings_layer.getAttribution = function () { return '<a href="#" data-toggle="modal" data-target="#termsModal">UWaterloo Open Data</a>' };
        buildings_retrieved = true;
        // buildLookupList();
        if (callback) callback();
    };

    return {
        prepare: function (callback) {
            getData(callback);

            //Set scale dependent rendering
            map.on('zoomend', function () {
                if (map.getZoom() >= 17) {
                    if (!(map.hasLayer(buildings_layer))) {
                        map.addLayer(buildings_layer);
                    }
                }
                else {
                    if (map.hasLayer(buildings_layer)) {
                        map.removeLayer(buildings_layer);
                    }
                }
            });
        },

        getLayer: function () {
            return buildings_layer;
        },

        showLayer: function () {
            map.addLayer(buildings_layer);
        },

        hideLayer: function () {
            map.removeLayer(buildings_layer);
        },

        toggleLayer: function () {
            map.hasLayer(buildings_layer) ? map.removeLayer(buildings_layer) : map.addLayer(buildings_layer);
        },

        selectBuilding: function (building_id, building_code) {
            if (current_selection == building_id) {
                this.unselectBuilding(building_id, building_code);
            }
            else {
                if (current_selection != "") {
                    ($.inArray(current_selection, residence_building_ids) >= 0) ? residence_layer.unselectBuilding(current_selection, current_code, current_altNames) : this.unselectBuilding(current_selection, current_code);
                }
                $('#' + building_id + "_toc").addClass('list-group-item-info');
                var sel_icon_source = (!Modernizr.svg) ? '/Scripts/images/sel-bldg-bak.png' : '/Scripts/images/sel-bldg-bak.svg';
                var selected_icon = L.divIcon({
                    className: "building-label-container",
                    iconSize: [40, 40],
                    popupAnchor: [0, -20],
                    html: "<div class='building-label-subcontainer'><span class='selected-building-label'>" + building_code.substr(0, 3) + "</span><img height=40 width=40 src='" + sel_icon_source + "'></div>"
                });

                bldg_obj[building_code].setZIndexOffset(2000);
                bldg_obj[building_code].setIcon(selected_icon);
                !(map.hasLayer(bldg_obj[building_code])) ? bldg_obj[building_code].addTo(map) : null;
                current_selection = building_id;
                current_code = building_code;
                bldg_obj[building_code].openPopup();
                map.panTo(bldg_obj[building_code].getLatLng());
            }
        },

        unselectBuilding: function (building_id, building_code) {
            // And in the TOC
            $('.building-toc').removeClass('list-group-item-info');
            var icon_source = (!Modernizr.svg) ? '/Scripts/images/bldg-bak.png' : '/Scripts/images/bldg-bak.svg';
            var icon = L.divIcon({
                className: "building-label-container",
                iconSize: [40, 40],
                html: "<div class='building-label-subcontainer'><span class='building-label'>" + building_code.substr(0, 3) + "</span><img height=40 width=40 src='" + icon_source + "'></div>"
            });
            bldg_obj[building_code].setZIndexOffset(1000);
            bldg_obj[building_code].setIcon(icon);
            bldg_obj[building_code].closePopup();
            map.hasLayer(buildings_layer) ? null : map.removeLayer(bldg_obj[building_code]);
            current_selection = "";
            current_code = "";
        }

    }

};

function ResidenceLayer(map, uw_api_key, searchableObj, router) {
    //Private variables
    var residences_layer;
    var residences_data;
    var cgr_layer_small_scale;
    var cgr_layer_large_scale;
    var res_markers = [];
    var res_obj = {};
    var icon_source = (!Modernizr.svg) ? '/Scripts/images/container-icon.png' : '/Scripts/images/container-icon.svg';
    var icon;
    var ss_markers = [];
    var ls_markers = [];
    var num_res = 6;
    var res_retrieved = 0;
    //Private functions
    var getData = function (callback) {
        var res_urls = {
            "CGR": 'buildings/cgr.json',
            "V1":  'buildings/v1.json',
            "UWP": 'buildings/uwp.json',
            "CLN": 'buildings/cln.json',
            "CLV": 'buildings/clv.json',
            "REV": 'buildings/rev.json',
            "MKV": 'buildings/mkv.json'
        }

        //Step through available residence groupings and fetch datasets
        // Perhaps just keep adding to residences_data for all groupings? Might be easiest.
        for (var res in res_urls) {
            $.ajax({
                dataType: "json",
                cache: false,
                url: "/Develop/ExecuteServerScriptProd",
                data: { id: 'campusMap', functionName: 'getOpenData', sqlArgs: { endPoint: res_urls[res] }, reviewing: false },
                method: "POST",
                success: function (data) {
                    residences_data = data.data;
                    ++res_retrieved;
                },
                crossDomain: true,
                xhr: window.IEXMLHttpRequest || jQuery.ajaxSettings.xhr
            })
            .done(function () {
                createLayers(callback);
                // if (callback) callback();
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log("Error fetching residence information from server: " + errorThrown);
            });
        }
        // buildLookupList();
    };

    var createLayers = function (callback) {


        //Small scale layer
        var popup_container = L.DomUtil.create('div', 'bldg-layer-popup');
        L.DomUtil.addClass(popup_container, 'campus-map-popup');
        var popup_content = "";
        var bldg_abbv = (residences_data.alternate_names[0] == undefined) ? residences_data.building_code : residences_data.alternate_names[0]
        bldg_abbv = (bldg_abbv.length > 3) ? residences_data.building_code : bldg_abbv;

        if (residences_data.building_name != null) {
            var popup_content = "<div class='large-popup'>"
            popup_content += "<div class='large-popup-header'>" + residences_data.building_name + "</div>";
            popup_content += '<span class="large-popup-label">' + bldg_abbv + '</span><br><i class="large-popup-icon icon-home" alt="Residences map icon"></i>'
            popup_content += "</div>"

        }
        popup_container.innerHTML = popup_content;
        if (residences_data.longitude != null && residences_data.latitude != null) {
            var xloc = residences_data.longitude;
            var yloc = residences_data.latitude;

            icon = L.divIcon({
                iconSize: [60, 70],
                className: "marker-container",
                iconAnchor: [30, 70],
                html: '<div class="marker-subcontainer"><p class="map-marker-label">' + bldg_abbv + '</p><i class="map-marker-with-label icon-home" alt="Residences map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>'
            });
            var marker = L.marker([yloc, xloc], { icon: icon });

            var directionsButton = L.DomUtil.create("div", "campus-map-directions-button", popup_container);
            directionsButton.innerHTML = "<i class='icon-direction'></i><div class='large-popup-header'>Directions</div>";

            L.DomEvent.on(directionsButton, 'click', function () {
                var latLong = L.latLng(yloc, xloc);
                router.spliceWaypoints(router.getWaypoints().length - 1, 1, latLong);
                var curStart = router.getWaypoints()[0].latLng;
                if (!watching_position && curStart == null) {
                    map.stopLocate();
                    isRouting = true;
                    map.locate({
                        timeout: 10000,
                        enableHighAccuracy: true,
                        maxZoom: 16
                    });
                }
                map.closePopup();
            });

            marker.bindPopup(popup_container, { maxWidth: 150, maxHeight: 200 });
            ss_markers.push(marker);
            res_obj[residences_data.building_id] = marker;
            searchableObj[residences_data.building_id] = residences_data;
        }

        //Large scale layer
        $.each(residences_data.building_sections, function (index, value) {
            if (value.longitude != null && value.latitude != null) {
                // Popup
                var popup_container = L.DomUtil.create('div', 'bldg-layer-popup');
                L.DomUtil.addClass(popup_container, 'campus-map-popup');
                var popup_content = "";
                if (value.building_name != null) {
                    var popup_content = "<div class='large-popup'>"
                    popup_content += "<div class='large-popup-header'>" + value.building_name + "</div>";
                    popup_content += '<span class="large-popup-label">' + value.building_code + '</span><br><i class="large-popup-icon icon-home" alt="Residences map icon"></i>'
                    popup_content += "</div>"
                }
                popup_container.innerHTML = popup_content;

                icon = L.divIcon({
                    iconSize: [60, 70],
                    className: "marker-container",
                    iconAnchor: [30, 70],
                    html: '<div class="marker-subcontainer"><p class="map-marker-label">' + value.building_code + '</p><i class="map-marker-with-label icon-home" alt="Residences map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>'
                });
                // Marker
                var xloc = value.longitude;
                var yloc = value.latitude;
                var marker = L.marker([yloc, xloc], { icon: icon });

                var directionsButton = L.DomUtil.create("div", "campus-map-directions-button", popup_container);
                directionsButton.innerHTML = "<i class='icon-direction'></i><div class='large-popup-header'>Directions</div>";

                L.DomEvent.on(directionsButton, 'click', function () {
                    var latLong = L.latLng(yloc, xloc);
                    router.spliceWaypoints(router.getWaypoints().length - 1, 1, latLong);
                    var curStart = router.getWaypoints()[0].latLng;
                    if (!watching_position && curStart == null) {
                        map.stopLocate();
                        isRouting = true;
                        map.locate({
                            timeout: 10000,
                            enableHighAccuracy: true,
                            maxZoom: 16
                        });
                    }
                    map.closePopup();
                });

                marker.bindPopup(popup_container, { maxWidth: 150, maxHeight: 200 });
                ls_markers.push(marker);
                res_obj[value.building_id] = marker;
                searchableObj[value.building_id] = value;
            }
        });

        cgr_layer_small_scale = L.layerGroup(ss_markers);
        cgr_layer_small_scale.getAttribution = function () { return '<a href="#" data-toggle="modal" data-target="#termsModal">UWaterloo Open Data</a>' };
        cgr_layer_large_scale = L.layerGroup(ls_markers);
        cgr_layer_large_scale.getAttribution = function () { return '<a href="#" data-toggle="modal" data-target="#termsModal">UWaterloo Open Data</a>' };
        residences_layer = cgr_layer_small_scale;
        if (res_retrieved == num_res) {
            residences_retrieved = true;
            if (callback) callback();
        }



    };

    return {
        prepare: function (callback) {
            getData(callback);
            //Set scale dependent rendering
            map.on('zoomend', function () {
                if (map.getZoom() >= 17) {
                    if (residences_layer === cgr_layer_small_scale && map.hasLayer(residences_layer)) {
                        map.removeLayer(residences_layer);
                        residences_layer = cgr_layer_large_scale;
                        map.addLayer(residences_layer);
                    }
                }
                else {
                    if (residences_layer === cgr_layer_large_scale && map.hasLayer(residences_layer)) {
                        map.removeLayer(residences_layer);
                        residences_layer = cgr_layer_small_scale;
                        map.addLayer(residences_layer);
                    }
                }
            });
        },

        getLayer: function () {
            return residences_layer;
        },

        showLayer: function () {
            if (map.getZoom() >= 17) {
                residences_layer = cgr_layer_large_scale;
            }
            else {
                residences_layer = cgr_layer_small_scale;
            }
            map.addLayer(residences_layer);
        },

        hideLayer: function () {
            map.removeLayer(residences_layer);
        },

        toggleLayer: function () {
            if (map.getZoom() >= 17) {
                residences_layer = cgr_layer_large_scale;
            }
            else {
                residences_layer = cgr_layer_small_scale;
            }
            map.hasLayer(residences_layer) ? map.removeLayer(residences_layer) : map.addLayer(residences_layer);
        },

        scaleSwitch: function () {
            if (residences_layer == cgr_layer_small_scale) {
                this.hideLayer();
                residences_layer = cgr_layer_large_scale;
                this.showLayer();
            }
            else {
                this.hideLayer();
                residences_layer = cgr_layer_small_scale;
                this.showLayer();
            }
        },

        selectBuilding: function (building_id, code, altNames) {
            if (current_selection == building_id) {
                this.unselectBuilding(building_id, building_code, altNames);
            }
            else {
                if (current_selection != "") {
                    ($.inArray(current_selection, residence_building_ids) >= 0) ? this.unselectBuilding(current_selection, current_code, current_altNames) : building_layer.unselectBuilding(current_selection, current_code);
                }

                var bldg_abbv = (altNames[0] == undefined) ? code : altNames[0]
                bldg_abbv = (bldg_abbv.length > 3) ? code : bldg_abbv;
                var building_code = bldg_abbv;
                $('#' + building_id + "_toc").addClass('list-group-item-info');
                var sel_icon_source = (!Modernizr.svg) ? '/Scripts/images/sel-container-icon.png' : '/Scripts/images/sel-container-icon.svg';
                var selected_icon = L.divIcon({
                    iconSize: [60, 70],
                    className: "marker-container",
                    iconAnchor: [30, 70],
                    html: '<div class="marker-subcontainer"><p class="map-marker-label-inv">' + building_code.substr(0, 3) + '</p><i class="map-marker-with-label-inv icon-home" alt="Residences map icon"></i><img alt="Map marker background" src="' + sel_icon_source + '"></div>'
                });
                res_obj[building_id].setZIndexOffset(2000);
                res_obj[building_id].setIcon(selected_icon);
                !(map.hasLayer(res_obj[building_code])) ? res_obj[building_id].addTo(map) : null;
                current_selection = building_id;
                current_code = code;
                current_altNames = altNames;
                res_obj[building_id].openPopup();
                map.panTo(res_obj[building_id].getLatLng());
            }
        },

        unselectBuilding: function (building_id, code, altNames) {
            // And in the TOC
            $('.building-toc').removeClass('list-group-item-info');
            var bldg_abbv = (altNames[0] == undefined) ? code : altNames[0]
            bldg_abbv = (bldg_abbv.length > 3) ? code : bldg_abbv;
            var building_code = bldg_abbv;
            var icon_source = (!Modernizr.svg) ? '/Scripts/images/container-icon.png' : '/Scripts/images/container-icon.svg';
            var icon = L.divIcon({
                iconSize: [60, 70],
                className: "marker-container",
                iconAnchor: [30, 70],
                // popupAnchor: [0,-70],
                html: '<div class="marker-subcontainer"><p class="map-marker-label">' + building_code.substr(0, 3) + '</p><i class="map-marker-with-label icon-home" alt="Residences map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>'
            });
            res_obj[building_id].setZIndexOffset(1000);
            res_obj[building_id].setIcon(icon);
            res_obj[building_id].closePopup();
            map.hasLayer(residences_layer) ? null : map.removeLayer(res_obj[building_id]);
            current_selection = "";
            current_code = "";
            current_altNames = "";
        }

    }

};

function PhotosphereLayer(icon, sphere_info_path, map) {
    //Private variables
    var sphere_json;
    var spheres_layer;
    var icon_source = (!Modernizr.svg) ? '/Scripts/images/container-icon.png' : '/Scripts/images/container-icon.svg';
    var markers = new L.MarkerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 60,
        iconCreateFunction: function (cluster) {
            icon = L.divIcon({
                iconSize: [60, 70],
                className: "marker-container",
                iconAnchor: [30, 70],
                html: '<div class="marker-subcontainer"><p class="map-marker-label-inv"><span class="map-marker-label-bak">' + cluster.getChildCount() + '</span></p><i class="map-marker-with-label icon-camera" alt="Photosphere map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>'
            });
            return icon;
        }
    });

    //Private functions
    var getData = function (callback) {
        $.get(sphere_info_path, function (data) {
            sphere_json = $.parseJSON(data);
        })
          .done(function () {
              createLayer(callback);
              if (callback) callback();
          })
          .fail(function (jqXHR, textStatus, errorThrown) {
              console.log("Error fetching photosphere information from server: " + errorThrown);
          });

    };

    var createLayer = function (callback) {
        spheres_layer = new L.geoJson(sphere_json, {
            pointToLayer: function (feature, latlng) {
                var ps_marker = L.marker(latlng, { icon: icon });
                ps_marker.on('click', function () { window.open(feature.properties.url) });
                markers.addLayer(ps_marker);
                return ps_marker;
            }
        });
        spheres_layer = markers;
        spheres_layer.getAttribution = function () { return '<a href="https://uwaterloo.ca">University of Waterloo</a>' };
        if (callback) callback();
    };

    return {

        //Public functions
        prepare: function (callback) {
            getData(callback);
        },

        getLayer: function () {
            return spheres_layer;
        },

        showLayer: function () {
            map.addLayer(spheres_layer);
        },

        hideLayer: function () {
            map.removeLayer(spheres_layer);
        },

        toggleLayer: function () {
            map.hasLayer(spheres_layer) ? map.removeLayer(spheres_layer) : map.addLayer(spheres_layer);
        }
    }

};

function GRTLayer(icon, grt_info_path, map, router) {
    //Private variables

    var grt_json;
    var grt_layer;
    var icon_source = (!Modernizr.svg) ? '/Scripts/images/container-icon.png' : '/Scripts/images/container-icon.svg';
    var markers = new L.MarkerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 60,
        iconCreateFunction: function (cluster) {
            icon = L.divIcon({
                iconSize: [60, 70],
                className: "marker-container",
                iconAnchor: [30, 70],
                html: '<div class="marker-subcontainer"><p class="map-marker-label-inv"><span class="map-marker-label-bak">' + cluster.getChildCount() + '</span></p><i class="map-marker-with-label icon-bus" alt="GRT stop map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>'
            });
            return icon;
        }
    });


    //Private functions
    var getData = function (callback) {
        $.get(grt_info_path, function (data) {
            grt_json = $.parseJSON(data);
        })
        .done(function () {
            createLayer(callback);
            if (callback) callback();
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log("Error fetching GRT information from server: " + errorThrown);
        });
    };

    var createLayer = function (callback) {
        grt_layer = L.geoJson(grt_json, {
            pointToLayer: function (feature, latlng) {
                var marker = L.marker(latlng, { icon: icon });
                var popup_container = L.DomUtil.create("div");
                L.DomUtil.addClass(popup_container, 'campus-map-popup');
                var popup_content = "<div class='large-popup'>"
                popup_content += "<div class='large-popup-header'>" + feature.properties.stop_name + "</div>";
                popup_content += "<div class='large-popup-subheader'>Stop Number: " + feature.properties.stop_id + "</div>";
                popup_content += '<div class="large-popup-label"><a target="_blank" href="http://web.grt.ca/hastinfoweb/">GRT Trip Planner</div></a><br>';
                popup_content += '<span class="large-popup-label">GRT</span><br><i class="large-popup-icon icon-bus" alt="GRT map icon"></i>'
                popup_content += "</div>"
                popup_container.innerHTML = popup_content;

                var directionsButton = L.DomUtil.create("div", "campus-map-directions-button", popup_container);
                directionsButton.innerHTML = "<i class='icon-direction'></i><div class='large-popup-header'>Directions</div>";

                L.DomEvent.on(directionsButton, 'click', function () {
                    router.spliceWaypoints(router.getWaypoints().length - 1, 1, latlng);
                    var curStart = router.getWaypoints()[0].latLng;
                    if (!watching_position && curStart == null) {
                        map.stopLocate();
                        isRouting = true;
                        map.locate({
                            timeout: 10000,
                            enableHighAccuracy: true,
                            maxZoom: 16
                        });
                    }
                    map.closePopup();
                });

                marker.bindPopup(popup_container);
                markers.addLayer(marker);
                return marker;
            }
        });
        grt_layer = markers;
        grt_layer.getAttribution = function () { return '<a href="#" data-toggle="modal" data-target="#termsModal">Regional Municipality of Waterloo</a>' };
        if (callback) callback();
    };

    return {

        //Public functions
        prepare: function (callback) {
            getData(callback);
        },

        getLayer: function () {
            return grt_layer;
        },

        showLayer: function () {
            map.addLayer(grt_layer);
        },

        hideLayer: function () {
            map.removeLayer(grt_layer);
        },

        toggleLayer: function () {
            map.hasLayer(grt_layer) ? map.removeLayer(grt_layer) : map.addLayer(grt_layer);
        }
    }

};

function FoodServicesLayer(map, uw_api_key, router) {
   
    //Private variables
    var fs_data;
    var f_layer;
    var icon_source;
    var icon;
    icon_source = (!Modernizr.svg) ? '/Scripts/images/container-icon.png' : '/Scripts/images/container-icon.svg';
    var markers = new L.MarkerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        iconCreateFunction: function (cluster) {
            icon = L.divIcon({
                iconSize: [60, 70],
                className: "marker-container",
                iconAnchor: [30, 70],
                html: '<div class="marker-subcontainer"><p class="map-marker-label-inv"><span class="map-marker-label-bak">' + cluster.getChildCount() + '</span></p><i class="map-marker-with-label icon-food" alt="Food services map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>'
            });
            return icon;
        }
    });

    //Private functions
    var getData = function (callback) {
        var fs_url = "https://api.uwaterloo.ca/v2/foodservices/locations.json?key=" + uw_api_key;
        $.ajax({
            dataType: "json",
            url: "/Develop/ExecuteServerScriptProd",
            data: { id: 'campusMap', functionName: 'getOpenData', sqlArgs: { endPoint: 'foodservices/locations.json' }, reviewing: false },
            method:"POST",
            cache: false,
            success: function (data) {
                fs_data = data.data;
            },
            crossDomain: true,
            xhr: window.IEXMLHttpRequest || jQuery.ajaxSettings.xhr
        })
          .done(function () {
              createLayer(callback);
              if (callback) callback();
          })
          .fail(function (jqXHR, textStatus, errorThrown) {
              console.log("Error fetching FoodServices information from server: " + errorThrown);
          });
    };

    var createLayer = function (callback) {
        var days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        $.each(fs_data, function (index, value) {
            var xloc = value.longitude;
            var yloc = value.latitude;
            var status = (value.is_open_now) ? "OPEN" : "CLOSED";
            var logo = value.logo;
            var d = new Date();
            var current_day = days[d.getDay()];
            var todays_hours = ""

            if (!(value.opening_hours[current_day].is_closed) && (value.is_open_now)) {
                todays_hours = value.opening_hours[current_day].opening_hour + " to " + value.opening_hours[current_day].closing_hour;
            }

            var popup_container = L.DomUtil.create("div");
            L.DomUtil.addClass(popup_container, 'campus-map-popup');

            var popup_content = "<div class='large-popup'>"
            popup_content += "<div class='large-popup-header'>" + value.outlet_name + "</div>";
            popup_content += '<img class="popup-image" src="' + logo + '" /><br>';
            if (todays_hours != "") {
                popup_content += "<div class='large-popup-subheader'>Today's Hours: " + todays_hours + "</div>";
            }
            popup_content += '<div class="large-popup-label"><a target="_blank" href="https://uwaterloo.ca/food-services/locations-and-hours">Food Services Information</div></a><br>';
            popup_content += '<span class="large-popup-label">' + status + '</span><br><i class="large-popup-icon icon-food" alt="Food services map icon"></i>'
            popup_content += "</div>"

            popup_container.innerHTML = popup_content;

            var directionsButton = L.DomUtil.create("div", "campus-map-directions-button", popup_container);
            directionsButton.innerHTML = "<i class='icon-direction'></i><div class='large-popup-header'>Directions</div>";

            L.DomEvent.on(directionsButton, 'click', function () {
                var latLong = L.latLng(yloc, xloc);
                router.spliceWaypoints(router.getWaypoints().length - 1, 1, latLong);
                var curStart = router.getWaypoints()[0].latLng;
                if (!watching_position && curStart == null) {
                    map.stopLocate();
                    isRouting = true;
                    map.locate({
                        timeout: 10000,
                        enableHighAccuracy: true,
                        maxZoom: 16
                    });
                }
                map.closePopup();
            });

            icon = L.divIcon({
                iconSize: [60, 70],
                className: "marker-container",
                iconAnchor: [30, 70],
                html: '<div class="marker-subcontainer"><p class="map-marker-label">' + status + '</p><i class="map-marker-with-label icon-food" alt="Food services map icon"></i><img alt="Map marker background" src="' + icon_source + '"></div>'
            });
            var marker = L.marker([yloc, xloc], { icon: icon });



            marker.bindPopup(popup_container);
            markers.addLayer(marker);
        });

        f_layer = markers;
        f_layer.getAttribution = function () { return '<a href="#" data-toggle="modal" data-target="#termsModal">UWaterloo Open Data</a>' };
        if (callback) callback();
    };

    return {

        //Public functions
        prepare: function (callback) {
            getData(callback);
        },

        getLayer: function () {
            return f_layer;
        },

        showLayer: function () {
            map.addLayer(f_layer);
        },

        hideLayer: function () {
            map.removeLayer(f_layer);
        },

        toggleLayer: function () {
            map.hasLayer(f_layer) ? map.removeLayer(f_layer) : map.addLayer(f_layer);
        }
    }

};

function sortResults(json_data, sort_property) {
    return json_data.sort(function (a, b) {
        return (a[sort_property] > b[sort_property]) ? 1 : ((a[sort_property] < b[sort_property]) ? -1 : 0)
    });
}

var LocatorControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function(map){

        // create control container
        var container = L.DomUtil.create('div','leaflet-bar');
        var button = L.DomUtil.create('button', 'leaflet-bar-part leaflet-menu-button locationButton', container);

        var icon = L.DomUtil.create('div','icon-compass',button);

        button.setAttribute('alt','Enable geolocation');
        button.setAttribute('aria-label','Enable geolocation');
        locate_icon = button;
        L.DomEvent.addListener(button,'click',this._toggleLocator,this);

        return container;
    },

    initialize: function(map, router){
        // Create a marker for displaying the user's location
        locateRouter = router;
        locatorMap = map;
        locator_marker = L.circleMarker(null,{
            radius: 6,
            stroke: true,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fill: true,
            fillColor: '#0033ff',
            fillOpacity: 1,
            clickable: false
        });

        locator_accuracy_marker = L.circle(null,null,{
            stroke: true,
            color: '#abcdef',
            weight: 3,
            opacity: 0.5,
            fill: true,
            fillColor: '#abcdef',
            fillOpacity: '0.2',
            clickable: true
        });

        map.on('locationfound',this._onLocationFound);
        map.on('locationerror', this._onLocationError);
        
        this._toggleLocator();
    }, 

    _onLocationFound: function(e){
        watching_position = true;

        var accuracy = e.accuracy;
        if (accuracy > 150){
            if (accurate_location == true){
                alert("The location reported by your device is too inaccurate (" + accuracy + " m)  to be reliably shown on the map.");
            }
            accurate_location = false;
            $(locate_icon).css("color","red");
        }
        else {
            var ll = L.latLng(e.latitude, e.longitude);

            //User's location
            locator_marker.setLatLng(ll);
            locator_marker.addTo(locatorMap);
            //Accuracy of user's location
            locator_accuracy_marker.setLatLng(ll);
            locator_accuracy_marker.setRadius(accuracy);
            locator_accuracy_marker.addTo(locatorMap);

            $(locate_icon).css("color", "green");
            locate_icon.setAttribute('alt', 'Disable geolocation');

            if (isLocatorBtnClick || isRouting)
            {
                locateRouter.spliceWaypoints(0, 1, ll);

                isRouting = false;
                accurate_location = true;

                // If we have already zoomed to the user's location, don't do it again
                if (!zoom_to) {
                    locatorMap.setView(ll);
                    zoom_to = true;
                }
            }

            isLocatorBtnClick = false;
        }
    },

    _onLocationError: function(e){
        $(locate_icon).css("color","red");
        locate_icon.setAttribute('alt','Enable geolocation');
        switch(e.code){
            case 0: //Uknown error
                $('#campusMapLink').scope().showAlertMessage("The application encountered an unknown error when trying to access your location.", true);
                break;
            case 1: //Permission denied
                $('#campusMapLink').scope().showAlertMessage("The application does not have permission to access your location.", true);
                break;
            case 2: //Position unavailable
                $('#campusMapLink').scope().showAlertMessage("The application was unable to find your position.", true);
                break;
            case 3: //Timeout
                $('#campusMapLink').scope().showAlertMessage("The application timed out while waiting for a position.", true);
                break;
            default:
                $('#campusMapLink').scope().showAlertMessage("There was an error trying to access your location.", true);
                break;
        }
    },

    _toggleLocator: function (e) {
        isLocatorBtnClick = true;
        if (typeof e != 'undefined') {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
        }
        if (watching_position){
            $(locate_icon).css("color","black");
            locate_icon.setAttribute('alt','Enable geolocation');
            locatorMap.removeLayer(locator_marker);
            locatorMap.removeLayer(locator_accuracy_marker);
            locatorMap.stopLocate();
            watching_position = false;
            zoom_to = false;
        }
        else {
            $('#campusMapLink').scope().showAlertMessage("Detecting location...", false);
            locatorMap.locate({
                watch: true,
                timeout: 10000,
                enableHighAccuracy: true,
                maxZoom:16
            });
        }
    }
});

function clearAllLayers() {
    var cleared = [];
    $.each($('.list-group-item-info'), function (i, v) {
        if ($.inArray(v.children[0].name, cleared) == -1) {
            $(v).click();
            cleared.push(v.children[0].name);
        }
    });

};