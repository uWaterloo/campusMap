(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
// Polyfills
// (new features which are "filled" into old browsers)


// Imports


require('whatwg-fetch');

require('es6-promise');

var _leaflet = require('leaflet');

var _leaflet2 = _interopRequireDefault(_leaflet);

var _parent = require('./layer/parent');

var _parent2 = _interopRequireDefault(_parent);

var _html = require('./layer/html');

var _html2 = _interopRequireDefault(_html);

var _data = require('./layer/data');

var _building = require('./layer/building');

var _building2 = _interopRequireDefault(_building);

var _parking = require('./layer/parking');

var _parking2 = _interopRequireDefault(_parking);

var _directions = require('./directions');

var _directions2 = _interopRequireDefault(_directions);

var _urijs = require('urijs');

var _urijs2 = _interopRequireDefault(_urijs);

var _minivents = require('minivents');

var _minivents2 = _interopRequireDefault(_minivents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CampusMap = function () {
    function CampusMap(config) {
        var mapElement = arguments.length <= 1 || arguments[1] === undefined ? 'map' : arguments[1];

        _classCallCheck(this, CampusMap);

        (0, _minivents2.default)(this);

        // Copy user config
        this._config = config;

        // Setup instance variables
        this._map = null;
        this._tiles = {};
        this._controls = {};
        this._parentLayer = new _parent2.default('Campus Map');
        this._layers = {};
        this._activeTiles = null;
        this._buildings = null;

        this._configure(mapElement);
        this._directions = new _directions2.default(this);
    } // End of constructor

    /*
     * Private Functions
     */


    CampusMap.prototype._configure = function _configure(mapElement) {
        var _this = this;

        console.debug('Configuring Campus Map...');

        // Creating the map
        _leaflet2.default.Icon.Default.imagePath = this._config.imagePath;
        this._map = _leaflet2.default.map(mapElement, this._config.map.config);

        // Configure the tile layers
        this._configureTileLayers();

        // Configure map indicators/controls
        console.debug('Configuring map indicators/controls...');

        this._scalebar = _leaflet2.default.control.scale(this._config.map.scalebar);
        this._scalebar.addTo(this._map);

        for (var id in this._config.map.controls) {
            var control = this._config.map.controls[id];
            this._controls[id] = _leaflet2.default.control({
                position: control.position
            });

            this._controls[id].onAdd = function (map) {
                var div = _leaflet2.default.DomUtil.create('div', 'info legend');
                div.innerHTML = control.html;
                return div;
            };

            this._controls[id].addTo(this._map);
        } // End of for

        // Setup buildings
        var layer_config = _leaflet2.default.Util.extend(this._config.map.buildings, {
            map_config: this._config
        });

        var dataCallback = function dataCallback(layer) {
            var url = new _urijs2.default('' + _this._config.uwapi.base + layer_config.endpoint + '.geojson');
            url.search(_leaflet2.default.extend({
                key: _this._config.uwapi.key
            }, layer_config.endpoint_options || {}));

            fetch(url.href()).then(function (raw) {
                return raw.json();
            }).then(function (data) {
                return layer.addData(data);
            }).catch(function (e) {
                return console.error(e);
            });
        }; // End of dataCallback

        var indoorMapsCallback = function indoorMapsCallback(layer) {
            var url = new _urijs2.default('' + _this._config.mapapi.base + layer_config.indoor_maps_endpoint + '.json');
            fetch(url.href()).then(function (res) {
                if (res.ok) return res;

                if (res.status === 403) {
                    throw Error('Sorry, indoor maps are only available when connected to the University of Waterloo network.');
                } else {
                    throw Error('Sorry, an unexpected error occurred.');
                } // End of if/else
            }).then(function (raw) {
                return raw.json();
            }).then(function (data) {
                return layer.setIndoorMaps(data);
            }).catch(function (e) {
                console.error(e);
                layer.setIndoorMapsUnavailable(e.message);
            });
        }; // End of indoorMapsCallback

        this._buildings = new _building2.default(layer_config, dataCallback, indoorMapsCallback);
        this._buildings.getAttribution = function () {
            return '<a href="#" class="do-nothing" data-toggle="modal" data-target="#termsModal">UWaterloo Open Data</a>';
        };
        this._buildings.addTo(this._map);

        // Configure layers
        this._configureLayers(this._config.map.layers, this._parentLayer);

        console.debug('Done configuring Campus Map...');
    }; // End of configure function

    CampusMap.prototype._configureTileLayers = function _configureTileLayers() {
        console.debug('Configuring tile layers...');

        for (var id in this._config.map.tiles) {
            console.debug('Configuring tile layer', id);
            var tile_config = this._config.map.tiles[id];

            this._tiles[id] = _leaflet2.default.tileLayer(tile_config.url, tile_config.config);
            this._tiles[id].id = id;
        } // End of for

        // Enable the default tile layer
        this.activeTiles = this._config.map.default_tiles;

        console.debug('Done configuring tile layers');
    }; // End of _configureTileLayers

    CampusMap.prototype._configureLayers = function _configureLayers(layers, parent) {
        var _this2 = this;

        console.debug('Configuring layers...');

        layers.forEach(function (layer_config, i) {
            var layer = null;
            layer_config = _leaflet2.default.Util.extend(layer_config, {
                map_config: _this2._config
            });

            if (!(layer_config.id in _this2._layers)) {
                switch (layer_config.type) {
                    case 'parent':
                        layer = new _parent2.default(layer_config);
                        _this2._configureLayers(layer_config.sublayers, layer);

                        break;
                    case 'html':
                        layer = new _html2.default(layer_config);
                        break;

                    case 'uwapi':
                    case 'uwbuilding':
                    case 'uwparking':
                        var callback = function callback(layer) {
                            var url = new _urijs2.default('' + _this2._config.uwapi.base + layer_config.endpoint + '.geojson');
                            url.search(_leaflet2.default.extend({
                                key: _this2._config.uwapi.key
                            }, layer_config.endpoint_options || {}));

                            fetch(url.href()).then(function (raw) {
                                return raw.json();
                            }).then(function (data) {
                                return layer.addData(data);
                            }).catch(function (e) {
                                return console.error(e);
                            });
                        };
                        if (layer_config.type === 'uwbuilding') {
                            layer = new _building2.default(layer_config, callback);
                        } else if (layer_config.type === 'uwparking') {
                            layer = new _parking2.default(layer_config, callback);
                        } else if (layer_config.clustered === false) {
                            layer = new _data.UnclusteredDataLayer(layer_config, callback);
                        } else {
                            layer = new _data.DataLayer(layer_config, callback);
                        } // End of else
                        layer.getAttribution = function () {
                            return '<a href="#" class="do-nothing" data-toggle="modal" data-target="#termsModal">UWaterloo Open Data</a>';
                        };
                        break;

                    default:
                        console.error('Unknown layer type', layer_config.type);
                        return;
                } // End of switch

                if (layer_config.autoload) {
                    layer.addTo(_this2._map);
                } // End of if

                layer.on('added', function () {
                    _this2.emit('layer-added', layer);
                });
                layer.on('removed', function () {
                    _this2.emit('layer-removed', layer);
                });

                _this2._layers[layer_config.id] = layer;
            } else {
                layer = _this2._layers[layer_config.id];
            } // End of if/else

            parent.addSublayer(layer);
        }); // End of for

        console.debug('Done configuring layers...');
        this.emit('configured');
    }; // End of _configureLayers function

    /*
     * Public Functions
     */


    CampusMap.prototype.clearLayers = function clearLayers() {
        var _this3 = this;

        Object.keys(this.layersById).forEach(function (layerId) {
            var layer = _this3.layersById[layerId];

            // If the layer was autoloaded, do not remove it
            if (layer.config && layer.config.autoload) return;

            // Remove the layer, if it is currently on the map
            if (_this3.map.hasLayer(layer)) {
                _this3.map.removeLayer(layer);
            } // End of if
        });
    }; // End of clearLayers function

    /*
     * Getters/Setters
     */


    _createClass(CampusMap, [{
        key: 'activeTiles',
        get: function get() {
            return this._activeTiles;
        },
        set: function set(tilesId) {
            if (this._activeTiles) {
                this._map.removeLayer(this._activeTiles);
            } // End of if

            this._activeTiles = this._tiles[tilesId];
            this._activeTiles.addTo(this._map);

            this.emit('tiles-changed', this._activeTiles);
        }
    }, {
        key: 'config',
        get: function get() {
            return this._config;
        }
    }, {
        key: 'map',
        get: function get() {
            return this._map;
        }
    }, {
        key: 'tiles',
        get: function get() {
            return this._tiles;
        }
    }, {
        key: 'buildings',
        get: function get() {
            return this._buildings;
        }
    }, {
        key: 'controls',
        get: function get() {
            return this._controls;
        }
    }, {
        key: 'layers',
        get: function get() {
            return this._parentLayer.sublayers;
        }
    }, {
        key: 'layersById',
        get: function get() {
            return this._layers;
        }
    }, {
        key: 'directions',
        get: function get() {
            return this._directions;
        }
    }]);

    return CampusMap;
}();

exports.default = CampusMap;
; // End of CampusMap class

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/js/campusmap.js","/js")

},{"./directions":3,"./layer/building":4,"./layer/data":5,"./layer/html":6,"./layer/parent":8,"./layer/parking":9,"_process":48,"buffer":13,"es6-promise":15,"leaflet":44,"minivents":46,"urijs":51,"whatwg-fetch":53}],2:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _leaflet = require('leaflet');

var _leaflet2 = _interopRequireDefault(_leaflet);

var _layers = require('./layers');

var _layers2 = _interopRequireDefault(_layers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var imagePath = './dist';
var config = {
    debug: true,

    imagePath: imagePath,

    mapapi: {
        base: 'https://opendata-dev.uwaterloo.ca/~ztseguin/map-alpha/api/'
    },
    uwapi: {
        key: '17ecdf04d8bb17750e28e2307cd86e44',
        base: 'https://api.uwaterloo.ca/'
    },
    valhalla_api_key: 'valhalla-toFWZ7k',

    map: {
        config: {
            center: [43.46898830444233, -80.54055154323578],
            zoom: 16,
            minZoom: 11,
            maxBounds: [[43.25, -81.0467], [43.71, -80.1528]]
        },

        scalebar: {
            position: 'bottomleft',
            metric: true
        },

        controls: {
            north_arrow: {
                position: 'bottomleft',
                html: '<img alt="North arrow" height="30" width="20" src="' + imagePath + '/north.png">'
            }
        },

        tiles: {
            D: {
                name: 'Campus Map',
                url: 'https://uwaterloo.ca/map-beta/tiles/default/{z}/{x}/{y}.png',
                config: {
                    maxNativeZoom: 18,
                    maxZoom: 18,
                    attribution: '<a href="#" class="do-nothing" data-toggle="modal" data-target="#termsModal">Map data © OpenStreetMap contributors.</a>'
                }
            },
            H: {
                name: 'High Contrast',
                url: 'https://uwaterloo.ca/map-beta/tiles/hc/{z}/{x}/{y}.png',
                config: {
                    maxNativeZoom: 18,
                    maxZoom: 18,
                    attribution: '<a href="#" class="do-nothing" data-toggle="modal" data-target="#termsModal">Map data © OpenStreetMap contributors.</a>'
                }
            }
        },

        default_tiles: 'D',

        buildings: {
            type: 'uwbuilding',
            id: 'buildings',
            name: 'Buildings',
            endpoint: 'v2/buildings/list',
            endpoint_options: { source: 'osm' },
            indoor_maps_endpoint: 'indoor-maps/buildings'
        },
        layers: _layers2.default
    },

    directions: {
        addWaypoints: true,
        useZoomParameter: true,
        autoRoute: true,
        lineOptions: {
            styles: [{ color: 'white', opacity: 1, weight: 8 }, { color: 'black', opacity: 1, weight: 6 }, { color: '#00b6ff', opacity: 1, weight: 4 }]
        },
        summaryTemplate: '<h4>Directions</h4><p class="route-summary">{distance}, {time}</p>',
        collapsible: true,
        show: false,
        containerClassName: 'routing'
    },

    present: function present(title, element) {
        var callback = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

        console.warn('Presenting', title, element);

        var backdrop = _leaflet2.default.DomUtil.create('div', 'modal-backdrop fade in', document.body);
        var modal = _leaflet2.default.DomUtil.create('div', 'modal fade in', document.body);
        var dialog = _leaflet2.default.DomUtil.create('div', 'modal-dialog modal-lg', modal);
        var content = _leaflet2.default.DomUtil.create('div', 'modal-content', dialog);

        function close() {
            modal.parentElement.removeChild(modal);
            backdrop.parentElement.removeChild(backdrop);
            if (callback) callback();
        } // End of close function

        modal.style.display = 'block';
        _leaflet2.default.DomEvent.addListener(modal, 'click', function (event) {
            if ((event.target || event.srcElement) !== modal) return;
            close();
        });

        // Modal header
        var header = _leaflet2.default.DomUtil.create('div', 'modal-header', content);

        var close_button = _leaflet2.default.DomUtil.create('button', 'close', header);
        close_button.type = 'button';
        close_button.setAttribute('arial-label', 'close');

        if (!close_button.data) close_button.data = {};
        close_button.data.dismiss = 'modal';

        close_button.innerHTML = '<span aria-hidden="true">&times;</span>';
        _leaflet2.default.DomEvent.addListener(close_button, 'click', close);

        var header_title = _leaflet2.default.DomUtil.create('h4', 'modal-title', header);
        header_title.innerHTML = title;

        // Modal body
        var body = _leaflet2.default.DomUtil.create('div', 'modal-body', content);
        body.appendChild(element);
    }

};

exports.default = config;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/js/config.js","/js")

},{"./layers":10,"_process":48,"buffer":13,"leaflet":44}],3:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.generateDirectionsLink = generateDirectionsLink;

var _leaflet = require('leaflet');

var _leaflet2 = _interopRequireDefault(_leaflet);

require('leaflet-routing-machine');

require('lrm-mapzen');

require('leaflet-control-geocoder');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var UWGeocoder = function (_L$Control$Geocoder$N) {
    _inherits(UWGeocoder, _L$Control$Geocoder$N);

    function UWGeocoder(campusMap) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        _classCallCheck(this, UWGeocoder);

        var _this = _possibleConstructorReturn(this, _L$Control$Geocoder$N.call(this, options));

        _this._campusMap = campusMap;
        return _this;
    } // End of constructor

    UWGeocoder.prototype.suggest = function suggest(query, callback, context) {
        if (query.length < 2) return;
        this.geocode(query, callback, context, false);
    };

    UWGeocoder.prototype.geocode = function geocode(query, callback, context) {
        var include_nominatim = arguments.length <= 3 || arguments[3] === undefined ? true : arguments[3];

        var results = [];

        // Request geocoding from nominatim if the query is greater
        // than 3 characters
        if (include_nominatim) {
            _L$Control$Geocoder$N.prototype.geocode.call(this, query, function (nomatim_results) {
                console.warn(nomatim_results);
                results = results.concat(nomatim_results);
                callback.call(context, results);
            }, context);
        } // End of if

        query = query.toLowerCase();
        console.warn(query);

        // Campus Buildings
        var buildings = [];
        Object.keys(this.campusMap.buildings.buildings).forEach(function (building) {
            buildings.push(campusMap.buildings.buildings[building]);
        });

        buildings = buildings.filter(function (a) {
            var res = a.layer.getLatLng().lat !== 0 && a.layer.getLatLng().lng !== 0 && (a.props.building_code.toLowerCase().indexOf(query) !== -1 || a.props.building_name.toLowerCase().indexOf(query) !== -1);
            console.warn(a.props.building_code, res, a.layer.getLatLng().lat, a.layer.getLatLng().lng, a.props.building_code.toLowerCase().indexOf(query), a.props.building_name.toLowerCase().indexOf(query));
            return res;
        });
        buildings.sort(function (a, b) {
            if (a.props.building_code < b.props.building_code) return -1;
            if (b.props.building_code < a.props.building_code) return 1;
            return 0;
        }).forEach(function (building) {
            results.push({
                name: building.props.building_name + ' (' + building.props.building_code + ')',
                bounds: null,
                center: building.layer.getLatLng()
            });
        });

        // If our query wasn't long enought to geocode
        // with Nominatim, then present the results
        if (!include_nominatim) {
            callback.call(context, results);
        }
    }; // End of geocode function

    UWGeocoder.prototype.reverse = function reverse(loc, scale, callback, context) {
        console.warn(loc, scale, callback.context);
        var results = [];

        // Campus Buildings
        var buildings = [];
        Object.keys(this.campusMap.buildings.buildings).forEach(function (building) {
            buildings.push(campusMap.buildings.buildings[building]);
        });

        buildings = buildings.filter(function (a) {
            return a.layer.getLatLng().lat === loc.lat && a.layer.getLatLng().lng === loc.lng;
        }).forEach(function (b) {
            return results.push({
                name: b.props.building_name,
                bounds: null,
                center: b.layer.getLatLng()
            });
        });

        callback.call(context, results);
    }; // End of reverse function

    _createClass(UWGeocoder, [{
        key: 'campusMap',
        get: function get() {
            return this._campusMap;
        }
    }]);

    return UWGeocoder;
}(_leaflet2.default.Control.Geocoder.Nominatim); // End of UWGeocoder class


_leaflet2.default.Control.Geocoder.uw = function (campusMap, options) {
    return new UWGeocoder(campusMap, options);
};

var UWItinerary = function (_L$Routing$ItineraryB) {
    _inherits(UWItinerary, _L$Routing$ItineraryB);

    function UWItinerary() {
        _classCallCheck(this, UWItinerary);

        return _possibleConstructorReturn(this, _L$Routing$ItineraryB.apply(this, arguments));
    }

    UWItinerary.prototype.createStep = function createStep(text, distance, icon, steps) {
        var tr = _leaflet2.default.DomUtil.create('tr', 'step', steps);

        // Icon
        var td_icon = _leaflet2.default.DomUtil.create('td', 'step', tr);
        _leaflet2.default.DomUtil.create('span', 'leaflet-routing-icon leaflet-routing-icon-' + icon, td_icon);

        var td_text = _leaflet2.default.DomUtil.create('td', 'text', tr);
        td_text.innerHTML = text;

        if (distance !== '0 m') {
            _leaflet2.default.DomUtil.create('td', 'distance', tr).innerHTML = distance;
        } else {
            td_text.colSpan = 2;
        }

        return tr;
    };

    return UWItinerary;
}(_leaflet2.default.Routing.ItineraryBuilder); // End of UWItinerary class

var UWPlan = function (_L$Routing$Plan) {
    _inherits(UWPlan, _L$Routing$Plan);

    function UWPlan(waypoints, options, directions_controller) {
        _classCallCheck(this, UWPlan);

        options.geocoderClass = function () {
            return _this3.geocoderClass();
        };
        options.createGeocoder = function (index, num_waypoints, options) {
            return _this3.createGeocoder(index, num_waypoints, options);
        };

        var _this3 = _possibleConstructorReturn(this, _L$Routing$Plan.call(this, waypoints, options));

        _this3._directionsController = directions_controller;
        return _this3;
    } // End of constructor

    UWPlan.prototype.switchMode = function switchMode(mode) {
        console.debug('Setting route mode', mode);
        this.options.router.options.costing = mode;
        this._directionsController._routingControl.route();
    }; // End of switchMode function

    UWPlan.prototype.createGeocoders = function createGeocoders() {
        var _this4 = this;

        var container = _leaflet2.default.DomUtil.create('form', '');
        var waypoints_container = _L$Routing$Plan.prototype.createGeocoders.call(this);
        container.appendChild(waypoints_container);

        var add_waypoint = container.querySelector('.leaflet-routing-add-waypoint');
        add_waypoint.innerText = 'Add another destination';

        // Routing type
        var modes_container = _leaflet2.default.DomUtil.create('div', 'form-group', container);
        var modes = _leaflet2.default.DomUtil.create('div', 'btn-group modes', modes_container);

        var auto = _leaflet2.default.DomUtil.create('div', 'btn btn-default', modes);
        var auto_input = _leaflet2.default.DomUtil.create('input', 'mode', auto);
        auto_input.name = 'mode';
        auto_input.type = 'radio';
        auto_input.value = 'auto';
        auto_input.id = 'mode-auto';
        var auto_label = _leaflet2.default.DomUtil.create('label', '', auto);
        auto_label.htmlFor = 'mode-auto';
        auto_label.innerHTML = '<i class="icon-cab" alt="Driving"></i>';
        _leaflet2.default.DomEvent.addListener(auto_input, 'change', function () {
            return _this4.switchMode('auto');
        });

        /* let bicycle = L.DomUtil.create('div', 'btn btn-default', modes);
        let bicycle_input = L.DomUtil.create('input', 'mode', bicycle);
        bicycle_input.name = 'mode';
        bicycle_input.type = 'radio';
        bicycle_input.value = 'bicycle';
        bicycle_input.id = 'mode-bicycle';
        let bicycle_label = L.DomUtil.create('label', '', bicycle);
        bicycle_label.htmlFor = 'mode-bicycle';
        bicycle_label.innerHTML = '<i class="icon-bicylce" alt="Cycling"></i>';
        L.DomEvent.addListener(bicycle_input, 'change', () => this.switchMode('bicycle')); */

        var pedestrian = _leaflet2.default.DomUtil.create('div', 'btn btn-default', modes);
        var pedestrian_input = _leaflet2.default.DomUtil.create('input', 'mode', pedestrian);
        pedestrian_input.name = 'mode';
        pedestrian_input.type = 'radio';
        pedestrian_input.value = 'pedestrian';
        pedestrian_input.id = 'mode-pedestrian';
        pedestrian_input.checked = true;
        var pedestrian_label = _leaflet2.default.DomUtil.create('label', '', pedestrian);
        pedestrian_label.htmlFor = 'mode-pedestrian';
        pedestrian_label.innerHTML = '<i class="icon-pitch" alt="Walking"></i>';
        _leaflet2.default.DomEvent.addListener(pedestrian_input, 'change', function () {
            return _this4.switchMode('pedestrian');
        });

        // Generate Route
        /*let get_directions = L.DomUtil.create('div', 'form-group', container);
        let get_directions_btn_group = L.DomUtil.create('div', 'btn-group', get_directions);
        get_directions_btn_group.role = 'group';
         let btn_generate = L.DomUtil.create('input', 'btn btn-default', get_directions_btn_group);
        btn_generate.value = 'Get Directions';
        btn_generate.type = 'submit';
         L.DomEvent.addListener(container, 'submit', (event) => {
            L.DomEvent.preventDefault(event);
            console.log(this);
            this._directionsController._routingControl.route();
        }); */

        // HR
        _leaflet2.default.DomUtil.create('hr', '', container);

        return container;
    }; // End of createGeocoders function

    UWPlan.prototype.geocoderClass = function geocoderClass() {
        return 'form-control';
    }; // End of geocoderClass function

    UWPlan.prototype.createGeocoder = function createGeocoder(index, num_waypoints, options) {
        var container = _leaflet2.default.DomUtil.create('div', 'waypoint');
        var input_group = _leaflet2.default.DomUtil.create('div', 'input-group', container);
        var input = _leaflet2.default.DomUtil.create('input', 'form-control', input_group);
        input.type = 'text';

        var buttons = _leaflet2.default.DomUtil.create('span', 'input-group-btn', input_group);

        var remove_waypoint = _leaflet2.default.DomUtil.create('button', 'btn btn-link remove-waypoint', buttons);
        remove_waypoint.type = 'button';
        var remove_waypoint_icon = _leaflet2.default.DomUtil.create('i', 'glyphicon glyphicon-remove', remove_waypoint);
        remove_waypoint_icon.alt = 'Remove Waypoint';

        var my_location = _leaflet2.default.DomUtil.create('button', 'btn btn-default my-location', buttons);
        my_location.type = 'button';
        var my_location_icon = _leaflet2.default.DomUtil.create('i', 'icon-direction', my_location);
        my_location_icon.alt = 'My Location';

        _leaflet2.default.DomEvent.addListener(my_location, 'click', function (event) {
            _leaflet2.default.DomEvent.preventDefault(event);
            console.warn('My Location---Not Implemented');
        });

        return {
            container: container,
            input: input,
            closeButton: remove_waypoint
        };
    }; // End of createGeocoder function


    return UWPlan;
}(_leaflet2.default.Routing.Plan); // End of UWPlan class

var Directions = function () {
    function Directions(campusMap) {
        _classCallCheck(this, Directions);

        console.debug('Configuring directions...');
        this._campusMap = campusMap;

        this._router = _leaflet2.default.Routing.mapzen(this._campusMap.config.valhalla_api_key, { costing: 'pedestrian' });
        this._formatter = new _leaflet2.default.Routing.mapzenFormatter();
        this._geocoder = _leaflet2.default.Control.Geocoder.uw(this.campusMap, {
            geocodingQueryParams: {
                viewbox: '-81.0467, 43.25, -80.1528, 43.71',
                bounded: 1,
                'accept-language': 'en'
            }
        });

        var options = {
            router: this._router,
            formatter: this._formatter,
            geocoder: this._geocoder,
            itineraryBuilder: new UWItinerary()
        };
        options = _leaflet2.default.Util.extend(options, this.campusMap.config.directions);
        options.plan = new UWPlan([], options, this);

        console.debug('Using options', options);

        this._routingControl = _leaflet2.default.Routing.control(options);
        this._routingControl.addTo(this._campusMap.map);
    } // End of constructor

    _createClass(Directions, [{
        key: 'campusMap',
        get: function get() {
            return this._campusMap;
        }
    }]);

    return Directions;
}(); // End of Directions class

exports.default = Directions;
function generateDirectionsLink(lat, lon, display_name) {
    lat = parseFloat(lat);
    lon = parseFloat(lon);

    var element = _leaflet2.default.DomUtil.create('div', 'large-popup-label');
    var directionsToHere = _leaflet2.default.DomUtil.create('a', 'directions-link', element);
    directionsToHere.innerHTML = 'Directions to here';
    _leaflet2.default.DomEvent.addListener(directionsToHere, 'click', function (evt) {
        console.warn('Directions to here --- Functionality not implemented');
    });

    _leaflet2.default.DomUtil.create('br', '', element);

    var addDestination = _leaflet2.default.DomUtil.create('a', 'directions-link', element);
    addDestination.innerHTML = 'Add as next destination';
    _leaflet2.default.DomEvent.addListener(addDestination, 'click', function (evt) {
        console.warn('Add as next destination --- Functionality not implemented');
    });

    return element;
} // End of generateDirectionsLink function

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/js/directions.js","/js")

},{"_process":48,"buffer":13,"leaflet":44,"leaflet-control-geocoder":29,"leaflet-routing-machine":32,"lrm-mapzen":45}],4:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _leaflet = require('leaflet');

var _leaflet2 = _interopRequireDefault(_leaflet);

var _data = require('./data');

var _directions = require('../directions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

//import Projective from '../lib/projective';

var BuildingLayer = function (_UnclusteredDataLayer) {
    _inherits(BuildingLayer, _UnclusteredDataLayer);

    function BuildingLayer(config, dataCallback, indoorMapsCallback) {
        _classCallCheck(this, BuildingLayer);

        config.options = config.options || {};

        if (!config.options.pointToLayer) {
            config.options.pointToLayer = function (feature, latlng) {
                // Create the popup
                var content = _leaflet2.default.DomUtil.create('div', 'large-popup');

                if (feature.properties.building_name) {
                    var header = _leaflet2.default.DomUtil.create('div', 'large-popup-header', content);
                    _leaflet2.default.DomUtil.create('p', '', header).innerHTML = feature.properties.building_name;
                } // End of if

                // Indoor Maps
                var indoorMaps = _leaflet2.default.DomUtil.create('p', '', content);
                var addIndoorMapsButton = function addIndoorMapsButton(infoURL) {
                    feature.properties.indoorMaps = infoURL;

                    var a = _leaflet2.default.DomUtil.create('a', 'show-indoor-maps', indoorMaps);
                    a.href = '#';
                    a.innerHTML = 'Indoor Maps';

                    _leaflet2.default.DomEvent.addListener(a, 'click', function (event) {
                        _leaflet2.default.DomEvent.preventDefault(event);
                        _this.showIndoorMaps(feature.properties);
                    });
                }; // End of addIndoorMapsButton function

                if (feature.properties.building_code in _this._indoorMaps) {
                    addIndoorMapsButton(_this._indoorMaps[feature.properties.building_code]);
                } else if (!_this._indoorMapsAvailable) {
                    _this.on('indoormaps', function () {
                        if (feature.properties.building_code in _this._indoorMaps) {
                            addIndoorMapsButton(_this._indoorMaps[feature.properties.building_code]);
                        } // End of if
                    });
                } // End of if/else

                // Videos
                if (feature.properties.streamable_vid) {
                    var streamable = _leaflet2.default.DomUtil.create('iframe', '', content);
                    streamable.src = 'https://streamable.com/e/' + feature.properties.streamable_vid + '?muted=1';
                    streamable.width = '100%';
                    streamable.setAttribute('frameborder', '0');
                    streamable.setAttribute('allowfullscreen', true);
                    streamable.setAttribute('webkitallowfullscreen', true);
                    streamable.setAttribute('mozallowfullscreen', true);
                    streamable.scrolling = 'no';
                } // End of if

                // Generate the directions link
                content.appendChild((0, _directions.generateDirectionsLink)(latlng.lat, latlng.lng, feature.properties.building_name));

                var popup = _leaflet2.default.popup().setContent(content);

                // Create the icon
                var icon = _leaflet2.default.divIcon({
                    iconSize: [30, 30],
                    className: 'building-marker',
                    popupAnchor: [0, -10],
                    html: feature.properties.building_code.substr(0, 3)
                });

                // Setup the marker
                var marker = _leaflet2.default.marker(latlng, { icon: icon });
                marker.bindPopup(popup, {
                    maxWidth: 250,
                    minWidth: 250,
                    maxHeight: 400
                });
                marker.on('popupopen', function () {
                    var icon = _leaflet2.default.divIcon({
                        iconSize: [30, 30],
                        className: 'building-marker selected',
                        popupAnchor: [0, -10],
                        html: feature.properties.building_code.substr(0, 3)
                    });
                    marker.setIcon(icon);

                    _this.emit('buildingselected', feature.properties);
                });
                marker.on('popupclose', function () {
                    marker.setIcon(icon);
                    _this.emit('buildingdeselected', feature.properties);
                });

                return marker;
            }; // End of pointToLayer
        } // End of if

        config.options.onEachFeature = function (feature, layer) {
            layer.feature = feature;
            _this._layers.push(layer);

            layer.on('popupclose', function () {
                if (_this.map.getZoom() < 16) {
                    _this.removeLayer(layer);
                } else if (_this.map.getZoom() < 17 && layer.feature.properties.building_parent !== null) {
                    _this.removeLayer(layer);
                } // End of if/else if
            });

            if (!(feature.properties.building_code in _this._buildings && feature.properties.building_parent !== null)) {
                _this._buildings[feature.properties.building_code] = { props: feature.properties, layer: layer };
            } // End of if
        }; // End of onEachFeature

        var _this = _possibleConstructorReturn(this, _UnclusteredDataLayer.call(this, config, dataCallback));

        _this._indoorMapsCallback = indoorMapsCallback;

        _this._layers = [];
        _this._buildings = {};
        _this._indoorMapsAvailable = false;
        _this._indoorMaps = {};
        return _this;
    } // End of constructor

    BuildingLayer.prototype.showIndoorMaps = function showIndoorMaps(building) {
        var _this3 = this;

        if (typeof building === 'string') {
            console.warn('NOT IMPLEMENTED---Cannot search for building by name');
            return false;
        } // End of if

        var container = _leaflet2.default.DomUtil.create('div', '');
        container.innerHTML = '<i class="icon-spin6 animate-spin"></i>&nbsp;Loading indoor maps...';

        function loadMaps() {
            var _this2 = this;

            fetch(building.indoorMaps).then(function (raw) {
                return raw.json();
            }).then(function (data) {
                console.debug(data);

                _this2._indoorMapsBuilding = building;

                // Create map container
                container.innerHTML = '';
                var im = _leaflet2.default.DomUtil.create('div', 'im', container);
                _this2._mapWrapper = _leaflet2.default.DomUtil.create('div', 'im-map', im);
                _this2._indoorMapElement = _leaflet2.default.DomUtil.create('div', '', _this2._mapWrapper);
                _this2._indoorMapElement.id = 'im-map';
                var active_floor = null;

                // Setup floor selector
                var floor_selector = _leaflet2.default.DomUtil.create('ul', 'im-floors', im);
                var floors = data.floors.slice(0);
                building.floors = floors;

                floors.reverse().forEach(function (floor) {
                    floor.building = building;

                    var li = _leaflet2.default.DomUtil.create('li', '', floor_selector);
                    var a = _leaflet2.default.DomUtil.create('a', 'switch-floor', li);
                    a.href = '#';
                    a.innerHTML = floor.name;

                    _leaflet2.default.DomEvent.addListener(a, 'click', function (event) {
                        _leaflet2.default.DomEvent.preventDefault(event);
                        _this2.selectFloor(floor);
                    });

                    _this2.on('floorselected', function (building, selected_floor) {
                        if (floor === selected_floor) {
                            _leaflet2.default.DomUtil.addClass(li, 'selected');
                        } else {
                            _leaflet2.default.DomUtil.removeClass(li, 'selected');
                        } // End of if/else
                    });
                });
                _this2.selectFloor(data.floors[0]);
                _this2.emit('indoormapsstart', building);
            }).catch(function (e) {
                console.error(e);
                container.innerHTML = 'Sorry, an unexpected error occurred while loading indoor maps.';
            });
        }

        // Fetch indoor maps data for this building
        if (this._indoorMaps.error) {
            container.innerHTML = this._indoorMaps.error;
        } else if (!this._indoorMapsAvailable) {
            this.on('indoormaps', loadMaps.bind(this));
        } else if (!building.indoorMaps) {
            container.innerHTML = 'Sorry, indoor maps are not available for this building.';
        } else {
            loadMaps.bind(this)();
        } // End of if/else

        this._config.map_config.present(building.building_name + ' (' + building.building_code + ')', container, function () {
            console.debug('Indoor Maps dismissed');

            _this3.selectRoom(null);
            _this3.emit('indoormapsend', building);
            _this3._indoorMap = null;
            _this3._indoorMapsBuilding = null;
        });
    }; // End of showIndoorMaps function

    BuildingLayer.prototype.selectFloor = function selectFloor(floor) {
        var _this4 = this;

        var ZOOM_OFFSET = 8;

        if (typeof floor === 'string') {
            console.debug('Identifying floor object from floor name...', floor);

            var matches = this._indoorMapsBuilding.floors.filter(function (f) {
                return f.name === floor;
            });
            if (matches.length !== 1) {
                console.error('Floor \'' + floor + '\' matched ' + matches.length + ' floors\'. Expected 1.');
                return false;
            } // End of if

            floor = matches[0];
        } // End of if

        if (floor == this._activeFloor) return;
        this._activeFloor = floor;

        console.debug('Showing Floor', floor);

        // Clear any selected room
        this.selectRoom(null);

        // Calculate maximum zoom of the map
        var max_zoom = Math.ceil(Math.log(Math.max(floor.perspective.size.height, floor.perspective.size.width)) / Math.log(2)) - ZOOM_OFFSET;

        // Setup the map projective
        var control = [];
        var target = [];

        floor.perspective.reference.forEach(function (ref) {
            control.push([parseFloat(ref.control.x), parseFloat(ref.control.y)]);
            target.push([parseFloat(ref.target.x), parseFloat(ref.target.y)]);
        });
        var projective = new Projective({
            from: control,
            to: target
        });

        var mapel = _leaflet2.default.DomUtil.create('div');
        mapel.id = 'im-map';
        this._mapWrapper.replaceChild(mapel, this._indoorMapElement);
        this._indoorMapElement = mapel;

        // Setup Leaflet
        this._indoorMap = _leaflet2.default.map(mapel, {
            center: [-125, 100],
            zoom: 1,
            minZoom: 0,
            maxZoom: max_zoom,
            crs: _leaflet2.default.CRS.Simple,
            attributionControl: false
        });

        // Setup tiles
        var tiles = _leaflet2.default.tileLayer(floor.perspective.tiles, {
            zoomOffset: ZOOM_OFFSET,
            noWrap: true,
            continuousWorld: true
        });
        tiles.addTo(this._indoorMap);

        // Add room labels
        this._markers = [];
        this._room_labels = _leaflet2.default.markerClusterGroup({
            disableClusteringAtZoom: this._indoorMap.getMaxZoom()
        });
        floor.locations.filter(function (location) {
            return location.type === 'rooms';
        }).forEach(function (location) {
            location.selected = false;

            var marker = _leaflet2.default.marker(_this4._indoorMap.unproject(projective.transform([location.latitude, location.longitude]), _this4._indoorMap.getMaxZoom()), {
                icon: _leaflet2.default.divIcon({
                    className: 'room-marker',
                    html: '<div class=\'room-number\'>' + location.name.replace(/.*\s(.+)/, '$1') + '</div>'
                }),
                title: location.name,
                clickable: true
            });
            marker.location = location;
            location.marker = marker;
            location.floor = floor;
            marker.addTo(_this4._room_labels);

            marker.on('click', function () {
                if (location.selected) {
                    _this4.selectRoom(null);
                } else {
                    _this4.selectRoom(location);
                } // End of if/else
            });
            _this4._markers.push(marker);
        });
        this._room_labels.addTo(this._indoorMap);

        setTimeout(function () {
            return _this4._indoorMap.invalidateSize();
        }, 500);
        this.emit('floorselected', floor.building, floor, this._indoorMap);
    }; // End of selectFloor function

    BuildingLayer.prototype.selectRoom = function selectRoom(room) {
        if (typeof room === 'string') {
            console.debug('Identifying room \'' + room + '\' from string\'');
            var matches = this._markers.filter(function (m) {
                return m.location.name === room;
            });
            if (matches.length !== 1) {
                console.error('Room \'' + floor + '\' matched ' + matches.length + ' rooms\'. Expected 1.');
                return false;
            } // End of if

            room = matches[0].location;
        } // End of if

        console.debug('Selecting room', room);

        // Clear the currently selected room
        if (this._selectedRoom) {
            this._selectedRoom.selected = false;
            this._selectedRoom.marker.setIcon(_leaflet2.default.divIcon({
                className: 'room-marker',
                html: '<div class=\'room-number\'>' + this._selectedRoom.name.replace(/.*\s(.+)/, '$1') + '</div>'
            }));
            this._indoorMap.removeLayer(this._selectedRoom.marker);
            this._room_labels.addLayer(this._selectedRoom.marker);
            this.emit('roomdeselected', this._selectedRoom.floor.building, this._selectedRoom.floor, this._selectedRoom);
            this._selectedRoom = null;
        }

        // Select a new room
        if (!room) return;

        // Let's show the room
        this._selectedRoom = room;
        this._selectedRoom.selected = true;
        this._selectedRoom.marker.setIcon(_leaflet2.default.divIcon({
            className: 'room-marker',
            html: '<div class=\'room-number selected\'>' + this._selectedRoom.name.replace(/.*\s(.+)/, '$1') + '</div>'
        }));
        this._room_labels.removeLayer(room.marker);
        this._indoorMap.addLayer(room.marker);

        this.emit('roomselected', this._selectedRoom.floor.building, this._selectedRoom.floor, this._selectedRoom);
    }; // End of selectRoom function

    BuildingLayer.prototype._filter = function _filter(event) {
        var _this5 = this;

        this._layers.forEach(function (layer) {
            if (layer.getPopup()._isOpen) return;

            if (_this5.map.getZoom() < 16) {
                _this5.removeLayer(layer);
            } else if (_this5.map.getZoom() < 17 && layer.feature.properties.building_parent !== null) {
                _this5.removeLayer(layer);
            } else if (!_this5.hasLayer(layer)) {
                _this5.addLayer(layer);
            } // End of if/else if/else
        }); // End of eachLayer
    }; // end of this._filter

    BuildingLayer.prototype.addData = function addData(data) {
        _UnclusteredDataLayer.prototype.addData.call(this, data);

        if (this.map) {
            this._filter({});
        } // End of if
    }; // End of addData function

    BuildingLayer.prototype.onAdd = function onAdd(map) {
        _UnclusteredDataLayer.prototype.onAdd.call(this, map);

        // Load indoor maps
        if (!this._indoorMapsRequested) {
            this._indoorMapsCallback(this);
            this._indoorMapsRequested = true;
        } // End of if

        // Register events to update buildings
        map.on('zoomend', this._filter.bind(this));
        this._filter({});
    }; // End of onAdd function

    BuildingLayer.prototype.onRemove = function onRemove(map) {
        map.off('zoomend', this._filter.bind(this));
        _UnclusteredDataLayer.prototype.onRemove.call(this, map);
    }; // End of onRemove function

    // BuildingLayer::setIndoorMaps(data)
    // Sets the indoor map data (a mapping of building codes to HTTP Endpoints)


    BuildingLayer.prototype.setIndoorMaps = function setIndoorMaps(data) {
        if (this._indoorMapsAvailable) {
            console.error('Indoor Maps data can only be set once.');
            return;
        } // End of if

        this._indoorMaps = data;
        this._indoorMapsAvailable = true;
        this.emit('indoormaps');
    }; // End of setIndoorMaps function

    BuildingLayer.prototype.setIndoorMapsUnavailable = function setIndoorMapsUnavailable(message) {
        this._indoorMaps = { error: message };
        this._indoorMapsAvailable = true;
        this.emit('indoormaps');
    }; // End of setIndoorMapsUnavailable function

    BuildingLayer.prototype.selectBuilding = function selectBuilding(building) {
        var _this7 = this;

        var changeView = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

        function select(building, changeView) {
            if (building && !(building in this._buildings)) return;

            if (building) {
                if (changeView) {
                    this.map.setView(this._buildings[building].layer.getLatLng());
                }
                this.addLayer(this._buildings[building].layer);
                this._buildings[building].layer.openPopup();
            } else {
                this._layers.forEach(function (layer) {
                    layer.closePopup();
                });
            }
        } // End of select function

        if (building && !(building in this._buildings)) {
            (function () {
                var func = function func(item) {
                    var _this6 = this;

                    if (!item.properties || item.properties.building_code !== building) return;

                    // Timout allows other handlers to run, allowing them to pick up this selection
                    setTimeout(function () {
                        return select.call(_this6, building, changeView);
                    }, 100);
                    this.off('data', func);
                };

                _this7.on('data', func.bind(_this7));
            })();
        } else {
            select.call(this, building, changeView);
        } // End of if/else
    }; // End of selectBuilding function

    _createClass(BuildingLayer, [{
        key: 'buildings',
        get: function get() {
            return this._buildings;
        }
    }, {
        key: 'buildingInfo',
        get: function get() {
            var _this8 = this;

            var buildings = {};

            Object.keys(this._buildings).forEach(function (building_code) {
                buildings[building_code] = _this8._buildings[building_code].props;
            });

            return buildings;
        }
    }]);

    return BuildingLayer;
}(_data.UnclusteredDataLayer);

exports.default = BuildingLayer;
;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/js/layer/building.js","/js/layer")

},{"../directions":3,"./data":5,"_process":48,"buffer":13,"leaflet":44}],5:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.UnclusteredDataLayer = exports.DataLayer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _leaflet = require('leaflet');

var _leaflet2 = _interopRequireDefault(_leaflet);

require('leaflet.markercluster');

var _named = require('./named');

var _directions = require('../directions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DataLayer = exports.DataLayer = function (_L$MarkerClusterGroup) {
    _inherits(DataLayer, _L$MarkerClusterGroup);

    function DataLayer(config, dataCallback) {
        _classCallCheck(this, DataLayer);

        var config = config || {};
        config.options = config.options || {};
        config.options.onEachFeature = function (feature, layer) {
            return _this.addLayer(layer);
        };

        var _this = _possibleConstructorReturn(this, _L$MarkerClusterGroup.call(this, {
            showCoverageOnHover: false,
            iconCreateFunction: function iconCreateFunction(cluster) {
                var icon = _leaflet2.default.divIcon({
                    iconSize: [60, 70],
                    className: 'marker-container',
                    iconAnchor: [30, 76],
                    html: '<div class="marker-subcontainer"><p class="map-marker-label-inv"><span class="map-marker-label-bak">' + cluster.getChildCount() + '</span></p><i class="map-marker-with-label ' + config.icon_class + '"></i><img alt="Map marker background" src="' + _leaflet2.default.Icon.Default.imagePath + '/container-icon.svg"></div>'
                });
                icon.options.zIndexOffset = 2000;

                return icon;
            } // End of iconCreateFunction
        }));

        _this._map = null;
        _this._config = config;
        _this._dataCallback = dataCallback;
        _this._unclusteredDataLayer = new UnclusteredDataLayer(config, dataCallback);
        _this.addLayer(_this._unclusteredDataLayer);
        return _this;
    } // End of constructor

    DataLayer.prototype.on = function on(event, callback) {
        this._unclusteredDataLayer.on(event, callback);
    };

    DataLayer.prototype.off = function off(event, callback) {
        this._unclusteredDataLayer.off(event, callback);
    };

    DataLayer.prototype.trigger = function trigger(event) {
        this._unclusteredDataLayer.trigger(event);
    };

    DataLayer.prototype.addData = function addData(data) {
        this._unclusteredDataLayer.addData(data);
    }; // End of addData function

    DataLayer.prototype.onAdd = function onAdd(map) {
        this._map = map;

        // Start request for data
        if (!this._dataRequested) {
            this._dataCallback(this);
            this._dataRequested = true;
        } // End of if

        // Let GeoJSON handle the rest
        _L$MarkerClusterGroup.prototype.onAdd.call(this, map);

        this._unclusteredDataLayer.emit('added');
    }; // End of onAdd function

    DataLayer.prototype.onRemove = function onRemove(map) {
        this._unclusteredDataLayer.emit('removed');
        _L$MarkerClusterGroup.prototype.onRemove.call(this, map);
        this._map = null;
    };

    _createClass(DataLayer, [{
        key: 'active',
        get: function get() {
            return this._map !== null;
        },
        set: function set(val) {/* ignored */}
    }, {
        key: 'id',
        get: function get() {
            return this._unclusteredDataLayer.id;
        }
    }, {
        key: 'name',
        get: function get() {
            return this._unclusteredDataLayer.name;
        }
    }, {
        key: 'config',
        get: function get() {
            return this._unclusteredDataLayer._config;
        }
    }]);

    return DataLayer;
}(_leaflet2.default.MarkerClusterGroup);

; // End of DataLayer class

exports.default = DataLayer;

var UnclusteredDataLayer = exports.UnclusteredDataLayer = function (_NamedGeoJSONLayer) {
    _inherits(UnclusteredDataLayer, _NamedGeoJSONLayer);

    function UnclusteredDataLayer(config, dataCallback) {
        _classCallCheck(this, UnclusteredDataLayer);

        // Configure default options
        var options = {
            pointToLayer: function pointToLayer(feature, latlng) {
                // Create the popup
                var content = _leaflet2.default.DomUtil.create('div', 'large-popup');

                if (feature.properties.name) {
                    var header = _leaflet2.default.DomUtil.create('div', 'large-popup-header', content);
                    _leaflet2.default.DomUtil.create('p', '', header).innerHTML = feature.properties.name;
                } // End of if

                // Generate the directions link
                content.appendChild((0, _directions.generateDirectionsLink)(latlng.lat, latlng.lng, feature.properties.building_name));

                // Put icon
                var popup_icon = _leaflet2.default.DomUtil.create('i', 'large-popup-icon-no-label ' + config.icon_class, content);
                popup_icon.alt = 'POI Icon';

                var popup = _leaflet2.default.popup().setContent(content);

                // Setup the icon
                var icon = _leaflet2.default.divIcon({
                    iconSize: [60, 70],
                    className: "marker-container",
                    iconAnchor: [30, 76],
                    html: '<div class="marker-subcontainer"><i class="map-marker ' + config.icon_class + '"></i><img alt="Map marker background" src="' + _leaflet2.default.Icon.Default.imagePath + '/container-icon.svg"></div>'
                });

                // Setup the marker
                var marker = _leaflet2.default.marker(latlng, { icon: icon });
                marker.bindPopup(popup);

                return marker;
            }
        };

        // Apply the options specified in the configuration
        _leaflet2.default.extend(options, config.options || {});


        // Set instance variables

        var _this2 = _possibleConstructorReturn(this, _NamedGeoJSONLayer.call(this, config, [], options));

        _this2._config = config;
        _this2._config.options = options;
        _this2._dataCallback = dataCallback;
        _this2._dataRequested = false;
        return _this2;
    } // End of constructor

    UnclusteredDataLayer.prototype.onAdd = function onAdd(map) {
        // Start request for data
        if (!this._dataRequested) {
            this._dataCallback(this);
            this._dataRequested = true;
        } // End of if

        // Let GeoJSON handle the rest
        _NamedGeoJSONLayer.prototype.onAdd.call(this, map);
    }; // End of onAdd function


    return UnclusteredDataLayer;
}(_named.NamedGeoJSONLayer); // End of DataLayer class

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/js/layer/data.js","/js/layer")

},{"../directions":3,"./named":7,"_process":48,"buffer":13,"leaflet":44,"leaflet.markercluster":43}],6:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _named = require('./named');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HTMLLayer = function (_NamedLayer) {
    _inherits(HTMLLayer, _NamedLayer);

    function HTMLLayer(config) {
        _classCallCheck(this, HTMLLayer);

        var _this = _possibleConstructorReturn(this, _NamedLayer.call(this, config));

        _this._html = config.html;
        return _this;
    } // End of constructor

    HTMLLayer.prototype.onAdd = function onAdd(map) {}
    // do nothing
    // End of onAdd function

    ;

    HTMLLayer.prototype.onRemove = function onRemove(map) {}
    // do nothing
    // End of onRemove function

    ;

    _createClass(HTMLLayer, [{
        key: 'html',
        get: function get() {
            return this._html;
        }
    }]);

    return HTMLLayer;
}(_named.NamedLayer); // End of HTMLLayer class


exports.default = HTMLLayer;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/js/layer/html.js","/js/layer")

},{"./named":7,"_process":48,"buffer":13}],7:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.NamedGeoJSONLayer = exports.NamedLayer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _leaflet = require('leaflet');

var _leaflet2 = _interopRequireDefault(_leaflet);

var _minivents = require('minivents');

var _minivents2 = _interopRequireDefault(_minivents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var NamedLayer = exports.NamedLayer = function (_L$Class) {
    _inherits(NamedLayer, _L$Class);

    function NamedLayer(config) {
        _classCallCheck(this, NamedLayer);

        var _this = _possibleConstructorReturn(this, _L$Class.call(this));

        (0, _minivents2.default)(_this);

        _this._id = config.id;
        _this._name = config.name || config.id;
        _this._config = config;
        return _this;
    }

    NamedLayer.prototype.onAdd = function onAdd(map) {
        this._map = map;
        this.emit('added');
        // do nothing
    };

    NamedLayer.prototype.onRemove = function onRemove(map) {
        this.emit('removed');
        this._map = null;
        // do nothing
    };

    _createClass(NamedLayer, [{
        key: 'active',
        get: function get() {
            return this._map !== null;
        },
        set: function set(val) {/* ignored */}
    }, {
        key: 'id',
        get: function get() {
            return this._id;
        }
    }, {
        key: 'name',
        get: function get() {
            return this._name;
        }
    }, {
        key: 'config',
        get: function get() {
            return this._config;
        }
    }, {
        key: 'map',
        get: function get() {
            return this._map;
        }
    }]);

    return NamedLayer;
}(_leaflet2.default.Class); // End of NamedLayer class

var NamedGeoJSONLayer = exports.NamedGeoJSONLayer = function (_L$GeoJSON) {
    _inherits(NamedGeoJSONLayer, _L$GeoJSON);

    function NamedGeoJSONLayer(config, data, options) {
        _classCallCheck(this, NamedGeoJSONLayer);

        var _this2 = _possibleConstructorReturn(this, _L$GeoJSON.call(this, data, options));

        (0, _minivents2.default)(_this2);

        _this2._id = config.id;
        _this2._name = config.name || config.id;
        _this2._config = config;
        return _this2;
    }

    NamedGeoJSONLayer.prototype.addData = function addData(data) {
        _L$GeoJSON.prototype.addData.call(this, data);
        if (this.emit) this.emit('data', data);
    };

    NamedGeoJSONLayer.prototype.onAdd = function onAdd(map) {
        this._map = map;
        _L$GeoJSON.prototype.onAdd.call(this, map);
        this.emit('added');
    };

    NamedGeoJSONLayer.prototype.onRemove = function onRemove(map) {
        this.emit('removed');
        this._map = null;
        _L$GeoJSON.prototype.onRemove.call(this, map);
    };

    _createClass(NamedGeoJSONLayer, [{
        key: 'active',
        get: function get() {
            return this._map !== null;
        },
        set: function set(val) {/* ignored */}
    }, {
        key: 'id',
        get: function get() {
            return this._id;
        }
    }, {
        key: 'name',
        get: function get() {
            return this._name;
        }
    }, {
        key: 'config',
        get: function get() {
            return this._config;
        }
    }, {
        key: 'map',
        get: function get() {
            return this._map;
        }
    }]);

    return NamedGeoJSONLayer;
}(_leaflet2.default.GeoJSON); // End of NamedGeoJSONLayer class

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/js/layer/named.js","/js/layer")

},{"_process":48,"buffer":13,"leaflet":44,"minivents":46}],8:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _named = require('./named');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ParentLayer = function (_NamedLayer) {
    _inherits(ParentLayer, _NamedLayer);

    function ParentLayer(id, name) {
        _classCallCheck(this, ParentLayer);

        var _this = _possibleConstructorReturn(this, _NamedLayer.call(this, id, name));

        _this._sublayers = [];
        return _this;
    } // End of initialize function

    ParentLayer.prototype.addSublayer = function addSublayer(layer) {
        this._sublayers.push(layer);
    }; // End of addSublayer function

    _createClass(ParentLayer, [{
        key: 'sublayers',
        get: function get() {
            return this._sublayers;
        }
    }]);

    return ParentLayer;
}(_named.NamedLayer); // End of ParentLayer class


exports.default = ParentLayer;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/js/layer/parent.js","/js/layer")

},{"./named":7,"_process":48,"buffer":13}],9:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _leaflet = require('leaflet');

var _leaflet2 = _interopRequireDefault(_leaflet);

var _data = require('./data');

var _directions = require('../directions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ParkingLayer = function (_DataLayer) {
	_inherits(ParkingLayer, _DataLayer);

	function ParkingLayer(config, dataCallback) {
		_classCallCheck(this, ParkingLayer);

		config = _leaflet2.default.extend({
			options: {
				pointToLayer: function pointToLayer(feature, latlng) {
					// Create the popup
					var content = _leaflet2.default.DomUtil.create('div', 'large-popup');

					// Info Link
					var link_container = _leaflet2.default.DomUtil.create('div', 'large-popup-label', content);
					var link = _leaflet2.default.DomUtil.create('a', '', link_container);
					link.innerHTML = 'Parking Information';
					link.href = 'https://uwaterloo.ca/parking/lot-information';

					// Generate the directions link
					content.appendChild((0, _directions.generateDirectionsLink)(latlng.lat, latlng.lng, feature.properties.building_name));

					// Put icon
					var popup_lot_type = _leaflet2.default.DomUtil.create('span', 'large-popup-label', content);
					popup_lot_type.innerHTML = config.lot_type.toUpperCase();

					_leaflet2.default.DomUtil.create('br', '', content);

					var popup_lot_name = _leaflet2.default.DomUtil.create('span', 'popup-lot-letter-label', content);
					popup_lot_name.innerHTML = feature.properties.name.substr(0, 3);

					var popup = _leaflet2.default.popup().setContent(content);

					// Setup the icon
					var icon = _leaflet2.default.divIcon({
						iconSize: [60, 70],
						className: "marker-container",
						iconAnchor: [30, 76],
						html: '<div class="marker-subcontainer"><p class="map-marker-label">' + config.lot_type.toUpperCase() + '</p><span class="lot-letter-label">' + feature.properties.name.substr(0, 3) + '</span><img alt="Map marker background" src="' + _leaflet2.default.Icon.Default.imagePath + '/container-icon.svg"></div>'
					});

					// Setup the marker
					var marker = _leaflet2.default.marker(latlng, { icon: icon });
					marker.bindPopup(popup);

					return marker;
				}
			}
		}, config || {});
		return _possibleConstructorReturn(this, _DataLayer.call(this, config, dataCallback));
	}

	return ParkingLayer;
}(_data.DataLayer);

exports.default = ParkingLayer;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/js/layer/parking.js","/js/layer")

},{"../directions":3,"./data":5,"_process":48,"buffer":13,"leaflet":44}],10:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _leaflet = require('leaflet');

var _leaflet2 = _interopRequireDefault(_leaflet);

var _directions = require('./directions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var reused_layers = {
	'help-lines': {
		type: 'uwapi',
		id: 'help-lines',
		name: 'Help Lines',
		icon_class: 'icon-help-phone',
		endpoint: 'v2/poi/helplines'
	},
	'accessible-parking': {
		type: 'uwapi',
		id: 'accessible-parking',
		name: 'Accessible Parking',
		icon_class: 'icon-parking-circle',
		endpoint: 'v2/parking/lots/accessible'
	}
};

var layers = [{
	type: 'parent',
	id: 'emergency-information',
	name: 'Emergency Information',
	sublayers: [{
		type: 'html',
		id: 'emergency-contacts',
		name: 'Emergency Contacts',
		html: '<b>In the event of an emergency, call 9-1-1 or Campus Police at extension 22222 or (519) 888-4911.</b>'
	}, {
		type: 'html',
		id: 'watsafe',
		name: 'WatSAFE',
		html: 'Download the <a href="https://uwaterloo.ca/watsafe">WatSAFE app</a> to receive emergency alerts and notifications.'
	}, {
		type: 'uwapi',
		id: 'aed',
		name: 'Automatic External Defibrillators',
		icon_class: 'icon-aed',
		endpoint: 'v2/poi/defibrillators'
	}, reused_layers['help-lines']]
}, {
	type: 'parent',
	id: 'places',
	name: 'Places',
	sublayers: [{
		type: 'uwapi',
		id: 'food',
		name: 'Places to Eat',
		icon_class: 'icon-food',
		endpoint: 'v2/foodservices/locations',
		options: {
			pointToLayer: function pointToLayer(feature, latlng) {
				// Create the popup
				var content = _leaflet2.default.DomUtil.create('div', 'large-popup');

				if (feature.properties.outlet_name) {
					var header = _leaflet2.default.DomUtil.create('div', 'large-popup-header', content);
					_leaflet2.default.DomUtil.create('p', '', header).innerHTML = feature.properties.outlet_name;
				} // End of if

				// Add the outlet notice
				if (feature.properties.notice) {
					var notice = _leaflet2.default.DomUtil.create('p', 'large-subheader', content);
					notice.innerHTML = '<b>' + feature.properties.notice + '</b>';
				} // End of if

				// Place today's hours
				function pad(value) {
					if (value < 10) return '0' + value;
					return '' + value;
				};
				var weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
				var date = new Date();
				var today = date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
				var weekday = weekdays[date.getDay()];

				if (feature.properties.dates_closed.indexOf(today) !== -1) {
					_leaflet2.default.DomUtil.create('div', 'large-popup-subheader', content).innerHTML = 'Exception: Closed Today';
				} else {
					// Search the special hours
					var has_special = false;
					feature.properties.special_hours.forEach(function (special) {
						if (special.date === today) {
							has_special = true;
							_leaflet2.default.DomUtil.create('div', 'large-popup-subheader', content).innerHTML = 'Today\'s Special Hours: ' + special.opening_hour + ' to ' + special_closing_hour;
						} // End of if
					});

					if (!has_special && !feature.properties.opening_hours[weekday].is_closed) {
						_leaflet2.default.DomUtil.create('div', 'large-popup-subheader', content).innerHTML = 'Today\'s Hours: ' + feature.properties.opening_hours[weekday].opening_hour + ' to ' + feature.properties.opening_hours[weekday].closing_hour;
					} else {
						_leaflet2.default.DomUtil.create('div', 'large-popup-subheader', content).innerHTML = 'Closed Today';
					} // End of else
				} // End of if/else

				// Add the outlet logo
				if (feature.properties.logo) {
					var logo = _leaflet2.default.DomUtil.create('img', 'popup-image', content);
					logo.src = feature.properties.logo;
				} // End of if

				// Generate the directions link
				content.appendChild((0, _directions.generateDirectionsLink)(latlng.lat, latlng.lng, feature.properties.outlet_name));

				// Put icon
				var status = feature.properties.is_open_now ? 'OPEN' : 'CLOSED';
				var popup_text = _leaflet2.default.DomUtil.create('span', 'large-popup-label', content);
				popup_text.innerHTML = status;

				_leaflet2.default.DomUtil.create('br', '', content);

				var popup_icon = _leaflet2.default.DomUtil.create('i', 'large-popup-icon icon-food', content);
				popup_icon.alt = 'Food Icon';

				var popup = _leaflet2.default.popup().setContent(content);

				// Setup the icon
				var icon = _leaflet2.default.divIcon({
					iconSize: [60, 70],
					className: "marker-container",
					iconAnchor: [30, 76],
					html: '<div class="marker-subcontainer"><p class="map-marker-label">' + status + '</p><i class="map-marker-with-label icon-food"></i><img alt="Map marker background" src="' + _leaflet2.default.Icon.Default.imagePath + '/container-icon.svg"></div>'
				});

				// Setup the marker
				var marker = _leaflet2.default.marker(latlng, { icon: icon });
				marker.bindPopup(popup);

				return marker;
			} // End of pointToLayer
		}
	}, {
		type: 'uwapi',
		id: 'libraries',
		name: 'Libraries',
		icon_class: 'icon-library',
		endpoint: 'v2/poi/libraries'
	}]
}, {
	type: 'parent',
	id: 'transit',
	name: 'Transit',
	sublayers: [{
		type: 'uwapi',
		id: 'grt',
		name: 'GRT Stops',
		icon_class: 'icon-bus',
		endpoint: 'v2/transit/grt/stops',
		options: {
			pointToLayer: function pointToLayer(feature, latlng) {
				// Create the popup
				var content = _leaflet2.default.DomUtil.create('div', 'large-popup');

				if (feature.properties.name) {
					var header = _leaflet2.default.DomUtil.create('div', 'large-popup-header', content);
					_leaflet2.default.DomUtil.create('p', '', header).innerHTML = feature.properties.name;
				} // End of if

				// GRT Trip Planner link
				var link_container = _leaflet2.default.DomUtil.create('div', 'large-popup-label', content);
				var link = _leaflet2.default.DomUtil.create('a', '', link_container);
				link.innerHTML = 'GRT Trip Planner';
				link.href = 'http://web.grt.ca/hastinfoweb/';

				// Generate the directions link
				content.appendChild((0, _directions.generateDirectionsLink)(latlng.lat, latlng.lng, feature.properties.building_name));

				// Put icon
				var popup_text = _leaflet2.default.DomUtil.create('span', 'large-popup-label', content);
				popup_text.innerHTML = feature.properties.id;

				_leaflet2.default.DomUtil.create('br', '', content);

				var popup_icon = _leaflet2.default.DomUtil.create('i', 'large-popup-icon icon-bus', content);
				popup_icon.alt = 'Bus Icon';

				var popup = _leaflet2.default.popup().setContent(content);

				// Setup the icon
				var icon = _leaflet2.default.divIcon({
					iconSize: [60, 70],
					className: "marker-container",
					iconAnchor: [30, 76],
					html: '<div class="marker-subcontainer"><p class="map-marker-label">' + feature.properties.id + '</p><i class="map-marker-with-label icon-bus"></i><img alt="Map marker background" src="' + _leaflet2.default.Icon.Default.imagePath + '/container-icon.svg"></div>'
				});

				// Setup the marker
				var marker = _leaflet2.default.marker(latlng, { icon: icon });
				marker.bindPopup(popup);

				return marker;
			}
		}
	}, {
		type: 'uwapi',
		id: 'go-transit',
		name: 'GO Transit',
		icon_class: 'icon-bus',
		endpoint: 'v2/transit/go/stops'
	}, {
		type: 'uwapi',
		id: 'greyhound',
		name: 'Greyhound',
		icon_class: 'icon-bus',
		endpoint: 'v2/poi/greyhound'
	}, {
		type: 'uwapi',
		id: 'community-carshare',
		name: 'Community CarShare',
		icon_class: 'icon-cab',
		endpoint: 'v2/poi/carshare'
	}]
}, {
	type: 'parent',
	id: 'information',
	name: 'Information',
	sublayers: [{
		type: 'uwapi',
		id: 'photospheres',
		name: 'Photospheres',
		icon_class: 'icon-camera',
		endpoint: 'v2/poi/photospheres'
	}, {
		type: 'uwapi',
		id: 'visitor-information',
		name: 'Visitor Information',
		icon_class: 'icon-info',
		endpoint: 'v2/poi/visitorinformation'
	}, {
		type: 'uwapi',
		id: 'construction-sites',
		name: 'Construction Sites',
		icon_class: 'icon-construction',
		endpoint: 'v2/poi/constructionsites'
	}, reused_layers['help-lines'], {
		type: 'uwapi',
		id: 'atms',
		name: 'ATMs',
		icon_class: 'icon-credit-card',
		endpoint: 'v2/poi/atms'
	}]
}, {
	type: 'parent',
	id: 'parking',
	name: 'Parking',
	sublayers: [{
		type: 'uwparking',
		lot_type: 'visitor',
		id: 'visitor-parking',
		name: 'Visitor Parking',
		icon_class: 'icon-parking-circle',
		endpoint: 'v2/parking/lots/visitor'
	}, {
		type: 'uwapi',
		id: 'meter-parking',
		name: 'Meter Parking',
		icon_class: 'icon-parking-circle',
		endpoint: 'v2/parking/lots/meter'
	}, {
		type: 'uwapi',
		id: 'short-term-parking',
		name: 'Short Term Parking',
		icon_class: 'icon-parking-circle',
		endpoint: 'v2/parking/lots/shortterm'
	}, {
		type: 'uwapi',
		id: 'motorcycle-parking',
		name: 'Motorcylce Parking',
		icon_class: 'icon-parking-circle',
		endpoint: 'v2/parking/lots/motorcycle'
	}, reused_layers['accessible-parking'], {
		type: 'uwparking',
		lot_type: 'permit',
		id: 'permit-parking',
		name: 'Permit Parking',
		icon_class: 'icon-parking-circle',
		endpoint: 'v2/parking/lots/permit'
	}]
}, {
	type: 'parent',
	id: 'accessibility',
	name: 'Accessibility',
	sublayers: [reused_layers['accessible-parking'], {
		type: 'uwapi',
		id: 'accessible-entrances',
		name: 'Accessible Entrances',
		icon_class: 'icon-accessibility',
		endpoint: 'v2/poi/accessibleentrances'
	}]
}];

exports.default = layers;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/js/layers.js","/js")

},{"./directions":3,"_process":48,"buffer":13,"leaflet":44}],11:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict';

var _leaflet = require('leaflet');

var _leaflet2 = _interopRequireDefault(_leaflet);

var _campusmap = require('./campusmap');

var _campusmap2 = _interopRequireDefault(_campusmap);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_config2.default['imagePath'] = 'https://opendata-dev.uwaterloo.ca/~ztseguin/map-alpha/dist';

var campusmap = null;

// Setup the Portal App
var app = angular.module('portalApp');

app.controller('campusMapCtrl', ['$scope', '$timeout', function ($scope, $timeout) {
	var presentCallback = null;

	$scope.$on('viewClosed', function () {
		if ($scope.activeColumn == 1 && presentCallback) {
			presentCallback();
			presentCallback = null;
		} // End of if
	});

	_config2.default['present'] = function (title, element) {
		var callback = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

		console.warn('Presenting (Portal)', title, element);
		presentCallback = callback;

		$scope.$apply(function () {
			$scope.portalHelpers.showView('campusMapPresent.html', 2);

			$scope.presentTitle = title;
			$timeout(function () {
				var $pres = $('<div id="campusMapPresent" />');
				$(element).appendTo($pres);
				$('#campusMapPresent').replaceWith($pres);
			}, 100);
		});
	};

	// Initialize
	$scope.search = { value: null };
	$scope.campusMap = { value: null };
	$scope.buildings = { value: null };

	// Functions
	$scope.toggleLayer = function (layer) {
		if ($scope.campusMap.value.map.hasLayer(layer)) {
			$scope.campusMap.value.map.removeLayer(layer);
		} else {
			$scope.campusMap.value.map.addLayer(layer);
		} // End of if/else
	}; // End of toggleLayer

	$scope.$watch('campusMap.value', function (new_value, old_value) {
		if (!new_value) return;

		// Register the data listeners if map changed
		new_value.buildings.on('data', function () {
			$scope.buildings.value = [];
			Object.keys(new_value.buildings.buildings).forEach(function (building_code) {
				var building = new_value.buildings.buildings[building_code];
				var latlng = building.layer.getLatLng();

				if (latlng.lat === 0 && latlng.lng === 0) {
					return;
				} // End of if

				$scope.buildings.value.push(building.props);
			});
		});
	});

	// Set the view
	$scope.portalHelpers.showView('campusMap.html', 1);
}]).directive('campusmap', ['$timeout', function ($timeout) {
	function link(scope, element, attrs) {
		console.debug(scope);
		console.debug(element);
		console.debug(attrs);

		scope.campusMap.value = new _campusmap2.default(_config2.default, element[0]);
		console.debug(scope.campusMap.value);
		window.campusMap = scope.campusMap.value;
		window.mapscope = scope;

		// Set the layers selector button
		var menu_button = _leaflet2.default.control({ position: 'topright' });
		menu_button.onAdd = function (map) {
			var div = _leaflet2.default.DomUtil.create("div", "leaflet-bar leaflet-control");
			var a = _leaflet2.default.DomUtil.create('a', '', div);
			a.href = '#';

			a.innerHTML = '<i class="icon-menu"></i>';
			_leaflet2.default.DomEvent.on(a, 'click', function (e) {
				_leaflet2.default.DomEvent.stopPropagation(e);
				_leaflet2.default.DomEvent.preventDefault(e);

				scope.$parent.$apply(function () {
					return scope.$parent.portalHelpers.showView('campusMapSettings.html', 2);
				});

				function animate(animationLength) {
					if (window.requestAnimationFrame) {
						var animationFrameRequest;

						(function () {
							animationFrameRequest = null;

							var callback = function callback() {
								scope.campusMap.value.map.invalidateSize();
								animationFrameRequest = requestAnimationFrame(callback);
							};
							animationFrameRequest = requestAnimationFrame(callback);

							setTimeout(function () {
								cancelAnimationFrame(animationFrameRequest);
							}, animationLength);
						})();
					} else {
						setTimeout(function () {
							scope.campusMap.value.map.invalidateSize();
						}, animationLength);
					}
				}

				animate(1500);
				$('.widgetCloseButton').click(function () {
					animate(1100);
				});
			});
			return div;
		};
		menu_button.addTo(scope.campusMap.value.map);

		setTimeout(function () {
			scope.campusMap.value.map.invalidateSize();
		}, 500);
	}

	return {
		restrict: 'E',
		scope: { campusMap: '=map' },
		link: link
	};
}]);

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/js/portal.js","/js")

},{"./campusmap":1,"./config":2,"_process":48,"buffer":13,"leaflet":44}],12:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict'

exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/base64-js/lib/b64.js","/node_modules/base64-js/lib")

},{"_process":48,"buffer":13}],13:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; i++) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  that.write(string, encoding)
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

function arrayIndexOf (arr, val, byteOffset, encoding) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var foundIndex = -1
  for (var i = 0; byteOffset + i < arrLength; i++) {
    if (read(arr, byteOffset + i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
      if (foundIndex === -1) foundIndex = i
      if (i - foundIndex + 1 === valLength) return (byteOffset + foundIndex) * indexSize
    } else {
      if (foundIndex !== -1) i -= i - foundIndex
      foundIndex = -1
    }
  }
  return -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  if (Buffer.isBuffer(val)) {
    // special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(this, val, byteOffset, encoding)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset, encoding)
  }

  throw new TypeError('val must be string, number or Buffer')
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; i++) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; i++) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/buffer/index.js","/node_modules/buffer")

},{"_process":48,"base64-js":12,"buffer":13,"ieee754":16,"isarray":17}],14:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
function corslite(url, callback, cors) {
    var sent = false;

    if (typeof window.XMLHttpRequest === 'undefined') {
        return callback(Error('Browser not supported'));
    }

    if (typeof cors === 'undefined') {
        var m = url.match(/^\s*https?:\/\/[^\/]*/);
        cors = m && (m[0] !== location.protocol + '//' + location.domain +
                (location.port ? ':' + location.port : ''));
    }

    var x = new window.XMLHttpRequest();

    function isSuccessful(status) {
        return status >= 200 && status < 300 || status === 304;
    }

    if (cors && !('withCredentials' in x)) {
        // IE8-9
        x = new window.XDomainRequest();

        // Ensure callback is never called synchronously, i.e., before
        // x.send() returns (this has been observed in the wild).
        // See https://github.com/mapbox/mapbox.js/issues/472
        var original = callback;
        callback = function() {
            if (sent) {
                original.apply(this, arguments);
            } else {
                var that = this, args = arguments;
                setTimeout(function() {
                    original.apply(that, args);
                }, 0);
            }
        }
    }

    function loaded() {
        if (
            // XDomainRequest
            x.status === undefined ||
            // modern browsers
            isSuccessful(x.status)) callback.call(x, null, x);
        else callback.call(x, x, null);
    }

    // Both `onreadystatechange` and `onload` can fire. `onreadystatechange`
    // has [been supported for longer](http://stackoverflow.com/a/9181508/229001).
    if ('onload' in x) {
        x.onload = loaded;
    } else {
        x.onreadystatechange = function readystate() {
            if (x.readyState === 4) {
                loaded();
            }
        };
    }

    // Call the callback with the XMLHttpRequest object as an error and prevent
    // it from ever being called again by reassigning it to `noop`
    x.onerror = function error(evt) {
        // XDomainRequest provides no evt parameter
        callback.call(this, evt || true, null);
        callback = function() { };
    };

    // IE9 must have onprogress be set to a unique function.
    x.onprogress = function() { };

    x.ontimeout = function(evt) {
        callback.call(this, evt, null);
        callback = function() { };
    };

    x.onabort = function(evt) {
        callback.call(this, evt, null);
        callback = function() { };
    };

    // GET is the only supported HTTP Verb by XDomainRequest and is the
    // only one supported here.
    x.open('GET', url, true);

    // Send the request. Sending data is not supported.
    x.send(null);
    sent = true;

    return x;
}

if (typeof module !== 'undefined') module.exports = corslite;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/corslite/corslite.js","/node_modules/corslite")

},{"_process":48,"buffer":13}],15:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.2.1
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$vertxNext;
    var lib$es6$promise$asap$$customSchedulerFn;

    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (lib$es6$promise$asap$$customSchedulerFn) {
          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
        } else {
          lib$es6$promise$asap$$scheduleFlush();
        }
      }
    }

    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
    }

    function lib$es6$promise$asap$$setAsap(asapFn) {
      lib$es6$promise$asap$$asap = asapFn;
    }

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // see https://github.com/cujojs/when/issues/410 for details
      return function() {
        process.nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertx() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }
    function lib$es6$promise$then$$then(onFulfillment, onRejection) {
      var parent = this;

      var child = new this.constructor(lib$es6$promise$$internal$$noop);

      if (child[lib$es6$promise$$internal$$PROMISE_ID] === undefined) {
        lib$es6$promise$$internal$$makePromise(child);
      }

      var state = parent._state;

      if (state) {
        var callback = arguments[state - 1];
        lib$es6$promise$asap$$asap(function(){
          lib$es6$promise$$internal$$invokeCallback(state, child, callback, parent._result);
        });
      } else {
        lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
      }

      return child;
    }
    var lib$es6$promise$then$$default = lib$es6$promise$then$$then;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
    var lib$es6$promise$$internal$$PROMISE_ID = Math.random().toString(36).substring(16);

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFulfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$asap(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable, then) {
      if (maybeThenable.constructor === promise.constructor &&
          then === lib$es6$promise$then$$default &&
          constructor.resolve === lib$es6$promise$promise$resolve$$default) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value, lib$es6$promise$$internal$$getThen(value));
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    var lib$es6$promise$$internal$$id = 0;
    function lib$es6$promise$$internal$$nextId() {
      return lib$es6$promise$$internal$$id++;
    }

    function lib$es6$promise$$internal$$makePromise(promise) {
      promise[lib$es6$promise$$internal$$PROMISE_ID] = lib$es6$promise$$internal$$id++;
      promise._state = undefined;
      promise._result = undefined;
      promise._subscribers = [];
    }

    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      if (!lib$es6$promise$utils$$isArray(entries)) {
        return new Constructor(function(resolve, reject) {
          reject(new TypeError('You must pass an array to race.'));
        });
      } else {
        return new Constructor(function(resolve, reject) {
          var length = entries.length;
          for (var i = 0; i < length; i++) {
            Constructor.resolve(entries[i]).then(resolve, reject);
          }
        });
      }
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;


    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this[lib$es6$promise$$internal$$PROMISE_ID] = lib$es6$promise$$internal$$nextId();
      this._result = this._state = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        typeof resolver !== 'function' && lib$es6$promise$promise$$needsResolver();
        this instanceof lib$es6$promise$promise$$Promise ? lib$es6$promise$$internal$$initializePromise(this, resolver) : lib$es6$promise$promise$$needsNew();
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: lib$es6$promise$then$$default,

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;
    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      this._instanceConstructor = Constructor;
      this.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!this.promise[lib$es6$promise$$internal$$PROMISE_ID]) {
        lib$es6$promise$$internal$$makePromise(this.promise);
      }

      if (lib$es6$promise$utils$$isArray(input)) {
        this._input     = input;
        this.length     = input.length;
        this._remaining = input.length;

        this._result = new Array(this.length);

        if (this.length === 0) {
          lib$es6$promise$$internal$$fulfill(this.promise, this._result);
        } else {
          this.length = this.length || 0;
          this._enumerate();
          if (this._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(this.promise, this._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(this.promise, lib$es6$promise$enumerator$$validationError());
      }
    }

    function lib$es6$promise$enumerator$$validationError() {
      return new Error('Array Methods must be provided an Array');
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var length  = this.length;
      var input   = this._input;

      for (var i = 0; this._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        this._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var c = this._instanceConstructor;
      var resolve = c.resolve;

      if (resolve === lib$es6$promise$promise$resolve$$default) {
        var then = lib$es6$promise$$internal$$getThen(entry);

        if (then === lib$es6$promise$then$$default &&
            entry._state !== lib$es6$promise$$internal$$PENDING) {
          this._settledAt(entry._state, i, entry._result);
        } else if (typeof then !== 'function') {
          this._remaining--;
          this._result[i] = entry;
        } else if (c === lib$es6$promise$promise$$default) {
          var promise = new c(lib$es6$promise$$internal$$noop);
          lib$es6$promise$$internal$$handleMaybeThenable(promise, entry, then);
          this._willSettleAt(promise, i);
        } else {
          this._willSettleAt(new c(function(resolve) { resolve(entry); }), i);
        }
      } else {
        this._willSettleAt(resolve(entry), i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var promise = this.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        this._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          this._result[i] = value;
        }
      }

      if (this._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, this._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/es6-promise/dist/es6-promise.js","/node_modules/es6-promise/dist")

},{"_process":48,"buffer":13}],16:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/ieee754/index.js","/node_modules/ieee754")

},{"_process":48,"buffer":13}],17:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/isarray/index.js","/node_modules/isarray")

},{"_process":48,"buffer":13}],18:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var L = require('leaflet'),
	Nominatim = require('./geocoders/nominatim').class;

module.exports = {
	class: L.Control.extend({
		options: {
			showResultIcons: false,
			collapsed: true,
			expand: 'click',
			position: 'topright',
			placeholder: 'Search...',
			errorMessage: 'Nothing found.'
		},

		_callbackId: 0,

		initialize: function (options) {
			L.Util.setOptions(this, options);
			if (!this.options.geocoder) {
				this.options.geocoder = new Nominatim();
			}
		},

		onAdd: function (map) {
			var className = 'leaflet-control-geocoder',
			    container = L.DomUtil.create('div', className + ' leaflet-bar'),
			    icon = L.DomUtil.create('a', 'leaflet-control-geocoder-icon', container),
			    form = this._form = L.DomUtil.create('form', className + '-form', container),
			    input;

			icon.innerHTML = '&nbsp;';
			icon.href = 'javascript:void(0);';
			this._map = map;
			this._container = container;
			input = this._input = L.DomUtil.create('input');
			input.type = 'text';
			input.placeholder = this.options.placeholder;

			L.DomEvent.addListener(input, 'keydown', this._keydown, this);
			//L.DomEvent.addListener(input, 'onpaste', this._clearResults, this);
			//L.DomEvent.addListener(input, 'oninput', this._clearResults, this);

			this._errorElement = document.createElement('div');
			this._errorElement.className = className + '-form-no-error';
			this._errorElement.innerHTML = this.options.errorMessage;

			this._alts = L.DomUtil.create('ul', className + '-alternatives leaflet-control-geocoder-alternatives-minimized');

			form.appendChild(input);
			this._container.appendChild(this._errorElement);
			container.appendChild(this._alts);

			L.DomEvent.addListener(form, 'submit', this._geocode, this);

			if (this.options.collapsed) {
				if (this.options.expand === 'click') {
					L.DomEvent.addListener(icon, 'click', function(e) {
						// TODO: touch
						if (e.button === 0 && e.detail !== 2) {
							this._toggle();
						}
					}, this);
				} else {
					L.DomEvent.addListener(icon, 'mouseover', this._expand, this);
					L.DomEvent.addListener(icon, 'mouseout', this._collapse, this);
					this._map.on('movestart', this._collapse, this);
				}
			} else {
				L.DomEvent.addListener(icon, 'click', function(e) {
					this._geocode(e);
				}, this);
				this._expand();
			}

			L.DomEvent.disableClickPropagation(container);

			return container;
		},

		_geocodeResult: function (results) {
			L.DomUtil.removeClass(this._container, 'leaflet-control-geocoder-throbber');
			if (results.length === 1) {
				this._geocodeResultSelected(results[0]);
			} else if (results.length > 0) {
				this._alts.innerHTML = '';
				this._results = results;
				L.DomUtil.removeClass(this._alts, 'leaflet-control-geocoder-alternatives-minimized');
				for (var i = 0; i < results.length; i++) {
					this._alts.appendChild(this._createAlt(results[i], i));
				}
			} else {
				L.DomUtil.addClass(this._errorElement, 'leaflet-control-geocoder-error');
			}
		},

		markGeocode: function(result) {
			this._map.fitBounds(result.bbox);

			if (this._geocodeMarker) {
				this._map.removeLayer(this._geocodeMarker);
			}

			this._geocodeMarker = new L.Marker(result.center)
				.bindPopup(result.html || result.name)
				.addTo(this._map)
				.openPopup();

			return this;
		},

		_geocode: function(event) {
			L.DomEvent.preventDefault(event);

			L.DomUtil.addClass(this._container, 'leaflet-control-geocoder-throbber');
			this._clearResults();
			this.options.geocoder.geocode(this._input.value, this._geocodeResult, this);

			return false;
		},

		_geocodeResultSelected: function(result) {
			if (this.options.collapsed) {
				this._collapse();
			} else {
				this._clearResults();
			}
			this.markGeocode(result);
		},

		_toggle: function() {
			if (this._container.className.indexOf('leaflet-control-geocoder-expanded') >= 0) {
				this._collapse();
			} else {
				this._expand();
			}
		},

		_expand: function () {
			L.DomUtil.addClass(this._container, 'leaflet-control-geocoder-expanded');
			this._input.select();
		},

		_collapse: function () {
			this._container.className = this._container.className.replace(' leaflet-control-geocoder-expanded', '');
			L.DomUtil.addClass(this._alts, 'leaflet-control-geocoder-alternatives-minimized');
			L.DomUtil.removeClass(this._errorElement, 'leaflet-control-geocoder-error');
		},

		_clearResults: function () {
			L.DomUtil.addClass(this._alts, 'leaflet-control-geocoder-alternatives-minimized');
			this._selection = null;
			L.DomUtil.removeClass(this._errorElement, 'leaflet-control-geocoder-error');
		},

		_createAlt: function(result, index) {
			var li = L.DomUtil.create('li', ''),
				a = L.DomUtil.create('a', '', li),
			    icon = this.options.showResultIcons && result.icon ? L.DomUtil.create('img', '', a) : null,
			    text = result.html ? undefined : document.createTextNode(result.name),
			    clickHandler = function clickHandler(e) {
					L.DomEvent.preventDefault(e);
					this._geocodeResultSelected(result);
				};

			if (icon) {
				icon.src = result.icon;
			}

			li.setAttribute('data-result-index', index);

			if (result.html) {
				a.innerHTML = a.innerHTML + result.html;
			} else {
				a.appendChild(text);
			}

			L.DomEvent.addListener(li, 'click', clickHandler, this);

			return li;
		},

		_keydown: function(e) {
			var _this = this,
			    select = function select(dir) {
					if (_this._selection) {
						L.DomUtil.removeClass(_this._selection, 'leaflet-control-geocoder-selected');
						_this._selection = _this._selection[dir > 0 ? 'nextSibling' : 'previousSibling'];
					}
					if (!_this._selection) {
						_this._selection = _this._alts[dir > 0 ? 'firstChild' : 'lastChild'];
					}

					if (_this._selection) {
						L.DomUtil.addClass(_this._selection, 'leaflet-control-geocoder-selected');
					}
				};

			switch (e.keyCode) {
			// Escape
			case 27:
				if (this.options.collapsed) {
					this._collapse();
				}
				break;
			// Up
			case 38:
				select(-1);
				L.DomEvent.preventDefault(e);
				break;
			// Up
			case 40:
				select(1);
				L.DomEvent.preventDefault(e);
				break;
			// Enter
			case 13:
				if (this._selection) {
					var index = parseInt(this._selection.getAttribute('data-result-index'), 10);
					this._geocodeResultSelected(this._results[index]);
					this._clearResults();
					L.DomEvent.preventDefault(e);
				}
			}
			return true;
		}
	}),
	factory: function(options) {
		return new L.Control.Geocoder(options);
	}
};

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-control-geocoder/src/control.js","/node_modules/leaflet-control-geocoder/src")

},{"./geocoders/nominatim":26,"_process":48,"buffer":13,"leaflet":44}],19:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var L = require('leaflet'),
	Util = require('../util');

module.exports = {
	class: L.Class.extend({
		options: {
			service_url: 'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer'
		},

		initialize: function(accessToken, options) {
			L.setOptions(this, options);
			this._accessToken = accessToken;
		},

		geocode: function(query, cb, context) {
			var params = {
				SingleLine: query,
				outFields: 'Addr_Type',
				forStorage: false,
				maxLocations: 10,
				f: 'json'
			};

			if (this._key && this._key.length) {
				params.token = this._key;
			}

			Util.getJSON(this.options.service_url + '/findAddressCandidates', params, function(data) {
				var results = [],
					loc,
					latLng,
					latLngBounds;

				if (data.candidates && data.candidates.length) {
					for (var i = 0; i <= data.candidates.length - 1; i++) {
						loc = data.candidates[i];
						latLng = L.latLng(loc.location.y, loc.location.x);
						latLngBounds = L.latLngBounds(L.latLng(loc.extent.ymax, loc.extent.xmax), L.latLng(loc.extent.ymin, loc.extent.xmin));
						results[i] = {
								name: loc.address,
								bbox: latLngBounds,
								center: latLng
						};
					}
				}

				cb.call(context, results);
			});
		},

		suggest: function(query, cb, context) {
			return this.geocode(query, cb, context);
		},

		reverse: function(location, scale, cb, context) {
			var params = {
				location: encodeURIComponent(location.lng) + ',' + encodeURIComponent(location.lat),
				distance: 100,
				f: 'json'
			};

			Util.getJSON(this.options.service_url + '/reverseGeocode', params, function(data) {
				var result = [],
					loc;

				if (data && !data.error) {
					loc = L.latLng(data.location.y, data.location.x);
					result.push({
						name: data.address.Match_addr,
						center: loc,
						bounds: L.latLngBounds(loc, loc)
					});
				}

				cb.call(context, result);
			});
		}
	}),

	factory: function(accessToken, options) {
		return new L.Control.Geocoder.ArcGis(accessToken, options);
	}
};

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-control-geocoder/src/geocoders/arcgis.js","/node_modules/leaflet-control-geocoder/src/geocoders")

},{"../util":30,"_process":48,"buffer":13,"leaflet":44}],20:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var L = require('leaflet'),
	Util = require('../util');

module.exports = {
	class: L.Class.extend({
		initialize: function(key) {
			this.key = key;
		},

		geocode : function (query, cb, context) {
			Util.jsonp('//dev.virtualearth.net/REST/v1/Locations', {
				query: query,
				key : this.key
			}, function(data) {
				var results = [];
				if( data.resourceSets.length > 0 ){
					for (var i = data.resourceSets[0].resources.length - 1; i >= 0; i--) {
						var resource = data.resourceSets[0].resources[i],
							bbox = resource.bbox;
						results[i] = {
							name: resource.name,
							bbox: L.latLngBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]]),
							center: L.latLng(resource.point.coordinates)
						};
					}
				}
				cb.call(context, results);
			}, this, 'jsonp');
		},

		reverse: function(location, scale, cb, context) {
			Util.jsonp('//dev.virtualearth.net/REST/v1/Locations/' + location.lat + ',' + location.lng, {
				key : this.key
			}, function(data) {
				var results = [];
				for (var i = data.resourceSets[0].resources.length - 1; i >= 0; i--) {
					var resource = data.resourceSets[0].resources[i],
						bbox = resource.bbox;
					results[i] = {
						name: resource.name,
						bbox: L.latLngBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]]),
						center: L.latLng(resource.point.coordinates)
					};
				}
				cb.call(context, results);
			}, this, 'jsonp');
		}
	}),

	factory: function(key) {
		return new L.Control.Geocoder.Bing(key);
	}
};

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-control-geocoder/src/geocoders/bing.js","/node_modules/leaflet-control-geocoder/src/geocoders")

},{"../util":30,"_process":48,"buffer":13,"leaflet":44}],21:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var L = require('leaflet'),
	Util = require('../util');

module.exports = {
	class: L.Class.extend({
		options: {
			serviceUrl: 'https://maps.googleapis.com/maps/api/geocode/json',
			geocodingQueryParams: {},
			reverseQueryParams: {}
		},

		initialize: function(key, options) {
			this._key = key;
			L.setOptions(this, options);
			// Backwards compatibility
			this.options.serviceUrl = this.options.service_url || this.options.serviceUrl;
		},

		geocode: function(query, cb, context) {
			var params = {
				address: query,
			};

			if (this._key && this._key.length) {
				params.key = this._key;
			}

			params = L.Util.extend(params, this.options.geocodingQueryParams);

			Util.getJSON(this.options.serviceUrl, params, function(data) {
				var results = [],
						loc,
						latLng,
						latLngBounds;
				if (data.results && data.results.length) {
					for (var i = 0; i <= data.results.length - 1; i++) {
						loc = data.results[i];
						latLng = L.latLng(loc.geometry.location);
						latLngBounds = L.latLngBounds(L.latLng(loc.geometry.viewport.northeast), L.latLng(loc.geometry.viewport.southwest));
						results[i] = {
							name: loc.formatted_address,
							bbox: latLngBounds,
							center: latLng,
							properties: loc.address_components
						};
					}
				}

				cb.call(context, results);
			});
		},

		reverse: function(location, scale, cb, context) {
			var params = {
				latlng: encodeURIComponent(location.lat) + ',' + encodeURIComponent(location.lng)
			};
			params = L.Util.extend(params, this.options.reverseQueryParams);
			if (this._key && this._key.length) {
				params.key = this._key;
			}

			Util.getJSON(this.options.serviceUrl, params, function(data) {
				var results = [],
						loc,
						latLng,
						latLngBounds;
				if (data.results && data.results.length) {
					for (var i = 0; i <= data.results.length - 1; i++) {
						loc = data.results[i];
						latLng = L.latLng(loc.geometry.location);
						latLngBounds = L.latLngBounds(L.latLng(loc.geometry.viewport.northeast), L.latLng(loc.geometry.viewport.southwest));
						results[i] = {
							name: loc.formatted_address,
							bbox: latLngBounds,
							center: latLng,
							properties: loc.address_components
						};
					}
				}

				cb.call(context, results);
			});
		}
	}),

	factory: function(key, options) {
		return new L.Control.Geocoder.Google(key, options);
	}
};

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-control-geocoder/src/geocoders/google.js","/node_modules/leaflet-control-geocoder/src/geocoders")

},{"../util":30,"_process":48,"buffer":13,"leaflet":44}],22:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var L = require('leaflet'),

    Util = require('../util');



module.exports = {

    class: L.Class.extend({

        options: {

            geocodeUrl: 'http://geocoder.api.here.com/6.2/geocode.json',

            reverseGeocodeUrl: 'http://reverse.geocoder.api.here.com/6.2/reversegeocode.json',

            app_id: '<insert your app_id here>',

            app_code: '<insert your app_code here>',

            geocodingQueryParams: {},

            reverseQueryParams: {}

        },



        initialize: function(options) {

            L.setOptions(this, options);

        },



        geocode: function(query, cb, context) {

            var params = {

                searchtext: query,

                gen: 9,

                app_id: this.options.app_id,

                app_code: this.options.app_code,

                jsonattributes: 1

            };

            params = L.Util.extend(params, this.options.geocodingQueryParams);

            this.getJSON(this.options.geocodeUrl, params, cb, context);

        },



        reverse: function(location, scale, cb, context) {

            var params = {

                prox: encodeURIComponent(location.lat) + ',' + encodeURIComponent(location.lng),

                mode: 'retrieveAddresses',

                app_id: this.options.app_id,

                app_code: this.options.app_code,

                gen: 9,

                jsonattributes: 1

            };

            params = L.Util.extend(params, this.options.reverseQueryParams);

            this.getJSON(this.options.reverseGeocodeUrl, params, cb, context);

        },



        getJSON: function(url, params, cb, context) {

            Util.getJSON(url, params, function(data) {

                var results = [],

                    loc,

                    latLng,

                    latLngBounds;

                if (data.response.view && data.response.view.length) {

                    for (var i = 0; i <= data.response.view[0].result.length - 1; i++) {

                        loc = data.response.view[0].result[i].location;

                        latLng = L.latLng(loc.displayPosition.latitude, loc.displayPosition.longitude);

                        latLngBounds = L.latLngBounds(L.latLng(loc.mapView.topLeft.latitude, loc.mapView.topLeft.longitude), L.latLng(loc.mapView.bottomRight.latitude, loc.mapView.bottomRight.longitude));

                        results[i] = {

                            name: loc.address.label,

                            bbox: latLngBounds,

                            center: latLng

                        };

                    }

                }

                cb.call(context, results);

            })

        }

    }),



    factory: function(options) {

        return new L.Control.Geocoder.HERE(options);

    }

};


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-control-geocoder/src/geocoders/here.js","/node_modules/leaflet-control-geocoder/src/geocoders")

},{"../util":30,"_process":48,"buffer":13,"leaflet":44}],23:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var L = require('leaflet'),
	Util = require('../util');

module.exports = {
	class: L.Class.extend({
		options: {
			serviceUrl: 'https://api.tiles.mapbox.com/v4/geocode/mapbox.places-v1/'
		},

		initialize: function(accessToken, options) {
			L.setOptions(this, options);
			this._accessToken = accessToken;
		},

		geocode: function(query, cb, context) {
			Util.getJSON(this.options.serviceUrl + encodeURIComponent(query) + '.json', {
				access_token: this._accessToken,
			}, function(data) {
				var results = [],
				loc,
				latLng,
				latLngBounds;
				if (data.features && data.features.length) {
					for (var i = 0; i <= data.features.length - 1; i++) {
						loc = data.features[i];
						latLng = L.latLng(loc.center.reverse());
						if(loc.hasOwnProperty('bbox'))
						{
							latLngBounds = L.latLngBounds(L.latLng(loc.bbox.slice(0, 2).reverse()), L.latLng(loc.bbox.slice(2, 4).reverse()));
						}
						else
						{
							latLngBounds = L.latLngBounds(latLng, latLng);
						}
						results[i] = {
							name: loc.place_name,
							bbox: latLngBounds,
							center: latLng
						};
					}
				}

				cb.call(context, results);
			});
		},

		suggest: function(query, cb, context) {
			return this.geocode(query, cb, context);
		},

		reverse: function(location, scale, cb, context) {
			Util.getJSON(this.options.serviceUrl + encodeURIComponent(location.lng) + ',' + encodeURIComponent(location.lat) + '.json', {
				access_token: this._accessToken,
			}, function(data) {
				var results = [],
				loc,
				latLng,
				latLngBounds;
				if (data.features && data.features.length) {
					for (var i = 0; i <= data.features.length - 1; i++) {
						loc = data.features[i];
						latLng = L.latLng(loc.center.reverse());
						if(loc.hasOwnProperty('bbox'))
						{
							latLngBounds = L.latLngBounds(L.latLng(loc.bbox.slice(0, 2).reverse()), L.latLng(loc.bbox.slice(2, 4).reverse()));
						}
						else
						{
							latLngBounds = L.latLngBounds(latLng, latLng);
						}
						results[i] = {
							name: loc.place_name,
							bbox: latLngBounds,
							center: latLng
						};
					}
				}

				cb.call(context, results);
			});
		}
	}),

	factory: function(accessToken, options) {
		return new L.Control.Geocoder.Mapbox(accessToken, options);
	}
};


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-control-geocoder/src/geocoders/mapbox.js","/node_modules/leaflet-control-geocoder/src/geocoders")

},{"../util":30,"_process":48,"buffer":13,"leaflet":44}],24:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var L = require('leaflet'),
	Util = require('../util');

module.exports = {
	class: L.Class.extend({
		options: {
			serviceUrl: '//www.mapquestapi.com/geocoding/v1'
		},

		initialize: function(key, options) {
			// MapQuest seems to provide URI encoded API keys,
			// so to avoid encoding them twice, we decode them here
			this._key = decodeURIComponent(key);

			L.Util.setOptions(this, options);
		},

		_formatName: function() {
			var r = [],
				i;
			for (i = 0; i < arguments.length; i++) {
				if (arguments[i]) {
					r.push(arguments[i]);
				}
			}

			return r.join(', ');
		},

		geocode: function(query, cb, context) {
			Util.jsonp(this.options.serviceUrl + '/address', {
				key: this._key,
				location: query,
				limit: 5,
				outFormat: 'json'
			}, function(data) {
				var results = [],
					loc,
					latLng;
				if (data.results && data.results[0].locations) {
					for (var i = data.results[0].locations.length - 1; i >= 0; i--) {
						loc = data.results[0].locations[i];
						latLng = L.latLng(loc.latLng);
						results[i] = {
							name: this._formatName(loc.street, loc.adminArea4, loc.adminArea3, loc.adminArea1),
							bbox: L.latLngBounds(latLng, latLng),
							center: latLng
						};
					}
				}

				cb.call(context, results);
			}, this);
		},

		reverse: function(location, scale, cb, context) {
			Util.jsonp(this.options.serviceUrl + '/reverse', {
				key: this._key,
				location: location.lat + ',' + location.lng,
				outputFormat: 'json'
			}, function(data) {
				var results = [],
					loc,
					latLng;
				if (data.results && data.results[0].locations) {
					for (var i = data.results[0].locations.length - 1; i >= 0; i--) {
						loc = data.results[0].locations[i];
						latLng = L.latLng(loc.latLng);
						results[i] = {
							name: this._formatName(loc.street, loc.adminArea4, loc.adminArea3, loc.adminArea1),
							bbox: L.latLngBounds(latLng, latLng),
							center: latLng
						};
					}
				}

				cb.call(context, results);
			}, this);
		}
	}),

	factory: function(key, options) {
		return new L.Control.Geocoder.MapQuest(key, options);
	}
};

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-control-geocoder/src/geocoders/mapquest.js","/node_modules/leaflet-control-geocoder/src/geocoders")

},{"../util":30,"_process":48,"buffer":13,"leaflet":44}],25:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var L = require('leaflet'),
	Util = require('../util');

module.exports = {
	class: L.Class.extend({
		options: {
			serviceUrl: '//search.mapzen.com/v1',
			geocodingQueryParams: {},
			reverseQueryParams: {}
		},

		initialize: function(apiKey, options) {
			L.Util.setOptions(this, options);
			this._apiKey = apiKey;
			this._lastSuggest = 0;
		},

		geocode: function(query, cb, context) {
			var _this = this;
			Util.getJSON(this.options.serviceUrl + "/search", L.extend({
				'api_key': this._apiKey,
				'text': query
			}, this.options.geocodingQueryParams), function(data) {
				cb.call(context, _this._parseResults(data, "bbox"));
			});
		},

		suggest: function(query, cb, context) {
			var _this = this;
			Util.getJSON(this.options.serviceUrl + "/autocomplete", L.extend({
				'api_key': this._apiKey,
				'text': query
			}, this.options.geocodingQueryParams), L.bind(function(data) {
				if (data.geocoding.timestamp > this._lastSuggest) {
					this._lastSuggest = data.geocoding.timestamp;
					cb.call(context, _this._parseResults(data, "bbox"));
				}
			}, this));
		},

		reverse: function(location, scale, cb, context) {
			var _this = this;
			Util.getJSON(this.options.serviceUrl + "/reverse", L.extend({
				'api_key': this._apiKey,
				'point.lat': location.lat,
				'point.lon': location.lng
			}, this.options.reverseQueryParams), function(data) {
				cb.call(context, _this._parseResults(data, "bounds"));
			});
		},

		_parseResults: function(data, bboxname) {
			var results = [];
			L.geoJson(data, {
				pointToLayer: function (feature, latlng) {
					return L.circleMarker(latlng);
				},
				onEachFeature: function(feature, layer) {
					var result = {};
					result['name'] = layer.feature.properties.label;
					result[bboxname] = layer.getBounds();
					result['center'] = result[bboxname].getCenter();
					result['properties'] = layer.feature.properties;
					results.push(result);
				}
			});
			return results;
		}
	}),

	factory: function(apiKey, options) {
		return new L.Control.Geocoder.Mapzen(apiKey, options);
	}
};

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-control-geocoder/src/geocoders/mapzen.js","/node_modules/leaflet-control-geocoder/src/geocoders")

},{"../util":30,"_process":48,"buffer":13,"leaflet":44}],26:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var L = require('leaflet'),
	Util = require('../util');

module.exports = {
	class: L.Class.extend({
		options: {
			serviceUrl: '//nominatim.openstreetmap.org/',
			geocodingQueryParams: {},
			reverseQueryParams: {},
			htmlTemplate: function(r) {
				var a = r.address,
					parts = [];
				if (a.road || a.building) {
					parts.push('{building} {road} {house_number}');
				}

				if (a.city || a.town || a.village || a.hamlet) {
					parts.push('<span class="' + (parts.length > 0 ? 'leaflet-control-geocoder-address-detail' : '') +
						'">{postcode} {city} {town} {village} {hamlet}</span>');
				}

				if (a.state || a.country) {
					parts.push('<span class="' + (parts.length > 0 ? 'leaflet-control-geocoder-address-context' : '') +
						'">{state} {country}</span>');
				}

				return Util.template(parts.join('<br/>'), a, true);
			}
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);
		},

		geocode: function(query, cb, context) {
			Util.jsonp(this.options.serviceUrl + 'search', L.extend({
				q: query,
				limit: 5,
				format: 'json',
				addressdetails: 1
			}, this.options.geocodingQueryParams),
			function(data) {
				var results = [];
				for (var i = data.length - 1; i >= 0; i--) {
					var bbox = data[i].boundingbox;
					for (var j = 0; j < 4; j++) bbox[j] = parseFloat(bbox[j]);
					results[i] = {
						icon: data[i].icon,
						name: data[i].display_name,
						html: this.options.htmlTemplate ?
							this.options.htmlTemplate(data[i])
							: undefined,
						bbox: L.latLngBounds([bbox[0], bbox[2]], [bbox[1], bbox[3]]),
						center: L.latLng(data[i].lat, data[i].lon),
						properties: data[i]
					};
				}
				cb.call(context, results);
			}, this, 'json_callback');
		},

		reverse: function(location, scale, cb, context) {
			Util.jsonp(this.options.serviceUrl + 'reverse', L.extend({
				lat: location.lat,
				lon: location.lng,
				zoom: Math.round(Math.log(scale / 256) / Math.log(2)),
				addressdetails: 1,
				format: 'json'
			}, this.options.reverseQueryParams), function(data) {
				var result = [],
				    loc;

				if (data && data.lat && data.lon) {
					loc = L.latLng(data.lat, data.lon);
					result.push({
						name: data.display_name,
						html: this.options.htmlTemplate ?
							this.options.htmlTemplate(data)
							: undefined,
						center: loc,
						bounds: L.latLngBounds(loc, loc),
						properties: data
					});
				}

				cb.call(context, result);
			}, this, 'json_callback');
		}
	}),

	factory: function(options) {
		return new L.Control.Geocoder.Nominatim(options);
	}
};

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-control-geocoder/src/geocoders/nominatim.js","/node_modules/leaflet-control-geocoder/src/geocoders")

},{"../util":30,"_process":48,"buffer":13,"leaflet":44}],27:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var L = require('leaflet'),
	Util = require('../util');

module.exports = {
	class: L.Class.extend({
		options: {
			serviceUrl: '//photon.komoot.de/api/',
			reverseUrl: '//photon.komoot.de/reverse/',
			nameProperties: [
				'name',
				'street',
				'suburb',
				'hamlet',
				'town',
				'city',
				'state',
				'country'
			]
		},

		initialize: function(options) {
			L.setOptions(this, options);
		},

		geocode: function(query, cb, context) {
			var params = L.extend({
				q: query,
			}, this.options.geocodingQueryParams);

			Util.getJSON(this.options.serviceUrl, params, L.bind(function(data) {
				cb.call(context, this._decodeFeatures(data));
			}, this));
		},

		suggest: function(query, cb, context) {
			return this.geocode(query, cb, context);
		},

		reverse: function(latLng, scale, cb, context) {
			var params = L.extend({
				lat: latLng.lat,
				lon: latLng.lng
			}, this.options.geocodingQueryParams);

			Util.getJSON(this.options.reverseUrl, params, L.bind(function(data) {
				cb.call(context, this._decodeFeatures(data));
			}, this));
		},

		_decodeFeatures: function(data) {
			var results = [],
				i,
				f,
				c,
				latLng,
				extent,
				bbox;

			if (data && data.features) {
				for (i = 0; i < data.features.length; i++) {
					f = data.features[i];
					c = f.geometry.coordinates;
					latLng = L.latLng(c[1], c[0]);
					extent = f.properties.extent;

					if (extent) {
						bbox = L.latLngBounds([extent[1], extent[0]], [extent[3], extent[2]]);
					} else {
						bbox = L.latLngBounds(latLng, latLng);
					}

					results.push({
						name: this._deocodeFeatureName(f),
						center: latLng,
						bbox: bbox,
						properties: f.properties
					});
				}
			}

			return results;
		},

		_deocodeFeatureName: function(f) {
			var j,
				name;
			for (j = 0; !name && j < this.options.nameProperties.length; j++) {
				name = f.properties[this.options.nameProperties[j]];
			}

			return name;
		}
	}),

	factory: function(options) {
		return new L.Control.Geocoder.Photon(options);
	}
};


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-control-geocoder/src/geocoders/photon.js","/node_modules/leaflet-control-geocoder/src/geocoders")

},{"../util":30,"_process":48,"buffer":13,"leaflet":44}],28:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var L = require('leaflet'),
	Util = require('../util');

module.exports = {
	class: L.Class.extend({
		options: {
			serviceUrl: 'http://api.what3words.com/'
		},

		initialize: function(accessToken) {
			this._accessToken = accessToken;
		},

		geocode: function(query, cb, context) {
			//get three words and make a dot based string
			Util.getJSON(this.options.serviceUrl +'w3w', {
				key: this._accessToken,
				string: query.split(/\s+/).join('.'),
			}, function(data) {
				var results = [], loc, latLng, latLngBounds;
				if (data.position && data.position.length) {
					loc = data.words;
					latLng = L.latLng(data.position[0],data.position[1]);
					latLngBounds = L.latLngBounds(latLng, latLng);
					results[0] = {
						name: loc.join('.'),
						bbox: latLngBounds,
						center: latLng
					};
				}

				cb.call(context, results);
			});
		},

		suggest: function(query, cb, context) {
			return this.geocode(query, cb, context);
		},

		reverse: function(location, scale, cb, context) {
			Util.getJSON(this.options.serviceUrl +'position', {
				key: this._accessToken,
				position: [location.lat,location.lng].join(',')
			}, function(data) {
				var results = [],loc,latLng,latLngBounds;
				if (data.position && data.position.length) {
					loc = data.words;
					latLng = L.latLng(data.position[0],data.position[1]);
					latLngBounds = L.latLngBounds(latLng, latLng);
					results[0] = {
						name: loc.join('.'),
						bbox: latLngBounds,
						center: latLng
					};
				}
				cb.call(context, results);
			});
		}
	}),

	factory: function(accessToken) {
		return new L.Control.Geocoder.What3Words(accessToken);
	}
};

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-control-geocoder/src/geocoders/what3words.js","/node_modules/leaflet-control-geocoder/src/geocoders")

},{"../util":30,"_process":48,"buffer":13,"leaflet":44}],29:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var L = require('leaflet'),
	Control = require('./control'),
	Nominatim = require('./geocoders/nominatim'),
	Bing = require('./geocoders/bing'),
	MapQuest = require('./geocoders/mapquest'),
	Mapbox = require('./geocoders/mapbox'),
	What3Words = require('./geocoders/what3words'),
	Google = require('./geocoders/google'),
	Photon = require('./geocoders/photon'),
	Mapzen = require('./geocoders/mapzen'),
	ArcGis = require('./geocoders/arcgis'),
	HERE = require('./geocoders/here');

module.exports = L.Util.extend(Control.class, {
	Nominatim: Nominatim.class,
	nominatim: Nominatim.factory,
	Bing: Bing.class,
	bing: Bing.factory,
	MapQuest: MapQuest.class,
	mapQuest: MapQuest.factory,
	Mapbox: Mapbox.class,
	mapbox: Mapbox.factory,
	What3Words: What3Words.class,
	what3words: What3Words.factory,
	Google: Google.class,
	google: Google.factory,
	Photon: Photon.class,
	photon: Photon.factory,
	Mapzen: Mapzen.class,
	mapzen: Mapzen.factory,
	ArcGis: ArcGis.class,
	arcgis: ArcGis.factory,
	HERE: HERE.class,
	here: HERE.factory
});

L.Util.extend(L.Control, {
	Geocoder: module.exports,
	geocoder: Control.factory
});

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-control-geocoder/src/index.js","/node_modules/leaflet-control-geocoder/src")

},{"./control":18,"./geocoders/arcgis":19,"./geocoders/bing":20,"./geocoders/google":21,"./geocoders/here":22,"./geocoders/mapbox":23,"./geocoders/mapquest":24,"./geocoders/mapzen":25,"./geocoders/nominatim":26,"./geocoders/photon":27,"./geocoders/what3words":28,"_process":48,"buffer":13,"leaflet":44}],30:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var L = require('leaflet'),
	lastCallbackId = 0,
	htmlEscape = (function() {
		// Adapted from handlebars.js
		// https://github.com/wycats/handlebars.js/
		var badChars = /[&<>"'`]/g;
		var possible = /[&<>"'`]/;
		var escape = {
		  '&': '&amp;',
		  '<': '&lt;',
		  '>': '&gt;',
		  '"': '&quot;',
		  '\'': '&#x27;',
		  '`': '&#x60;'
		};

		function escapeChar(chr) {
		  return escape[chr];
		}

		return function(string) {
			if (string == null) {
				return '';
			} else if (!string) {
				return string + '';
			}

			// Force a string conversion as this will be done by the append regardless and
			// the regex test will do this transparently behind the scenes, causing issues if
			// an object's to string has escaped characters in it.
			string = '' + string;

			if (!possible.test(string)) {
				return string;
			}
			return string.replace(badChars, escapeChar);
		};
	})();

module.exports = {
	jsonp: function(url, params, callback, context, jsonpParam) {
		var callbackId = '_l_geocoder_' + (lastCallbackId++);
		params[jsonpParam || 'callback'] = callbackId;
		window[callbackId] = L.Util.bind(callback, context);
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = url + L.Util.getParamString(params);
		script.id = callbackId;
		document.getElementsByTagName('head')[0].appendChild(script);
	},

	getJSON: function(url, params, callback) {
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.onreadystatechange = function () {
			if (xmlHttp.readyState !== 4){
				return;
			}
			if (xmlHttp.status !== 200 && xmlHttp.status !== 304){
				callback('');
				return;
			}
			callback(JSON.parse(xmlHttp.response));
		};
		xmlHttp.open('GET', url + L.Util.getParamString(params), true);
		xmlHttp.setRequestHeader('Accept', 'application/json');
		xmlHttp.send(null);
	},

	template: function (str, data) {
		return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
			var value = data[key];
			if (value === undefined) {
				value = '';
			} else if (typeof value === 'function') {
				value = value(data);
			}
			return htmlEscape(value);
		});
	},

	htmlEscape: htmlEscape
};

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-control-geocoder/src/util.js","/node_modules/leaflet-control-geocoder/src")

},{"_process":48,"buffer":13,"leaflet":44}],31:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
(function() {
	'use strict';

	L.Routing = L.Routing || {};

	L.Routing.Autocomplete = L.Class.extend({
		options: {
			timeout: 500,
			blurTimeout: 100,
			noResultsMessage: 'No results found.'
		},

		initialize: function(elem, callback, context, options) {
			L.setOptions(this, options);

			this._elem = elem;
			this._resultFn = options.resultFn ? L.Util.bind(options.resultFn, options.resultContext) : null;
			this._autocomplete = options.autocompleteFn ? L.Util.bind(options.autocompleteFn, options.autocompleteContext) : null;
			this._selectFn = L.Util.bind(callback, context);
			this._container = L.DomUtil.create('div', 'leaflet-routing-geocoder-result');
			this._resultTable = L.DomUtil.create('table', '', this._container);

			// TODO: looks a bit like a kludge to register same for input and keypress -
			// browsers supporting both will get duplicate events; just registering
			// input will not catch enter, though.
			L.DomEvent.addListener(this._elem, 'input', this._keyPressed, this);
			L.DomEvent.addListener(this._elem, 'keypress', this._keyPressed, this);
			L.DomEvent.addListener(this._elem, 'keydown', this._keyDown, this);
			L.DomEvent.addListener(this._elem, 'blur', function() {
				if (this._isOpen) {
					this.close();
				}
			}, this);
		},

		close: function() {
			L.DomUtil.removeClass(this._container, 'leaflet-routing-geocoder-result-open');
			this._isOpen = false;
		},

		_open: function() {
			var rect = this._elem.getBoundingClientRect();
			if (!this._container.parentElement) {
				this._container.style.left = (rect.left + window.scrollX) + 'px';
				this._container.style.top = (rect.bottom + window.scrollY) + 'px';
				this._container.style.width = (rect.right - rect.left) + 'px';
				document.body.appendChild(this._container);
			}

			L.DomUtil.addClass(this._container, 'leaflet-routing-geocoder-result-open');
			this._isOpen = true;
		},

		_setResults: function(results) {
			var i,
			    tr,
			    td,
			    text;

			delete this._selection;
			this._results = results;

			while (this._resultTable.firstChild) {
				this._resultTable.removeChild(this._resultTable.firstChild);
			}

			for (i = 0; i < results.length; i++) {
				tr = L.DomUtil.create('tr', '', this._resultTable);
				tr.setAttribute('data-result-index', i);
				td = L.DomUtil.create('td', '', tr);
				text = document.createTextNode(results[i].name);
				td.appendChild(text);
				// mousedown + click because:
				// http://stackoverflow.com/questions/10652852/jquery-fire-click-before-blur-event
				L.DomEvent.addListener(td, 'mousedown', L.DomEvent.preventDefault);
				L.DomEvent.addListener(td, 'click', this._createClickListener(results[i]));
			}

			if (!i) {
				tr = L.DomUtil.create('tr', '', this._resultTable);
				td = L.DomUtil.create('td', 'leaflet-routing-geocoder-no-results', tr);
				td.innerHTML = this.options.noResultsMessage;
			}

			this._open();

			if (results.length > 0) {
				// Select the first entry
				this._select(1);
			}
		},

		_createClickListener: function(r) {
			var resultSelected = this._resultSelected(r);
			return L.bind(function() {
				this._elem.blur();
				resultSelected();
			}, this);
		},

		_resultSelected: function(r) {
			return L.bind(function() {
				this.close();
				this._elem.value = r.name;
				this._lastCompletedText = r.name;
				this._selectFn(r);
			}, this);
		},

		_keyPressed: function(e) {
			var index;

			if (this._isOpen && e.keyCode === 13 && this._selection) {
				index = parseInt(this._selection.getAttribute('data-result-index'), 10);
				this._resultSelected(this._results[index])();
				L.DomEvent.preventDefault(e);
				return;
			}

			if (e.keyCode === 13) {
				this._complete(this._resultFn, true);
				return;
			}

			if (this._autocomplete && document.activeElement === this._elem) {
				if (this._timer) {
					clearTimeout(this._timer);
				}
				this._timer = setTimeout(L.Util.bind(function() { this._complete(this._autocomplete); }, this),
					this.options.timeout);
				return;
			}

			this._unselect();
		},

		_select: function(dir) {
			var sel = this._selection;
			if (sel) {
				L.DomUtil.removeClass(sel.firstChild, 'leaflet-routing-geocoder-selected');
				sel = sel[dir > 0 ? 'nextSibling' : 'previousSibling'];
			}
			if (!sel) {
				sel = this._resultTable[dir > 0 ? 'firstChild' : 'lastChild'];
			}

			if (sel) {
				L.DomUtil.addClass(sel.firstChild, 'leaflet-routing-geocoder-selected');
				this._selection = sel;
			}
		},

		_unselect: function() {
			if (this._selection) {
				L.DomUtil.removeClass(this._selection.firstChild, 'leaflet-routing-geocoder-selected');
			}
			delete this._selection;
		},

		_keyDown: function(e) {
			if (this._isOpen) {
				switch (e.keyCode) {
				// Escape
				case 27:
					this.close();
					L.DomEvent.preventDefault(e);
					return;
				// Up
				case 38:
					this._select(-1);
					L.DomEvent.preventDefault(e);
					return;
				// Down
				case 40:
					this._select(1);
					L.DomEvent.preventDefault(e);
					return;
				}
			}
		},

		_complete: function(completeFn, trySelect) {
			var v = this._elem.value;
			function completeResults(results) {
				this._lastCompletedText = v;
				if (trySelect && results.length === 1) {
					this._resultSelected(results[0])();
				} else {
					this._setResults(results);
				}
			}

			if (!v) {
				return;
			}

			if (v !== this._lastCompletedText) {
				completeFn(v, completeResults, this);
			} else if (trySelect) {
				completeResults.call(this, this._results);
			}
		}
	});
})();

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-routing-machine/src/L.Routing.Autocomplete.js","/node_modules/leaflet-routing-machine/src")

},{"_process":48,"buffer":13}],32:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
(function() {
	'use strict';

	var L = require('leaflet');

	L.Routing = L.Routing || {};
	L.extend(L.Routing, require('./L.Routing.Itinerary'));
	L.extend(L.Routing, require('./L.Routing.Line'));
	L.extend(L.Routing, require('./L.Routing.Plan'));
	L.extend(L.Routing, require('./L.Routing.OSRMv1'));
	L.extend(L.Routing, require('./L.Routing.ErrorControl'));

	L.Routing.Control = L.Routing.Itinerary.extend({
		options: {
			fitSelectedRoutes: 'smart',
			routeLine: function(route, options) { return L.Routing.line(route, options); },
			autoRoute: true,
			routeWhileDragging: false,
			routeDragInterval: 500,
			waypointMode: 'connect',
			useZoomParameter: false,
			showAlternatives: false
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);

			this._router = this.options.router || new L.Routing.OSRMv1(options);
			this._plan = this.options.plan || L.Routing.plan(this.options.waypoints, options);
			this._requestCount = 0;

			L.Routing.Itinerary.prototype.initialize.call(this, options);

			this.on('routeselected', this._routeSelected, this);
			this._plan.on('waypointschanged', this._onWaypointsChanged, this);
			if (options.routeWhileDragging) {
				this._setupRouteDragging();
			}

			if (this.options.autoRoute) {
				this.route();
			}
		},

		onAdd: function(map) {
			var container = L.Routing.Itinerary.prototype.onAdd.call(this, map);

			this._map = map;
			this._map.addLayer(this._plan);

			if (this.options.useZoomParameter) {
				this._map.on('zoomend', function() {
					this.route({
						callback: L.bind(this._updateLineCallback, this)
					});
				}, this);
			}

			if (this._plan.options.geocoder) {
				container.insertBefore(this._plan.createGeocoders(), container.firstChild);
			}

			return container;
		},

		onRemove: function(map) {
			if (this._line) {
				map.removeLayer(this._line);
			}
			map.removeLayer(this._plan);
			return L.Routing.Itinerary.prototype.onRemove.call(this, map);
		},

		getWaypoints: function() {
			return this._plan.getWaypoints();
		},

		setWaypoints: function(waypoints) {
			this._plan.setWaypoints(waypoints);
			return this;
		},

		spliceWaypoints: function() {
			var removed = this._plan.spliceWaypoints.apply(this._plan, arguments);
			return removed;
		},

		getPlan: function() {
			return this._plan;
		},

		getRouter: function() {
			return this._router;
		},

		_routeSelected: function(e) {
			var route = e.route,
				alternatives = this.options.showAlternatives && e.alternatives,
				fitMode = this.options.fitSelectedRoutes,
				fitBounds =
					(fitMode === 'smart' && !this._waypointsVisible()) ||
					(fitMode !== 'smart' && fitMode);

			this._updateLines({route: route, alternatives: alternatives});

			if (fitBounds) {
				this._map.fitBounds(this._line.getBounds());
			}

			if (this.options.waypointMode === 'snap') {
				this._plan.off('waypointschanged', this._onWaypointsChanged, this);
				this.setWaypoints(route.waypoints);
				this._plan.on('waypointschanged', this._onWaypointsChanged, this);
			}
		},

		_waypointsVisible: function() {
			var wps = this.getWaypoints(),
				mapSize,
				bounds,
				boundsSize,
				i,
				p;

			try {
				mapSize = this._map.getSize();

				for (i = 0; i < wps.length; i++) {
					p = this._map.latLngToLayerPoint(wps[i].latLng);

					if (bounds) {
						bounds.extend(p);
					} else {
						bounds = L.bounds([p]);
					}
				}

				boundsSize = bounds.getSize();
				return (boundsSize.x > mapSize.x / 5 ||
					boundsSize.y > mapSize.y / 5) && this._waypointsInViewport();

			} catch (e) {
				return false;
			}
		},

		_waypointsInViewport: function() {
			var wps = this.getWaypoints(),
				mapBounds,
				i;

			try {
				mapBounds = this._map.getBounds();
			} catch (e) {
				return false;
			}

			for (i = 0; i < wps.length; i++) {
				if (mapBounds.contains(wps[i].latLng)) {
					return true;
				}
			}

			return false;
		},

		_updateLines: function(routes) {
			var addWaypoints = this.options.addWaypoints !== undefined ?
				this.options.addWaypoints : true;
			this._clearLines();

			// add alternatives first so they lie below the main route
			this._alternatives = [];
			if (routes.alternatives) routes.alternatives.forEach(function(alt, i) {
				this._alternatives[i] = this.options.routeLine(alt,
					L.extend({
						isAlternative: true
					}, this.options.altLineOptions || this.options.lineOptions));
				this._alternatives[i].addTo(this._map);
				this._hookAltEvents(this._alternatives[i]);
			}, this);

			this._line = this.options.routeLine(routes.route,
				L.extend({
					addWaypoints: addWaypoints,
					extendToWaypoints: this.options.waypointMode === 'connect'
				}, this.options.lineOptions));
			this._line.addTo(this._map);
			this._hookEvents(this._line);
		},

		_hookEvents: function(l) {
			l.on('linetouched', function(e) {
				this._plan.dragNewWaypoint(e);
			}, this);
		},

		_hookAltEvents: function(l) {
			l.on('linetouched', function(e) {
				var alts = this._routes.slice();
				var selected = alts.splice(e.target._route.routesIndex, 1)[0];
				this.fire('routeselected', {route: selected, alternatives: alts});
			}, this);
		},

		_onWaypointsChanged: function(e) {
			if (this.options.autoRoute) {
				this.route({});
			}
			if (!this._plan.isReady()) {
				this._clearLines();
				this._clearAlts();
			}
			this.fire('waypointschanged', {waypoints: e.waypoints});
		},

		_setupRouteDragging: function() {
			var timer = 0,
				waypoints;

			this._plan.on('waypointdrag', L.bind(function(e) {
				waypoints = e.waypoints;

				if (!timer) {
					timer = setTimeout(L.bind(function() {
						this.route({
							waypoints: waypoints,
							geometryOnly: true,
							callback: L.bind(this._updateLineCallback, this)
						});
						timer = undefined;
					}, this), this.options.routeDragInterval);
				}
			}, this));
			this._plan.on('waypointdragend', function() {
				if (timer) {
					clearTimeout(timer);
					timer = undefined;
				}
				this.route();
			}, this);
		},

		_updateLineCallback: function(err, routes) {
			if (!err) {
				this._updateLines({route: routes[0], alternatives: routes.slice(1) });
			} else {
				this._clearLines();
			}
		},

		route: function(options) {
			var ts = ++this._requestCount,
				wps;

			options = options || {};

			if (this._plan.isReady()) {
				if (this.options.useZoomParameter) {
					options.z = this._map && this._map.getZoom();
				}

				wps = options && options.waypoints || this._plan.getWaypoints();
				this.fire('routingstart', {waypoints: wps});
				this._router.route(wps, options.callback || function(err, routes) {
					// Prevent race among multiple requests,
					// by checking the current request's timestamp
					// against the last request's; ignore result if
					// this isn't the latest request.
					if (ts === this._requestCount) {
						this._clearLines();
						this._clearAlts();
						if (err) {
							this.fire('routingerror', {error: err});
							return;
						}

						routes.forEach(function(route, i) { route.routesIndex = i; });

						if (!options.geometryOnly) {
							this.fire('routesfound', {waypoints: wps, routes: routes});
							this.setAlternatives(routes);
						} else {
							var selectedRoute = routes.splice(0,1)[0];
							this._routeSelected({route: selectedRoute, alternatives: routes});
						}
					}
				}, this, options);
			}
		},

		_clearLines: function() {
			if (this._line) {
				this._map.removeLayer(this._line);
				delete this._line;
			}
			if (this._alternatives && this._alternatives.length) {
				for (var i in this._alternatives) {
					this._map.removeLayer(this._alternatives[i]);
				}
				this._alternatives = [];
			}
		}
	});

	L.Routing.control = function(options) {
		return new L.Routing.Control(options);
	};

	module.exports = L.Routing;
})();

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-routing-machine/src/L.Routing.Control.js","/node_modules/leaflet-routing-machine/src")

},{"./L.Routing.ErrorControl":33,"./L.Routing.Itinerary":36,"./L.Routing.Line":38,"./L.Routing.OSRMv1":40,"./L.Routing.Plan":41,"_process":48,"buffer":13,"leaflet":44}],33:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
(function() {
	'use strict';

	L.Routing = L.Routing || {};

	L.Routing.ErrorControl = L.Control.extend({
		options: {
			header: 'Routing error',
			formatMessage: function(error) {
				if (error.status < 0) {
					return 'Calculating the route caused an error. Technical description follows: <code><pre>' +
						error.message + '</pre></code';
				} else {
					return 'The route could not be calculated. ' +
						error.message;
				}
			}
		},

		initialize: function(routingControl, options) {
			L.Control.prototype.initialize.call(this, options);
			routingControl
				.on('routingerror', L.bind(function(e) {
					if (this._element) {
						this._element.children[1].innerHTML = this.options.formatMessage(e.error);
						this._element.style.visibility = 'visible';
					}
				}, this))
				.on('routingstart', L.bind(function() {
					if (this._element) {
						this._element.style.visibility = 'hidden';
					}
				}, this));
		},

		onAdd: function() {
			var header,
				message;

			this._element = L.DomUtil.create('div', 'leaflet-bar leaflet-routing-error');
			this._element.style.visibility = 'hidden';

			header = L.DomUtil.create('h3', null, this._element);
			message = L.DomUtil.create('span', null, this._element);

			header.innerHTML = this.options.header;

			return this._element;
		},

		onRemove: function() {
			delete this._element;
		}
	});

	L.Routing.errorControl = function(routingControl, options) {
		return new L.Routing.ErrorControl(routingControl, options);
	};
})();

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-routing-machine/src/L.Routing.ErrorControl.js","/node_modules/leaflet-routing-machine/src")

},{"_process":48,"buffer":13}],34:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
(function() {
	'use strict';

	var L = require('leaflet');

	L.Routing = L.Routing || {};

	L.extend(L.Routing, require('./L.Routing.Localization'));

	L.Routing.Formatter = L.Class.extend({
		options: {
			units: 'metric',
			unitNames: {
				meters: 'm',
				kilometers: 'km',
				yards: 'yd',
				miles: 'mi',
				hours: 'h',
				minutes: 'mín',
				seconds: 's'
			},
			language: 'en',
			roundingSensitivity: 1,
			distanceTemplate: '{value} {unit}'
		},

		initialize: function(options) {
			L.setOptions(this, options);
		},

		formatDistance: function(d /* Number (meters) */, sensitivity) {
			var un = this.options.unitNames,
				simpleRounding = sensitivity <= 0,
				round = simpleRounding ? function(v) { return v; } : L.bind(this._round, this),
			    v,
			    yards,
				data,
				pow10;

			if (this.options.units === 'imperial') {
				yards = d / 0.9144;
				if (yards >= 1000) {
					data = {
						value: round(d / 1609.344, sensitivity),
						unit: un.miles
					};
				} else {
					data = {
						value: round(yards, sensitivity),
						unit: un.yards
					};
				}
			} else {
				v = round(d, sensitivity);
				data = {
					value: v >= 1000 ? (v / 1000) : v,
					unit: v >= 1000 ? un.kilometers : un.meters
				};
			}

			if (simpleRounding) {
				pow10 = Math.pow(10, -sensitivity);
				data.value = Math.round(data.value * pow10) / pow10;
			}

			return L.Util.template(this.options.distanceTemplate, data);
		},

		_round: function(d, sensitivity) {
			var s = sensitivity || this.options.roundingSensitivity,
				pow10 = Math.pow(10, (Math.floor(d / s) + '').length - 1),
				r = Math.floor(d / pow10),
				p = (r > 5) ? pow10 : pow10 / 2;

			return Math.round(d / p) * p;
		},

		formatTime: function(t /* Number (seconds) */) {
			if (t > 86400) {
				return Math.round(t / 3600) + ' h';
			} else if (t > 3600) {
				return Math.floor(t / 3600) + ' h ' +
					Math.round((t % 3600) / 60) + ' min';
			} else if (t > 300) {
				return Math.round(t / 60) + ' min';
			} else if (t > 60) {
				return Math.floor(t / 60) + ' min' +
					(t % 60 !== 0 ? ' ' + (t % 60) + ' s' : '');
			} else {
				return t + ' s';
			}
		},

		formatInstruction: function(instr, i) {
			if (instr.text === undefined) {
				return L.Util.template(this._getInstructionTemplate(instr, i),
					L.extend({
						exitStr: instr.exit ? L.Routing.Localization[this.options.language].formatOrder(instr.exit) : '',
						dir: L.Routing.Localization[this.options.language].directions[instr.direction]
					},
					instr));
			} else {
				return instr.text;
			}
		},

		getIconName: function(instr, i) {
			switch (instr.type) {
			case 'Straight':
				return (i === 0 ? 'depart' : 'continue');
			case 'SlightRight':
				return 'bear-right';
			case 'Right':
				return 'turn-right';
			case 'SharpRight':
				return 'sharp-right';
			case 'TurnAround':
				return 'u-turn';
			case 'SharpLeft':
				return 'sharp-left';
			case 'Left':
				return 'turn-left';
			case 'SlightLeft':
				return 'bear-left';
			case 'WaypointReached':
				return 'via';
			case 'Roundabout':
				return 'enter-roundabout';
			case 'DestinationReached':
				return 'arrive';
			}
		},

		_getInstructionTemplate: function(instr, i) {
			var type = instr.type === 'Straight' ? (i === 0 ? 'Head' : 'Continue') : instr.type,
				strings = L.Routing.Localization[this.options.language].instructions[type];

			return strings[0] + (strings.length > 1 && instr.road ? strings[1] : '');
		}
	});

	module.exports = L.Routing;
})();


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-routing-machine/src/L.Routing.Formatter.js","/node_modules/leaflet-routing-machine/src")

},{"./L.Routing.Localization":39,"_process":48,"buffer":13,"leaflet":44}],35:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
(function() {
	'use strict';

	var L = require('leaflet');
	L.Routing = L.Routing || {};
	L.extend(L.Routing, require('./L.Routing.Autocomplete'));

	function selectInputText(input) {
		if (input.setSelectionRange) {
			// On iOS, select() doesn't work
			input.setSelectionRange(0, 9999);
		} else {
			// On at least IE8, setSeleectionRange doesn't exist
			input.select();
		}
	}

	L.Routing.GeocoderElement = L.Class.extend({
		includes: L.Mixin.Events,

		options: {
			createGeocoder: function(i, nWps, options) {
				var container = L.DomUtil.create('div', 'leaflet-routing-geocoder'),
					input = L.DomUtil.create('input', '', container),
					remove = options.addWaypoints ? L.DomUtil.create('span', 'leaflet-routing-remove-waypoint', container) : undefined;

				input.disabled = !options.addWaypoints;

				return {
					container: container,
					input: input,
					closeButton: remove
				};
			},
			geocoderPlaceholder: function(i, numberWaypoints, plan) {
				var l = L.Routing.Localization[plan.options.language].ui;
				return i === 0 ?
					l.startPlaceholder :
					(i < numberWaypoints - 1 ?
						L.Util.template(l.viaPlaceholder, {viaNumber: i}) :
						l.endPlaceholder);
			},

			geocoderClass: function() {
				return '';
			},

			waypointNameFallback: function(latLng) {
				var ns = latLng.lat < 0 ? 'S' : 'N',
					ew = latLng.lng < 0 ? 'W' : 'E',
					lat = (Math.round(Math.abs(latLng.lat) * 10000) / 10000).toString(),
					lng = (Math.round(Math.abs(latLng.lng) * 10000) / 10000).toString();
				return ns + lat + ', ' + ew + lng;
			},
			maxGeocoderTolerance: 200,
			autocompleteOptions: {},
			language: 'en',
		},

		initialize: function(wp, i, nWps, options) {
			L.setOptions(this, options);

			var g = this.options.createGeocoder(i, nWps, this.options),
				closeButton = g.closeButton,
				geocoderInput = g.input;
			geocoderInput.setAttribute('placeholder', this.options.geocoderPlaceholder(i, nWps, this));
			geocoderInput.className = this.options.geocoderClass(i, nWps);

			this._element = g;
			this._waypoint = wp;

			this.update();
			// This has to be here, or geocoder's value will not be properly
			// initialized.
			// TODO: look into why and make _updateWaypointName fix this.
			geocoderInput.value = wp.name;

			L.DomEvent.addListener(geocoderInput, 'click', function() {
				selectInputText(this);
			}, geocoderInput);

			if (closeButton) {
				L.DomEvent.addListener(closeButton, 'click', function() {
					this.fire('delete', { waypoint: this._waypoint });
				}, this);
			}

			new L.Routing.Autocomplete(geocoderInput, function(r) {
					geocoderInput.value = r.name;
					wp.name = r.name;
					wp.latLng = r.center;
					this.fire('geocoded', { waypoint: wp, value: r });
				}, this, L.extend({
					resultFn: this.options.geocoder.geocode,
					resultContext: this.options.geocoder,
					autocompleteFn: this.options.geocoder.suggest,
					autocompleteContext: this.options.geocoder
				}, this.options.autocompleteOptions));
		},

		getContainer: function() {
			return this._element.container;
		},

		setValue: function(v) {
			this._element.input.value = v;
		},

		update: function(force) {
			var wp = this._waypoint,
				wpCoords;

			wp.name = wp.name || '';

			if (wp.latLng && (force || !wp.name)) {
				wpCoords = this.options.waypointNameFallback(wp.latLng);
				if (this.options.geocoder && this.options.geocoder.reverse) {
					this.options.geocoder.reverse(wp.latLng, 67108864 /* zoom 18 */, function(rs) {
						if (rs.length > 0 && rs[0].center.distanceTo(wp.latLng) < this.options.maxGeocoderTolerance) {
							wp.name = rs[0].name;
						} else {
							wp.name = wpCoords;
						}
						this._update();
					}, this);
				} else {
					wp.name = wpCoords;
					this._update();
				}
			}
		},

		focus: function() {
			var input = this._element.input;
			input.focus();
			selectInputText(input);
		},

		_update: function() {
			var wp = this._waypoint,
			    value = wp && wp.name ? wp.name : '';
			this.setValue(value);
			this.fire('reversegeocoded', {waypoint: wp, value: value});
		}
	});

	L.Routing.geocoderElement = function(wp, i, nWps, plan) {
		return new L.Routing.GeocoderElement(wp, i, nWps, plan);
	};

	module.exports = L.Routing;
})();

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-routing-machine/src/L.Routing.GeocoderElement.js","/node_modules/leaflet-routing-machine/src")

},{"./L.Routing.Autocomplete":31,"_process":48,"buffer":13,"leaflet":44}],36:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
(function() {
	'use strict';

	var L = require('leaflet');

	L.Routing = L.Routing || {};
	L.extend(L.Routing, require('./L.Routing.Formatter'));
	L.extend(L.Routing, require('./L.Routing.ItineraryBuilder'));

	L.Routing.Itinerary = L.Control.extend({
		includes: L.Mixin.Events,

		options: {
			pointMarkerStyle: {
				radius: 5,
				color: '#03f',
				fillColor: 'white',
				opacity: 1,
				fillOpacity: 0.7
			},
			summaryTemplate: '<h2>{name}</h2><h3>{distance}, {time}</h3>',
			timeTemplate: '{time}',
			containerClassName: '',
			alternativeClassName: '',
			minimizedClassName: '',
			itineraryClassName: '',
			totalDistanceRoundingSensitivity: -1,
			show: true,
			collapsible: undefined,
			collapseBtn: function(itinerary) {
				var collapseBtn = L.DomUtil.create('span', itinerary.options.collapseBtnClass);
				L.DomEvent.on(collapseBtn, 'click', itinerary._toggle, itinerary);
				itinerary._container.insertBefore(collapseBtn, itinerary._container.firstChild);
			},
			collapseBtnClass: 'leaflet-routing-collapse-btn'
		},

		initialize: function(options) {
			L.setOptions(this, options);
			this._formatter = this.options.formatter || new L.Routing.Formatter(this.options);
			this._itineraryBuilder = this.options.itineraryBuilder || new L.Routing.ItineraryBuilder({
				containerClassName: this.options.itineraryClassName
			});
		},

		onAdd: function(map) {
			var collapsible = this.options.collapsible;

			collapsible = collapsible || (collapsible === undefined && map.getSize().x <= 640);

			this._container = L.DomUtil.create('div', 'leaflet-routing-container leaflet-bar ' +
				(!this.options.show ? 'leaflet-routing-container-hide ' : '') +
				(collapsible ? 'leaflet-routing-collapsible ' : '') +
				this.options.containerClassName);
			this._altContainer = this.createAlternativesContainer();
			this._container.appendChild(this._altContainer);
			L.DomEvent.disableClickPropagation(this._container);
			L.DomEvent.addListener(this._container, 'mousewheel', function(e) {
				L.DomEvent.stopPropagation(e);
			});

			if (collapsible) {
				this.options.collapseBtn(this);
			}

			return this._container;
		},

		onRemove: function() {
		},

		createAlternativesContainer: function() {
			return L.DomUtil.create('div', 'leaflet-routing-alternatives-container');
		},

		setAlternatives: function(routes) {
			var i,
			    alt,
			    altDiv;

			this._clearAlts();

			this._routes = routes;

			for (i = 0; i < this._routes.length; i++) {
				alt = this._routes[i];
				altDiv = this._createAlternative(alt, i);
				this._altContainer.appendChild(altDiv);
				this._altElements.push(altDiv);
			}

			this._selectRoute({route: this._routes[0], alternatives: this._routes.slice(1)});

			return this;
		},

		show: function() {
			L.DomUtil.removeClass(this._container, 'leaflet-routing-container-hide');
		},

		hide: function() {
			L.DomUtil.addClass(this._container, 'leaflet-routing-container-hide');
		},

		_toggle: function() {
			var collapsed = L.DomUtil.hasClass(this._container, 'leaflet-routing-container-hide');
			this[collapsed ? 'show' : 'hide']();
		},

		_createAlternative: function(alt, i) {
			var altDiv = L.DomUtil.create('div', 'leaflet-routing-alt ' +
				this.options.alternativeClassName +
				(i > 0 ? ' leaflet-routing-alt-minimized ' + this.options.minimizedClassName : '')),
				template = this.options.summaryTemplate,
				data = L.extend({
					name: alt.name,
					distance: this._formatter.formatDistance(alt.summary.totalDistance, this.options.totalDistanceRoundingSensitivity),
					time: this._formatter.formatTime(alt.summary.totalTime)
				}, alt);
			altDiv.innerHTML = typeof(template) === 'function' ? template(data) : L.Util.template(template, data);
			L.DomEvent.addListener(altDiv, 'click', this._onAltClicked, this);
			this.on('routeselected', this._selectAlt, this);

			altDiv.appendChild(this._createItineraryContainer(alt));
			return altDiv;
		},

		_clearAlts: function() {
			var el = this._altContainer;
			while (el && el.firstChild) {
				el.removeChild(el.firstChild);
			}

			this._altElements = [];
		},

		_createItineraryContainer: function(r) {
			var container = this._itineraryBuilder.createContainer(),
			    steps = this._itineraryBuilder.createStepsContainer(),
			    i,
			    instr,
			    step,
			    distance,
			    text,
			    icon;

			container.appendChild(steps);

			for (i = 0; i < r.instructions.length; i++) {
				instr = r.instructions[i];
				text = this._formatter.formatInstruction(instr, i);
				distance = this._formatter.formatDistance(instr.distance);
				icon = this._formatter.getIconName(instr, i);
				step = this._itineraryBuilder.createStep(text, distance, icon, steps);

				this._addRowListeners(step, r.coordinates[instr.index]);
			}

			return container;
		},

		_addRowListeners: function(row, coordinate) {
			L.DomEvent.addListener(row, 'mouseover', function() {
				this._marker = L.circleMarker(coordinate,
					this.options.pointMarkerStyle).addTo(this._map);
			}, this);
			L.DomEvent.addListener(row, 'mouseout', function() {
				if (this._marker) {
					this._map.removeLayer(this._marker);
					delete this._marker;
				}
			}, this);
			L.DomEvent.addListener(row, 'click', function(e) {
				this._map.panTo(coordinate);
				L.DomEvent.stopPropagation(e);
			}, this);
		},

		_onAltClicked: function(e) {
			var altElem = e.target || window.event.srcElement;
			while (!L.DomUtil.hasClass(altElem, 'leaflet-routing-alt')) {
				altElem = altElem.parentElement;
			}

			var j = this._altElements.indexOf(altElem);
			var alts = this._routes.slice();
			var route = alts.splice(j, 1)[0];

			this.fire('routeselected', {
				route: route,
				alternatives: alts
			});
		},

		_selectAlt: function(e) {
			var altElem,
			    j,
			    n,
			    classFn;

			altElem = this._altElements[e.route.routesIndex];

			if (L.DomUtil.hasClass(altElem, 'leaflet-routing-alt-minimized')) {
				for (j = 0; j < this._altElements.length; j++) {
					n = this._altElements[j];
					classFn = j === e.route.routesIndex ? 'removeClass' : 'addClass';
					L.DomUtil[classFn](n, 'leaflet-routing-alt-minimized');
					if (this.options.minimizedClassName) {
						L.DomUtil[classFn](n, this.options.minimizedClassName);
					}

					if (j !== e.route.routesIndex) n.scrollTop = 0;
				}
			}

			L.DomEvent.stop(e);
		},

		_selectRoute: function(routes) {
			if (this._marker) {
				this._map.removeLayer(this._marker);
				delete this._marker;
			}
			this.fire('routeselected', routes);
		}
	});

	L.Routing.itinerary = function(options) {
		return new L.Routing.Itinerary(options);
	};

	module.exports = L.Routing;
})();

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-routing-machine/src/L.Routing.Itinerary.js","/node_modules/leaflet-routing-machine/src")

},{"./L.Routing.Formatter":34,"./L.Routing.ItineraryBuilder":37,"_process":48,"buffer":13,"leaflet":44}],37:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
(function() {
	'use strict';

	var L = require('leaflet');
	L.Routing = L.Routing || {};

	L.Routing.ItineraryBuilder = L.Class.extend({
		options: {
			containerClassName: ''
		},

		initialize: function(options) {
			L.setOptions(this, options);
		},

		createContainer: function(className) {
			var table = L.DomUtil.create('table', className || ''),
				colgroup = L.DomUtil.create('colgroup', '', table);

			L.DomUtil.create('col', 'leaflet-routing-instruction-icon', colgroup);
			L.DomUtil.create('col', 'leaflet-routing-instruction-text', colgroup);
			L.DomUtil.create('col', 'leaflet-routing-instruction-distance', colgroup);

			return table;
		},

		createStepsContainer: function() {
			return L.DomUtil.create('tbody', '');
		},

		createStep: function(text, distance, icon, steps) {
			var row = L.DomUtil.create('tr', '', steps),
				span,
				td;
			td = L.DomUtil.create('td', '', row);
			span = L.DomUtil.create('span', 'leaflet-routing-icon leaflet-routing-icon-'+icon, td);
			td.appendChild(span);
			td = L.DomUtil.create('td', '', row);
			td.appendChild(document.createTextNode(text));
			td = L.DomUtil.create('td', '', row);
			td.appendChild(document.createTextNode(distance));
			return row;
		}
	});

	module.exports = L.Routing;
})();

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-routing-machine/src/L.Routing.ItineraryBuilder.js","/node_modules/leaflet-routing-machine/src")

},{"_process":48,"buffer":13,"leaflet":44}],38:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
(function() {
	'use strict';

	var L = require('leaflet');

	L.Routing = L.Routing || {};

	L.Routing.Line = L.LayerGroup.extend({
		includes: L.Mixin.Events,

		options: {
			styles: [
				{color: 'black', opacity: 0.15, weight: 9},
				{color: 'white', opacity: 0.8, weight: 6},
				{color: 'red', opacity: 1, weight: 2}
			],
			missingRouteStyles: [
				{color: 'black', opacity: 0.15, weight: 7},
				{color: 'white', opacity: 0.6, weight: 4},
				{color: 'gray', opacity: 0.8, weight: 2, dashArray: '7,12'}
			],
			addWaypoints: true,
			extendToWaypoints: true,
			missingRouteTolerance: 10
		},

		initialize: function(route, options) {
			L.setOptions(this, options);
			L.LayerGroup.prototype.initialize.call(this, options);
			this._route = route;

			if (this.options.extendToWaypoints) {
				this._extendToWaypoints();
			}

			this._addSegment(
				route.coordinates,
				this.options.styles,
				this.options.addWaypoints);
		},

		addTo: function(map) {
			map.addLayer(this);
			return this;
		},
		getBounds: function() {
			return L.latLngBounds(this._route.coordinates);
		},

		_findWaypointIndices: function() {
			var wps = this._route.inputWaypoints,
			    indices = [],
			    i;
			for (i = 0; i < wps.length; i++) {
				indices.push(this._findClosestRoutePoint(wps[i].latLng));
			}

			return indices;
		},

		_findClosestRoutePoint: function(latlng) {
			var minDist = Number.MAX_VALUE,
				minIndex,
			    i,
			    d;

			for (i = this._route.coordinates.length - 1; i >= 0 ; i--) {
				// TODO: maybe do this in pixel space instead?
				d = latlng.distanceTo(this._route.coordinates[i]);
				if (d < minDist) {
					minIndex = i;
					minDist = d;
				}
			}

			return minIndex;
		},

		_extendToWaypoints: function() {
			var wps = this._route.inputWaypoints,
				wpIndices = this._getWaypointIndices(),
			    i,
			    wpLatLng,
			    routeCoord;

			for (i = 0; i < wps.length; i++) {
				wpLatLng = wps[i].latLng;
				routeCoord = L.latLng(this._route.coordinates[wpIndices[i]]);
				if (wpLatLng.distanceTo(routeCoord) >
					this.options.missingRouteTolerance) {
					this._addSegment([wpLatLng, routeCoord],
						this.options.missingRouteStyles);
				}
			}
		},

		_addSegment: function(coords, styles, mouselistener) {
			var i,
				pl;

			for (i = 0; i < styles.length; i++) {
				pl = L.polyline(coords, styles[i]);
				this.addLayer(pl);
				if (mouselistener) {
					pl.on('mousedown', this._onLineTouched, this);
				}
			}
		},

		_findNearestWpBefore: function(i) {
			var wpIndices = this._getWaypointIndices(),
				j = wpIndices.length - 1;
			while (j >= 0 && wpIndices[j] > i) {
				j--;
			}

			return j;
		},

		_onLineTouched: function(e) {
			var afterIndex = this._findNearestWpBefore(this._findClosestRoutePoint(e.latlng));
			this.fire('linetouched', {
				afterIndex: afterIndex,
				latlng: e.latlng
			});
		},

		_getWaypointIndices: function() {
			if (!this._wpIndices) {
				this._wpIndices = this._route.waypointIndices || this._findWaypointIndices();
			}

			return this._wpIndices;
		}
	});

	L.Routing.line = function(route, options) {
		return new L.Routing.Line(route, options);
	};

	module.exports = L.Routing;
})();

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-routing-machine/src/L.Routing.Line.js","/node_modules/leaflet-routing-machine/src")

},{"_process":48,"buffer":13,"leaflet":44}],39:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
(function() {
	'use strict';
	L.Routing = L.Routing || {};

	L.Routing.Localization = {
		'en': {
			directions: {
				N: 'north',
				NE: 'northeast',
				E: 'east',
				SE: 'southeast',
				S: 'south',
				SW: 'southwest',
				W: 'west',
				NW: 'northwest'
			},
			instructions: {
				// instruction, postfix if the road is named
				'Head':
					['Head {dir}', ' on {road}'],
				'Continue':
					['Continue {dir}', ' on {road}'],
				'SlightRight':
					['Slight right', ' onto {road}'],
				'Right':
					['Right', ' onto {road}'],
				'SharpRight':
					['Sharp right', ' onto {road}'],
				'TurnAround':
					['Turn around'],
				'SharpLeft':
					['Sharp left', ' onto {road}'],
				'Left':
					['Left', ' onto {road}'],
				'SlightLeft':
					['Slight left', ' onto {road}'],
				'WaypointReached':
					['Waypoint reached'],
				'Roundabout':
					['Take the {exitStr} exit in the roundabout', ' onto {road}'],
				'DestinationReached':
					['Destination reached'],
			},
			formatOrder: function(n) {
				var i = n % 10 - 1,
				suffix = ['st', 'nd', 'rd'];

				return suffix[i] ? n + suffix[i] : n + 'th';
			},
			ui: {
				startPlaceholder: 'Start',
				viaPlaceholder: 'Via {viaNumber}',
				endPlaceholder: 'End'
			}
		},

		'de': {
			directions: {
				N: 'Norden',
				NE: 'Nordosten',
				E: 'Osten',
				SE: 'Südosten',
				S: 'Süden',
				SW: 'Südwesten',
				W: 'Westen',
				NW: 'Nordwesten'
			},
			instructions: {
				// instruction, postfix if the road is named
				'Head':
					['Richtung {dir}', ' auf {road}'],
				'Continue':
					['Geradeaus Richtung {dir}', ' auf {road}'],
				'SlightRight':
					['Leicht rechts abbiegen', ' auf {road}'],
				'Right':
					['Rechts abbiegen', ' auf {road}'],
				'SharpRight':
					['Scharf rechts abbiegen', ' auf {road}'],
				'TurnAround':
					['Wenden'],
				'SharpLeft':
					['Scharf links abbiegen', ' auf {road}'],
				'Left':
					['Links abbiegen', ' auf {road}'],
				'SlightLeft':
					['Leicht links abbiegen', ' auf {road}'],
				'WaypointReached':
					['Zwischenhalt erreicht'],
				'Roundabout':
					['Nehmen Sie die {exitStr} Ausfahrt im Kreisverkehr', ' auf {road}'],
				'DestinationReached':
					['Sie haben ihr Ziel erreicht'],
			},
			formatOrder: function(n) {
				return n + '.';
			},
			ui: {
				startPlaceholder: 'Start',
				viaPlaceholder: 'Via {viaNumber}',
				endPlaceholder: 'Ziel'
			}
		},

		'sv': {
			directions: {
				N: 'norr',
				NE: 'nordost',
				E: 'öst',
				SE: 'sydost',
				S: 'syd',
				SW: 'sydväst',
				W: 'väst',
				NW: 'nordväst'
			},
			instructions: {
				// instruction, postfix if the road is named
				'Head':
					['Åk åt {dir}', ' på {road}'],
				'Continue':
					['Fortsätt {dir}', ' på {road}'],
				'SlightRight':
					['Svagt höger', ' på {road}'],
				'Right':
					['Sväng höger', ' på {road}'],
				'SharpRight':
					['Skarpt höger', ' på {road}'],
				'TurnAround':
					['Vänd'],
				'SharpLeft':
					['Skarpt vänster', ' på {road}'],
				'Left':
					['Sväng vänster', ' på {road}'],
				'SlightLeft':
					['Svagt vänster', ' på {road}'],
				'WaypointReached':
					['Viapunkt nådd'],
				'Roundabout':
					['Tag {exitStr} avfarten i rondellen', ' till {road}'],
				'DestinationReached':
					['Framme vid resans mål'],
			},
			formatOrder: function(n) {
				return ['första', 'andra', 'tredje', 'fjärde', 'femte',
					'sjätte', 'sjunde', 'åttonde', 'nionde', 'tionde'
					/* Can't possibly be more than ten exits, can there? */][n - 1];
			},
			ui: {
				startPlaceholder: 'Från',
				viaPlaceholder: 'Via {viaNumber}',
				endPlaceholder: 'Till'
			}
		},

		'sp': {
			directions: {
				N: 'norte',
				NE: 'noreste',
				E: 'este',
				SE: 'sureste',
				S: 'sur',
				SW: 'suroeste',
				W: 'oeste',
				NW: 'noroeste'
			},
			instructions: {
				// instruction, postfix if the road is named
				'Head':
					['Derecho {dir}', ' sobre {road}'],
				'Continue':
					['Continuar {dir}', ' en {road}'],
				'SlightRight':
					['Leve giro a la derecha', ' sobre {road}'],
				'Right':
					['Derecha', ' sobre {road}'],
				'SharpRight':
					['Giro pronunciado a la derecha', ' sobre {road}'],
				'TurnAround':
					['Dar vuelta'],
				'SharpLeft':
					['Giro pronunciado a la izquierda', ' sobre {road}'],
				'Left':
					['Izquierda', ' en {road}'],
				'SlightLeft':
					['Leve giro a la izquierda', ' en {road}'],
				'WaypointReached':
					['Llegó a un punto del camino'],
				'Roundabout':
					['Tomar {exitStr} salida en la rotonda', ' en {road}'],
				'DestinationReached':
					['Llegada a destino'],
			},
			formatOrder: function(n) {
				return n + 'º';
			},
			ui: {
				startPlaceholder: 'Inicio',
				viaPlaceholder: 'Via {viaNumber}',
				endPlaceholder: 'Destino'
			}
		},
		'nl': {
			directions: {
				N: 'noordelijke',
				NE: 'noordoostelijke',
				E: 'oostelijke',
				SE: 'zuidoostelijke',
				S: 'zuidelijke',
				SW: 'zuidewestelijke',
				W: 'westelijke',
				NW: 'noordwestelijke'
			},
			instructions: {
				// instruction, postfix if the road is named
				'Head':
					['Vertrek in {dir} richting', ' de {road} op'],
				'Continue':
					['Ga in {dir} richting', ' de {road} op'],
				'SlightRight':
					['Volg de weg naar rechts', ' de {road} op'],
				'Right':
					['Ga rechtsaf', ' de {road} op'],
				'SharpRight':
					['Ga scherpe bocht naar rechts', ' de {road} op'],
				'TurnAround':
					['Keer om'],
				'SharpLeft':
					['Ga scherpe bocht naar links', ' de {road} op'],
				'Left':
					['Ga linksaf', ' de {road} op'],
				'SlightLeft':
					['Volg de weg naar links', ' de {road} op'],
				'WaypointReached':
					['Aangekomen bij tussenpunt'],
				'Roundabout':
					['Neem de {exitStr} afslag op de rotonde', ' de {road} op'],
				'DestinationReached':
					['Aangekomen op eindpunt'],
			},
			formatOrder: function(n) {
				if (n === 1 || n >= 20) {
					return n + 'ste';
				} else {
					return n + 'de';
				}
			},
			ui: {
				startPlaceholder: 'Vertrekpunt',
				viaPlaceholder: 'Via {viaNumber}',
				endPlaceholder: 'Bestemming'
			}
		},
		'fr': {
			directions: {
				N: 'nord',
				NE: 'nord-est',
				E: 'est',
				SE: 'sud-est',
				S: 'sud',
				SW: 'sud-ouest',
				W: 'ouest',
				NW: 'nord-ouest'
			},
			instructions: {
				// instruction, postfix if the road is named
				'Head':
					['Tout droit au {dir}', ' sur {road}'],
				'Continue':
					['Continuer au {dir}', ' sur {road}'],
				'SlightRight':
					['Légèrement à droite', ' sur {road}'],
				'Right':
					['A droite', ' sur {road}'],
				'SharpRight':
					['Complètement à droite', ' sur {road}'],
				'TurnAround':
					['Faire demi-tour'],
				'SharpLeft':
					['Complètement à gauche', ' sur {road}'],
				'Left':
					['A gauche', ' sur {road}'],
				'SlightLeft':
					['Légèrement à gauche', ' sur {road}'],
				'WaypointReached':
					['Point d\'étape atteint'],
				'Roundabout':
					['Au rond-point, prenez la {exitStr} sortie', ' sur {road}'],
				'DestinationReached':
					['Destination atteinte'],
			},
			formatOrder: function(n) {
				return n + 'º';
			},
			ui: {
				startPlaceholder: 'Départ',
				viaPlaceholder: 'Intermédiaire {viaNumber}',
				endPlaceholder: 'Arrivée'
			}
		},
		'it': {
			directions: {
				N: 'nord',
				NE: 'nord-est',
				E: 'est',
				SE: 'sud-est',
				S: 'sud',
				SW: 'sud-ovest',
				W: 'ovest',
				NW: 'nord-ovest'
			},
			instructions: {
				// instruction, postfix if the road is named
				'Head':
					['Dritto verso {dir}', ' su {road}'],
				'Continue':
					['Continuare verso {dir}', ' su {road}'],
				'SlightRight':
					['Mantenere la destra', ' su {road}'],
				'Right':
					['A destra', ' su {road}'],
				'SharpRight':
					['Strettamente a destra', ' su {road}'],
				'TurnAround':
					['Fare inversione di marcia'],
				'SharpLeft':
					['Strettamente a sinistra', ' su {road}'],
				'Left':
					['A sinistra', ' sur {road}'],
				'SlightLeft':
					['Mantenere la sinistra', ' su {road}'],
				'WaypointReached':
					['Punto di passaggio raggiunto'],
				'Roundabout':
					['Alla rotonda, prendere la {exitStr} uscita'],
				'DestinationReached':
					['Destinazione raggiunta'],
			},
			formatOrder: function(n) {
				return n + 'º';
			},
			ui: {
				startPlaceholder: 'Partenza',
				viaPlaceholder: 'Intermedia {viaNumber}',
				endPlaceholder: 'Destinazione'
			}
		},
		'pt': {
			directions: {
				N: 'norte',
				NE: 'nordeste',
				E: 'leste',
				SE: 'sudeste',
				S: 'sul',
				SW: 'sudoeste',
				W: 'oeste',
				NW: 'noroeste'
			},
			instructions: {
				// instruction, postfix if the road is named
				'Head':
					['Siga {dir}', ' na {road}'],
				'Continue':
					['Continue {dir}', ' na {road}'],
				'SlightRight':
					['Curva ligeira a direita', ' na {road}'],
				'Right':
					['Curva a direita', ' na {road}'],
				'SharpRight':
					['Curva fechada a direita', ' na {road}'],
				'TurnAround':
					['Retorne'],
				'SharpLeft':
					['Curva fechada a esquerda', ' na {road}'],
				'Left':
					['Curva a esquerda', ' na {road}'],
				'SlightLeft':
					['Curva ligueira a esquerda', ' na {road}'],
				'WaypointReached':
					['Ponto de interesse atingido'],
				'Roundabout':
					['Pegue a {exitStr} saída na rotatória', ' na {road}'],
				'DestinationReached':
					['Destino atingido'],
			},
			formatOrder: function(n) {
				return n + 'º';
			},
			ui: {
				startPlaceholder: 'Origem',
				viaPlaceholder: 'Intermédio {viaNumber}',
				endPlaceholder: 'Destino'
			}
		},
		'sk': {
			directions: {
				N: 'sever',
				NE: 'serverovýchod',
				E: 'východ',
				SE: 'juhovýchod',
				S: 'juh',
				SW: 'juhozápad',
				W: 'západ',
				NW: 'serverozápad'
			},
			instructions: {
				// instruction, postfix if the road is named
				'Head':
					['Mierte na {dir}', ' na {road}'],
				'Continue':
					['Pokračujte na {dir}', ' na {road}'],
				'SlightRight':
					['Mierne doprava', ' na {road}'],
				'Right':
					['Doprava', ' na {road}'],
				'SharpRight':
					['Prudko doprava', ' na {road}'],
				'TurnAround':
					['Otočte sa'],
				'SharpLeft':
					['Prudko doľava', ' na {road}'],
				'Left':
					['Doľava', ' na {road}'],
				'SlightLeft':
					['Mierne doľava', ' na {road}'],
				'WaypointReached':
					['Ste v prejazdovom bode.'],
				'Roundabout':
					['Odbočte na {exitStr} výjazde', ' na {road}'],
				'DestinationReached':
					['Prišli ste do cieľa.'],
			},
			formatOrder: function(n) {
				var i = n % 10 - 1,
				suffix = ['.', '.', '.'];

				return suffix[i] ? n + suffix[i] : n + '.';
			},
			ui: {
				startPlaceholder: 'Začiatok',
				viaPlaceholder: 'Cez {viaNumber}',
				endPlaceholder: 'Koniec'
			}
		},
		'el': {
			directions: {
				N: 'βόρεια',
				NE: 'βορειοανατολικά',
				E: 'ανατολικά',
				SE: 'νοτιοανατολικά',
				S: 'νότια',
				SW: 'νοτιοδυτικά',
				W: 'δυτικά',
				NW: 'βορειοδυτικά'
			},
			instructions: {
				// instruction, postfix if the road is named
				'Head':
					['Κατευθυνθείτε {dir}', ' στην {road}'],
				'Continue':
					['Συνεχίστε {dir}', ' στην {road}'],
				'SlightRight':
					['Ελαφρώς δεξιά', ' στην {road}'],
				'Right':
					['Δεξιά', ' στην {road}'],
				'SharpRight':
					['Απότομη δεξιά στροφή', ' στην {road}'],
				'TurnAround':
					['Κάντε αναστροφή'],
				'SharpLeft':
					['Απότομη αριστερή στροφή', ' στην {road}'],
				'Left':
					['Αριστερά', ' στην {road}'],
				'SlightLeft':
					['Ελαφρώς αριστερά', ' στην {road}'],
				'WaypointReached':
					['Φτάσατε στο σημείο αναφοράς'],
				'Roundabout':
					['Ακολουθήστε την {exitStr} έξοδο στο κυκλικό κόμβο', ' στην {road}'],
				'DestinationReached':
					['Φτάσατε στον προορισμό σας'],
			},
			formatOrder: function(n) {
				return n + 'º';
			},
			ui: {
				startPlaceholder: 'Αφετηρία',
				viaPlaceholder: 'μέσω {viaNumber}',
				endPlaceholder: 'Προορισμός'
			}
		}
	};

	module.exports = L.Routing;
})();

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-routing-machine/src/L.Routing.Localization.js","/node_modules/leaflet-routing-machine/src")

},{"_process":48,"buffer":13}],40:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
(function() {
	'use strict';

	var L = require('leaflet'),
		corslite = require('corslite'),
		polyline = require('polyline');

	// Ignore camelcase naming for this file, since OSRM's API uses
	// underscores.
	/* jshint camelcase: false */

	L.Routing = L.Routing || {};
	L.extend(L.Routing, require('./L.Routing.Waypoint'));

	/**
	 * Works against OSRM's new API in version 5.0; this has
	 * the API version v1.
	 */
	L.Routing.OSRMv1 = L.Class.extend({
		options: {
			serviceUrl: 'http://router.project-osrm.org/route/v1',
			profile: 'driving',
			timeout: 30 * 1000,
			routingOptions: {
				alternatives: true,
				steps: true
			},
			polylinePrecision: 5
		},

		initialize: function(options) {
			L.Util.setOptions(this, options);
			this._hints = {
				locations: {}
			};
		},

		route: function(waypoints, callback, context, options) {
			var timedOut = false,
				wps = [],
				url,
				timer,
				wp,
				i;

			url = this.buildRouteUrl(waypoints, L.extend({}, this.options.routingOptions, options));

			timer = setTimeout(function() {
				timedOut = true;
				callback.call(context || callback, {
					status: -1,
					message: 'OSRM request timed out.'
				});
			}, this.options.timeout);

			// Create a copy of the waypoints, since they
			// might otherwise be asynchronously modified while
			// the request is being processed.
			for (i = 0; i < waypoints.length; i++) {
				wp = waypoints[i];
				wps.push(new L.Routing.Waypoint(wp.latLng, wp.name, wp.options));
			}

			corslite(url, L.bind(function(err, resp) {
				var data,
					errorMessage,
					statusCode;

				clearTimeout(timer);
				if (!timedOut) {
					errorMessage = 'HTTP request failed: ' + err;
					statusCode = -1;

					if (!err) {
						try {
							data = JSON.parse(resp.responseText);
							try {
								return this._routeDone(data, wps, options, callback, context);
							} catch (ex) {
								statusCode = -3;
								errorMessage = ex.toString();
							}
						} catch (ex) {
							statusCode = -2;
							errorMessage = 'Error parsing OSRM response: ' + ex.toString();
						}
					}

					callback.call(context || callback, {
						status: statusCode,
						message: errorMessage
					});
				}
			}, this));

			return this;
		},

		_routeDone: function(response, inputWaypoints, options, callback, context) {
			var alts = [],
			    actualWaypoints,
			    i,
			    route;

			context = context || callback;
			if (response.code !== 'Ok') {
				callback.call(context, {
					status: response.code
				});
				return;
			}

			actualWaypoints = this._toWaypoints(inputWaypoints, response.waypoints);

			for (i = 0; i < response.routes.length; i++) {
				route = this._convertRoute(response.routes[i], options.geometryOnly);
				route.inputWaypoints = inputWaypoints;
				route.waypoints = actualWaypoints;
				alts.push(route);
			}

			this._saveHintData(response.waypoints, inputWaypoints);

			callback.call(context, null, alts);
		},

		_convertRoute: function(responseRoute, geometryOnly) {
			var result = {
					name: '', // TODO
					summary: {
						totalDistance: responseRoute.distance,
						totalTime: responseRoute.duration
					}
				},
				coordinates = [],
				instructions = [],
				index = 0,
				legCount = responseRoute.legs.length,
				i,
				j,
				leg,
				step,
				geometry,
				type;

			if (geometryOnly) {
				result.coordinates = this._decodePolyline(responseRoute.geometry);
				return result;
			}

			for (i = 0; i < legCount; i++) {
				leg = responseRoute.legs[i];
				for (j = 0; j < leg.steps.length; j++) {
					step = leg.steps[j];
					geometry = this._decodePolyline(step.geometry);
					coordinates.push(geometry);
					type = this._maneuverToInstructionType(step.maneuver, i === legCount - 1);
					if (type) {
						instructions.push({
							type: type,
							distance: step.distance,
							time: step.duration,
							road: step.name,
							direction: this._bearingToDirection(step.maneuver.bearing_after),
							exit: step.maneuver.exit,
							index: index
						});
					}

					index += geometry.length;
				}
			}

			result.coordinates = Array.prototype.concat.apply([], coordinates);
			result.instructions = instructions;

			return result;
		},

		_bearingToDirection: function(bearing) {
			var oct = Math.round(bearing / 45) % 8;
			return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][oct];
		},

		_maneuverToInstructionType: function(maneuver, lastLeg) {
			switch (maneuver.type) {
			case 'turn':
			case 'end of road':
				switch (maneuver.modifier) {
				case 'straight':
					return 'Straight';
				case 'slight right':
					return 'SlightRight';
				case 'right':
					return 'Right';
				case 'sharp right':
					return 'SharpRight';
				case 'sharp left':
					return 'SharpLeft';
				case 'left':
					return 'Left';
				case 'slight left':
					return 'SlightLeft';
				case 'uturn':
					return 'TurnAround';
				default:
					return null;
				}
				break;
			case 'new name':
			case 'merge':
			case 'ramp':
			case 'fork':
				return 'Continue';
			case 'arrive':
				return lastLeg ? 'DestinationReached' : 'WaypointReached';
			case 'roundabout':
			case 'rotary':
				return 'Roundabout';
			default:
				return null;
			}
		},

		_decodePolyline: function(routeGeometry) {
			var cs = polyline.decode(routeGeometry, this.options.polylinePrecision),
				result = new Array(cs.length),
				i;
			for (i = cs.length - 1; i >= 0; i--) {
				result[i] = L.latLng(cs[i]);
			}

			return result;
		},

		_toWaypoints: function(inputWaypoints, vias) {
			var wps = [],
			    i;
			for (i = 0; i < vias.length; i++) {
				wps.push(L.Routing.waypoint(L.latLng(vias[i]),
				                            inputWaypoints[i].name,
				                            inputWaypoints[i].options));
			}

			return wps;
		},

		_createName: function(nameParts) {
			var name = '',
				i;

			for (i = 0; i < nameParts.length; i++) {
				if (nameParts[i]) {
					if (name) {
						name += ', ';
					}
					name += nameParts[i].charAt(0).toUpperCase() + nameParts[i].slice(1);
				}
			}

			return name;
		},

		buildRouteUrl: function(waypoints, options) {
			var locs = [],
				hints = [],
				wp,
				latLng,
			    computeInstructions,
			    computeAlternative;

			for (var i = 0; i < waypoints.length; i++) {
				wp = waypoints[i];
				latLng = wp.latLng;
				locs.push(latLng.lng + ',' + latLng.lat);
				hints.push(this._hints[this._locationKey(latLng)] || '');
			}

			computeAlternative = computeInstructions =
				!(options && options.geometryOnly);

			return this.options.serviceUrl + '/' + this.options.profile + '/' +
				locs.join(';') + '?' +
				(options.z ? 'z=' + options.z + '&' : (options.geometryOnly ? 'overview=full&' : '')) +
				//'hints=' + hints.join(';') + '&' +
				'alternatives=' + computeAlternative.toString() + '&' +
				'steps=' + computeInstructions.toString() +
				(options.allowUTurns ? '&continue_straight=' + !options.allowUTurns : '');
		},

		_locationKey: function(location) {
			return location.lat + ',' + location.lng;
		},

		_saveHintData: function(actualWaypoints, waypoints) {
			var loc;
			this._hints = {
				locations: {}
			};
			for (var i = actualWaypoints.length - 1; i >= 0; i--) {
				loc = waypoints[i].latLng;
				this._hints.locations[this._locationKey(loc)] = actualWaypoints[i].hint;
			}
		},

		_convertSummary: function(osrmSummary) {
			return {
				totalDistance: osrmSummary.total_distance,
				totalTime: osrmSummary.total_time
			};
		},

		_convertInstructions: function(osrmInstructions) {
			var result = [],
			    i,
			    instr,
			    type,
			    driveDir;

			for (i = 0; i < osrmInstructions.length; i++) {
				instr = osrmInstructions[i];
				type = this._drivingDirectionType(instr[0]);
				driveDir = instr[0].split('-');
				if (type) {
					result.push({
						type: type,
						distance: instr[2],
						time: instr[4],
						road: instr[1],
						direction: instr[6],
						exit: driveDir.length > 1 ? driveDir[1] : undefined,
						index: instr[3]
					});
				}
			}

			return result;
		},
	});

	L.Routing.osrmv1 = function(options) {
		return new L.Routing.OSRM(options);
	};

	module.exports = L.Routing;
})();

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-routing-machine/src/L.Routing.OSRMv1.js","/node_modules/leaflet-routing-machine/src")

},{"./L.Routing.Waypoint":42,"_process":48,"buffer":13,"corslite":14,"leaflet":44,"polyline":47}],41:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
(function() {
	'use strict';

	var L = require('leaflet');
	L.Routing = L.Routing || {};
	L.extend(L.Routing, require('./L.Routing.GeocoderElement'));
	L.extend(L.Routing, require('./L.Routing.Waypoint'));

	L.Routing.Plan = L.Class.extend({
		includes: L.Mixin.Events,

		options: {
			dragStyles: [
				{color: 'black', opacity: 0.15, weight: 9},
				{color: 'white', opacity: 0.8, weight: 6},
				{color: 'red', opacity: 1, weight: 2, dashArray: '7,12'}
			],
			draggableWaypoints: true,
			routeWhileDragging: false,
			addWaypoints: true,
			reverseWaypoints: false,
			addButtonClassName: '',
			language: 'en',
			createGeocoderElement: L.Routing.geocoderElement,
			createMarker: function(i, wp) {
				var options = {
						draggable: this.draggableWaypoints
					},
				    marker = L.marker(wp.latLng, options);

				return marker;
			},
			geocodersClassName: ''
		},

		initialize: function(waypoints, options) {
			L.Util.setOptions(this, options);
			this._waypoints = [];
			this.setWaypoints(waypoints);
		},

		isReady: function() {
			var i;
			for (i = 0; i < this._waypoints.length; i++) {
				if (!this._waypoints[i].latLng) {
					return false;
				}
			}

			return true;
		},

		getWaypoints: function() {
			var i,
				wps = [];

			for (i = 0; i < this._waypoints.length; i++) {
				wps.push(this._waypoints[i]);
			}

			return wps;
		},

		setWaypoints: function(waypoints) {
			var args = [0, this._waypoints.length].concat(waypoints);
			this.spliceWaypoints.apply(this, args);
			return this;
		},

		spliceWaypoints: function() {
			var args = [arguments[0], arguments[1]],
			    i;

			for (i = 2; i < arguments.length; i++) {
				args.push(arguments[i] && arguments[i].hasOwnProperty('latLng') ? arguments[i] : L.Routing.waypoint(arguments[i]));
			}

			[].splice.apply(this._waypoints, args);

			// Make sure there's always at least two waypoints
			while (this._waypoints.length < 2) {
				this.spliceWaypoints(this._waypoints.length, 0, null);
			}

			this._updateMarkers();
			this._fireChanged.apply(this, args);
		},

		onAdd: function(map) {
			this._map = map;
			this._updateMarkers();
		},

		onRemove: function() {
			var i;
			this._removeMarkers();

			if (this._newWp) {
				for (i = 0; i < this._newWp.lines.length; i++) {
					this._map.removeLayer(this._newWp.lines[i]);
				}
			}

			delete this._map;
		},

		createGeocoders: function() {
			var container = L.DomUtil.create('div', 'leaflet-routing-geocoders ' + this.options.geocodersClassName),
				waypoints = this._waypoints,
			    addWpBtn,
			    reverseBtn;

			this._geocoderContainer = container;
			this._geocoderElems = [];


			if (this.options.addWaypoints) {
				addWpBtn = L.DomUtil.create('button', 'leaflet-routing-add-waypoint ' + this.options.addButtonClassName, container);
				addWpBtn.setAttribute('type', 'button');
				L.DomEvent.addListener(addWpBtn, 'click', function() {
					this.spliceWaypoints(waypoints.length, 0, null);
				}, this);
			}

			if (this.options.reverseWaypoints) {
				reverseBtn = L.DomUtil.create('button', 'leaflet-routing-reverse-waypoints', container);
				reverseBtn.setAttribute('type', 'button');
				L.DomEvent.addListener(reverseBtn, 'click', function() {
					this._waypoints.reverse();
					this.setWaypoints(this._waypoints);
				}, this);
			}

			this._updateGeocoders();
			this.on('waypointsspliced', this._updateGeocoders);

			return container;
		},

		_createGeocoder: function(i) {
			var geocoder = this.options.createGeocoderElement(this._waypoints[i], i, this._waypoints.length, this.options);
			geocoder
			.on('delete', function() {
				if (i > 0 || this._waypoints.length > 2) {
					this.spliceWaypoints(i, 1);
				} else {
					this.spliceWaypoints(i, 1, new L.Routing.Waypoint());
				}
			}, this)
			.on('geocoded', function(e) {
				this._updateMarkers();
				this._fireChanged();
				this._focusGeocoder(i + 1);
				this.fire('waypointgeocoded', {
					waypointIndex: i,
					waypoint: e.waypoint
				});
			}, this)
			.on('reversegeocoded', function(e) {
				this.fire('waypointgeocoded', {
					waypointIndex: i,
					waypoint: e.waypoint
				});
			}, this);

			return geocoder;
		},

		_updateGeocoders: function() {
			var elems = [],
				i,
			    geocoderElem;

			for (i = 0; i < this._geocoderElems.length; i++) {
				this._geocoderContainer.removeChild(this._geocoderElems[i].getContainer());
			}

			for (i = this._waypoints.length - 1; i >= 0; i--) {
				geocoderElem = this._createGeocoder(i);
				this._geocoderContainer.insertBefore(geocoderElem.getContainer(), this._geocoderContainer.firstChild);
				elems.push(geocoderElem);
			}

			this._geocoderElems = elems.reverse();
		},

		_removeMarkers: function() {
			var i;
			if (this._markers) {
				for (i = 0; i < this._markers.length; i++) {
					if (this._markers[i]) {
						this._map.removeLayer(this._markers[i]);
					}
				}
			}
			this._markers = [];
		},

		_updateMarkers: function() {
			var i,
			    m;

			if (!this._map) {
				return;
			}

			this._removeMarkers();

			for (i = 0; i < this._waypoints.length; i++) {
				if (this._waypoints[i].latLng) {
					m = this.options.createMarker(i, this._waypoints[i], this._waypoints.length);
					if (m) {
						m.addTo(this._map);
						if (this.options.draggableWaypoints) {
							this._hookWaypointEvents(m, i);
						}
					}
				} else {
					m = null;
				}
				this._markers.push(m);
			}
		},

		_fireChanged: function() {
			this.fire('waypointschanged', {waypoints: this.getWaypoints()});

			if (arguments.length >= 2) {
				this.fire('waypointsspliced', {
					index: Array.prototype.shift.call(arguments),
					nRemoved: Array.prototype.shift.call(arguments),
					added: arguments
				});
			}
		},

		_hookWaypointEvents: function(m, i, trackMouseMove) {
			var eventLatLng = function(e) {
					return trackMouseMove ? e.latlng : e.target.getLatLng();
				},
				dragStart = L.bind(function(e) {
					this.fire('waypointdragstart', {index: i, latlng: eventLatLng(e)});
				}, this),
				drag = L.bind(function(e) {
					this._waypoints[i].latLng = eventLatLng(e);
					this.fire('waypointdrag', {index: i, latlng: eventLatLng(e)});
				}, this),
				dragEnd = L.bind(function(e) {
					this._waypoints[i].latLng = eventLatLng(e);
					this._waypoints[i].name = '';
					if (this._geocoderElems) {
						this._geocoderElems[i].update(true);
					}
					this.fire('waypointdragend', {index: i, latlng: eventLatLng(e)});
					this._fireChanged();
				}, this),
				mouseMove,
				mouseUp;

			if (trackMouseMove) {
				mouseMove = L.bind(function(e) {
					this._markers[i].setLatLng(e.latlng);
					drag(e);
				}, this);
				mouseUp = L.bind(function(e) {
					this._map.dragging.enable();
					this._map.off('mouseup', mouseUp);
					this._map.off('mousemove', mouseMove);
					dragEnd(e);
				}, this);
				this._map.dragging.disable();
				this._map.on('mousemove', mouseMove);
				this._map.on('mouseup', mouseUp);
				dragStart({latlng: this._waypoints[i].latLng});
			} else {
				m.on('dragstart', dragStart);
				m.on('drag', drag);
				m.on('dragend', dragEnd);
			}
		},

		dragNewWaypoint: function(e) {
			var newWpIndex = e.afterIndex + 1;
			if (this.options.routeWhileDragging) {
				this.spliceWaypoints(newWpIndex, 0, e.latlng);
				this._hookWaypointEvents(this._markers[newWpIndex], newWpIndex, true);
			} else {
				this._dragNewWaypoint(newWpIndex, e.latlng);
			}
		},

		_dragNewWaypoint: function(newWpIndex, initialLatLng) {
			var wp = new L.Routing.Waypoint(initialLatLng),
				prevWp = this._waypoints[newWpIndex - 1],
				nextWp = this._waypoints[newWpIndex],
				marker = this.options.createMarker(newWpIndex, wp, this._waypoints.length + 1),
				lines = [],
				mouseMove = L.bind(function(e) {
					var i;
					if (marker) {
						marker.setLatLng(e.latlng);
					}
					for (i = 0; i < lines.length; i++) {
						lines[i].spliceLatLngs(1, 1, e.latlng);
					}
				}, this),
				mouseUp = L.bind(function(e) {
					var i;
					if (marker) {
						this._map.removeLayer(marker);
					}
					for (i = 0; i < lines.length; i++) {
						this._map.removeLayer(lines[i]);
					}
					this._map.off('mousemove', mouseMove);
					this._map.off('mouseup', mouseUp);
					this.spliceWaypoints(newWpIndex, 0, e.latlng);
				}, this),
				i;

			if (marker) {
				marker.addTo(this._map);
			}

			for (i = 0; i < this.options.dragStyles.length; i++) {
				lines.push(L.polyline([prevWp.latLng, initialLatLng, nextWp.latLng],
					this.options.dragStyles[i]).addTo(this._map));
			}

			this._map.on('mousemove', mouseMove);
			this._map.on('mouseup', mouseUp);
		},

		_focusGeocoder: function(i) {
			if (this._geocoderElems[i]) {
				this._geocoderElems[i].focus();
			} else {
				document.activeElement.blur();
			}
		}
	});

	L.Routing.plan = function(waypoints, options) {
		return new L.Routing.Plan(waypoints, options);
	};

	module.exports = L.Routing;
})();

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-routing-machine/src/L.Routing.Plan.js","/node_modules/leaflet-routing-machine/src")

},{"./L.Routing.GeocoderElement":35,"./L.Routing.Waypoint":42,"_process":48,"buffer":13,"leaflet":44}],42:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
(function() {
	'use strict';

	var L = require('leaflet');
	L.Routing = L.Routing || {};

	L.Routing.Waypoint = L.Class.extend({
			options: {
				allowUTurn: false,
			},
			initialize: function(latLng, name, options) {
				L.Util.setOptions(this, options);
				this.latLng = L.latLng(latLng);
				this.name = name;
			}
		});

	L.Routing.waypoint = function(latLng, name, options) {
		return new L.Routing.Waypoint(latLng, name, options);
	};

	module.exports = L.Routing;
})();

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet-routing-machine/src/L.Routing.Waypoint.js","/node_modules/leaflet-routing-machine/src")

},{"_process":48,"buffer":13,"leaflet":44}],43:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/*

 Leaflet.markercluster, Provides Beautiful Animated Marker Clustering functionality for Leaflet, a JS library for interactive maps.

 https://github.com/Leaflet/Leaflet.markercluster

 (c) 2012-2013, Dave Leaver, smartrak

*/

!function(t,e,i){L.MarkerClusterGroup=L.FeatureGroup.extend({options:{maxClusterRadius:80,iconCreateFunction:null,spiderfyOnMaxZoom:!0,showCoverageOnHover:!0,zoomToBoundsOnClick:!0,singleMarkerMode:!1,disableClusteringAtZoom:null,removeOutsideVisibleBounds:!0,animate:!0,animateAddingMarkers:!1,spiderfyDistanceMultiplier:1,spiderLegPolylineOptions:{weight:1.5,color:"#222",opacity:.5},chunkedLoading:!1,chunkInterval:200,chunkDelay:50,chunkProgress:null,polygonOptions:{}},initialize:function(t){L.Util.setOptions(this,t),this.options.iconCreateFunction||(this.options.iconCreateFunction=this._defaultIconCreateFunction),this._featureGroup=L.featureGroup(),this._featureGroup.on(L.FeatureGroup.EVENTS,this._propagateEvent,this),this._nonPointGroup=L.featureGroup(),this._nonPointGroup.on(L.FeatureGroup.EVENTS,this._propagateEvent,this),this._inZoomAnimation=0,this._needsClustering=[],this._needsRemoving=[],this._currentShownBounds=null,this._queue=[];var e=L.DomUtil.TRANSITION&&this.options.animate;L.extend(this,e?this._withAnimation:this._noAnimation),this._markerCluster=e?L.MarkerCluster:L.MarkerClusterNonAnimated},addLayer:function(t){if(t instanceof L.LayerGroup){var e=[];for(var i in t._layers)e.push(t._layers[i]);return this.addLayers(e)}if(!t.getLatLng)return this._nonPointGroup.addLayer(t),this;if(!this._map)return this._needsClustering.push(t),this;if(this.hasLayer(t))return this;this._unspiderfy&&this._unspiderfy(),this._addLayer(t,this._maxZoom),this._topClusterLevel._recalculateBounds();var n=t,s=this._map.getZoom();if(t.__parent)for(;n.__parent._zoom>=s;)n=n.__parent;return this._currentShownBounds.contains(n.getLatLng())&&(this.options.animateAddingMarkers?this._animationAddLayer(t,n):this._animationAddLayerNonAnimated(t,n)),this},removeLayer:function(t){if(t instanceof L.LayerGroup){var e=[];for(var i in t._layers)e.push(t._layers[i]);return this.removeLayers(e)}return t.getLatLng?this._map?t.__parent?(this._unspiderfy&&(this._unspiderfy(),this._unspiderfyLayer(t)),this._removeLayer(t,!0),this._topClusterLevel._recalculateBounds(),this._featureGroup.hasLayer(t)&&(this._featureGroup.removeLayer(t),t.clusterShow&&t.clusterShow()),this):this:(!this._arraySplice(this._needsClustering,t)&&this.hasLayer(t)&&this._needsRemoving.push(t),this):(this._nonPointGroup.removeLayer(t),this)},addLayers:function(t){var e,i,n,s,r=this._featureGroup,o=this._nonPointGroup,a=this.options.chunkedLoading,h=this.options.chunkInterval,u=this.options.chunkProgress;if(this._map){var _=0,l=(new Date).getTime(),d=L.bind(function(){for(var e=(new Date).getTime();_<t.length;_++){if(a&&0===_%200){var i=(new Date).getTime()-e;if(i>h)break}if(s=t[_],s.getLatLng){if(!this.hasLayer(s)&&(this._addLayer(s,this._maxZoom),s.__parent&&2===s.__parent.getChildCount())){var n=s.__parent.getAllChildMarkers(),c=n[0]===s?n[1]:n[0];r.removeLayer(c)}}else o.addLayer(s)}u&&u(_,t.length,(new Date).getTime()-l),_===t.length?(this._topClusterLevel._recalculateBounds(),this._featureGroup.eachLayer(function(t){t instanceof L.MarkerCluster&&t._iconNeedsUpdate&&t._updateIcon()}),this._topClusterLevel._recursivelyAddChildrenToMap(null,this._zoom,this._currentShownBounds)):setTimeout(d,this.options.chunkDelay)},this);d()}else{for(e=[],i=0,n=t.length;n>i;i++)s=t[i],s.getLatLng?this.hasLayer(s)||e.push(s):o.addLayer(s);this._needsClustering=this._needsClustering.concat(e)}return this},removeLayers:function(t){var e,i,n,s=this._featureGroup,r=this._nonPointGroup;if(!this._map){for(e=0,i=t.length;i>e;e++)n=t[e],this._arraySplice(this._needsClustering,n),r.removeLayer(n),this.hasLayer(n)&&this._needsRemoving.push(n);return this}if(this._unspiderfy)for(this._unspiderfy(),e=0,i=t.length;i>e;e++)n=t[e],this._unspiderfyLayer(n);for(e=0,i=t.length;i>e;e++)n=t[e],n.__parent?(this._removeLayer(n,!0,!0),s.hasLayer(n)&&(s.removeLayer(n),n.clusterShow&&n.clusterShow())):r.removeLayer(n);return this._topClusterLevel._recalculateBounds(),this._topClusterLevel._recursivelyAddChildrenToMap(null,this._zoom,this._currentShownBounds),s.eachLayer(function(t){t instanceof L.MarkerCluster&&t._updateIcon()}),this},clearLayers:function(){return this._map||(this._needsClustering=[],delete this._gridClusters,delete this._gridUnclustered),this._noanimationUnspiderfy&&this._noanimationUnspiderfy(),this._featureGroup.clearLayers(),this._nonPointGroup.clearLayers(),this.eachLayer(function(t){delete t.__parent}),this._map&&this._generateInitialClusters(),this},getBounds:function(){var t=new L.LatLngBounds;this._topClusterLevel&&t.extend(this._topClusterLevel._bounds);for(var e=this._needsClustering.length-1;e>=0;e--)t.extend(this._needsClustering[e].getLatLng());return t.extend(this._nonPointGroup.getBounds()),t},eachLayer:function(t,e){var i,n=this._needsClustering.slice();for(this._topClusterLevel&&this._topClusterLevel.getAllChildMarkers(n),i=n.length-1;i>=0;i--)t.call(e,n[i]);this._nonPointGroup.eachLayer(t,e)},getLayers:function(){var t=[];return this.eachLayer(function(e){t.push(e)}),t},getLayer:function(t){var e=null;return t=parseInt(t,10),this.eachLayer(function(i){L.stamp(i)===t&&(e=i)}),e},hasLayer:function(t){if(!t)return!1;var e,i=this._needsClustering;for(e=i.length-1;e>=0;e--)if(i[e]===t)return!0;for(i=this._needsRemoving,e=i.length-1;e>=0;e--)if(i[e]===t)return!1;return!(!t.__parent||t.__parent._group!==this)||this._nonPointGroup.hasLayer(t)},zoomToShowLayer:function(t,e){"function"!=typeof e&&(e=function(){});var i=function(){!t._icon&&!t.__parent._icon||this._inZoomAnimation||(this._map.off("moveend",i,this),this.off("animationend",i,this),t._icon?e():t.__parent._icon&&(this.once("spiderfied",e,this),t.__parent.spiderfy()))};if(t._icon&&this._map.getBounds().contains(t.getLatLng()))e();else if(t.__parent._zoom<this._map.getZoom())this._map.on("moveend",i,this),this._map.panTo(t.getLatLng());else{var n=function(){this._map.off("movestart",n,this),n=null};this._map.on("movestart",n,this),this._map.on("moveend",i,this),this.on("animationend",i,this),t.__parent.zoomToBounds(),n&&i.call(this)}},onAdd:function(t){this._map=t;var e,i,n;if(!isFinite(this._map.getMaxZoom()))throw"Map has no maxZoom specified";for(this._featureGroup.onAdd(t),this._nonPointGroup.onAdd(t),this._gridClusters||this._generateInitialClusters(),this._maxLat=t.options.crs.projection.MAX_LATITUDE,e=0,i=this._needsRemoving.length;i>e;e++)n=this._needsRemoving[e],this._removeLayer(n,!0);this._needsRemoving=[],this._zoom=this._map.getZoom(),this._currentShownBounds=this._getExpandedVisibleBounds(),this._map.on("zoomend",this._zoomEnd,this),this._map.on("moveend",this._moveEnd,this),this._spiderfierOnAdd&&this._spiderfierOnAdd(),this._bindEvents(),i=this._needsClustering,this._needsClustering=[],this.addLayers(i)},onRemove:function(t){t.off("zoomend",this._zoomEnd,this),t.off("moveend",this._moveEnd,this),this._unbindEvents(),this._map._mapPane.className=this._map._mapPane.className.replace(" leaflet-cluster-anim",""),this._spiderfierOnRemove&&this._spiderfierOnRemove(),delete this._maxLat,this._hideCoverage(),this._featureGroup.onRemove(t),this._nonPointGroup.onRemove(t),this._featureGroup.clearLayers(),this._map=null},getVisibleParent:function(t){for(var e=t;e&&!e._icon;)e=e.__parent;return e||null},_arraySplice:function(t,e){for(var i=t.length-1;i>=0;i--)if(t[i]===e)return t.splice(i,1),!0},_removeFromGridUnclustered:function(t,e){for(var i=this._map,n=this._gridUnclustered;e>=0&&n[e].removeObject(t,i.project(t.getLatLng(),e));e--);},_removeLayer:function(t,e,i){var n=this._gridClusters,s=this._gridUnclustered,r=this._featureGroup,o=this._map;e&&this._removeFromGridUnclustered(t,this._maxZoom);var a,h=t.__parent,u=h._markers;for(this._arraySplice(u,t);h&&(h._childCount--,h._boundsNeedUpdate=!0,!(h._zoom<0));)e&&h._childCount<=1?(a=h._markers[0]===t?h._markers[1]:h._markers[0],n[h._zoom].removeObject(h,o.project(h._cLatLng,h._zoom)),s[h._zoom].addObject(a,o.project(a.getLatLng(),h._zoom)),this._arraySplice(h.__parent._childClusters,h),h.__parent._markers.push(a),a.__parent=h.__parent,h._icon&&(r.removeLayer(h),i||r.addLayer(a))):i&&h._icon||h._updateIcon(),h=h.__parent;delete t.__parent},_isOrIsParent:function(t,e){for(;e;){if(t===e)return!0;e=e.parentNode}return!1},_propagateEvent:function(t){if(t.layer instanceof L.MarkerCluster){if(t.originalEvent&&this._isOrIsParent(t.layer._icon,t.originalEvent.relatedTarget))return;t.type="cluster"+t.type}this.fire(t.type,t)},_defaultIconCreateFunction:function(t){var e=t.getChildCount(),i=" marker-cluster-";return i+=10>e?"small":100>e?"medium":"large",new L.DivIcon({html:"<div><span>"+e+"</span></div>",className:"marker-cluster"+i,iconSize:new L.Point(40,40)})},_bindEvents:function(){var t=this._map,e=this.options.spiderfyOnMaxZoom,i=this.options.showCoverageOnHover,n=this.options.zoomToBoundsOnClick;(e||n)&&this.on("clusterclick",this._zoomOrSpiderfy,this),i&&(this.on("clustermouseover",this._showCoverage,this),this.on("clustermouseout",this._hideCoverage,this),t.on("zoomend",this._hideCoverage,this))},_zoomOrSpiderfy:function(t){for(var e=t.layer,i=e;1===i._childClusters.length;)i=i._childClusters[0];i._zoom===this._maxZoom&&i._childCount===e._childCount?this.options.spiderfyOnMaxZoom&&e.spiderfy():this.options.zoomToBoundsOnClick&&e.zoomToBounds(),t.originalEvent&&13===t.originalEvent.keyCode&&this._map._container.focus()},_showCoverage:function(t){var e=this._map;this._inZoomAnimation||(this._shownPolygon&&e.removeLayer(this._shownPolygon),t.layer.getChildCount()>2&&t.layer!==this._spiderfied&&(this._shownPolygon=new L.Polygon(t.layer.getConvexHull(),this.options.polygonOptions),e.addLayer(this._shownPolygon)))},_hideCoverage:function(){this._shownPolygon&&(this._map.removeLayer(this._shownPolygon),this._shownPolygon=null)},_unbindEvents:function(){var t=this.options.spiderfyOnMaxZoom,e=this.options.showCoverageOnHover,i=this.options.zoomToBoundsOnClick,n=this._map;(t||i)&&this.off("clusterclick",this._zoomOrSpiderfy,this),e&&(this.off("clustermouseover",this._showCoverage,this),this.off("clustermouseout",this._hideCoverage,this),n.off("zoomend",this._hideCoverage,this))},_zoomEnd:function(){this._map&&(this._mergeSplitClusters(),this._zoom=this._map._zoom,this._currentShownBounds=this._getExpandedVisibleBounds())},_moveEnd:function(){if(!this._inZoomAnimation){var t=this._getExpandedVisibleBounds();this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds,this._zoom,t),this._topClusterLevel._recursivelyAddChildrenToMap(null,this._map._zoom,t),this._currentShownBounds=t}},_generateInitialClusters:function(){var t=this._map.getMaxZoom(),e=this.options.maxClusterRadius,i=e;"function"!=typeof e&&(i=function(){return e}),this.options.disableClusteringAtZoom&&(t=this.options.disableClusteringAtZoom-1),this._maxZoom=t,this._gridClusters={},this._gridUnclustered={};for(var n=t;n>=0;n--)this._gridClusters[n]=new L.DistanceGrid(i(n)),this._gridUnclustered[n]=new L.DistanceGrid(i(n));this._topClusterLevel=new this._markerCluster(this,-1)},_addLayer:function(t,e){var i,n,s=this._gridClusters,r=this._gridUnclustered;for(this.options.singleMarkerMode&&this._overrideMarkerIcon(t);e>=0;e--){i=this._map.project(t.getLatLng(),e);var o=s[e].getNearObject(i);if(o)return o._addChild(t),t.__parent=o,void 0;if(o=r[e].getNearObject(i)){var a=o.__parent;a&&this._removeLayer(o,!1);var h=new this._markerCluster(this,e,o,t);s[e].addObject(h,this._map.project(h._cLatLng,e)),o.__parent=h,t.__parent=h;var u=h;for(n=e-1;n>a._zoom;n--)u=new this._markerCluster(this,n,u),s[n].addObject(u,this._map.project(o.getLatLng(),n));return a._addChild(u),this._removeFromGridUnclustered(o,e),void 0}r[e].addObject(t,i)}this._topClusterLevel._addChild(t),t.__parent=this._topClusterLevel},_enqueue:function(t){this._queue.push(t),this._queueTimeout||(this._queueTimeout=setTimeout(L.bind(this._processQueue,this),300))},_processQueue:function(){for(var t=0;t<this._queue.length;t++)this._queue[t].call(this);this._queue.length=0,clearTimeout(this._queueTimeout),this._queueTimeout=null},_mergeSplitClusters:function(){this._processQueue(),this._zoom<this._map._zoom&&this._currentShownBounds.intersects(this._getExpandedVisibleBounds())?(this._animationStart(),this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds,this._zoom,this._getExpandedVisibleBounds()),this._animationZoomIn(this._zoom,this._map._zoom)):this._zoom>this._map._zoom?(this._animationStart(),this._animationZoomOut(this._zoom,this._map._zoom)):this._moveEnd()},_getExpandedVisibleBounds:function(){return this.options.removeOutsideVisibleBounds?L.Browser.mobile?this._checkBoundsMaxLat(this._map.getBounds()):this._checkBoundsMaxLat(this._map.getBounds().pad(1)):this._mapBoundsInfinite},_checkBoundsMaxLat:function(t){var e=this._maxLat;return e!==i&&(t.getNorth()>=e&&(t._northEast.lat=1/0),t.getSouth()<=-e&&(t._southWest.lat=-1/0)),t},_animationAddLayerNonAnimated:function(t,e){if(e===t)this._featureGroup.addLayer(t);else if(2===e._childCount){e._addToMap();var i=e.getAllChildMarkers();this._featureGroup.removeLayer(i[0]),this._featureGroup.removeLayer(i[1])}else e._updateIcon()},_overrideMarkerIcon:function(t){var e=t.options.icon=this.options.iconCreateFunction({getChildCount:function(){return 1},getAllChildMarkers:function(){return[t]}});return e}}),L.MarkerClusterGroup.include({_mapBoundsInfinite:new L.LatLngBounds(new L.LatLng(-1/0,-1/0),new L.LatLng(1/0,1/0))}),L.MarkerClusterGroup.include({_noAnimation:{_animationStart:function(){},_animationZoomIn:function(t,e){this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds,t),this._topClusterLevel._recursivelyAddChildrenToMap(null,e,this._getExpandedVisibleBounds()),this.fire("animationend")},_animationZoomOut:function(t,e){this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds,t),this._topClusterLevel._recursivelyAddChildrenToMap(null,e,this._getExpandedVisibleBounds()),this.fire("animationend")},_animationAddLayer:function(t,e){this._animationAddLayerNonAnimated(t,e)}},_withAnimation:{_animationStart:function(){this._map._mapPane.className+=" leaflet-cluster-anim",this._inZoomAnimation++},_animationZoomIn:function(t,e){var i,n=this._getExpandedVisibleBounds(),s=this._featureGroup;this._topClusterLevel._recursively(n,t,0,function(r){var o,a=r._latlng,h=r._markers;for(n.contains(a)||(a=null),r._isSingleParent()&&t+1===e?(s.removeLayer(r),r._recursivelyAddChildrenToMap(null,e,n)):(r.clusterHide(),r._recursivelyAddChildrenToMap(a,e,n)),i=h.length-1;i>=0;i--)o=h[i],n.contains(o._latlng)||s.removeLayer(o)}),this._forceLayout(),this._topClusterLevel._recursivelyBecomeVisible(n,e),s.eachLayer(function(t){t instanceof L.MarkerCluster||!t._icon||t.clusterShow()}),this._topClusterLevel._recursively(n,t,e,function(t){t._recursivelyRestoreChildPositions(e)}),this._enqueue(function(){this._topClusterLevel._recursively(n,t,0,function(t){s.removeLayer(t),t.clusterShow()}),this._animationEnd()})},_animationZoomOut:function(t,e){this._animationZoomOutSingle(this._topClusterLevel,t-1,e),this._topClusterLevel._recursivelyAddChildrenToMap(null,e,this._getExpandedVisibleBounds()),this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds,t,this._getExpandedVisibleBounds())},_animationAddLayer:function(t,e){var i=this,n=this._featureGroup;n.addLayer(t),e!==t&&(e._childCount>2?(e._updateIcon(),this._forceLayout(),this._animationStart(),t._setPos(this._map.latLngToLayerPoint(e.getLatLng())),t.clusterHide(),this._enqueue(function(){n.removeLayer(t),t.clusterShow(),i._animationEnd()})):(this._forceLayout(),i._animationStart(),i._animationZoomOutSingle(e,this._map.getMaxZoom(),this._map.getZoom())))}},_animationZoomOutSingle:function(t,e,i){var n=this._getExpandedVisibleBounds();t._recursivelyAnimateChildrenInAndAddSelfToMap(n,e+1,i);var s=this;this._forceLayout(),t._recursivelyBecomeVisible(n,i),this._enqueue(function(){if(1===t._childCount){var r=t._markers[0];r.setLatLng(r.getLatLng()),r.clusterShow&&r.clusterShow()}else t._recursively(n,i,0,function(t){t._recursivelyRemoveChildrenFromMap(n,e+1)});s._animationEnd()})},_animationEnd:function(){this._map&&(this._map._mapPane.className=this._map._mapPane.className.replace(" leaflet-cluster-anim","")),this._inZoomAnimation--,this.fire("animationend")},_forceLayout:function(){L.Util.falseFn(e.body.offsetWidth)}}),L.markerClusterGroup=function(t){return new L.MarkerClusterGroup(t)},L.MarkerCluster=L.Marker.extend({initialize:function(t,e,i,n){L.Marker.prototype.initialize.call(this,i?i._cLatLng||i.getLatLng():new L.LatLng(0,0),{icon:this}),this._group=t,this._zoom=e,this._markers=[],this._childClusters=[],this._childCount=0,this._iconNeedsUpdate=!0,this._boundsNeedUpdate=!0,this._bounds=new L.LatLngBounds,i&&this._addChild(i),n&&this._addChild(n)},getAllChildMarkers:function(t){t=t||[];for(var e=this._childClusters.length-1;e>=0;e--)this._childClusters[e].getAllChildMarkers(t);for(var i=this._markers.length-1;i>=0;i--)t.push(this._markers[i]);return t},getChildCount:function(){return this._childCount},zoomToBounds:function(){for(var t,e=this._childClusters.slice(),i=this._group._map,n=i.getBoundsZoom(this._bounds),s=this._zoom+1,r=i.getZoom();e.length>0&&n>s;){s++;var o=[];for(t=0;t<e.length;t++)o=o.concat(e[t]._childClusters);e=o}n>s?this._group._map.setView(this._latlng,s):r>=n?this._group._map.setView(this._latlng,r+1):this._group._map.fitBounds(this._bounds)},getBounds:function(){var t=new L.LatLngBounds;return t.extend(this._bounds),t},_updateIcon:function(){this._iconNeedsUpdate=!0,this._icon&&this.setIcon(this)},createIcon:function(){return this._iconNeedsUpdate&&(this._iconObj=this._group.options.iconCreateFunction(this),this._iconNeedsUpdate=!1),this._iconObj.createIcon()},createShadow:function(){return this._iconObj.createShadow()},_addChild:function(t,e){this._iconNeedsUpdate=!0,this._boundsNeedUpdate=!0,this._setClusterCenter(t),t instanceof L.MarkerCluster?(e||(this._childClusters.push(t),t.__parent=this),this._childCount+=t._childCount):(e||this._markers.push(t),this._childCount++),this.__parent&&this.__parent._addChild(t,!0)},_setClusterCenter:function(t){this._cLatLng||(this._cLatLng=t._cLatLng||t._latlng)},_resetBounds:function(){var t=this._bounds;t._southWest&&(t._southWest.lat=1/0,t._southWest.lng=1/0),t._northEast&&(t._northEast.lat=-1/0,t._northEast.lng=-1/0)},_recalculateBounds:function(){var t,e,i,n,s=this._markers,r=this._childClusters,o=0,a=0,h=this._childCount;if(0!==h){for(this._resetBounds(),t=0;t<s.length;t++)i=s[t]._latlng,this._bounds.extend(i),o+=i.lat,a+=i.lng;for(t=0;t<r.length;t++)e=r[t],e._boundsNeedUpdate&&e._recalculateBounds(),this._bounds.extend(e._bounds),i=e._wLatLng,n=e._childCount,o+=i.lat*n,a+=i.lng*n;this._latlng=this._wLatLng=new L.LatLng(o/h,a/h),this._boundsNeedUpdate=!1}},_addToMap:function(t){t&&(this._backupLatlng=this._latlng,this.setLatLng(t)),this._group._featureGroup.addLayer(this)},_recursivelyAnimateChildrenIn:function(t,e,i){this._recursively(t,0,i-1,function(t){var i,n,s=t._markers;for(i=s.length-1;i>=0;i--)n=s[i],n._icon&&(n._setPos(e),n.clusterHide())},function(t){var i,n,s=t._childClusters;for(i=s.length-1;i>=0;i--)n=s[i],n._icon&&(n._setPos(e),n.clusterHide())})},_recursivelyAnimateChildrenInAndAddSelfToMap:function(t,e,i){this._recursively(t,i,0,function(n){n._recursivelyAnimateChildrenIn(t,n._group._map.latLngToLayerPoint(n.getLatLng()).round(),e),n._isSingleParent()&&e-1===i?(n.clusterShow(),n._recursivelyRemoveChildrenFromMap(t,e)):n.clusterHide(),n._addToMap()})},_recursivelyBecomeVisible:function(t,e){this._recursively(t,0,e,null,function(t){t.clusterShow()})},_recursivelyAddChildrenToMap:function(t,e,i){this._recursively(i,-1,e,function(n){if(e!==n._zoom)for(var s=n._markers.length-1;s>=0;s--){var r=n._markers[s];i.contains(r._latlng)&&(t&&(r._backupLatlng=r.getLatLng(),r.setLatLng(t),r.clusterHide&&r.clusterHide()),n._group._featureGroup.addLayer(r))}},function(e){e._addToMap(t)})},_recursivelyRestoreChildPositions:function(t){for(var e=this._markers.length-1;e>=0;e--){var i=this._markers[e];i._backupLatlng&&(i.setLatLng(i._backupLatlng),delete i._backupLatlng)}if(t-1===this._zoom)for(var n=this._childClusters.length-1;n>=0;n--)this._childClusters[n]._restorePosition();else for(var s=this._childClusters.length-1;s>=0;s--)this._childClusters[s]._recursivelyRestoreChildPositions(t)},_restorePosition:function(){this._backupLatlng&&(this.setLatLng(this._backupLatlng),delete this._backupLatlng)},_recursivelyRemoveChildrenFromMap:function(t,e,i){var n,s;this._recursively(t,-1,e-1,function(t){for(s=t._markers.length-1;s>=0;s--)n=t._markers[s],i&&i.contains(n._latlng)||(t._group._featureGroup.removeLayer(n),n.clusterShow&&n.clusterShow())},function(t){for(s=t._childClusters.length-1;s>=0;s--)n=t._childClusters[s],i&&i.contains(n._latlng)||(t._group._featureGroup.removeLayer(n),n.clusterShow&&n.clusterShow())})},_recursively:function(t,e,i,n,s){var r,o,a=this._childClusters,h=this._zoom;if(e>h)for(r=a.length-1;r>=0;r--)o=a[r],t.intersects(o._bounds)&&o._recursively(t,e,i,n,s);else if(n&&n(this),s&&this._zoom===i&&s(this),i>h)for(r=a.length-1;r>=0;r--)o=a[r],t.intersects(o._bounds)&&o._recursively(t,e,i,n,s)},_isSingleParent:function(){return this._childClusters.length>0&&this._childClusters[0]._childCount===this._childCount}}),L.Marker.include({clusterHide:function(){return this.options.opacityWhenUnclustered=this.options.opacity||1,this.setOpacity(0)},clusterShow:function(){var t=this.setOpacity(this.options.opacity||this.options.opacityWhenUnclustered);return delete this.options.opacityWhenUnclustered,t}}),L.DistanceGrid=function(t){this._cellSize=t,this._sqCellSize=t*t,this._grid={},this._objectPoint={}},L.DistanceGrid.prototype={addObject:function(t,e){var i=this._getCoord(e.x),n=this._getCoord(e.y),s=this._grid,r=s[n]=s[n]||{},o=r[i]=r[i]||[],a=L.Util.stamp(t);this._objectPoint[a]=e,o.push(t)},updateObject:function(t,e){this.removeObject(t),this.addObject(t,e)},removeObject:function(t,e){var i,n,s=this._getCoord(e.x),r=this._getCoord(e.y),o=this._grid,a=o[r]=o[r]||{},h=a[s]=a[s]||[];for(delete this._objectPoint[L.Util.stamp(t)],i=0,n=h.length;n>i;i++)if(h[i]===t)return h.splice(i,1),1===n&&delete a[s],!0},eachObject:function(t,e){var i,n,s,r,o,a,h,u=this._grid;for(i in u){o=u[i];for(n in o)for(a=o[n],s=0,r=a.length;r>s;s++)h=t.call(e,a[s]),h&&(s--,r--)}},getNearObject:function(t){var e,i,n,s,r,o,a,h,u=this._getCoord(t.x),_=this._getCoord(t.y),l=this._objectPoint,d=this._sqCellSize,c=null;for(e=_-1;_+1>=e;e++)if(s=this._grid[e])for(i=u-1;u+1>=i;i++)if(r=s[i])for(n=0,o=r.length;o>n;n++)a=r[n],h=this._sqDist(l[L.Util.stamp(a)],t),d>h&&(d=h,c=a);return c},_getCoord:function(t){return Math.floor(t/this._cellSize)},_sqDist:function(t,e){var i=e.x-t.x,n=e.y-t.y;return i*i+n*n}},function(){L.QuickHull={getDistant:function(t,e){var i=e[1].lat-e[0].lat,n=e[0].lng-e[1].lng;return n*(t.lat-e[0].lat)+i*(t.lng-e[0].lng)},findMostDistantPointFromBaseLine:function(t,e){var i,n,s,r=0,o=null,a=[];for(i=e.length-1;i>=0;i--)n=e[i],s=this.getDistant(n,t),s>0&&(a.push(n),s>r&&(r=s,o=n));return{maxPoint:o,newPoints:a}},buildConvexHull:function(t,e){var i=[],n=this.findMostDistantPointFromBaseLine(t,e);return n.maxPoint?(i=i.concat(this.buildConvexHull([t[0],n.maxPoint],n.newPoints)),i=i.concat(this.buildConvexHull([n.maxPoint,t[1]],n.newPoints))):[t[0]]},getConvexHull:function(t){var e,i=!1,n=!1,s=!1,r=!1,o=null,a=null,h=null,u=null,_=null,l=null;for(e=t.length-1;e>=0;e--){var d=t[e];(i===!1||d.lat>i)&&(o=d,i=d.lat),(n===!1||d.lat<n)&&(a=d,n=d.lat),(s===!1||d.lng>s)&&(h=d,s=d.lng),(r===!1||d.lng<r)&&(u=d,r=d.lng)}n!==i?(l=a,_=o):(l=u,_=h);var c=[].concat(this.buildConvexHull([l,_],t),this.buildConvexHull([_,l],t));return c}}}(),L.MarkerCluster.include({getConvexHull:function(){var t,e,i=this.getAllChildMarkers(),n=[];for(e=i.length-1;e>=0;e--)t=i[e].getLatLng(),n.push(t);return L.QuickHull.getConvexHull(n)}}),L.MarkerCluster.include({_2PI:2*Math.PI,_circleFootSeparation:25,_circleStartAngle:Math.PI/6,_spiralFootSeparation:28,_spiralLengthStart:11,_spiralLengthFactor:5,_circleSpiralSwitchover:9,spiderfy:function(){if(this._group._spiderfied!==this&&!this._group._inZoomAnimation){var t,e=this.getAllChildMarkers(),i=this._group,n=i._map,s=n.latLngToLayerPoint(this._latlng);this._group._unspiderfy(),this._group._spiderfied=this,e.length>=this._circleSpiralSwitchover?t=this._generatePointsSpiral(e.length,s):(s.y+=10,t=this._generatePointsCircle(e.length,s)),this._animationSpiderfy(e,t)}},unspiderfy:function(t){this._group._inZoomAnimation||(this._animationUnspiderfy(t),this._group._spiderfied=null)},_generatePointsCircle:function(t,e){var i,n,s=this._group.options.spiderfyDistanceMultiplier*this._circleFootSeparation*(2+t),r=s/this._2PI,o=this._2PI/t,a=[];for(a.length=t,i=t-1;i>=0;i--)n=this._circleStartAngle+i*o,a[i]=new L.Point(e.x+r*Math.cos(n),e.y+r*Math.sin(n))._round();return a},_generatePointsSpiral:function(t,e){var i,n=this._group.options.spiderfyDistanceMultiplier,s=n*this._spiralLengthStart,r=n*this._spiralFootSeparation,o=n*this._spiralLengthFactor*this._2PI,a=0,h=[];for(h.length=t,i=t-1;i>=0;i--)a+=r/s+5e-4*i,h[i]=new L.Point(e.x+s*Math.cos(a),e.y+s*Math.sin(a))._round(),s+=o/a;return h},_noanimationUnspiderfy:function(){var t,e,i=this._group,n=i._map,s=i._featureGroup,r=this.getAllChildMarkers();for(this.setOpacity(1),e=r.length-1;e>=0;e--)t=r[e],s.removeLayer(t),t._preSpiderfyLatlng&&(t.setLatLng(t._preSpiderfyLatlng),delete t._preSpiderfyLatlng),t.setZIndexOffset&&t.setZIndexOffset(0),t._spiderLeg&&(n.removeLayer(t._spiderLeg),delete t._spiderLeg);i.fire("unspiderfied",{cluster:this,markers:r}),i._spiderfied=null}}),L.MarkerClusterNonAnimated=L.MarkerCluster.extend({_animationSpiderfy:function(t,e){var i,n,s,r,o=this._group,a=o._map,h=o._featureGroup,u=this._group.options.spiderLegPolylineOptions;for(i=0;i<t.length;i++)r=a.layerPointToLatLng(e[i]),n=t[i],s=new L.Polyline([this._latlng,r],u),a.addLayer(s),n._spiderLeg=s,n._preSpiderfyLatlng=n._latlng,n.setLatLng(r),n.setZIndexOffset&&n.setZIndexOffset(1e6),h.addLayer(n);this.setOpacity(.3),o.fire("spiderfied",{cluster:this,markers:t})},_animationUnspiderfy:function(){this._noanimationUnspiderfy()}}),L.MarkerCluster.include({_animationSpiderfy:function(t,e){var n,s,r,o,a,h,u=this,_=this._group,l=_._map,d=_._featureGroup,c=this._latlng,p=l.latLngToLayerPoint(c),f=L.Path.SVG,m=L.extend({},this._group.options.spiderLegPolylineOptions),g=m.opacity;for(g===i&&(g=L.MarkerClusterGroup.prototype.options.spiderLegPolylineOptions.opacity),f?(m.opacity=0,m.className=(m.className||"")+" leaflet-cluster-spider-leg"):m.opacity=g,n=0;n<t.length;n++)s=t[n],h=l.layerPointToLatLng(e[n]),r=new L.Polyline([c,h],m),l.addLayer(r),s._spiderLeg=r,f&&(o=r._path,a=o.getTotalLength()+.1,o.style.strokeDasharray=a,o.style.strokeDashoffset=a),s.setZIndexOffset&&s.setZIndexOffset(1e6),s.clusterHide&&s.clusterHide(),d.addLayer(s),s._setPos&&s._setPos(p);for(_._forceLayout(),_._animationStart(),n=t.length-1;n>=0;n--)h=l.layerPointToLatLng(e[n]),s=t[n],s._preSpiderfyLatlng=s._latlng,s.setLatLng(h),s.clusterShow&&s.clusterShow(),f&&(r=s._spiderLeg,o=r._path,o.style.strokeDashoffset=0,r.setStyle({opacity:g}));this.setOpacity(.3),setTimeout(function(){_._animationEnd(),_.fire("spiderfied",{cluster:u,markers:t})},200)},_animationUnspiderfy:function(t){var e,i,n,s,r,o,a=this,h=this._group,u=h._map,_=h._featureGroup,l=t?u._latLngToNewLayerPoint(this._latlng,t.zoom,t.center):u.latLngToLayerPoint(this._latlng),d=this.getAllChildMarkers(),c=L.Path.SVG;for(h._animationStart(),this.setOpacity(1),i=d.length-1;i>=0;i--)e=d[i],e._preSpiderfyLatlng&&(e.setLatLng(e._preSpiderfyLatlng),delete e._preSpiderfyLatlng,o=!0,e._setPos&&(e._setPos(l),o=!1),e.clusterHide&&(e.clusterHide(),o=!1),o&&_.removeLayer(e),c&&(n=e._spiderLeg,s=n._path,r=s.getTotalLength()+.1,s.style.strokeDashoffset=r,n.setStyle({opacity:0})));setTimeout(function(){var t=0;for(i=d.length-1;i>=0;i--)e=d[i],e._spiderLeg&&t++;for(i=d.length-1;i>=0;i--)e=d[i],e._spiderLeg&&(e.clusterShow&&e.clusterShow(),e.setZIndexOffset&&e.setZIndexOffset(0),t>1&&_.removeLayer(e),u.removeLayer(e._spiderLeg),delete e._spiderLeg);h._animationEnd(),h.fire("unspiderfied",{cluster:a,markers:d})},200)}}),L.MarkerClusterGroup.include({_spiderfied:null,_spiderfierOnAdd:function(){this._map.on("click",this._unspiderfyWrapper,this),this._map.options.zoomAnimation&&this._map.on("zoomstart",this._unspiderfyZoomStart,this),this._map.on("zoomend",this._noanimationUnspiderfy,this)},_spiderfierOnRemove:function(){this._map.off("click",this._unspiderfyWrapper,this),this._map.off("zoomstart",this._unspiderfyZoomStart,this),this._map.off("zoomanim",this._unspiderfyZoomAnim,this),this._map.off("zoomend",this._noanimationUnspiderfy,this),this._noanimationUnspiderfy()},_unspiderfyZoomStart:function(){this._map&&this._map.on("zoomanim",this._unspiderfyZoomAnim,this)},_unspiderfyZoomAnim:function(t){L.DomUtil.hasClass(this._map._mapPane,"leaflet-touching")||(this._map.off("zoomanim",this._unspiderfyZoomAnim,this),this._unspiderfy(t))},_unspiderfyWrapper:function(){this._unspiderfy()},_unspiderfy:function(t){this._spiderfied&&this._spiderfied.unspiderfy(t)},_noanimationUnspiderfy:function(){this._spiderfied&&this._spiderfied._noanimationUnspiderfy()},_unspiderfyLayer:function(t){t._spiderLeg&&(this._featureGroup.removeLayer(t),t.clusterShow&&t.clusterShow(),t.setZIndexOffset&&t.setZIndexOffset(0),this._map.removeLayer(t._spiderLeg),delete t._spiderLeg)}}),L.MarkerClusterGroup.include({refreshClusters:function(t){return t?t instanceof L.MarkerClusterGroup?t=t._topClusterLevel.getAllChildMarkers():t instanceof L.LayerGroup?t=t._layers:t instanceof L.MarkerCluster?t=t.getAllChildMarkers():t instanceof L.Marker&&(t=[t]):t=this._topClusterLevel.getAllChildMarkers(),this._flagParentsIconsNeedUpdate(t),this._refreshClustersIcons(),this.options.singleMarkerMode&&this._refreshSingleMarkerModeMarkers(t),this},_flagParentsIconsNeedUpdate:function(t){var e,i;for(e in t)for(i=t[e].__parent;i;)i._iconNeedsUpdate=!0,i=i.__parent},_refreshClustersIcons:function(){this._featureGroup.eachLayer(function(t){t instanceof L.MarkerCluster&&t._iconNeedsUpdate&&t._updateIcon()})},_refreshSingleMarkerModeMarkers:function(t){var e,i;for(e in t)i=t[e],this.hasLayer(i)&&i.setIcon(this._overrideMarkerIcon(i))}}),L.Marker.include({refreshIconOptions:function(t,e){var i=this.options.icon;return L.setOptions(i,t),this.setIcon(i),e&&this.__parent&&this.__parent._group.refreshClusters(this),this}})}(window,document);
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet.markercluster/dist/leaflet.markercluster.js","/node_modules/leaflet.markercluster/dist")

},{"_process":48,"buffer":13}],44:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/*
 Leaflet, a JavaScript library for mobile-friendly interactive maps. http://leafletjs.com
 (c) 2010-2013, Vladimir Agafonkin
 (c) 2010-2011, CloudMade
*/
(function (window, document, undefined) {

var oldL = window.L,

    L = {};



L.version = '0.7.7';



// define Leaflet for Node module pattern loaders, including Browserify

if (typeof module === 'object' && typeof module.exports === 'object') {

	module.exports = L;



// define Leaflet as an AMD module

} else if (typeof define === 'function' && define.amd) {

	define(L);

}



// define Leaflet as a global L variable, saving the original L to restore later if needed



L.noConflict = function () {

	window.L = oldL;

	return this;

};



window.L = L;



/*

 * L.Util contains various utility functions used throughout Leaflet code.

 */



L.Util = {

	extend: function (dest) { // (Object[, Object, ...]) ->

		var sources = Array.prototype.slice.call(arguments, 1),

		    i, j, len, src;



		for (j = 0, len = sources.length; j < len; j++) {

			src = sources[j] || {};

			for (i in src) {

				if (src.hasOwnProperty(i)) {

					dest[i] = src[i];

				}

			}

		}

		return dest;

	},



	bind: function (fn, obj) { // (Function, Object) -> Function

		var args = arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : null;

		return function () {

			return fn.apply(obj, args || arguments);

		};

	},



	stamp: (function () {

		var lastId = 0,

		    key = '_leaflet_id';

		return function (obj) {

			obj[key] = obj[key] || ++lastId;

			return obj[key];

		};

	}()),



	invokeEach: function (obj, method, context) {

		var i, args;



		if (typeof obj === 'object') {

			args = Array.prototype.slice.call(arguments, 3);



			for (i in obj) {

				method.apply(context, [i, obj[i]].concat(args));

			}

			return true;

		}



		return false;

	},



	limitExecByInterval: function (fn, time, context) {

		var lock, execOnUnlock;



		return function wrapperFn() {

			var args = arguments;



			if (lock) {

				execOnUnlock = true;

				return;

			}



			lock = true;



			setTimeout(function () {

				lock = false;



				if (execOnUnlock) {

					wrapperFn.apply(context, args);

					execOnUnlock = false;

				}

			}, time);



			fn.apply(context, args);

		};

	},



	falseFn: function () {

		return false;

	},



	formatNum: function (num, digits) {

		var pow = Math.pow(10, digits || 5);

		return Math.round(num * pow) / pow;

	},



	trim: function (str) {

		return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');

	},



	splitWords: function (str) {

		return L.Util.trim(str).split(/\s+/);

	},



	setOptions: function (obj, options) {

		obj.options = L.extend({}, obj.options, options);

		return obj.options;

	},



	getParamString: function (obj, existingUrl, uppercase) {

		var params = [];

		for (var i in obj) {

			params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));

		}

		return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');

	},

	template: function (str, data) {

		return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {

			var value = data[key];

			if (value === undefined) {

				throw new Error('No value provided for variable ' + str);

			} else if (typeof value === 'function') {

				value = value(data);

			}

			return value;

		});

	},



	isArray: Array.isArray || function (obj) {

		return (Object.prototype.toString.call(obj) === '[object Array]');

	},



	emptyImageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

};



(function () {



	// inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/



	function getPrefixed(name) {

		var i, fn,

		    prefixes = ['webkit', 'moz', 'o', 'ms'];



		for (i = 0; i < prefixes.length && !fn; i++) {

			fn = window[prefixes[i] + name];

		}



		return fn;

	}



	var lastTime = 0;



	function timeoutDefer(fn) {

		var time = +new Date(),

		    timeToCall = Math.max(0, 16 - (time - lastTime));



		lastTime = time + timeToCall;

		return window.setTimeout(fn, timeToCall);

	}



	var requestFn = window.requestAnimationFrame ||

	        getPrefixed('RequestAnimationFrame') || timeoutDefer;



	var cancelFn = window.cancelAnimationFrame ||

	        getPrefixed('CancelAnimationFrame') ||

	        getPrefixed('CancelRequestAnimationFrame') ||

	        function (id) { window.clearTimeout(id); };





	L.Util.requestAnimFrame = function (fn, context, immediate, element) {

		fn = L.bind(fn, context);



		if (immediate && requestFn === timeoutDefer) {

			fn();

		} else {

			return requestFn.call(window, fn, element);

		}

	};



	L.Util.cancelAnimFrame = function (id) {

		if (id) {

			cancelFn.call(window, id);

		}

	};



}());



// shortcuts for most used utility functions

L.extend = L.Util.extend;

L.bind = L.Util.bind;

L.stamp = L.Util.stamp;

L.setOptions = L.Util.setOptions;



/*

 * L.Class powers the OOP facilities of the library.

 * Thanks to John Resig and Dean Edwards for inspiration!

 */



L.Class = function () {};



L.Class.extend = function (props) {



	// extended class with the new prototype

	var NewClass = function () {



		// call the constructor

		if (this.initialize) {

			this.initialize.apply(this, arguments);

		}



		// call all constructor hooks

		if (this._initHooks) {

			this.callInitHooks();

		}

	};



	// instantiate class without calling constructor

	var F = function () {};

	F.prototype = this.prototype;



	var proto = new F();

	proto.constructor = NewClass;



	NewClass.prototype = proto;



	//inherit parent's statics

	for (var i in this) {

		if (this.hasOwnProperty(i) && i !== 'prototype') {

			NewClass[i] = this[i];

		}

	}



	// mix static properties into the class

	if (props.statics) {

		L.extend(NewClass, props.statics);

		delete props.statics;

	}



	// mix includes into the prototype

	if (props.includes) {

		L.Util.extend.apply(null, [proto].concat(props.includes));

		delete props.includes;

	}



	// merge options

	if (props.options && proto.options) {

		props.options = L.extend({}, proto.options, props.options);

	}



	// mix given properties into the prototype

	L.extend(proto, props);



	proto._initHooks = [];



	var parent = this;

	// jshint camelcase: false

	NewClass.__super__ = parent.prototype;



	// add method for calling all hooks

	proto.callInitHooks = function () {



		if (this._initHooksCalled) { return; }



		if (parent.prototype.callInitHooks) {

			parent.prototype.callInitHooks.call(this);

		}



		this._initHooksCalled = true;



		for (var i = 0, len = proto._initHooks.length; i < len; i++) {

			proto._initHooks[i].call(this);

		}

	};



	return NewClass;

};





// method for adding properties to prototype

L.Class.include = function (props) {

	L.extend(this.prototype, props);

};



// merge new default options to the Class

L.Class.mergeOptions = function (options) {

	L.extend(this.prototype.options, options);

};



// add a constructor hook

L.Class.addInitHook = function (fn) { // (Function) || (String, args...)

	var args = Array.prototype.slice.call(arguments, 1);



	var init = typeof fn === 'function' ? fn : function () {

		this[fn].apply(this, args);

	};



	this.prototype._initHooks = this.prototype._initHooks || [];

	this.prototype._initHooks.push(init);

};



/*

 * L.Mixin.Events is used to add custom events functionality to Leaflet classes.

 */



var eventsKey = '_leaflet_events';



L.Mixin = {};



L.Mixin.Events = {



	addEventListener: function (types, fn, context) { // (String, Function[, Object]) or (Object[, Object])



		// types can be a map of types/handlers

		if (L.Util.invokeEach(types, this.addEventListener, this, fn, context)) { return this; }



		var events = this[eventsKey] = this[eventsKey] || {},

		    contextId = context && context !== this && L.stamp(context),

		    i, len, event, type, indexKey, indexLenKey, typeIndex;



		// types can be a string of space-separated words

		types = L.Util.splitWords(types);



		for (i = 0, len = types.length; i < len; i++) {

			event = {

				action: fn,

				context: context || this

			};

			type = types[i];



			if (contextId) {

				// store listeners of a particular context in a separate hash (if it has an id)

				// gives a major performance boost when removing thousands of map layers



				indexKey = type + '_idx';

				indexLenKey = indexKey + '_len';



				typeIndex = events[indexKey] = events[indexKey] || {};



				if (!typeIndex[contextId]) {

					typeIndex[contextId] = [];



					// keep track of the number of keys in the index to quickly check if it's empty

					events[indexLenKey] = (events[indexLenKey] || 0) + 1;

				}



				typeIndex[contextId].push(event);





			} else {

				events[type] = events[type] || [];

				events[type].push(event);

			}

		}



		return this;

	},



	hasEventListeners: function (type) { // (String) -> Boolean

		var events = this[eventsKey];

		return !!events && ((type in events && events[type].length > 0) ||

		                    (type + '_idx' in events && events[type + '_idx_len'] > 0));

	},



	removeEventListener: function (types, fn, context) { // ([String, Function, Object]) or (Object[, Object])



		if (!this[eventsKey]) {

			return this;

		}



		if (!types) {

			return this.clearAllEventListeners();

		}



		if (L.Util.invokeEach(types, this.removeEventListener, this, fn, context)) { return this; }



		var events = this[eventsKey],

		    contextId = context && context !== this && L.stamp(context),

		    i, len, type, listeners, j, indexKey, indexLenKey, typeIndex, removed;



		types = L.Util.splitWords(types);



		for (i = 0, len = types.length; i < len; i++) {

			type = types[i];

			indexKey = type + '_idx';

			indexLenKey = indexKey + '_len';



			typeIndex = events[indexKey];



			if (!fn) {

				// clear all listeners for a type if function isn't specified

				delete events[type];

				delete events[indexKey];

				delete events[indexLenKey];



			} else {

				listeners = contextId && typeIndex ? typeIndex[contextId] : events[type];



				if (listeners) {

					for (j = listeners.length - 1; j >= 0; j--) {

						if ((listeners[j].action === fn) && (!context || (listeners[j].context === context))) {

							removed = listeners.splice(j, 1);

							// set the old action to a no-op, because it is possible

							// that the listener is being iterated over as part of a dispatch

							removed[0].action = L.Util.falseFn;

						}

					}



					if (context && typeIndex && (listeners.length === 0)) {

						delete typeIndex[contextId];

						events[indexLenKey]--;

					}

				}

			}

		}



		return this;

	},



	clearAllEventListeners: function () {

		delete this[eventsKey];

		return this;

	},



	fireEvent: function (type, data) { // (String[, Object])

		if (!this.hasEventListeners(type)) {

			return this;

		}



		var event = L.Util.extend({}, data, { type: type, target: this });



		var events = this[eventsKey],

		    listeners, i, len, typeIndex, contextId;



		if (events[type]) {

			// make sure adding/removing listeners inside other listeners won't cause infinite loop

			listeners = events[type].slice();



			for (i = 0, len = listeners.length; i < len; i++) {

				listeners[i].action.call(listeners[i].context, event);

			}

		}



		// fire event for the context-indexed listeners as well

		typeIndex = events[type + '_idx'];



		for (contextId in typeIndex) {

			listeners = typeIndex[contextId].slice();



			if (listeners) {

				for (i = 0, len = listeners.length; i < len; i++) {

					listeners[i].action.call(listeners[i].context, event);

				}

			}

		}



		return this;

	},



	addOneTimeEventListener: function (types, fn, context) {



		if (L.Util.invokeEach(types, this.addOneTimeEventListener, this, fn, context)) { return this; }



		var handler = L.bind(function () {

			this

			    .removeEventListener(types, fn, context)

			    .removeEventListener(types, handler, context);

		}, this);



		return this

		    .addEventListener(types, fn, context)

		    .addEventListener(types, handler, context);

	}

};



L.Mixin.Events.on = L.Mixin.Events.addEventListener;

L.Mixin.Events.off = L.Mixin.Events.removeEventListener;

L.Mixin.Events.once = L.Mixin.Events.addOneTimeEventListener;

L.Mixin.Events.fire = L.Mixin.Events.fireEvent;



/*

 * L.Browser handles different browser and feature detections for internal Leaflet use.

 */



(function () {



	var ie = 'ActiveXObject' in window,

		ielt9 = ie && !document.addEventListener,



	    // terrible browser detection to work around Safari / iOS / Android browser bugs

	    ua = navigator.userAgent.toLowerCase(),

	    webkit = ua.indexOf('webkit') !== -1,

	    chrome = ua.indexOf('chrome') !== -1,

	    phantomjs = ua.indexOf('phantom') !== -1,

	    android = ua.indexOf('android') !== -1,

	    android23 = ua.search('android [23]') !== -1,

		gecko = ua.indexOf('gecko') !== -1,



	    mobile = typeof orientation !== undefined + '',

	    msPointer = !window.PointerEvent && window.MSPointerEvent,

		pointer = (window.PointerEvent && window.navigator.pointerEnabled) ||

				  msPointer,

	    retina = ('devicePixelRatio' in window && window.devicePixelRatio > 1) ||

	             ('matchMedia' in window && window.matchMedia('(min-resolution:144dpi)') &&

	              window.matchMedia('(min-resolution:144dpi)').matches),



	    doc = document.documentElement,

	    ie3d = ie && ('transition' in doc.style),

	    webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,

	    gecko3d = 'MozPerspective' in doc.style,

	    opera3d = 'OTransition' in doc.style,

	    any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d || opera3d) && !phantomjs;



	var touch = !window.L_NO_TOUCH && !phantomjs && (pointer || 'ontouchstart' in window ||

		(window.DocumentTouch && document instanceof window.DocumentTouch));



	L.Browser = {

		ie: ie,

		ielt9: ielt9,

		webkit: webkit,

		gecko: gecko && !webkit && !window.opera && !ie,



		android: android,

		android23: android23,



		chrome: chrome,



		ie3d: ie3d,

		webkit3d: webkit3d,

		gecko3d: gecko3d,

		opera3d: opera3d,

		any3d: any3d,



		mobile: mobile,

		mobileWebkit: mobile && webkit,

		mobileWebkit3d: mobile && webkit3d,

		mobileOpera: mobile && window.opera,



		touch: touch,

		msPointer: msPointer,

		pointer: pointer,



		retina: retina

	};



}());



/*

 * L.Point represents a point with x and y coordinates.

 */



L.Point = function (/*Number*/ x, /*Number*/ y, /*Boolean*/ round) {

	this.x = (round ? Math.round(x) : x);

	this.y = (round ? Math.round(y) : y);

};



L.Point.prototype = {



	clone: function () {

		return new L.Point(this.x, this.y);

	},



	// non-destructive, returns a new point

	add: function (point) {

		return this.clone()._add(L.point(point));

	},



	// destructive, used directly for performance in situations where it's safe to modify existing point

	_add: function (point) {

		this.x += point.x;

		this.y += point.y;

		return this;

	},



	subtract: function (point) {

		return this.clone()._subtract(L.point(point));

	},



	_subtract: function (point) {

		this.x -= point.x;

		this.y -= point.y;

		return this;

	},



	divideBy: function (num) {

		return this.clone()._divideBy(num);

	},



	_divideBy: function (num) {

		this.x /= num;

		this.y /= num;

		return this;

	},



	multiplyBy: function (num) {

		return this.clone()._multiplyBy(num);

	},



	_multiplyBy: function (num) {

		this.x *= num;

		this.y *= num;

		return this;

	},



	round: function () {

		return this.clone()._round();

	},



	_round: function () {

		this.x = Math.round(this.x);

		this.y = Math.round(this.y);

		return this;

	},



	floor: function () {

		return this.clone()._floor();

	},



	_floor: function () {

		this.x = Math.floor(this.x);

		this.y = Math.floor(this.y);

		return this;

	},



	distanceTo: function (point) {

		point = L.point(point);



		var x = point.x - this.x,

		    y = point.y - this.y;



		return Math.sqrt(x * x + y * y);

	},



	equals: function (point) {

		point = L.point(point);



		return point.x === this.x &&

		       point.y === this.y;

	},



	contains: function (point) {

		point = L.point(point);



		return Math.abs(point.x) <= Math.abs(this.x) &&

		       Math.abs(point.y) <= Math.abs(this.y);

	},



	toString: function () {

		return 'Point(' +

		        L.Util.formatNum(this.x) + ', ' +

		        L.Util.formatNum(this.y) + ')';

	}

};



L.point = function (x, y, round) {

	if (x instanceof L.Point) {

		return x;

	}

	if (L.Util.isArray(x)) {

		return new L.Point(x[0], x[1]);

	}

	if (x === undefined || x === null) {

		return x;

	}

	return new L.Point(x, y, round);

};



/*

 * L.Bounds represents a rectangular area on the screen in pixel coordinates.

 */



L.Bounds = function (a, b) { //(Point, Point) or Point[]

	if (!a) { return; }



	var points = b ? [a, b] : a;



	for (var i = 0, len = points.length; i < len; i++) {

		this.extend(points[i]);

	}

};



L.Bounds.prototype = {

	// extend the bounds to contain the given point

	extend: function (point) { // (Point)

		point = L.point(point);



		if (!this.min && !this.max) {

			this.min = point.clone();

			this.max = point.clone();

		} else {

			this.min.x = Math.min(point.x, this.min.x);

			this.max.x = Math.max(point.x, this.max.x);

			this.min.y = Math.min(point.y, this.min.y);

			this.max.y = Math.max(point.y, this.max.y);

		}

		return this;

	},



	getCenter: function (round) { // (Boolean) -> Point

		return new L.Point(

		        (this.min.x + this.max.x) / 2,

		        (this.min.y + this.max.y) / 2, round);

	},



	getBottomLeft: function () { // -> Point

		return new L.Point(this.min.x, this.max.y);

	},



	getTopRight: function () { // -> Point

		return new L.Point(this.max.x, this.min.y);

	},



	getSize: function () {

		return this.max.subtract(this.min);

	},



	contains: function (obj) { // (Bounds) or (Point) -> Boolean

		var min, max;



		if (typeof obj[0] === 'number' || obj instanceof L.Point) {

			obj = L.point(obj);

		} else {

			obj = L.bounds(obj);

		}



		if (obj instanceof L.Bounds) {

			min = obj.min;

			max = obj.max;

		} else {

			min = max = obj;

		}



		return (min.x >= this.min.x) &&

		       (max.x <= this.max.x) &&

		       (min.y >= this.min.y) &&

		       (max.y <= this.max.y);

	},



	intersects: function (bounds) { // (Bounds) -> Boolean

		bounds = L.bounds(bounds);



		var min = this.min,

		    max = this.max,

		    min2 = bounds.min,

		    max2 = bounds.max,

		    xIntersects = (max2.x >= min.x) && (min2.x <= max.x),

		    yIntersects = (max2.y >= min.y) && (min2.y <= max.y);



		return xIntersects && yIntersects;

	},



	isValid: function () {

		return !!(this.min && this.max);

	}

};



L.bounds = function (a, b) { // (Bounds) or (Point, Point) or (Point[])

	if (!a || a instanceof L.Bounds) {

		return a;

	}

	return new L.Bounds(a, b);

};



/*

 * L.Transformation is an utility class to perform simple point transformations through a 2d-matrix.

 */



L.Transformation = function (a, b, c, d) {

	this._a = a;

	this._b = b;

	this._c = c;

	this._d = d;

};



L.Transformation.prototype = {

	transform: function (point, scale) { // (Point, Number) -> Point

		return this._transform(point.clone(), scale);

	},



	// destructive transform (faster)

	_transform: function (point, scale) {

		scale = scale || 1;

		point.x = scale * (this._a * point.x + this._b);

		point.y = scale * (this._c * point.y + this._d);

		return point;

	},



	untransform: function (point, scale) {

		scale = scale || 1;

		return new L.Point(

		        (point.x / scale - this._b) / this._a,

		        (point.y / scale - this._d) / this._c);

	}

};



/*

 * L.DomUtil contains various utility functions for working with DOM.

 */



L.DomUtil = {

	get: function (id) {

		return (typeof id === 'string' ? document.getElementById(id) : id);

	},



	getStyle: function (el, style) {



		var value = el.style[style];



		if (!value && el.currentStyle) {

			value = el.currentStyle[style];

		}



		if ((!value || value === 'auto') && document.defaultView) {

			var css = document.defaultView.getComputedStyle(el, null);

			value = css ? css[style] : null;

		}



		return value === 'auto' ? null : value;

	},



	getViewportOffset: function (element) {



		var top = 0,

		    left = 0,

		    el = element,

		    docBody = document.body,

		    docEl = document.documentElement,

		    pos;



		do {

			top  += el.offsetTop  || 0;

			left += el.offsetLeft || 0;



			//add borders

			top += parseInt(L.DomUtil.getStyle(el, 'borderTopWidth'), 10) || 0;

			left += parseInt(L.DomUtil.getStyle(el, 'borderLeftWidth'), 10) || 0;



			pos = L.DomUtil.getStyle(el, 'position');



			if (el.offsetParent === docBody && pos === 'absolute') { break; }



			if (pos === 'fixed') {

				top  += docBody.scrollTop  || docEl.scrollTop  || 0;

				left += docBody.scrollLeft || docEl.scrollLeft || 0;

				break;

			}



			if (pos === 'relative' && !el.offsetLeft) {

				var width = L.DomUtil.getStyle(el, 'width'),

				    maxWidth = L.DomUtil.getStyle(el, 'max-width'),

				    r = el.getBoundingClientRect();



				if (width !== 'none' || maxWidth !== 'none') {

					left += r.left + el.clientLeft;

				}



				//calculate full y offset since we're breaking out of the loop

				top += r.top + (docBody.scrollTop  || docEl.scrollTop  || 0);



				break;

			}



			el = el.offsetParent;



		} while (el);



		el = element;



		do {

			if (el === docBody) { break; }



			top  -= el.scrollTop  || 0;

			left -= el.scrollLeft || 0;



			el = el.parentNode;

		} while (el);



		return new L.Point(left, top);

	},



	documentIsLtr: function () {

		if (!L.DomUtil._docIsLtrCached) {

			L.DomUtil._docIsLtrCached = true;

			L.DomUtil._docIsLtr = L.DomUtil.getStyle(document.body, 'direction') === 'ltr';

		}

		return L.DomUtil._docIsLtr;

	},



	create: function (tagName, className, container) {



		var el = document.createElement(tagName);

		el.className = className;



		if (container) {

			container.appendChild(el);

		}



		return el;

	},



	hasClass: function (el, name) {

		if (el.classList !== undefined) {

			return el.classList.contains(name);

		}

		var className = L.DomUtil._getClass(el);

		return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);

	},



	addClass: function (el, name) {

		if (el.classList !== undefined) {

			var classes = L.Util.splitWords(name);

			for (var i = 0, len = classes.length; i < len; i++) {

				el.classList.add(classes[i]);

			}

		} else if (!L.DomUtil.hasClass(el, name)) {

			var className = L.DomUtil._getClass(el);

			L.DomUtil._setClass(el, (className ? className + ' ' : '') + name);

		}

	},



	removeClass: function (el, name) {

		if (el.classList !== undefined) {

			el.classList.remove(name);

		} else {

			L.DomUtil._setClass(el, L.Util.trim((' ' + L.DomUtil._getClass(el) + ' ').replace(' ' + name + ' ', ' ')));

		}

	},



	_setClass: function (el, name) {

		if (el.className.baseVal === undefined) {

			el.className = name;

		} else {

			// in case of SVG element

			el.className.baseVal = name;

		}

	},



	_getClass: function (el) {

		return el.className.baseVal === undefined ? el.className : el.className.baseVal;

	},



	setOpacity: function (el, value) {



		if ('opacity' in el.style) {

			el.style.opacity = value;



		} else if ('filter' in el.style) {



			var filter = false,

			    filterName = 'DXImageTransform.Microsoft.Alpha';



			// filters collection throws an error if we try to retrieve a filter that doesn't exist

			try {

				filter = el.filters.item(filterName);

			} catch (e) {

				// don't set opacity to 1 if we haven't already set an opacity,

				// it isn't needed and breaks transparent pngs.

				if (value === 1) { return; }

			}



			value = Math.round(value * 100);



			if (filter) {

				filter.Enabled = (value !== 100);

				filter.Opacity = value;

			} else {

				el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';

			}

		}

	},



	testProp: function (props) {



		var style = document.documentElement.style;



		for (var i = 0; i < props.length; i++) {

			if (props[i] in style) {

				return props[i];

			}

		}

		return false;

	},



	getTranslateString: function (point) {

		// on WebKit browsers (Chrome/Safari/iOS Safari/Android) using translate3d instead of translate

		// makes animation smoother as it ensures HW accel is used. Firefox 13 doesn't care

		// (same speed either way), Opera 12 doesn't support translate3d



		var is3d = L.Browser.webkit3d,

		    open = 'translate' + (is3d ? '3d' : '') + '(',

		    close = (is3d ? ',0' : '') + ')';



		return open + point.x + 'px,' + point.y + 'px' + close;

	},



	getScaleString: function (scale, origin) {



		var preTranslateStr = L.DomUtil.getTranslateString(origin.add(origin.multiplyBy(-1 * scale))),

		    scaleStr = ' scale(' + scale + ') ';



		return preTranslateStr + scaleStr;

	},



	setPosition: function (el, point, disable3D) { // (HTMLElement, Point[, Boolean])



		// jshint camelcase: false

		el._leaflet_pos = point;



		if (!disable3D && L.Browser.any3d) {

			el.style[L.DomUtil.TRANSFORM] =  L.DomUtil.getTranslateString(point);

		} else {

			el.style.left = point.x + 'px';

			el.style.top = point.y + 'px';

		}

	},



	getPosition: function (el) {

		// this method is only used for elements previously positioned using setPosition,

		// so it's safe to cache the position for performance



		// jshint camelcase: false

		return el._leaflet_pos;

	}

};





// prefix style property names



L.DomUtil.TRANSFORM = L.DomUtil.testProp(

        ['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);



// webkitTransition comes first because some browser versions that drop vendor prefix don't do

// the same for the transitionend event, in particular the Android 4.1 stock browser



L.DomUtil.TRANSITION = L.DomUtil.testProp(

        ['webkitTransition', 'transition', 'OTransition', 'MozTransition', 'msTransition']);



L.DomUtil.TRANSITION_END =

        L.DomUtil.TRANSITION === 'webkitTransition' || L.DomUtil.TRANSITION === 'OTransition' ?

        L.DomUtil.TRANSITION + 'End' : 'transitionend';



(function () {

    if ('onselectstart' in document) {

        L.extend(L.DomUtil, {

            disableTextSelection: function () {

                L.DomEvent.on(window, 'selectstart', L.DomEvent.preventDefault);

            },



            enableTextSelection: function () {

                L.DomEvent.off(window, 'selectstart', L.DomEvent.preventDefault);

            }

        });

    } else {

        var userSelectProperty = L.DomUtil.testProp(

            ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);



        L.extend(L.DomUtil, {

            disableTextSelection: function () {

                if (userSelectProperty) {

                    var style = document.documentElement.style;

                    this._userSelect = style[userSelectProperty];

                    style[userSelectProperty] = 'none';

                }

            },



            enableTextSelection: function () {

                if (userSelectProperty) {

                    document.documentElement.style[userSelectProperty] = this._userSelect;

                    delete this._userSelect;

                }

            }

        });

    }



	L.extend(L.DomUtil, {

		disableImageDrag: function () {

			L.DomEvent.on(window, 'dragstart', L.DomEvent.preventDefault);

		},



		enableImageDrag: function () {

			L.DomEvent.off(window, 'dragstart', L.DomEvent.preventDefault);

		}

	});

})();



/*

 * L.LatLng represents a geographical point with latitude and longitude coordinates.

 */



L.LatLng = function (lat, lng, alt) { // (Number, Number, Number)

	lat = parseFloat(lat);

	lng = parseFloat(lng);



	if (isNaN(lat) || isNaN(lng)) {

		throw new Error('Invalid LatLng object: (' + lat + ', ' + lng + ')');

	}



	this.lat = lat;

	this.lng = lng;



	if (alt !== undefined) {

		this.alt = parseFloat(alt);

	}

};



L.extend(L.LatLng, {

	DEG_TO_RAD: Math.PI / 180,

	RAD_TO_DEG: 180 / Math.PI,

	MAX_MARGIN: 1.0E-9 // max margin of error for the "equals" check

});



L.LatLng.prototype = {

	equals: function (obj) { // (LatLng) -> Boolean

		if (!obj) { return false; }



		obj = L.latLng(obj);



		var margin = Math.max(

		        Math.abs(this.lat - obj.lat),

		        Math.abs(this.lng - obj.lng));



		return margin <= L.LatLng.MAX_MARGIN;

	},



	toString: function (precision) { // (Number) -> String

		return 'LatLng(' +

		        L.Util.formatNum(this.lat, precision) + ', ' +

		        L.Util.formatNum(this.lng, precision) + ')';

	},



	// Haversine distance formula, see http://en.wikipedia.org/wiki/Haversine_formula

	// TODO move to projection code, LatLng shouldn't know about Earth

	distanceTo: function (other) { // (LatLng) -> Number

		other = L.latLng(other);



		var R = 6378137, // earth radius in meters

		    d2r = L.LatLng.DEG_TO_RAD,

		    dLat = (other.lat - this.lat) * d2r,

		    dLon = (other.lng - this.lng) * d2r,

		    lat1 = this.lat * d2r,

		    lat2 = other.lat * d2r,

		    sin1 = Math.sin(dLat / 2),

		    sin2 = Math.sin(dLon / 2);



		var a = sin1 * sin1 + sin2 * sin2 * Math.cos(lat1) * Math.cos(lat2);



		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	},



	wrap: function (a, b) { // (Number, Number) -> LatLng

		var lng = this.lng;



		a = a || -180;

		b = b ||  180;



		lng = (lng + b) % (b - a) + (lng < a || lng === b ? b : a);



		return new L.LatLng(this.lat, lng);

	}

};



L.latLng = function (a, b) { // (LatLng) or ([Number, Number]) or (Number, Number)

	if (a instanceof L.LatLng) {

		return a;

	}

	if (L.Util.isArray(a)) {

		if (typeof a[0] === 'number' || typeof a[0] === 'string') {

			return new L.LatLng(a[0], a[1], a[2]);

		} else {

			return null;

		}

	}

	if (a === undefined || a === null) {

		return a;

	}

	if (typeof a === 'object' && 'lat' in a) {

		return new L.LatLng(a.lat, 'lng' in a ? a.lng : a.lon);

	}

	if (b === undefined) {

		return null;

	}

	return new L.LatLng(a, b);

};





/*

 * L.LatLngBounds represents a rectangular area on the map in geographical coordinates.

 */



L.LatLngBounds = function (southWest, northEast) { // (LatLng, LatLng) or (LatLng[])

	if (!southWest) { return; }



	var latlngs = northEast ? [southWest, northEast] : southWest;



	for (var i = 0, len = latlngs.length; i < len; i++) {

		this.extend(latlngs[i]);

	}

};



L.LatLngBounds.prototype = {

	// extend the bounds to contain the given point or bounds

	extend: function (obj) { // (LatLng) or (LatLngBounds)

		if (!obj) { return this; }



		var latLng = L.latLng(obj);

		if (latLng !== null) {

			obj = latLng;

		} else {

			obj = L.latLngBounds(obj);

		}



		if (obj instanceof L.LatLng) {

			if (!this._southWest && !this._northEast) {

				this._southWest = new L.LatLng(obj.lat, obj.lng);

				this._northEast = new L.LatLng(obj.lat, obj.lng);

			} else {

				this._southWest.lat = Math.min(obj.lat, this._southWest.lat);

				this._southWest.lng = Math.min(obj.lng, this._southWest.lng);



				this._northEast.lat = Math.max(obj.lat, this._northEast.lat);

				this._northEast.lng = Math.max(obj.lng, this._northEast.lng);

			}

		} else if (obj instanceof L.LatLngBounds) {

			this.extend(obj._southWest);

			this.extend(obj._northEast);

		}

		return this;

	},



	// extend the bounds by a percentage

	pad: function (bufferRatio) { // (Number) -> LatLngBounds

		var sw = this._southWest,

		    ne = this._northEast,

		    heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio,

		    widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;



		return new L.LatLngBounds(

		        new L.LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer),

		        new L.LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer));

	},



	getCenter: function () { // -> LatLng

		return new L.LatLng(

		        (this._southWest.lat + this._northEast.lat) / 2,

		        (this._southWest.lng + this._northEast.lng) / 2);

	},



	getSouthWest: function () {

		return this._southWest;

	},



	getNorthEast: function () {

		return this._northEast;

	},



	getNorthWest: function () {

		return new L.LatLng(this.getNorth(), this.getWest());

	},



	getSouthEast: function () {

		return new L.LatLng(this.getSouth(), this.getEast());

	},



	getWest: function () {

		return this._southWest.lng;

	},



	getSouth: function () {

		return this._southWest.lat;

	},



	getEast: function () {

		return this._northEast.lng;

	},



	getNorth: function () {

		return this._northEast.lat;

	},



	contains: function (obj) { // (LatLngBounds) or (LatLng) -> Boolean

		if (typeof obj[0] === 'number' || obj instanceof L.LatLng) {

			obj = L.latLng(obj);

		} else {

			obj = L.latLngBounds(obj);

		}



		var sw = this._southWest,

		    ne = this._northEast,

		    sw2, ne2;



		if (obj instanceof L.LatLngBounds) {

			sw2 = obj.getSouthWest();

			ne2 = obj.getNorthEast();

		} else {

			sw2 = ne2 = obj;

		}



		return (sw2.lat >= sw.lat) && (ne2.lat <= ne.lat) &&

		       (sw2.lng >= sw.lng) && (ne2.lng <= ne.lng);

	},



	intersects: function (bounds) { // (LatLngBounds)

		bounds = L.latLngBounds(bounds);



		var sw = this._southWest,

		    ne = this._northEast,

		    sw2 = bounds.getSouthWest(),

		    ne2 = bounds.getNorthEast(),



		    latIntersects = (ne2.lat >= sw.lat) && (sw2.lat <= ne.lat),

		    lngIntersects = (ne2.lng >= sw.lng) && (sw2.lng <= ne.lng);



		return latIntersects && lngIntersects;

	},



	toBBoxString: function () {

		return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(',');

	},



	equals: function (bounds) { // (LatLngBounds)

		if (!bounds) { return false; }



		bounds = L.latLngBounds(bounds);



		return this._southWest.equals(bounds.getSouthWest()) &&

		       this._northEast.equals(bounds.getNorthEast());

	},



	isValid: function () {

		return !!(this._southWest && this._northEast);

	}

};



//TODO International date line?



L.latLngBounds = function (a, b) { // (LatLngBounds) or (LatLng, LatLng)

	if (!a || a instanceof L.LatLngBounds) {

		return a;

	}

	return new L.LatLngBounds(a, b);

};



/*

 * L.Projection contains various geographical projections used by CRS classes.

 */



L.Projection = {};



/*

 * Spherical Mercator is the most popular map projection, used by EPSG:3857 CRS used by default.

 */



L.Projection.SphericalMercator = {

	MAX_LATITUDE: 85.0511287798,



	project: function (latlng) { // (LatLng) -> Point

		var d = L.LatLng.DEG_TO_RAD,

		    max = this.MAX_LATITUDE,

		    lat = Math.max(Math.min(max, latlng.lat), -max),

		    x = latlng.lng * d,

		    y = lat * d;



		y = Math.log(Math.tan((Math.PI / 4) + (y / 2)));



		return new L.Point(x, y);

	},



	unproject: function (point) { // (Point, Boolean) -> LatLng

		var d = L.LatLng.RAD_TO_DEG,

		    lng = point.x * d,

		    lat = (2 * Math.atan(Math.exp(point.y)) - (Math.PI / 2)) * d;



		return new L.LatLng(lat, lng);

	}

};



/*

 * Simple equirectangular (Plate Carree) projection, used by CRS like EPSG:4326 and Simple.

 */



L.Projection.LonLat = {

	project: function (latlng) {

		return new L.Point(latlng.lng, latlng.lat);

	},



	unproject: function (point) {

		return new L.LatLng(point.y, point.x);

	}

};



/*

 * L.CRS is a base object for all defined CRS (Coordinate Reference Systems) in Leaflet.

 */



L.CRS = {

	latLngToPoint: function (latlng, zoom) { // (LatLng, Number) -> Point

		var projectedPoint = this.projection.project(latlng),

		    scale = this.scale(zoom);



		return this.transformation._transform(projectedPoint, scale);

	},



	pointToLatLng: function (point, zoom) { // (Point, Number[, Boolean]) -> LatLng

		var scale = this.scale(zoom),

		    untransformedPoint = this.transformation.untransform(point, scale);



		return this.projection.unproject(untransformedPoint);

	},



	project: function (latlng) {

		return this.projection.project(latlng);

	},



	scale: function (zoom) {

		return 256 * Math.pow(2, zoom);

	},



	getSize: function (zoom) {

		var s = this.scale(zoom);

		return L.point(s, s);

	}

};



/*
 * A simple CRS that can be used for flat non-Earth maps like panoramas or game maps.
 */

L.CRS.Simple = L.extend({}, L.CRS, {
	projection: L.Projection.LonLat,
	transformation: new L.Transformation(1, 0, -1, 0),

	scale: function (zoom) {
		return Math.pow(2, zoom);
	}
});


/*

 * L.CRS.EPSG3857 (Spherical Mercator) is the most common CRS for web mapping

 * and is used by Leaflet by default.

 */



L.CRS.EPSG3857 = L.extend({}, L.CRS, {

	code: 'EPSG:3857',



	projection: L.Projection.SphericalMercator,

	transformation: new L.Transformation(0.5 / Math.PI, 0.5, -0.5 / Math.PI, 0.5),



	project: function (latlng) { // (LatLng) -> Point

		var projectedPoint = this.projection.project(latlng),

		    earthRadius = 6378137;

		return projectedPoint.multiplyBy(earthRadius);

	}

});



L.CRS.EPSG900913 = L.extend({}, L.CRS.EPSG3857, {

	code: 'EPSG:900913'

});



/*

 * L.CRS.EPSG4326 is a CRS popular among advanced GIS specialists.

 */



L.CRS.EPSG4326 = L.extend({}, L.CRS, {

	code: 'EPSG:4326',



	projection: L.Projection.LonLat,

	transformation: new L.Transformation(1 / 360, 0.5, -1 / 360, 0.5)

});



/*

 * L.Map is the central class of the API - it is used to create a map.

 */



L.Map = L.Class.extend({



	includes: L.Mixin.Events,



	options: {

		crs: L.CRS.EPSG3857,



		/*

		center: LatLng,

		zoom: Number,

		layers: Array,

		*/



		fadeAnimation: L.DomUtil.TRANSITION && !L.Browser.android23,

		trackResize: true,

		markerZoomAnimation: L.DomUtil.TRANSITION && L.Browser.any3d

	},



	initialize: function (id, options) { // (HTMLElement or String, Object)

		options = L.setOptions(this, options);





		this._initContainer(id);

		this._initLayout();



		// hack for https://github.com/Leaflet/Leaflet/issues/1980

		this._onResize = L.bind(this._onResize, this);



		this._initEvents();



		if (options.maxBounds) {

			this.setMaxBounds(options.maxBounds);

		}



		if (options.center && options.zoom !== undefined) {

			this.setView(L.latLng(options.center), options.zoom, {reset: true});

		}



		this._handlers = [];



		this._layers = {};

		this._zoomBoundLayers = {};

		this._tileLayersNum = 0;



		this.callInitHooks();



		this._addLayers(options.layers);

	},





	// public methods that modify map state



	// replaced by animation-powered implementation in Map.PanAnimation.js

	setView: function (center, zoom) {

		zoom = zoom === undefined ? this.getZoom() : zoom;

		this._resetView(L.latLng(center), this._limitZoom(zoom));

		return this;

	},



	setZoom: function (zoom, options) {

		if (!this._loaded) {

			this._zoom = this._limitZoom(zoom);

			return this;

		}

		return this.setView(this.getCenter(), zoom, {zoom: options});

	},



	zoomIn: function (delta, options) {

		return this.setZoom(this._zoom + (delta || 1), options);

	},



	zoomOut: function (delta, options) {

		return this.setZoom(this._zoom - (delta || 1), options);

	},



	setZoomAround: function (latlng, zoom, options) {

		var scale = this.getZoomScale(zoom),

		    viewHalf = this.getSize().divideBy(2),

		    containerPoint = latlng instanceof L.Point ? latlng : this.latLngToContainerPoint(latlng),



		    centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),

		    newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));



		return this.setView(newCenter, zoom, {zoom: options});

	},



	fitBounds: function (bounds, options) {



		options = options || {};

		bounds = bounds.getBounds ? bounds.getBounds() : L.latLngBounds(bounds);



		var paddingTL = L.point(options.paddingTopLeft || options.padding || [0, 0]),

		    paddingBR = L.point(options.paddingBottomRight || options.padding || [0, 0]),



		    zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR));



		zoom = (options.maxZoom) ? Math.min(options.maxZoom, zoom) : zoom;



		var paddingOffset = paddingBR.subtract(paddingTL).divideBy(2),



		    swPoint = this.project(bounds.getSouthWest(), zoom),

		    nePoint = this.project(bounds.getNorthEast(), zoom),

		    center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);



		return this.setView(center, zoom, options);

	},



	fitWorld: function (options) {

		return this.fitBounds([[-90, -180], [90, 180]], options);

	},



	panTo: function (center, options) { // (LatLng)

		return this.setView(center, this._zoom, {pan: options});

	},



	panBy: function (offset) { // (Point)

		// replaced with animated panBy in Map.PanAnimation.js

		this.fire('movestart');



		this._rawPanBy(L.point(offset));



		this.fire('move');

		return this.fire('moveend');

	},



	setMaxBounds: function (bounds) {

		bounds = L.latLngBounds(bounds);



		this.options.maxBounds = bounds;



		if (!bounds) {

			return this.off('moveend', this._panInsideMaxBounds, this);

		}



		if (this._loaded) {

			this._panInsideMaxBounds();

		}



		return this.on('moveend', this._panInsideMaxBounds, this);

	},



	panInsideBounds: function (bounds, options) {

		var center = this.getCenter(),

			newCenter = this._limitCenter(center, this._zoom, bounds);



		if (center.equals(newCenter)) { return this; }



		return this.panTo(newCenter, options);

	},



	addLayer: function (layer) {

		// TODO method is too big, refactor



		var id = L.stamp(layer);



		if (this._layers[id]) { return this; }



		this._layers[id] = layer;



		// TODO getMaxZoom, getMinZoom in ILayer (instead of options)

		if (layer.options && (!isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom))) {

			this._zoomBoundLayers[id] = layer;

			this._updateZoomLevels();

		}



		// TODO looks ugly, refactor!!!

		if (this.options.zoomAnimation && L.TileLayer && (layer instanceof L.TileLayer)) {

			this._tileLayersNum++;

			this._tileLayersToLoad++;

			layer.on('load', this._onTileLayerLoad, this);

		}



		if (this._loaded) {

			this._layerAdd(layer);

		}



		return this;

	},



	removeLayer: function (layer) {

		var id = L.stamp(layer);



		if (!this._layers[id]) { return this; }



		if (this._loaded) {

			layer.onRemove(this);

		}



		delete this._layers[id];



		if (this._loaded) {

			this.fire('layerremove', {layer: layer});

		}



		if (this._zoomBoundLayers[id]) {

			delete this._zoomBoundLayers[id];

			this._updateZoomLevels();

		}



		// TODO looks ugly, refactor

		if (this.options.zoomAnimation && L.TileLayer && (layer instanceof L.TileLayer)) {

			this._tileLayersNum--;

			this._tileLayersToLoad--;

			layer.off('load', this._onTileLayerLoad, this);

		}



		return this;

	},



	hasLayer: function (layer) {

		if (!layer) { return false; }



		return (L.stamp(layer) in this._layers);

	},



	eachLayer: function (method, context) {

		for (var i in this._layers) {

			method.call(context, this._layers[i]);

		}

		return this;

	},



	invalidateSize: function (options) {

		if (!this._loaded) { return this; }



		options = L.extend({

			animate: false,

			pan: true

		}, options === true ? {animate: true} : options);



		var oldSize = this.getSize();

		this._sizeChanged = true;

		this._initialCenter = null;



		var newSize = this.getSize(),

		    oldCenter = oldSize.divideBy(2).round(),

		    newCenter = newSize.divideBy(2).round(),

		    offset = oldCenter.subtract(newCenter);



		if (!offset.x && !offset.y) { return this; }



		if (options.animate && options.pan) {

			this.panBy(offset);



		} else {

			if (options.pan) {

				this._rawPanBy(offset);

			}



			this.fire('move');



			if (options.debounceMoveend) {

				clearTimeout(this._sizeTimer);

				this._sizeTimer = setTimeout(L.bind(this.fire, this, 'moveend'), 200);

			} else {

				this.fire('moveend');

			}

		}



		return this.fire('resize', {

			oldSize: oldSize,

			newSize: newSize

		});

	},



	// TODO handler.addTo

	addHandler: function (name, HandlerClass) {

		if (!HandlerClass) { return this; }



		var handler = this[name] = new HandlerClass(this);



		this._handlers.push(handler);



		if (this.options[name]) {

			handler.enable();

		}



		return this;

	},



	remove: function () {

		if (this._loaded) {

			this.fire('unload');

		}



		this._initEvents('off');



		try {

			// throws error in IE6-8

			delete this._container._leaflet;

		} catch (e) {

			this._container._leaflet = undefined;

		}



		this._clearPanes();

		if (this._clearControlPos) {

			this._clearControlPos();

		}



		this._clearHandlers();



		return this;

	},





	// public methods for getting map state



	getCenter: function () { // (Boolean) -> LatLng

		this._checkIfLoaded();



		if (this._initialCenter && !this._moved()) {

			return this._initialCenter;

		}

		return this.layerPointToLatLng(this._getCenterLayerPoint());

	},



	getZoom: function () {

		return this._zoom;

	},



	getBounds: function () {

		var bounds = this.getPixelBounds(),

		    sw = this.unproject(bounds.getBottomLeft()),

		    ne = this.unproject(bounds.getTopRight());



		return new L.LatLngBounds(sw, ne);

	},



	getMinZoom: function () {

		return this.options.minZoom === undefined ?

			(this._layersMinZoom === undefined ? 0 : this._layersMinZoom) :

			this.options.minZoom;

	},



	getMaxZoom: function () {

		return this.options.maxZoom === undefined ?

			(this._layersMaxZoom === undefined ? Infinity : this._layersMaxZoom) :

			this.options.maxZoom;

	},



	getBoundsZoom: function (bounds, inside, padding) { // (LatLngBounds[, Boolean, Point]) -> Number

		bounds = L.latLngBounds(bounds);



		var zoom = this.getMinZoom() - (inside ? 1 : 0),

		    maxZoom = this.getMaxZoom(),

		    size = this.getSize(),



		    nw = bounds.getNorthWest(),

		    se = bounds.getSouthEast(),



		    zoomNotFound = true,

		    boundsSize;



		padding = L.point(padding || [0, 0]);



		do {

			zoom++;

			boundsSize = this.project(se, zoom).subtract(this.project(nw, zoom)).add(padding);

			zoomNotFound = !inside ? size.contains(boundsSize) : boundsSize.x < size.x || boundsSize.y < size.y;



		} while (zoomNotFound && zoom <= maxZoom);



		if (zoomNotFound && inside) {

			return null;

		}



		return inside ? zoom : zoom - 1;

	},



	getSize: function () {

		if (!this._size || this._sizeChanged) {

			this._size = new L.Point(

				this._container.clientWidth,

				this._container.clientHeight);



			this._sizeChanged = false;

		}

		return this._size.clone();

	},



	getPixelBounds: function () {

		var topLeftPoint = this._getTopLeftPoint();

		return new L.Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));

	},



	getPixelOrigin: function () {

		this._checkIfLoaded();

		return this._initialTopLeftPoint;

	},



	getPanes: function () {

		return this._panes;

	},



	getContainer: function () {

		return this._container;

	},





	// TODO replace with universal implementation after refactoring projections



	getZoomScale: function (toZoom) {

		var crs = this.options.crs;

		return crs.scale(toZoom) / crs.scale(this._zoom);

	},



	getScaleZoom: function (scale) {

		return this._zoom + (Math.log(scale) / Math.LN2);

	},





	// conversion methods



	project: function (latlng, zoom) { // (LatLng[, Number]) -> Point

		zoom = zoom === undefined ? this._zoom : zoom;

		return this.options.crs.latLngToPoint(L.latLng(latlng), zoom);

	},



	unproject: function (point, zoom) { // (Point[, Number]) -> LatLng

		zoom = zoom === undefined ? this._zoom : zoom;

		return this.options.crs.pointToLatLng(L.point(point), zoom);

	},



	layerPointToLatLng: function (point) { // (Point)

		var projectedPoint = L.point(point).add(this.getPixelOrigin());

		return this.unproject(projectedPoint);

	},



	latLngToLayerPoint: function (latlng) { // (LatLng)

		var projectedPoint = this.project(L.latLng(latlng))._round();

		return projectedPoint._subtract(this.getPixelOrigin());

	},



	containerPointToLayerPoint: function (point) { // (Point)

		return L.point(point).subtract(this._getMapPanePos());

	},



	layerPointToContainerPoint: function (point) { // (Point)

		return L.point(point).add(this._getMapPanePos());

	},



	containerPointToLatLng: function (point) {

		var layerPoint = this.containerPointToLayerPoint(L.point(point));

		return this.layerPointToLatLng(layerPoint);

	},



	latLngToContainerPoint: function (latlng) {

		return this.layerPointToContainerPoint(this.latLngToLayerPoint(L.latLng(latlng)));

	},



	mouseEventToContainerPoint: function (e) { // (MouseEvent)

		return L.DomEvent.getMousePosition(e, this._container);

	},



	mouseEventToLayerPoint: function (e) { // (MouseEvent)

		return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));

	},



	mouseEventToLatLng: function (e) { // (MouseEvent)

		return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));

	},





	// map initialization methods



	_initContainer: function (id) {

		var container = this._container = L.DomUtil.get(id);



		if (!container) {

			throw new Error('Map container not found.');

		} else if (container._leaflet) {

			throw new Error('Map container is already initialized.');

		}



		container._leaflet = true;

	},



	_initLayout: function () {

		var container = this._container;



		L.DomUtil.addClass(container, 'leaflet-container' +

			(L.Browser.touch ? ' leaflet-touch' : '') +

			(L.Browser.retina ? ' leaflet-retina' : '') +

			(L.Browser.ielt9 ? ' leaflet-oldie' : '') +

			(this.options.fadeAnimation ? ' leaflet-fade-anim' : ''));



		var position = L.DomUtil.getStyle(container, 'position');



		if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {

			container.style.position = 'relative';

		}



		this._initPanes();



		if (this._initControlPos) {

			this._initControlPos();

		}

	},



	_initPanes: function () {

		var panes = this._panes = {};



		this._mapPane = panes.mapPane = this._createPane('leaflet-map-pane', this._container);



		this._tilePane = panes.tilePane = this._createPane('leaflet-tile-pane', this._mapPane);

		panes.objectsPane = this._createPane('leaflet-objects-pane', this._mapPane);

		panes.shadowPane = this._createPane('leaflet-shadow-pane');

		panes.overlayPane = this._createPane('leaflet-overlay-pane');

		panes.markerPane = this._createPane('leaflet-marker-pane');

		panes.popupPane = this._createPane('leaflet-popup-pane');



		var zoomHide = ' leaflet-zoom-hide';



		if (!this.options.markerZoomAnimation) {

			L.DomUtil.addClass(panes.markerPane, zoomHide);

			L.DomUtil.addClass(panes.shadowPane, zoomHide);

			L.DomUtil.addClass(panes.popupPane, zoomHide);

		}

	},



	_createPane: function (className, container) {

		return L.DomUtil.create('div', className, container || this._panes.objectsPane);

	},



	_clearPanes: function () {

		this._container.removeChild(this._mapPane);

	},



	_addLayers: function (layers) {

		layers = layers ? (L.Util.isArray(layers) ? layers : [layers]) : [];



		for (var i = 0, len = layers.length; i < len; i++) {

			this.addLayer(layers[i]);

		}

	},





	// private methods that modify map state



	_resetView: function (center, zoom, preserveMapOffset, afterZoomAnim) {



		var zoomChanged = (this._zoom !== zoom);



		if (!afterZoomAnim) {

			this.fire('movestart');



			if (zoomChanged) {

				this.fire('zoomstart');

			}

		}



		this._zoom = zoom;

		this._initialCenter = center;



		this._initialTopLeftPoint = this._getNewTopLeftPoint(center);



		if (!preserveMapOffset) {

			L.DomUtil.setPosition(this._mapPane, new L.Point(0, 0));

		} else {

			this._initialTopLeftPoint._add(this._getMapPanePos());

		}



		this._tileLayersToLoad = this._tileLayersNum;



		var loading = !this._loaded;

		this._loaded = true;



		this.fire('viewreset', {hard: !preserveMapOffset});



		if (loading) {

			this.fire('load');

			this.eachLayer(this._layerAdd, this);

		}



		this.fire('move');



		if (zoomChanged || afterZoomAnim) {

			this.fire('zoomend');

		}



		this.fire('moveend', {hard: !preserveMapOffset});

	},



	_rawPanBy: function (offset) {

		L.DomUtil.setPosition(this._mapPane, this._getMapPanePos().subtract(offset));

	},



	_getZoomSpan: function () {

		return this.getMaxZoom() - this.getMinZoom();

	},



	_updateZoomLevels: function () {

		var i,

			minZoom = Infinity,

			maxZoom = -Infinity,

			oldZoomSpan = this._getZoomSpan();



		for (i in this._zoomBoundLayers) {

			var layer = this._zoomBoundLayers[i];

			if (!isNaN(layer.options.minZoom)) {

				minZoom = Math.min(minZoom, layer.options.minZoom);

			}

			if (!isNaN(layer.options.maxZoom)) {

				maxZoom = Math.max(maxZoom, layer.options.maxZoom);

			}

		}



		if (i === undefined) { // we have no tilelayers

			this._layersMaxZoom = this._layersMinZoom = undefined;

		} else {

			this._layersMaxZoom = maxZoom;

			this._layersMinZoom = minZoom;

		}



		if (oldZoomSpan !== this._getZoomSpan()) {

			this.fire('zoomlevelschange');

		}

	},



	_panInsideMaxBounds: function () {

		this.panInsideBounds(this.options.maxBounds);

	},



	_checkIfLoaded: function () {

		if (!this._loaded) {

			throw new Error('Set map center and zoom first.');

		}

	},



	// map events



	_initEvents: function (onOff) {

		if (!L.DomEvent) { return; }



		onOff = onOff || 'on';



		L.DomEvent[onOff](this._container, 'click', this._onMouseClick, this);



		var events = ['dblclick', 'mousedown', 'mouseup', 'mouseenter',

		              'mouseleave', 'mousemove', 'contextmenu'],

		    i, len;



		for (i = 0, len = events.length; i < len; i++) {

			L.DomEvent[onOff](this._container, events[i], this._fireMouseEvent, this);

		}



		if (this.options.trackResize) {

			L.DomEvent[onOff](window, 'resize', this._onResize, this);

		}

	},



	_onResize: function () {

		L.Util.cancelAnimFrame(this._resizeRequest);

		this._resizeRequest = L.Util.requestAnimFrame(

		        function () { this.invalidateSize({debounceMoveend: true}); }, this, false, this._container);

	},



	_onMouseClick: function (e) {

		if (!this._loaded || (!e._simulated &&

		        ((this.dragging && this.dragging.moved()) ||

		         (this.boxZoom  && this.boxZoom.moved()))) ||

		            L.DomEvent._skipped(e)) { return; }



		this.fire('preclick');

		this._fireMouseEvent(e);

	},



	_fireMouseEvent: function (e) {

		if (!this._loaded || L.DomEvent._skipped(e)) { return; }



		var type = e.type;



		type = (type === 'mouseenter' ? 'mouseover' : (type === 'mouseleave' ? 'mouseout' : type));



		if (!this.hasEventListeners(type)) { return; }



		if (type === 'contextmenu') {

			L.DomEvent.preventDefault(e);

		}



		var containerPoint = this.mouseEventToContainerPoint(e),

		    layerPoint = this.containerPointToLayerPoint(containerPoint),

		    latlng = this.layerPointToLatLng(layerPoint);



		this.fire(type, {

			latlng: latlng,

			layerPoint: layerPoint,

			containerPoint: containerPoint,

			originalEvent: e

		});

	},



	_onTileLayerLoad: function () {

		this._tileLayersToLoad--;

		if (this._tileLayersNum && !this._tileLayersToLoad) {

			this.fire('tilelayersload');

		}

	},



	_clearHandlers: function () {

		for (var i = 0, len = this._handlers.length; i < len; i++) {

			this._handlers[i].disable();

		}

	},



	whenReady: function (callback, context) {

		if (this._loaded) {

			callback.call(context || this, this);

		} else {

			this.on('load', callback, context);

		}

		return this;

	},



	_layerAdd: function (layer) {

		layer.onAdd(this);

		this.fire('layeradd', {layer: layer});

	},





	// private methods for getting map state



	_getMapPanePos: function () {

		return L.DomUtil.getPosition(this._mapPane);

	},



	_moved: function () {

		var pos = this._getMapPanePos();

		return pos && !pos.equals([0, 0]);

	},



	_getTopLeftPoint: function () {

		return this.getPixelOrigin().subtract(this._getMapPanePos());

	},



	_getNewTopLeftPoint: function (center, zoom) {

		var viewHalf = this.getSize()._divideBy(2);

		// TODO round on display, not calculation to increase precision?

		return this.project(center, zoom)._subtract(viewHalf)._round();

	},



	_latLngToNewLayerPoint: function (latlng, newZoom, newCenter) {

		var topLeft = this._getNewTopLeftPoint(newCenter, newZoom).add(this._getMapPanePos());

		return this.project(latlng, newZoom)._subtract(topLeft);

	},



	// layer point of the current center

	_getCenterLayerPoint: function () {

		return this.containerPointToLayerPoint(this.getSize()._divideBy(2));

	},



	// offset of the specified place to the current center in pixels

	_getCenterOffset: function (latlng) {

		return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());

	},



	// adjust center for view to get inside bounds

	_limitCenter: function (center, zoom, bounds) {



		if (!bounds) { return center; }



		var centerPoint = this.project(center, zoom),

		    viewHalf = this.getSize().divideBy(2),

		    viewBounds = new L.Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)),

		    offset = this._getBoundsOffset(viewBounds, bounds, zoom);



		return this.unproject(centerPoint.add(offset), zoom);

	},



	// adjust offset for view to get inside bounds

	_limitOffset: function (offset, bounds) {

		if (!bounds) { return offset; }



		var viewBounds = this.getPixelBounds(),

		    newBounds = new L.Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));



		return offset.add(this._getBoundsOffset(newBounds, bounds));

	},



	// returns offset needed for pxBounds to get inside maxBounds at a specified zoom

	_getBoundsOffset: function (pxBounds, maxBounds, zoom) {

		var nwOffset = this.project(maxBounds.getNorthWest(), zoom).subtract(pxBounds.min),

		    seOffset = this.project(maxBounds.getSouthEast(), zoom).subtract(pxBounds.max),



		    dx = this._rebound(nwOffset.x, -seOffset.x),

		    dy = this._rebound(nwOffset.y, -seOffset.y);



		return new L.Point(dx, dy);

	},



	_rebound: function (left, right) {

		return left + right > 0 ?

			Math.round(left - right) / 2 :

			Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));

	},



	_limitZoom: function (zoom) {

		var min = this.getMinZoom(),

		    max = this.getMaxZoom();



		return Math.max(min, Math.min(max, zoom));

	}

});



L.map = function (id, options) {

	return new L.Map(id, options);

};



/*

 * Mercator projection that takes into account that the Earth is not a perfect sphere.

 * Less popular than spherical mercator; used by projections like EPSG:3395.

 */



L.Projection.Mercator = {

	MAX_LATITUDE: 85.0840591556,



	R_MINOR: 6356752.314245179,

	R_MAJOR: 6378137,



	project: function (latlng) { // (LatLng) -> Point

		var d = L.LatLng.DEG_TO_RAD,

		    max = this.MAX_LATITUDE,

		    lat = Math.max(Math.min(max, latlng.lat), -max),

		    r = this.R_MAJOR,

		    r2 = this.R_MINOR,

		    x = latlng.lng * d * r,

		    y = lat * d,

		    tmp = r2 / r,

		    eccent = Math.sqrt(1.0 - tmp * tmp),

		    con = eccent * Math.sin(y);



		con = Math.pow((1 - con) / (1 + con), eccent * 0.5);



		var ts = Math.tan(0.5 * ((Math.PI * 0.5) - y)) / con;

		y = -r * Math.log(ts);



		return new L.Point(x, y);

	},



	unproject: function (point) { // (Point, Boolean) -> LatLng

		var d = L.LatLng.RAD_TO_DEG,

		    r = this.R_MAJOR,

		    r2 = this.R_MINOR,

		    lng = point.x * d / r,

		    tmp = r2 / r,

		    eccent = Math.sqrt(1 - (tmp * tmp)),

		    ts = Math.exp(- point.y / r),

		    phi = (Math.PI / 2) - 2 * Math.atan(ts),

		    numIter = 15,

		    tol = 1e-7,

		    i = numIter,

		    dphi = 0.1,

		    con;



		while ((Math.abs(dphi) > tol) && (--i > 0)) {

			con = eccent * Math.sin(phi);

			dphi = (Math.PI / 2) - 2 * Math.atan(ts *

			            Math.pow((1.0 - con) / (1.0 + con), 0.5 * eccent)) - phi;

			phi += dphi;

		}



		return new L.LatLng(phi * d, lng);

	}

};





L.CRS.EPSG3395 = L.extend({}, L.CRS, {

	code: 'EPSG:3395',



	projection: L.Projection.Mercator,



	transformation: (function () {

		var m = L.Projection.Mercator,

		    r = m.R_MAJOR,

		    scale = 0.5 / (Math.PI * r);



		return new L.Transformation(scale, 0.5, -scale, 0.5);

	}())

});



/*

 * L.TileLayer is used for standard xyz-numbered tile layers.

 */



L.TileLayer = L.Class.extend({

	includes: L.Mixin.Events,



	options: {

		minZoom: 0,

		maxZoom: 18,

		tileSize: 256,

		subdomains: 'abc',

		errorTileUrl: '',

		attribution: '',

		zoomOffset: 0,

		opacity: 1,

		/*

		maxNativeZoom: null,

		zIndex: null,

		tms: false,

		continuousWorld: false,

		noWrap: false,

		zoomReverse: false,

		detectRetina: false,

		reuseTiles: false,

		bounds: false,

		*/

		unloadInvisibleTiles: L.Browser.mobile,

		updateWhenIdle: L.Browser.mobile

	},



	initialize: function (url, options) {

		options = L.setOptions(this, options);



		// detecting retina displays, adjusting tileSize and zoom levels

		if (options.detectRetina && L.Browser.retina && options.maxZoom > 0) {



			options.tileSize = Math.floor(options.tileSize / 2);

			options.zoomOffset++;



			if (options.minZoom > 0) {

				options.minZoom--;

			}

			this.options.maxZoom--;

		}



		if (options.bounds) {

			options.bounds = L.latLngBounds(options.bounds);

		}



		this._url = url;



		var subdomains = this.options.subdomains;



		if (typeof subdomains === 'string') {

			this.options.subdomains = subdomains.split('');

		}

	},



	onAdd: function (map) {

		this._map = map;

		this._animated = map._zoomAnimated;



		// create a container div for tiles

		this._initContainer();



		// set up events

		map.on({

			'viewreset': this._reset,

			'moveend': this._update

		}, this);



		if (this._animated) {

			map.on({

				'zoomanim': this._animateZoom,

				'zoomend': this._endZoomAnim

			}, this);

		}



		if (!this.options.updateWhenIdle) {

			this._limitedUpdate = L.Util.limitExecByInterval(this._update, 150, this);

			map.on('move', this._limitedUpdate, this);

		}



		this._reset();

		this._update();

	},



	addTo: function (map) {

		map.addLayer(this);

		return this;

	},



	onRemove: function (map) {

		this._container.parentNode.removeChild(this._container);



		map.off({

			'viewreset': this._reset,

			'moveend': this._update

		}, this);



		if (this._animated) {

			map.off({

				'zoomanim': this._animateZoom,

				'zoomend': this._endZoomAnim

			}, this);

		}



		if (!this.options.updateWhenIdle) {

			map.off('move', this._limitedUpdate, this);

		}



		this._container = null;

		this._map = null;

	},



	bringToFront: function () {

		var pane = this._map._panes.tilePane;



		if (this._container) {

			pane.appendChild(this._container);

			this._setAutoZIndex(pane, Math.max);

		}



		return this;

	},



	bringToBack: function () {

		var pane = this._map._panes.tilePane;



		if (this._container) {

			pane.insertBefore(this._container, pane.firstChild);

			this._setAutoZIndex(pane, Math.min);

		}



		return this;

	},



	getAttribution: function () {

		return this.options.attribution;

	},



	getContainer: function () {

		return this._container;

	},



	setOpacity: function (opacity) {

		this.options.opacity = opacity;



		if (this._map) {

			this._updateOpacity();

		}



		return this;

	},



	setZIndex: function (zIndex) {

		this.options.zIndex = zIndex;

		this._updateZIndex();



		return this;

	},



	setUrl: function (url, noRedraw) {

		this._url = url;



		if (!noRedraw) {

			this.redraw();

		}



		return this;

	},



	redraw: function () {

		if (this._map) {

			this._reset({hard: true});

			this._update();

		}

		return this;

	},



	_updateZIndex: function () {

		if (this._container && this.options.zIndex !== undefined) {

			this._container.style.zIndex = this.options.zIndex;

		}

	},



	_setAutoZIndex: function (pane, compare) {



		var layers = pane.children,

		    edgeZIndex = -compare(Infinity, -Infinity), // -Infinity for max, Infinity for min

		    zIndex, i, len;



		for (i = 0, len = layers.length; i < len; i++) {



			if (layers[i] !== this._container) {

				zIndex = parseInt(layers[i].style.zIndex, 10);



				if (!isNaN(zIndex)) {

					edgeZIndex = compare(edgeZIndex, zIndex);

				}

			}

		}



		this.options.zIndex = this._container.style.zIndex =

		        (isFinite(edgeZIndex) ? edgeZIndex : 0) + compare(1, -1);

	},



	_updateOpacity: function () {

		var i,

		    tiles = this._tiles;



		if (L.Browser.ielt9) {

			for (i in tiles) {

				L.DomUtil.setOpacity(tiles[i], this.options.opacity);

			}

		} else {

			L.DomUtil.setOpacity(this._container, this.options.opacity);

		}

	},



	_initContainer: function () {

		var tilePane = this._map._panes.tilePane;



		if (!this._container) {

			this._container = L.DomUtil.create('div', 'leaflet-layer');



			this._updateZIndex();



			if (this._animated) {

				var className = 'leaflet-tile-container';



				this._bgBuffer = L.DomUtil.create('div', className, this._container);

				this._tileContainer = L.DomUtil.create('div', className, this._container);



			} else {

				this._tileContainer = this._container;

			}



			tilePane.appendChild(this._container);



			if (this.options.opacity < 1) {

				this._updateOpacity();

			}

		}

	},



	_reset: function (e) {

		for (var key in this._tiles) {

			this.fire('tileunload', {tile: this._tiles[key]});

		}



		this._tiles = {};

		this._tilesToLoad = 0;



		if (this.options.reuseTiles) {

			this._unusedTiles = [];

		}



		this._tileContainer.innerHTML = '';



		if (this._animated && e && e.hard) {

			this._clearBgBuffer();

		}



		this._initContainer();

	},



	_getTileSize: function () {

		var map = this._map,

		    zoom = map.getZoom() + this.options.zoomOffset,

		    zoomN = this.options.maxNativeZoom,

		    tileSize = this.options.tileSize;



		if (zoomN && zoom > zoomN) {

			tileSize = Math.round(map.getZoomScale(zoom) / map.getZoomScale(zoomN) * tileSize);

		}



		return tileSize;

	},



	_update: function () {



		if (!this._map) { return; }



		var map = this._map,

		    bounds = map.getPixelBounds(),

		    zoom = map.getZoom(),

		    tileSize = this._getTileSize();



		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {

			return;

		}



		var tileBounds = L.bounds(

		        bounds.min.divideBy(tileSize)._floor(),

		        bounds.max.divideBy(tileSize)._floor());



		this._addTilesFromCenterOut(tileBounds);



		if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {

			this._removeOtherTiles(tileBounds);

		}

	},



	_addTilesFromCenterOut: function (bounds) {

		var queue = [],

		    center = bounds.getCenter();



		var j, i, point;



		for (j = bounds.min.y; j <= bounds.max.y; j++) {

			for (i = bounds.min.x; i <= bounds.max.x; i++) {

				point = new L.Point(i, j);



				if (this._tileShouldBeLoaded(point)) {

					queue.push(point);

				}

			}

		}



		var tilesToLoad = queue.length;



		if (tilesToLoad === 0) { return; }



		// load tiles in order of their distance to center

		queue.sort(function (a, b) {

			return a.distanceTo(center) - b.distanceTo(center);

		});



		var fragment = document.createDocumentFragment();



		// if its the first batch of tiles to load

		if (!this._tilesToLoad) {

			this.fire('loading');

		}



		this._tilesToLoad += tilesToLoad;



		for (i = 0; i < tilesToLoad; i++) {

			this._addTile(queue[i], fragment);

		}



		this._tileContainer.appendChild(fragment);

	},



	_tileShouldBeLoaded: function (tilePoint) {

		if ((tilePoint.x + ':' + tilePoint.y) in this._tiles) {

			return false; // already loaded

		}



		var options = this.options;



		if (!options.continuousWorld) {

			var limit = this._getWrapTileNum();



			// don't load if exceeds world bounds

			if ((options.noWrap && (tilePoint.x < 0 || tilePoint.x >= limit.x)) ||

				tilePoint.y < 0 || tilePoint.y >= limit.y) { return false; }

		}



		if (options.bounds) {

			var tileSize = this._getTileSize(),

			    nwPoint = tilePoint.multiplyBy(tileSize),

			    sePoint = nwPoint.add([tileSize, tileSize]),

			    nw = this._map.unproject(nwPoint),

			    se = this._map.unproject(sePoint);



			// TODO temporary hack, will be removed after refactoring projections

			// https://github.com/Leaflet/Leaflet/issues/1618

			if (!options.continuousWorld && !options.noWrap) {

				nw = nw.wrap();

				se = se.wrap();

			}



			if (!options.bounds.intersects([nw, se])) { return false; }

		}



		return true;

	},



	_removeOtherTiles: function (bounds) {

		var kArr, x, y, key;



		for (key in this._tiles) {

			kArr = key.split(':');

			x = parseInt(kArr[0], 10);

			y = parseInt(kArr[1], 10);



			// remove tile if it's out of bounds

			if (x < bounds.min.x || x > bounds.max.x || y < bounds.min.y || y > bounds.max.y) {

				this._removeTile(key);

			}

		}

	},



	_removeTile: function (key) {

		var tile = this._tiles[key];



		this.fire('tileunload', {tile: tile, url: tile.src});



		if (this.options.reuseTiles) {

			L.DomUtil.removeClass(tile, 'leaflet-tile-loaded');

			this._unusedTiles.push(tile);



		} else if (tile.parentNode === this._tileContainer) {

			this._tileContainer.removeChild(tile);

		}



		// for https://github.com/CloudMade/Leaflet/issues/137

		if (!L.Browser.android) {

			tile.onload = null;

			tile.src = L.Util.emptyImageUrl;

		}



		delete this._tiles[key];

	},



	_addTile: function (tilePoint, container) {

		var tilePos = this._getTilePos(tilePoint);



		// get unused tile - or create a new tile

		var tile = this._getTile();



		/*

		Chrome 20 layouts much faster with top/left (verify with timeline, frames)

		Android 4 browser has display issues with top/left and requires transform instead

		(other browsers don't currently care) - see debug/hacks/jitter.html for an example

		*/

		L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome);



		this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;



		this._loadTile(tile, tilePoint);



		if (tile.parentNode !== this._tileContainer) {

			container.appendChild(tile);

		}

	},



	_getZoomForUrl: function () {



		var options = this.options,

		    zoom = this._map.getZoom();



		if (options.zoomReverse) {

			zoom = options.maxZoom - zoom;

		}



		zoom += options.zoomOffset;



		return options.maxNativeZoom ? Math.min(zoom, options.maxNativeZoom) : zoom;

	},



	_getTilePos: function (tilePoint) {

		var origin = this._map.getPixelOrigin(),

		    tileSize = this._getTileSize();



		return tilePoint.multiplyBy(tileSize).subtract(origin);

	},



	// image-specific code (override to implement e.g. Canvas or SVG tile layer)



	getTileUrl: function (tilePoint) {

		return L.Util.template(this._url, L.extend({

			s: this._getSubdomain(tilePoint),

			z: tilePoint.z,

			x: tilePoint.x,

			y: tilePoint.y

		}, this.options));

	},



	_getWrapTileNum: function () {

		var crs = this._map.options.crs,

		    size = crs.getSize(this._map.getZoom());

		return size.divideBy(this._getTileSize())._floor();

	},



	_adjustTilePoint: function (tilePoint) {



		var limit = this._getWrapTileNum();



		// wrap tile coordinates

		if (!this.options.continuousWorld && !this.options.noWrap) {

			tilePoint.x = ((tilePoint.x % limit.x) + limit.x) % limit.x;

		}



		if (this.options.tms) {

			tilePoint.y = limit.y - tilePoint.y - 1;

		}



		tilePoint.z = this._getZoomForUrl();

	},



	_getSubdomain: function (tilePoint) {

		var index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;

		return this.options.subdomains[index];

	},



	_getTile: function () {

		if (this.options.reuseTiles && this._unusedTiles.length > 0) {

			var tile = this._unusedTiles.pop();

			this._resetTile(tile);

			return tile;

		}

		return this._createTile();

	},



	// Override if data stored on a tile needs to be cleaned up before reuse

	_resetTile: function (/*tile*/) {},



	_createTile: function () {

		var tile = L.DomUtil.create('img', 'leaflet-tile');

		tile.style.width = tile.style.height = this._getTileSize() + 'px';

		tile.galleryimg = 'no';



		tile.onselectstart = tile.onmousemove = L.Util.falseFn;



		if (L.Browser.ielt9 && this.options.opacity !== undefined) {

			L.DomUtil.setOpacity(tile, this.options.opacity);

		}

		// without this hack, tiles disappear after zoom on Chrome for Android

		// https://github.com/Leaflet/Leaflet/issues/2078

		if (L.Browser.mobileWebkit3d) {

			tile.style.WebkitBackfaceVisibility = 'hidden';

		}

		return tile;

	},



	_loadTile: function (tile, tilePoint) {

		tile._layer  = this;

		tile.onload  = this._tileOnLoad;

		tile.onerror = this._tileOnError;



		this._adjustTilePoint(tilePoint);

		tile.src     = this.getTileUrl(tilePoint);



		this.fire('tileloadstart', {

			tile: tile,

			url: tile.src

		});

	},



	_tileLoaded: function () {

		this._tilesToLoad--;



		if (this._animated) {

			L.DomUtil.addClass(this._tileContainer, 'leaflet-zoom-animated');

		}



		if (!this._tilesToLoad) {

			this.fire('load');



			if (this._animated) {

				// clear scaled tiles after all new tiles are loaded (for performance)

				clearTimeout(this._clearBgBufferTimer);

				this._clearBgBufferTimer = setTimeout(L.bind(this._clearBgBuffer, this), 500);

			}

		}

	},



	_tileOnLoad: function () {

		var layer = this._layer;



		//Only if we are loading an actual image

		if (this.src !== L.Util.emptyImageUrl) {

			L.DomUtil.addClass(this, 'leaflet-tile-loaded');



			layer.fire('tileload', {

				tile: this,

				url: this.src

			});

		}



		layer._tileLoaded();

	},



	_tileOnError: function () {

		var layer = this._layer;



		layer.fire('tileerror', {

			tile: this,

			url: this.src

		});



		var newUrl = layer.options.errorTileUrl;

		if (newUrl) {

			this.src = newUrl;

		}



		layer._tileLoaded();

	}

});



L.tileLayer = function (url, options) {

	return new L.TileLayer(url, options);

};



/*

 * L.TileLayer.WMS is used for putting WMS tile layers on the map.

 */



L.TileLayer.WMS = L.TileLayer.extend({



	defaultWmsParams: {

		service: 'WMS',

		request: 'GetMap',

		version: '1.1.1',

		layers: '',

		styles: '',

		format: 'image/jpeg',

		transparent: false

	},



	initialize: function (url, options) { // (String, Object)



		this._url = url;



		var wmsParams = L.extend({}, this.defaultWmsParams),

		    tileSize = options.tileSize || this.options.tileSize;



		if (options.detectRetina && L.Browser.retina) {

			wmsParams.width = wmsParams.height = tileSize * 2;

		} else {

			wmsParams.width = wmsParams.height = tileSize;

		}



		for (var i in options) {

			// all keys that are not TileLayer options go to WMS params

			if (!this.options.hasOwnProperty(i) && i !== 'crs') {

				wmsParams[i] = options[i];

			}

		}



		this.wmsParams = wmsParams;



		L.setOptions(this, options);

	},



	onAdd: function (map) {



		this._crs = this.options.crs || map.options.crs;



		this._wmsVersion = parseFloat(this.wmsParams.version);



		var projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';

		this.wmsParams[projectionKey] = this._crs.code;



		L.TileLayer.prototype.onAdd.call(this, map);

	},



	getTileUrl: function (tilePoint) { // (Point, Number) -> String



		var map = this._map,

		    tileSize = this.options.tileSize,



		    nwPoint = tilePoint.multiplyBy(tileSize),

		    sePoint = nwPoint.add([tileSize, tileSize]),



		    nw = this._crs.project(map.unproject(nwPoint, tilePoint.z)),

		    se = this._crs.project(map.unproject(sePoint, tilePoint.z)),

		    bbox = this._wmsVersion >= 1.3 && this._crs === L.CRS.EPSG4326 ?

		        [se.y, nw.x, nw.y, se.x].join(',') :

		        [nw.x, se.y, se.x, nw.y].join(','),



		    url = L.Util.template(this._url, {s: this._getSubdomain(tilePoint)});



		return url + L.Util.getParamString(this.wmsParams, url, true) + '&BBOX=' + bbox;

	},



	setParams: function (params, noRedraw) {



		L.extend(this.wmsParams, params);



		if (!noRedraw) {

			this.redraw();

		}



		return this;

	}

});



L.tileLayer.wms = function (url, options) {

	return new L.TileLayer.WMS(url, options);

};



/*

 * L.TileLayer.Canvas is a class that you can use as a base for creating

 * dynamically drawn Canvas-based tile layers.

 */



L.TileLayer.Canvas = L.TileLayer.extend({

	options: {

		async: false

	},



	initialize: function (options) {

		L.setOptions(this, options);

	},



	redraw: function () {

		if (this._map) {

			this._reset({hard: true});

			this._update();

		}



		for (var i in this._tiles) {

			this._redrawTile(this._tiles[i]);

		}

		return this;

	},



	_redrawTile: function (tile) {

		this.drawTile(tile, tile._tilePoint, this._map._zoom);

	},



	_createTile: function () {

		var tile = L.DomUtil.create('canvas', 'leaflet-tile');

		tile.width = tile.height = this.options.tileSize;

		tile.onselectstart = tile.onmousemove = L.Util.falseFn;

		return tile;

	},



	_loadTile: function (tile, tilePoint) {

		tile._layer = this;

		tile._tilePoint = tilePoint;



		this._redrawTile(tile);



		if (!this.options.async) {

			this.tileDrawn(tile);

		}

	},



	drawTile: function (/*tile, tilePoint*/) {

		// override with rendering code

	},



	tileDrawn: function (tile) {

		this._tileOnLoad.call(tile);

	}

});





L.tileLayer.canvas = function (options) {

	return new L.TileLayer.Canvas(options);

};



/*

 * L.ImageOverlay is used to overlay images over the map (to specific geographical bounds).

 */



L.ImageOverlay = L.Class.extend({

	includes: L.Mixin.Events,



	options: {

		opacity: 1

	},



	initialize: function (url, bounds, options) { // (String, LatLngBounds, Object)

		this._url = url;

		this._bounds = L.latLngBounds(bounds);



		L.setOptions(this, options);

	},



	onAdd: function (map) {

		this._map = map;



		if (!this._image) {

			this._initImage();

		}



		map._panes.overlayPane.appendChild(this._image);



		map.on('viewreset', this._reset, this);



		if (map.options.zoomAnimation && L.Browser.any3d) {

			map.on('zoomanim', this._animateZoom, this);

		}



		this._reset();

	},



	onRemove: function (map) {

		map.getPanes().overlayPane.removeChild(this._image);



		map.off('viewreset', this._reset, this);



		if (map.options.zoomAnimation) {

			map.off('zoomanim', this._animateZoom, this);

		}

	},



	addTo: function (map) {

		map.addLayer(this);

		return this;

	},



	setOpacity: function (opacity) {

		this.options.opacity = opacity;

		this._updateOpacity();

		return this;

	},



	// TODO remove bringToFront/bringToBack duplication from TileLayer/Path

	bringToFront: function () {

		if (this._image) {

			this._map._panes.overlayPane.appendChild(this._image);

		}

		return this;

	},



	bringToBack: function () {

		var pane = this._map._panes.overlayPane;

		if (this._image) {

			pane.insertBefore(this._image, pane.firstChild);

		}

		return this;

	},



	setUrl: function (url) {

		this._url = url;

		this._image.src = this._url;

	},



	getAttribution: function () {

		return this.options.attribution;

	},



	_initImage: function () {

		this._image = L.DomUtil.create('img', 'leaflet-image-layer');



		if (this._map.options.zoomAnimation && L.Browser.any3d) {

			L.DomUtil.addClass(this._image, 'leaflet-zoom-animated');

		} else {

			L.DomUtil.addClass(this._image, 'leaflet-zoom-hide');

		}



		this._updateOpacity();



		//TODO createImage util method to remove duplication

		L.extend(this._image, {

			galleryimg: 'no',

			onselectstart: L.Util.falseFn,

			onmousemove: L.Util.falseFn,

			onload: L.bind(this._onImageLoad, this),

			src: this._url

		});

	},



	_animateZoom: function (e) {

		var map = this._map,

		    image = this._image,

		    scale = map.getZoomScale(e.zoom),

		    nw = this._bounds.getNorthWest(),

		    se = this._bounds.getSouthEast(),



		    topLeft = map._latLngToNewLayerPoint(nw, e.zoom, e.center),

		    size = map._latLngToNewLayerPoint(se, e.zoom, e.center)._subtract(topLeft),

		    origin = topLeft._add(size._multiplyBy((1 / 2) * (1 - 1 / scale)));



		image.style[L.DomUtil.TRANSFORM] =

		        L.DomUtil.getTranslateString(origin) + ' scale(' + scale + ') ';

	},



	_reset: function () {

		var image   = this._image,

		    topLeft = this._map.latLngToLayerPoint(this._bounds.getNorthWest()),

		    size = this._map.latLngToLayerPoint(this._bounds.getSouthEast())._subtract(topLeft);



		L.DomUtil.setPosition(image, topLeft);



		image.style.width  = size.x + 'px';

		image.style.height = size.y + 'px';

	},



	_onImageLoad: function () {

		this.fire('load');

	},



	_updateOpacity: function () {

		L.DomUtil.setOpacity(this._image, this.options.opacity);

	}

});



L.imageOverlay = function (url, bounds, options) {

	return new L.ImageOverlay(url, bounds, options);

};



/*

 * L.Icon is an image-based icon class that you can use with L.Marker for custom markers.

 */



L.Icon = L.Class.extend({

	options: {

		/*

		iconUrl: (String) (required)

		iconRetinaUrl: (String) (optional, used for retina devices if detected)

		iconSize: (Point) (can be set through CSS)

		iconAnchor: (Point) (centered by default, can be set in CSS with negative margins)

		popupAnchor: (Point) (if not specified, popup opens in the anchor point)

		shadowUrl: (String) (no shadow by default)

		shadowRetinaUrl: (String) (optional, used for retina devices if detected)

		shadowSize: (Point)

		shadowAnchor: (Point)

		*/

		className: ''

	},



	initialize: function (options) {

		L.setOptions(this, options);

	},



	createIcon: function (oldIcon) {

		return this._createIcon('icon', oldIcon);

	},



	createShadow: function (oldIcon) {

		return this._createIcon('shadow', oldIcon);

	},



	_createIcon: function (name, oldIcon) {

		var src = this._getIconUrl(name);



		if (!src) {

			if (name === 'icon') {

				throw new Error('iconUrl not set in Icon options (see the docs).');

			}

			return null;

		}



		var img;

		if (!oldIcon || oldIcon.tagName !== 'IMG') {

			img = this._createImg(src);

		} else {

			img = this._createImg(src, oldIcon);

		}

		this._setIconStyles(img, name);



		return img;

	},



	_setIconStyles: function (img, name) {

		var options = this.options,

		    size = L.point(options[name + 'Size']),

		    anchor;



		if (name === 'shadow') {

			anchor = L.point(options.shadowAnchor || options.iconAnchor);

		} else {

			anchor = L.point(options.iconAnchor);

		}



		if (!anchor && size) {

			anchor = size.divideBy(2, true);

		}



		img.className = 'leaflet-marker-' + name + ' ' + options.className;



		if (anchor) {

			img.style.marginLeft = (-anchor.x) + 'px';

			img.style.marginTop  = (-anchor.y) + 'px';

		}



		if (size) {

			img.style.width  = size.x + 'px';

			img.style.height = size.y + 'px';

		}

	},



	_createImg: function (src, el) {

		el = el || document.createElement('img');

		el.src = src;

		return el;

	},



	_getIconUrl: function (name) {

		if (L.Browser.retina && this.options[name + 'RetinaUrl']) {

			return this.options[name + 'RetinaUrl'];

		}

		return this.options[name + 'Url'];

	}

});



L.icon = function (options) {

	return new L.Icon(options);

};



/*
 * L.Icon.Default is the blue marker icon used by default in Leaflet.
 */

L.Icon.Default = L.Icon.extend({

	options: {
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],

		shadowSize: [41, 41]
	},

	_getIconUrl: function (name) {
		var key = name + 'Url';

		if (this.options[key]) {
			return this.options[key];
		}

		if (L.Browser.retina && name === 'icon') {
			name += '-2x';
		}

		var path = L.Icon.Default.imagePath;

		if (!path) {
			throw new Error('Couldn\'t autodetect L.Icon.Default.imagePath, set it manually.');
		}

		return path + '/marker-' + name + '.png';
	}
});

L.Icon.Default.imagePath = (function () {
	var scripts = document.getElementsByTagName('script'),
	    leafletRe = /[\/^]leaflet[\-\._]?([\w\-\._]*)\.js\??/;

	var i, len, src, matches, path;

	for (i = 0, len = scripts.length; i < len; i++) {
		src = scripts[i].src;
		matches = src.match(leafletRe);

		if (matches) {
			path = src.split(leafletRe)[0];
			return (path ? path + '/' : '') + 'images';
		}
	}
}());


/*

 * L.Marker is used to display clickable/draggable icons on the map.

 */



L.Marker = L.Class.extend({



	includes: L.Mixin.Events,



	options: {

		icon: new L.Icon.Default(),

		title: '',

		alt: '',

		clickable: true,

		draggable: false,

		keyboard: true,

		zIndexOffset: 0,

		opacity: 1,

		riseOnHover: false,

		riseOffset: 250

	},



	initialize: function (latlng, options) {

		L.setOptions(this, options);

		this._latlng = L.latLng(latlng);

	},



	onAdd: function (map) {

		this._map = map;



		map.on('viewreset', this.update, this);



		this._initIcon();

		this.update();

		this.fire('add');



		if (map.options.zoomAnimation && map.options.markerZoomAnimation) {

			map.on('zoomanim', this._animateZoom, this);

		}

	},



	addTo: function (map) {

		map.addLayer(this);

		return this;

	},



	onRemove: function (map) {

		if (this.dragging) {

			this.dragging.disable();

		}



		this._removeIcon();

		this._removeShadow();



		this.fire('remove');



		map.off({

			'viewreset': this.update,

			'zoomanim': this._animateZoom

		}, this);



		this._map = null;

	},



	getLatLng: function () {

		return this._latlng;

	},



	setLatLng: function (latlng) {

		this._latlng = L.latLng(latlng);



		this.update();



		return this.fire('move', { latlng: this._latlng });

	},



	setZIndexOffset: function (offset) {

		this.options.zIndexOffset = offset;

		this.update();



		return this;

	},



	setIcon: function (icon) {



		this.options.icon = icon;



		if (this._map) {

			this._initIcon();

			this.update();

		}



		if (this._popup) {

			this.bindPopup(this._popup);

		}



		return this;

	},



	update: function () {

		if (this._icon) {

			this._setPos(this._map.latLngToLayerPoint(this._latlng).round());

		}

		return this;

	},



	_initIcon: function () {

		var options = this.options,

		    map = this._map,

		    animation = (map.options.zoomAnimation && map.options.markerZoomAnimation),

		    classToAdd = animation ? 'leaflet-zoom-animated' : 'leaflet-zoom-hide';



		var icon = options.icon.createIcon(this._icon),

			addIcon = false;



		// if we're not reusing the icon, remove the old one and init new one

		if (icon !== this._icon) {

			if (this._icon) {

				this._removeIcon();

			}

			addIcon = true;



			if (options.title) {

				icon.title = options.title;

			}



			if (options.alt) {

				icon.alt = options.alt;

			}

		}



		L.DomUtil.addClass(icon, classToAdd);



		if (options.keyboard) {

			icon.tabIndex = '0';

		}



		this._icon = icon;



		this._initInteraction();



		if (options.riseOnHover) {

			L.DomEvent

				.on(icon, 'mouseover', this._bringToFront, this)

				.on(icon, 'mouseout', this._resetZIndex, this);

		}



		var newShadow = options.icon.createShadow(this._shadow),

			addShadow = false;



		if (newShadow !== this._shadow) {

			this._removeShadow();

			addShadow = true;

		}



		if (newShadow) {

			L.DomUtil.addClass(newShadow, classToAdd);

		}

		this._shadow = newShadow;





		if (options.opacity < 1) {

			this._updateOpacity();

		}





		var panes = this._map._panes;



		if (addIcon) {

			panes.markerPane.appendChild(this._icon);

		}



		if (newShadow && addShadow) {

			panes.shadowPane.appendChild(this._shadow);

		}

	},



	_removeIcon: function () {

		if (this.options.riseOnHover) {

			L.DomEvent

			    .off(this._icon, 'mouseover', this._bringToFront)

			    .off(this._icon, 'mouseout', this._resetZIndex);

		}



		this._map._panes.markerPane.removeChild(this._icon);



		this._icon = null;

	},



	_removeShadow: function () {

		if (this._shadow) {

			this._map._panes.shadowPane.removeChild(this._shadow);

		}

		this._shadow = null;

	},



	_setPos: function (pos) {

		L.DomUtil.setPosition(this._icon, pos);



		if (this._shadow) {

			L.DomUtil.setPosition(this._shadow, pos);

		}



		this._zIndex = pos.y + this.options.zIndexOffset;



		this._resetZIndex();

	},



	_updateZIndex: function (offset) {

		this._icon.style.zIndex = this._zIndex + offset;

	},



	_animateZoom: function (opt) {

		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();



		this._setPos(pos);

	},



	_initInteraction: function () {



		if (!this.options.clickable) { return; }



		// TODO refactor into something shared with Map/Path/etc. to DRY it up



		var icon = this._icon,

		    events = ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'contextmenu'];



		L.DomUtil.addClass(icon, 'leaflet-clickable');

		L.DomEvent.on(icon, 'click', this._onMouseClick, this);

		L.DomEvent.on(icon, 'keypress', this._onKeyPress, this);



		for (var i = 0; i < events.length; i++) {

			L.DomEvent.on(icon, events[i], this._fireMouseEvent, this);

		}



		if (L.Handler.MarkerDrag) {

			this.dragging = new L.Handler.MarkerDrag(this);



			if (this.options.draggable) {

				this.dragging.enable();

			}

		}

	},



	_onMouseClick: function (e) {

		var wasDragged = this.dragging && this.dragging.moved();



		if (this.hasEventListeners(e.type) || wasDragged) {

			L.DomEvent.stopPropagation(e);

		}



		if (wasDragged) { return; }



		if ((!this.dragging || !this.dragging._enabled) && this._map.dragging && this._map.dragging.moved()) { return; }



		this.fire(e.type, {

			originalEvent: e,

			latlng: this._latlng

		});

	},



	_onKeyPress: function (e) {

		if (e.keyCode === 13) {

			this.fire('click', {

				originalEvent: e,

				latlng: this._latlng

			});

		}

	},



	_fireMouseEvent: function (e) {



		this.fire(e.type, {

			originalEvent: e,

			latlng: this._latlng

		});



		// TODO proper custom event propagation

		// this line will always be called if marker is in a FeatureGroup

		if (e.type === 'contextmenu' && this.hasEventListeners(e.type)) {

			L.DomEvent.preventDefault(e);

		}

		if (e.type !== 'mousedown') {

			L.DomEvent.stopPropagation(e);

		} else {

			L.DomEvent.preventDefault(e);

		}

	},



	setOpacity: function (opacity) {

		this.options.opacity = opacity;

		if (this._map) {

			this._updateOpacity();

		}



		return this;

	},



	_updateOpacity: function () {

		L.DomUtil.setOpacity(this._icon, this.options.opacity);

		if (this._shadow) {

			L.DomUtil.setOpacity(this._shadow, this.options.opacity);

		}

	},



	_bringToFront: function () {

		this._updateZIndex(this.options.riseOffset);

	},



	_resetZIndex: function () {

		this._updateZIndex(0);

	}

});



L.marker = function (latlng, options) {

	return new L.Marker(latlng, options);

};



/*
 * L.DivIcon is a lightweight HTML-based icon class (as opposed to the image-based L.Icon)
 * to use with L.Marker.
 */

L.DivIcon = L.Icon.extend({
	options: {
		iconSize: [12, 12], // also can be set through CSS
		/*
		iconAnchor: (Point)
		popupAnchor: (Point)
		html: (String)
		bgPos: (Point)
		*/
		className: 'leaflet-div-icon',
		html: false
	},

	createIcon: function (oldIcon) {
		var div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div'),
		    options = this.options;

		if (options.html !== false) {
			div.innerHTML = options.html;
		} else {
			div.innerHTML = '';
		}

		if (options.bgPos) {
			div.style.backgroundPosition =
			        (-options.bgPos.x) + 'px ' + (-options.bgPos.y) + 'px';
		}

		this._setIconStyles(div, 'icon');
		return div;
	},

	createShadow: function () {
		return null;
	}
});

L.divIcon = function (options) {
	return new L.DivIcon(options);
};


/*

 * L.Popup is used for displaying popups on the map.

 */



L.Map.mergeOptions({

	closePopupOnClick: true

});



L.Popup = L.Class.extend({

	includes: L.Mixin.Events,



	options: {

		minWidth: 50,

		maxWidth: 300,

		// maxHeight: null,

		autoPan: true,

		closeButton: true,

		offset: [0, 7],

		autoPanPadding: [5, 5],

		// autoPanPaddingTopLeft: null,

		// autoPanPaddingBottomRight: null,

		keepInView: false,

		className: '',

		zoomAnimation: true

	},



	initialize: function (options, source) {

		L.setOptions(this, options);



		this._source = source;

		this._animated = L.Browser.any3d && this.options.zoomAnimation;

		this._isOpen = false;

	},



	onAdd: function (map) {

		this._map = map;



		if (!this._container) {

			this._initLayout();

		}



		var animFade = map.options.fadeAnimation;



		if (animFade) {

			L.DomUtil.setOpacity(this._container, 0);

		}

		map._panes.popupPane.appendChild(this._container);



		map.on(this._getEvents(), this);



		this.update();



		if (animFade) {

			L.DomUtil.setOpacity(this._container, 1);

		}



		this.fire('open');



		map.fire('popupopen', {popup: this});



		if (this._source) {

			this._source.fire('popupopen', {popup: this});

		}

	},



	addTo: function (map) {

		map.addLayer(this);

		return this;

	},



	openOn: function (map) {

		map.openPopup(this);

		return this;

	},



	onRemove: function (map) {

		map._panes.popupPane.removeChild(this._container);



		L.Util.falseFn(this._container.offsetWidth); // force reflow



		map.off(this._getEvents(), this);



		if (map.options.fadeAnimation) {

			L.DomUtil.setOpacity(this._container, 0);

		}



		this._map = null;



		this.fire('close');



		map.fire('popupclose', {popup: this});



		if (this._source) {

			this._source.fire('popupclose', {popup: this});

		}

	},



	getLatLng: function () {

		return this._latlng;

	},



	setLatLng: function (latlng) {

		this._latlng = L.latLng(latlng);

		if (this._map) {

			this._updatePosition();

			this._adjustPan();

		}

		return this;

	},



	getContent: function () {

		return this._content;

	},



	setContent: function (content) {

		this._content = content;

		this.update();

		return this;

	},



	update: function () {

		if (!this._map) { return; }



		this._container.style.visibility = 'hidden';



		this._updateContent();

		this._updateLayout();

		this._updatePosition();



		this._container.style.visibility = '';



		this._adjustPan();

	},



	_getEvents: function () {

		var events = {

			viewreset: this._updatePosition

		};



		if (this._animated) {

			events.zoomanim = this._zoomAnimation;

		}

		if ('closeOnClick' in this.options ? this.options.closeOnClick : this._map.options.closePopupOnClick) {

			events.preclick = this._close;

		}

		if (this.options.keepInView) {

			events.moveend = this._adjustPan;

		}



		return events;

	},



	_close: function () {

		if (this._map) {

			this._map.closePopup(this);

		}

	},



	_initLayout: function () {

		var prefix = 'leaflet-popup',

			containerClass = prefix + ' ' + this.options.className + ' leaflet-zoom-' +

			        (this._animated ? 'animated' : 'hide'),

			container = this._container = L.DomUtil.create('div', containerClass),

			closeButton;



		if (this.options.closeButton) {

			closeButton = this._closeButton =

			        L.DomUtil.create('a', prefix + '-close-button', container);

			closeButton.href = '#close';

			closeButton.innerHTML = '&#215;';

			L.DomEvent.disableClickPropagation(closeButton);



			L.DomEvent.on(closeButton, 'click', this._onCloseButtonClick, this);

		}



		var wrapper = this._wrapper =

		        L.DomUtil.create('div', prefix + '-content-wrapper', container);

		L.DomEvent.disableClickPropagation(wrapper);



		this._contentNode = L.DomUtil.create('div', prefix + '-content', wrapper);



		L.DomEvent.disableScrollPropagation(this._contentNode);

		L.DomEvent.on(wrapper, 'contextmenu', L.DomEvent.stopPropagation);



		this._tipContainer = L.DomUtil.create('div', prefix + '-tip-container', container);

		this._tip = L.DomUtil.create('div', prefix + '-tip', this._tipContainer);

	},



	_updateContent: function () {

		if (!this._content) { return; }



		if (typeof this._content === 'string') {

			this._contentNode.innerHTML = this._content;

		} else {

			while (this._contentNode.hasChildNodes()) {

				this._contentNode.removeChild(this._contentNode.firstChild);

			}

			this._contentNode.appendChild(this._content);

		}

		this.fire('contentupdate');

	},



	_updateLayout: function () {

		var container = this._contentNode,

		    style = container.style;



		style.width = '';

		style.whiteSpace = 'nowrap';



		var width = container.offsetWidth;

		width = Math.min(width, this.options.maxWidth);

		width = Math.max(width, this.options.minWidth);



		style.width = (width + 1) + 'px';

		style.whiteSpace = '';



		style.height = '';



		var height = container.offsetHeight,

		    maxHeight = this.options.maxHeight,

		    scrolledClass = 'leaflet-popup-scrolled';



		if (maxHeight && height > maxHeight) {

			style.height = maxHeight + 'px';

			L.DomUtil.addClass(container, scrolledClass);

		} else {

			L.DomUtil.removeClass(container, scrolledClass);

		}



		this._containerWidth = this._container.offsetWidth;

	},



	_updatePosition: function () {

		if (!this._map) { return; }



		var pos = this._map.latLngToLayerPoint(this._latlng),

		    animated = this._animated,

		    offset = L.point(this.options.offset);



		if (animated) {

			L.DomUtil.setPosition(this._container, pos);

		}



		this._containerBottom = -offset.y - (animated ? 0 : pos.y);

		this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x + (animated ? 0 : pos.x);



		// bottom position the popup in case the height of the popup changes (images loading etc)

		this._container.style.bottom = this._containerBottom + 'px';

		this._container.style.left = this._containerLeft + 'px';

	},



	_zoomAnimation: function (opt) {

		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center);



		L.DomUtil.setPosition(this._container, pos);

	},



	_adjustPan: function () {

		if (!this.options.autoPan) { return; }



		var map = this._map,

		    containerHeight = this._container.offsetHeight,

		    containerWidth = this._containerWidth,



		    layerPos = new L.Point(this._containerLeft, -containerHeight - this._containerBottom);



		if (this._animated) {

			layerPos._add(L.DomUtil.getPosition(this._container));

		}



		var containerPos = map.layerPointToContainerPoint(layerPos),

		    padding = L.point(this.options.autoPanPadding),

		    paddingTL = L.point(this.options.autoPanPaddingTopLeft || padding),

		    paddingBR = L.point(this.options.autoPanPaddingBottomRight || padding),

		    size = map.getSize(),

		    dx = 0,

		    dy = 0;



		if (containerPos.x + containerWidth + paddingBR.x > size.x) { // right

			dx = containerPos.x + containerWidth - size.x + paddingBR.x;

		}

		if (containerPos.x - dx - paddingTL.x < 0) { // left

			dx = containerPos.x - paddingTL.x;

		}

		if (containerPos.y + containerHeight + paddingBR.y > size.y) { // bottom

			dy = containerPos.y + containerHeight - size.y + paddingBR.y;

		}

		if (containerPos.y - dy - paddingTL.y < 0) { // top

			dy = containerPos.y - paddingTL.y;

		}



		if (dx || dy) {

			map

			    .fire('autopanstart')

			    .panBy([dx, dy]);

		}

	},



	_onCloseButtonClick: function (e) {

		this._close();

		L.DomEvent.stop(e);

	}

});



L.popup = function (options, source) {

	return new L.Popup(options, source);

};





L.Map.include({

	openPopup: function (popup, latlng, options) { // (Popup) or (String || HTMLElement, LatLng[, Object])

		this.closePopup();



		if (!(popup instanceof L.Popup)) {

			var content = popup;



			popup = new L.Popup(options)

			    .setLatLng(latlng)

			    .setContent(content);

		}

		popup._isOpen = true;



		this._popup = popup;

		return this.addLayer(popup);

	},



	closePopup: function (popup) {

		if (!popup || popup === this._popup) {

			popup = this._popup;

			this._popup = null;

		}

		if (popup) {

			this.removeLayer(popup);

			popup._isOpen = false;

		}

		return this;

	}

});



/*

 * Popup extension to L.Marker, adding popup-related methods.

 */



L.Marker.include({

	openPopup: function () {

		if (this._popup && this._map && !this._map.hasLayer(this._popup)) {

			this._popup.setLatLng(this._latlng);

			this._map.openPopup(this._popup);

		}



		return this;

	},



	closePopup: function () {

		if (this._popup) {

			this._popup._close();

		}

		return this;

	},



	togglePopup: function () {

		if (this._popup) {

			if (this._popup._isOpen) {

				this.closePopup();

			} else {

				this.openPopup();

			}

		}

		return this;

	},



	bindPopup: function (content, options) {

		var anchor = L.point(this.options.icon.options.popupAnchor || [0, 0]);



		anchor = anchor.add(L.Popup.prototype.options.offset);



		if (options && options.offset) {

			anchor = anchor.add(options.offset);

		}



		options = L.extend({offset: anchor}, options);



		if (!this._popupHandlersAdded) {

			this

			    .on('click', this.togglePopup, this)

			    .on('remove', this.closePopup, this)

			    .on('move', this._movePopup, this);

			this._popupHandlersAdded = true;

		}



		if (content instanceof L.Popup) {

			L.setOptions(content, options);

			this._popup = content;

			content._source = this;

		} else {

			this._popup = new L.Popup(options, this)

				.setContent(content);

		}



		return this;

	},



	setPopupContent: function (content) {

		if (this._popup) {

			this._popup.setContent(content);

		}

		return this;

	},



	unbindPopup: function () {

		if (this._popup) {

			this._popup = null;

			this

			    .off('click', this.togglePopup, this)

			    .off('remove', this.closePopup, this)

			    .off('move', this._movePopup, this);

			this._popupHandlersAdded = false;

		}

		return this;

	},



	getPopup: function () {

		return this._popup;

	},



	_movePopup: function (e) {

		this._popup.setLatLng(e.latlng);

	}

});



/*

 * L.LayerGroup is a class to combine several layers into one so that

 * you can manipulate the group (e.g. add/remove it) as one layer.

 */



L.LayerGroup = L.Class.extend({

	initialize: function (layers) {

		this._layers = {};



		var i, len;



		if (layers) {

			for (i = 0, len = layers.length; i < len; i++) {

				this.addLayer(layers[i]);

			}

		}

	},



	addLayer: function (layer) {

		var id = this.getLayerId(layer);



		this._layers[id] = layer;



		if (this._map) {

			this._map.addLayer(layer);

		}



		return this;

	},



	removeLayer: function (layer) {

		var id = layer in this._layers ? layer : this.getLayerId(layer);



		if (this._map && this._layers[id]) {

			this._map.removeLayer(this._layers[id]);

		}



		delete this._layers[id];



		return this;

	},



	hasLayer: function (layer) {

		if (!layer) { return false; }



		return (layer in this._layers || this.getLayerId(layer) in this._layers);

	},



	clearLayers: function () {

		this.eachLayer(this.removeLayer, this);

		return this;

	},



	invoke: function (methodName) {

		var args = Array.prototype.slice.call(arguments, 1),

		    i, layer;



		for (i in this._layers) {

			layer = this._layers[i];



			if (layer[methodName]) {

				layer[methodName].apply(layer, args);

			}

		}



		return this;

	},



	onAdd: function (map) {

		this._map = map;

		this.eachLayer(map.addLayer, map);

	},



	onRemove: function (map) {

		this.eachLayer(map.removeLayer, map);

		this._map = null;

	},



	addTo: function (map) {

		map.addLayer(this);

		return this;

	},



	eachLayer: function (method, context) {

		for (var i in this._layers) {

			method.call(context, this._layers[i]);

		}

		return this;

	},



	getLayer: function (id) {

		return this._layers[id];

	},



	getLayers: function () {

		var layers = [];



		for (var i in this._layers) {

			layers.push(this._layers[i]);

		}

		return layers;

	},



	setZIndex: function (zIndex) {

		return this.invoke('setZIndex', zIndex);

	},



	getLayerId: function (layer) {

		return L.stamp(layer);

	}

});



L.layerGroup = function (layers) {

	return new L.LayerGroup(layers);

};



/*

 * L.FeatureGroup extends L.LayerGroup by introducing mouse events and additional methods

 * shared between a group of interactive layers (like vectors or markers).

 */



L.FeatureGroup = L.LayerGroup.extend({

	includes: L.Mixin.Events,



	statics: {

		EVENTS: 'click dblclick mouseover mouseout mousemove contextmenu popupopen popupclose'

	},



	addLayer: function (layer) {

		if (this.hasLayer(layer)) {

			return this;

		}



		if ('on' in layer) {

			layer.on(L.FeatureGroup.EVENTS, this._propagateEvent, this);

		}



		L.LayerGroup.prototype.addLayer.call(this, layer);



		if (this._popupContent && layer.bindPopup) {

			layer.bindPopup(this._popupContent, this._popupOptions);

		}



		return this.fire('layeradd', {layer: layer});

	},



	removeLayer: function (layer) {

		if (!this.hasLayer(layer)) {

			return this;

		}

		if (layer in this._layers) {

			layer = this._layers[layer];

		}



		if ('off' in layer) {

			layer.off(L.FeatureGroup.EVENTS, this._propagateEvent, this);

		}



		L.LayerGroup.prototype.removeLayer.call(this, layer);



		if (this._popupContent) {

			this.invoke('unbindPopup');

		}



		return this.fire('layerremove', {layer: layer});

	},



	bindPopup: function (content, options) {

		this._popupContent = content;

		this._popupOptions = options;

		return this.invoke('bindPopup', content, options);

	},



	openPopup: function (latlng) {

		// open popup on the first layer

		for (var id in this._layers) {

			this._layers[id].openPopup(latlng);

			break;

		}

		return this;

	},



	setStyle: function (style) {

		return this.invoke('setStyle', style);

	},



	bringToFront: function () {

		return this.invoke('bringToFront');

	},



	bringToBack: function () {

		return this.invoke('bringToBack');

	},



	getBounds: function () {

		var bounds = new L.LatLngBounds();



		this.eachLayer(function (layer) {

			bounds.extend(layer instanceof L.Marker ? layer.getLatLng() : layer.getBounds());

		});



		return bounds;

	},



	_propagateEvent: function (e) {

		e = L.extend({

			layer: e.target,

			target: this

		}, e);

		this.fire(e.type, e);

	}

});



L.featureGroup = function (layers) {

	return new L.FeatureGroup(layers);

};



/*

 * L.Path is a base class for rendering vector paths on a map. Inherited by Polyline, Circle, etc.

 */



L.Path = L.Class.extend({

	includes: [L.Mixin.Events],



	statics: {

		// how much to extend the clip area around the map view

		// (relative to its size, e.g. 0.5 is half the screen in each direction)

		// set it so that SVG element doesn't exceed 1280px (vectors flicker on dragend if it is)

		CLIP_PADDING: (function () {

			var max = L.Browser.mobile ? 1280 : 2000,

			    target = (max / Math.max(window.outerWidth, window.outerHeight) - 1) / 2;

			return Math.max(0, Math.min(0.5, target));

		})()

	},



	options: {

		stroke: true,

		color: '#0033ff',

		dashArray: null,

		lineCap: null,

		lineJoin: null,

		weight: 5,

		opacity: 0.5,



		fill: false,

		fillColor: null, //same as color by default

		fillOpacity: 0.2,



		clickable: true

	},



	initialize: function (options) {

		L.setOptions(this, options);

	},



	onAdd: function (map) {

		this._map = map;



		if (!this._container) {

			this._initElements();

			this._initEvents();

		}



		this.projectLatlngs();

		this._updatePath();



		if (this._container) {

			this._map._pathRoot.appendChild(this._container);

		}



		this.fire('add');



		map.on({

			'viewreset': this.projectLatlngs,

			'moveend': this._updatePath

		}, this);

	},



	addTo: function (map) {

		map.addLayer(this);

		return this;

	},



	onRemove: function (map) {

		map._pathRoot.removeChild(this._container);



		// Need to fire remove event before we set _map to null as the event hooks might need the object

		this.fire('remove');

		this._map = null;



		if (L.Browser.vml) {

			this._container = null;

			this._stroke = null;

			this._fill = null;

		}



		map.off({

			'viewreset': this.projectLatlngs,

			'moveend': this._updatePath

		}, this);

	},



	projectLatlngs: function () {

		// do all projection stuff here

	},



	setStyle: function (style) {

		L.setOptions(this, style);



		if (this._container) {

			this._updateStyle();

		}



		return this;

	},



	redraw: function () {

		if (this._map) {

			this.projectLatlngs();

			this._updatePath();

		}

		return this;

	}

});



L.Map.include({

	_updatePathViewport: function () {

		var p = L.Path.CLIP_PADDING,

		    size = this.getSize(),

		    panePos = L.DomUtil.getPosition(this._mapPane),

		    min = panePos.multiplyBy(-1)._subtract(size.multiplyBy(p)._round()),

		    max = min.add(size.multiplyBy(1 + p * 2)._round());



		this._pathViewport = new L.Bounds(min, max);

	}

});



/*

 * Extends L.Path with SVG-specific rendering code.

 */



L.Path.SVG_NS = 'http://www.w3.org/2000/svg';



L.Browser.svg = !!(document.createElementNS && document.createElementNS(L.Path.SVG_NS, 'svg').createSVGRect);



L.Path = L.Path.extend({

	statics: {

		SVG: L.Browser.svg

	},



	bringToFront: function () {

		var root = this._map._pathRoot,

		    path = this._container;



		if (path && root.lastChild !== path) {

			root.appendChild(path);

		}

		return this;

	},



	bringToBack: function () {

		var root = this._map._pathRoot,

		    path = this._container,

		    first = root.firstChild;



		if (path && first !== path) {

			root.insertBefore(path, first);

		}

		return this;

	},



	getPathString: function () {

		// form path string here

	},



	_createElement: function (name) {

		return document.createElementNS(L.Path.SVG_NS, name);

	},



	_initElements: function () {

		this._map._initPathRoot();

		this._initPath();

		this._initStyle();

	},



	_initPath: function () {

		this._container = this._createElement('g');



		this._path = this._createElement('path');



		if (this.options.className) {

			L.DomUtil.addClass(this._path, this.options.className);

		}



		this._container.appendChild(this._path);

	},



	_initStyle: function () {

		if (this.options.stroke) {

			this._path.setAttribute('stroke-linejoin', 'round');

			this._path.setAttribute('stroke-linecap', 'round');

		}

		if (this.options.fill) {

			this._path.setAttribute('fill-rule', 'evenodd');

		}

		if (this.options.pointerEvents) {

			this._path.setAttribute('pointer-events', this.options.pointerEvents);

		}

		if (!this.options.clickable && !this.options.pointerEvents) {

			this._path.setAttribute('pointer-events', 'none');

		}

		this._updateStyle();

	},



	_updateStyle: function () {

		if (this.options.stroke) {

			this._path.setAttribute('stroke', this.options.color);

			this._path.setAttribute('stroke-opacity', this.options.opacity);

			this._path.setAttribute('stroke-width', this.options.weight);

			if (this.options.dashArray) {

				this._path.setAttribute('stroke-dasharray', this.options.dashArray);

			} else {

				this._path.removeAttribute('stroke-dasharray');

			}

			if (this.options.lineCap) {

				this._path.setAttribute('stroke-linecap', this.options.lineCap);

			}

			if (this.options.lineJoin) {

				this._path.setAttribute('stroke-linejoin', this.options.lineJoin);

			}

		} else {

			this._path.setAttribute('stroke', 'none');

		}

		if (this.options.fill) {

			this._path.setAttribute('fill', this.options.fillColor || this.options.color);

			this._path.setAttribute('fill-opacity', this.options.fillOpacity);

		} else {

			this._path.setAttribute('fill', 'none');

		}

	},



	_updatePath: function () {

		var str = this.getPathString();

		if (!str) {

			// fix webkit empty string parsing bug

			str = 'M0 0';

		}

		this._path.setAttribute('d', str);

	},



	// TODO remove duplication with L.Map

	_initEvents: function () {

		if (this.options.clickable) {

			if (L.Browser.svg || !L.Browser.vml) {

				L.DomUtil.addClass(this._path, 'leaflet-clickable');

			}



			L.DomEvent.on(this._container, 'click', this._onMouseClick, this);



			var events = ['dblclick', 'mousedown', 'mouseover',

			              'mouseout', 'mousemove', 'contextmenu'];

			for (var i = 0; i < events.length; i++) {

				L.DomEvent.on(this._container, events[i], this._fireMouseEvent, this);

			}

		}

	},



	_onMouseClick: function (e) {

		if (this._map.dragging && this._map.dragging.moved()) { return; }



		this._fireMouseEvent(e);

	},



	_fireMouseEvent: function (e) {

		if (!this._map || !this.hasEventListeners(e.type)) { return; }



		var map = this._map,

		    containerPoint = map.mouseEventToContainerPoint(e),

		    layerPoint = map.containerPointToLayerPoint(containerPoint),

		    latlng = map.layerPointToLatLng(layerPoint);



		this.fire(e.type, {

			latlng: latlng,

			layerPoint: layerPoint,

			containerPoint: containerPoint,

			originalEvent: e

		});



		if (e.type === 'contextmenu') {

			L.DomEvent.preventDefault(e);

		}

		if (e.type !== 'mousemove') {

			L.DomEvent.stopPropagation(e);

		}

	}

});



L.Map.include({

	_initPathRoot: function () {

		if (!this._pathRoot) {

			this._pathRoot = L.Path.prototype._createElement('svg');

			this._panes.overlayPane.appendChild(this._pathRoot);



			if (this.options.zoomAnimation && L.Browser.any3d) {

				L.DomUtil.addClass(this._pathRoot, 'leaflet-zoom-animated');



				this.on({

					'zoomanim': this._animatePathZoom,

					'zoomend': this._endPathZoom

				});

			} else {

				L.DomUtil.addClass(this._pathRoot, 'leaflet-zoom-hide');

			}



			this.on('moveend', this._updateSvgViewport);

			this._updateSvgViewport();

		}

	},



	_animatePathZoom: function (e) {

		var scale = this.getZoomScale(e.zoom),

		    offset = this._getCenterOffset(e.center)._multiplyBy(-scale)._add(this._pathViewport.min);



		this._pathRoot.style[L.DomUtil.TRANSFORM] =

		        L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ') ';



		this._pathZooming = true;

	},



	_endPathZoom: function () {

		this._pathZooming = false;

	},



	_updateSvgViewport: function () {



		if (this._pathZooming) {

			// Do not update SVGs while a zoom animation is going on otherwise the animation will break.

			// When the zoom animation ends we will be updated again anyway

			// This fixes the case where you do a momentum move and zoom while the move is still ongoing.

			return;

		}



		this._updatePathViewport();



		var vp = this._pathViewport,

		    min = vp.min,

		    max = vp.max,

		    width = max.x - min.x,

		    height = max.y - min.y,

		    root = this._pathRoot,

		    pane = this._panes.overlayPane;



		// Hack to make flicker on drag end on mobile webkit less irritating

		if (L.Browser.mobileWebkit) {

			pane.removeChild(root);

		}



		L.DomUtil.setPosition(root, min);

		root.setAttribute('width', width);

		root.setAttribute('height', height);

		root.setAttribute('viewBox', [min.x, min.y, width, height].join(' '));



		if (L.Browser.mobileWebkit) {

			pane.appendChild(root);

		}

	}

});



/*

 * Popup extension to L.Path (polylines, polygons, circles), adding popup-related methods.

 */



L.Path.include({



	bindPopup: function (content, options) {



		if (content instanceof L.Popup) {

			this._popup = content;

		} else {

			if (!this._popup || options) {

				this._popup = new L.Popup(options, this);

			}

			this._popup.setContent(content);

		}



		if (!this._popupHandlersAdded) {

			this

			    .on('click', this._openPopup, this)

			    .on('remove', this.closePopup, this);



			this._popupHandlersAdded = true;

		}



		return this;

	},



	unbindPopup: function () {

		if (this._popup) {

			this._popup = null;

			this

			    .off('click', this._openPopup)

			    .off('remove', this.closePopup);



			this._popupHandlersAdded = false;

		}

		return this;

	},



	openPopup: function (latlng) {



		if (this._popup) {

			// open the popup from one of the path's points if not specified

			latlng = latlng || this._latlng ||

			         this._latlngs[Math.floor(this._latlngs.length / 2)];



			this._openPopup({latlng: latlng});

		}



		return this;

	},



	closePopup: function () {

		if (this._popup) {

			this._popup._close();

		}

		return this;

	},



	_openPopup: function (e) {

		this._popup.setLatLng(e.latlng);

		this._map.openPopup(this._popup);

	}

});



/*

 * Vector rendering for IE6-8 through VML.

 * Thanks to Dmitry Baranovsky and his Raphael library for inspiration!

 */



L.Browser.vml = !L.Browser.svg && (function () {

	try {

		var div = document.createElement('div');

		div.innerHTML = '<v:shape adj="1"/>';



		var shape = div.firstChild;

		shape.style.behavior = 'url(#default#VML)';



		return shape && (typeof shape.adj === 'object');



	} catch (e) {

		return false;

	}

}());



L.Path = L.Browser.svg || !L.Browser.vml ? L.Path : L.Path.extend({

	statics: {

		VML: true,

		CLIP_PADDING: 0.02

	},



	_createElement: (function () {

		try {

			document.namespaces.add('lvml', 'urn:schemas-microsoft-com:vml');

			return function (name) {

				return document.createElement('<lvml:' + name + ' class="lvml">');

			};

		} catch (e) {

			return function (name) {

				return document.createElement(

				        '<' + name + ' xmlns="urn:schemas-microsoft.com:vml" class="lvml">');

			};

		}

	}()),



	_initPath: function () {

		var container = this._container = this._createElement('shape');



		L.DomUtil.addClass(container, 'leaflet-vml-shape' +

			(this.options.className ? ' ' + this.options.className : ''));



		if (this.options.clickable) {

			L.DomUtil.addClass(container, 'leaflet-clickable');

		}



		container.coordsize = '1 1';



		this._path = this._createElement('path');

		container.appendChild(this._path);



		this._map._pathRoot.appendChild(container);

	},



	_initStyle: function () {

		this._updateStyle();

	},



	_updateStyle: function () {

		var stroke = this._stroke,

		    fill = this._fill,

		    options = this.options,

		    container = this._container;



		container.stroked = options.stroke;

		container.filled = options.fill;



		if (options.stroke) {

			if (!stroke) {

				stroke = this._stroke = this._createElement('stroke');

				stroke.endcap = 'round';

				container.appendChild(stroke);

			}

			stroke.weight = options.weight + 'px';

			stroke.color = options.color;

			stroke.opacity = options.opacity;



			if (options.dashArray) {

				stroke.dashStyle = L.Util.isArray(options.dashArray) ?

				    options.dashArray.join(' ') :

				    options.dashArray.replace(/( *, *)/g, ' ');

			} else {

				stroke.dashStyle = '';

			}

			if (options.lineCap) {

				stroke.endcap = options.lineCap.replace('butt', 'flat');

			}

			if (options.lineJoin) {

				stroke.joinstyle = options.lineJoin;

			}



		} else if (stroke) {

			container.removeChild(stroke);

			this._stroke = null;

		}



		if (options.fill) {

			if (!fill) {

				fill = this._fill = this._createElement('fill');

				container.appendChild(fill);

			}

			fill.color = options.fillColor || options.color;

			fill.opacity = options.fillOpacity;



		} else if (fill) {

			container.removeChild(fill);

			this._fill = null;

		}

	},



	_updatePath: function () {

		var style = this._container.style;



		style.display = 'none';

		this._path.v = this.getPathString() + ' '; // the space fixes IE empty path string bug

		style.display = '';

	}

});



L.Map.include(L.Browser.svg || !L.Browser.vml ? {} : {

	_initPathRoot: function () {

		if (this._pathRoot) { return; }



		var root = this._pathRoot = document.createElement('div');

		root.className = 'leaflet-vml-container';

		this._panes.overlayPane.appendChild(root);



		this.on('moveend', this._updatePathViewport);

		this._updatePathViewport();

	}

});



/*

 * Vector rendering for all browsers that support canvas.

 */



L.Browser.canvas = (function () {

	return !!document.createElement('canvas').getContext;

}());



L.Path = (L.Path.SVG && !window.L_PREFER_CANVAS) || !L.Browser.canvas ? L.Path : L.Path.extend({

	statics: {

		//CLIP_PADDING: 0.02, // not sure if there's a need to set it to a small value

		CANVAS: true,

		SVG: false

	},



	redraw: function () {

		if (this._map) {

			this.projectLatlngs();

			this._requestUpdate();

		}

		return this;

	},



	setStyle: function (style) {

		L.setOptions(this, style);



		if (this._map) {

			this._updateStyle();

			this._requestUpdate();

		}

		return this;

	},



	onRemove: function (map) {

		map

		    .off('viewreset', this.projectLatlngs, this)

		    .off('moveend', this._updatePath, this);



		if (this.options.clickable) {

			this._map.off('click', this._onClick, this);

			this._map.off('mousemove', this._onMouseMove, this);

		}



		this._requestUpdate();

		

		this.fire('remove');

		this._map = null;

	},



	_requestUpdate: function () {

		if (this._map && !L.Path._updateRequest) {

			L.Path._updateRequest = L.Util.requestAnimFrame(this._fireMapMoveEnd, this._map);

		}

	},



	_fireMapMoveEnd: function () {

		L.Path._updateRequest = null;

		this.fire('moveend');

	},



	_initElements: function () {

		this._map._initPathRoot();

		this._ctx = this._map._canvasCtx;

	},



	_updateStyle: function () {

		var options = this.options;



		if (options.stroke) {

			this._ctx.lineWidth = options.weight;

			this._ctx.strokeStyle = options.color;

		}

		if (options.fill) {

			this._ctx.fillStyle = options.fillColor || options.color;

		}



		if (options.lineCap) {

			this._ctx.lineCap = options.lineCap;

		}

		if (options.lineJoin) {

			this._ctx.lineJoin = options.lineJoin;

		}

	},



	_drawPath: function () {

		var i, j, len, len2, point, drawMethod;



		this._ctx.beginPath();



		for (i = 0, len = this._parts.length; i < len; i++) {

			for (j = 0, len2 = this._parts[i].length; j < len2; j++) {

				point = this._parts[i][j];

				drawMethod = (j === 0 ? 'move' : 'line') + 'To';



				this._ctx[drawMethod](point.x, point.y);

			}

			// TODO refactor ugly hack

			if (this instanceof L.Polygon) {

				this._ctx.closePath();

			}

		}

	},



	_checkIfEmpty: function () {

		return !this._parts.length;

	},



	_updatePath: function () {

		if (this._checkIfEmpty()) { return; }



		var ctx = this._ctx,

		    options = this.options;



		this._drawPath();

		ctx.save();

		this._updateStyle();



		if (options.fill) {

			ctx.globalAlpha = options.fillOpacity;

			ctx.fill(options.fillRule || 'evenodd');

		}



		if (options.stroke) {

			ctx.globalAlpha = options.opacity;

			ctx.stroke();

		}



		ctx.restore();



		// TODO optimization: 1 fill/stroke for all features with equal style instead of 1 for each feature

	},



	_initEvents: function () {

		if (this.options.clickable) {

			this._map.on('mousemove', this._onMouseMove, this);

			this._map.on('click dblclick contextmenu', this._fireMouseEvent, this);

		}

	},



	_fireMouseEvent: function (e) {

		if (this._containsPoint(e.layerPoint)) {

			this.fire(e.type, e);

		}

	},



	_onMouseMove: function (e) {

		if (!this._map || this._map._animatingZoom) { return; }



		// TODO don't do on each move

		if (this._containsPoint(e.layerPoint)) {

			this._ctx.canvas.style.cursor = 'pointer';

			this._mouseInside = true;

			this.fire('mouseover', e);



		} else if (this._mouseInside) {

			this._ctx.canvas.style.cursor = '';

			this._mouseInside = false;

			this.fire('mouseout', e);

		}

	}

});



L.Map.include((L.Path.SVG && !window.L_PREFER_CANVAS) || !L.Browser.canvas ? {} : {

	_initPathRoot: function () {

		var root = this._pathRoot,

		    ctx;



		if (!root) {

			root = this._pathRoot = document.createElement('canvas');

			root.style.position = 'absolute';

			ctx = this._canvasCtx = root.getContext('2d');



			ctx.lineCap = 'round';

			ctx.lineJoin = 'round';



			this._panes.overlayPane.appendChild(root);



			if (this.options.zoomAnimation) {

				this._pathRoot.className = 'leaflet-zoom-animated';

				this.on('zoomanim', this._animatePathZoom);

				this.on('zoomend', this._endPathZoom);

			}

			this.on('moveend', this._updateCanvasViewport);

			this._updateCanvasViewport();

		}

	},



	_updateCanvasViewport: function () {

		// don't redraw while zooming. See _updateSvgViewport for more details

		if (this._pathZooming) { return; }

		this._updatePathViewport();



		var vp = this._pathViewport,

		    min = vp.min,

		    size = vp.max.subtract(min),

		    root = this._pathRoot;



		//TODO check if this works properly on mobile webkit

		L.DomUtil.setPosition(root, min);

		root.width = size.x;

		root.height = size.y;

		root.getContext('2d').translate(-min.x, -min.y);

	}

});



/*

 * L.LineUtil contains different utility functions for line segments

 * and polylines (clipping, simplification, distances, etc.)

 */



/*jshint bitwise:false */ // allow bitwise operations for this file



L.LineUtil = {



	// Simplify polyline with vertex reduction and Douglas-Peucker simplification.

	// Improves rendering performance dramatically by lessening the number of points to draw.



	simplify: function (/*Point[]*/ points, /*Number*/ tolerance) {

		if (!tolerance || !points.length) {

			return points.slice();

		}



		var sqTolerance = tolerance * tolerance;



		// stage 1: vertex reduction

		points = this._reducePoints(points, sqTolerance);



		// stage 2: Douglas-Peucker simplification

		points = this._simplifyDP(points, sqTolerance);



		return points;

	},



	// distance from a point to a segment between two points

	pointToSegmentDistance:  function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2) {

		return Math.sqrt(this._sqClosestPointOnSegment(p, p1, p2, true));

	},



	closestPointOnSegment: function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2) {

		return this._sqClosestPointOnSegment(p, p1, p2);

	},



	// Douglas-Peucker simplification, see http://en.wikipedia.org/wiki/Douglas-Peucker_algorithm

	_simplifyDP: function (points, sqTolerance) {



		var len = points.length,

		    ArrayConstructor = typeof Uint8Array !== undefined + '' ? Uint8Array : Array,

		    markers = new ArrayConstructor(len);



		markers[0] = markers[len - 1] = 1;



		this._simplifyDPStep(points, markers, sqTolerance, 0, len - 1);



		var i,

		    newPoints = [];



		for (i = 0; i < len; i++) {

			if (markers[i]) {

				newPoints.push(points[i]);

			}

		}



		return newPoints;

	},



	_simplifyDPStep: function (points, markers, sqTolerance, first, last) {



		var maxSqDist = 0,

		    index, i, sqDist;



		for (i = first + 1; i <= last - 1; i++) {

			sqDist = this._sqClosestPointOnSegment(points[i], points[first], points[last], true);



			if (sqDist > maxSqDist) {

				index = i;

				maxSqDist = sqDist;

			}

		}



		if (maxSqDist > sqTolerance) {

			markers[index] = 1;



			this._simplifyDPStep(points, markers, sqTolerance, first, index);

			this._simplifyDPStep(points, markers, sqTolerance, index, last);

		}

	},



	// reduce points that are too close to each other to a single point

	_reducePoints: function (points, sqTolerance) {

		var reducedPoints = [points[0]];



		for (var i = 1, prev = 0, len = points.length; i < len; i++) {

			if (this._sqDist(points[i], points[prev]) > sqTolerance) {

				reducedPoints.push(points[i]);

				prev = i;

			}

		}

		if (prev < len - 1) {

			reducedPoints.push(points[len - 1]);

		}

		return reducedPoints;

	},



	// Cohen-Sutherland line clipping algorithm.

	// Used to avoid rendering parts of a polyline that are not currently visible.



	clipSegment: function (a, b, bounds, useLastCode) {

		var codeA = useLastCode ? this._lastCode : this._getBitCode(a, bounds),

		    codeB = this._getBitCode(b, bounds),



		    codeOut, p, newCode;



		// save 2nd code to avoid calculating it on the next segment

		this._lastCode = codeB;



		while (true) {

			// if a,b is inside the clip window (trivial accept)

			if (!(codeA | codeB)) {

				return [a, b];

			// if a,b is outside the clip window (trivial reject)

			} else if (codeA & codeB) {

				return false;

			// other cases

			} else {

				codeOut = codeA || codeB;

				p = this._getEdgeIntersection(a, b, codeOut, bounds);

				newCode = this._getBitCode(p, bounds);



				if (codeOut === codeA) {

					a = p;

					codeA = newCode;

				} else {

					b = p;

					codeB = newCode;

				}

			}

		}

	},



	_getEdgeIntersection: function (a, b, code, bounds) {

		var dx = b.x - a.x,

		    dy = b.y - a.y,

		    min = bounds.min,

		    max = bounds.max;



		if (code & 8) { // top

			return new L.Point(a.x + dx * (max.y - a.y) / dy, max.y);

		} else if (code & 4) { // bottom

			return new L.Point(a.x + dx * (min.y - a.y) / dy, min.y);

		} else if (code & 2) { // right

			return new L.Point(max.x, a.y + dy * (max.x - a.x) / dx);

		} else if (code & 1) { // left

			return new L.Point(min.x, a.y + dy * (min.x - a.x) / dx);

		}

	},



	_getBitCode: function (/*Point*/ p, bounds) {

		var code = 0;



		if (p.x < bounds.min.x) { // left

			code |= 1;

		} else if (p.x > bounds.max.x) { // right

			code |= 2;

		}

		if (p.y < bounds.min.y) { // bottom

			code |= 4;

		} else if (p.y > bounds.max.y) { // top

			code |= 8;

		}



		return code;

	},



	// square distance (to avoid unnecessary Math.sqrt calls)

	_sqDist: function (p1, p2) {

		var dx = p2.x - p1.x,

		    dy = p2.y - p1.y;

		return dx * dx + dy * dy;

	},



	// return closest point on segment or distance to that point

	_sqClosestPointOnSegment: function (p, p1, p2, sqDist) {

		var x = p1.x,

		    y = p1.y,

		    dx = p2.x - x,

		    dy = p2.y - y,

		    dot = dx * dx + dy * dy,

		    t;



		if (dot > 0) {

			t = ((p.x - x) * dx + (p.y - y) * dy) / dot;



			if (t > 1) {

				x = p2.x;

				y = p2.y;

			} else if (t > 0) {

				x += dx * t;

				y += dy * t;

			}

		}



		dx = p.x - x;

		dy = p.y - y;



		return sqDist ? dx * dx + dy * dy : new L.Point(x, y);

	}

};



/*

 * L.Polyline is used to display polylines on a map.

 */



L.Polyline = L.Path.extend({

	initialize: function (latlngs, options) {

		L.Path.prototype.initialize.call(this, options);



		this._latlngs = this._convertLatLngs(latlngs);

	},



	options: {

		// how much to simplify the polyline on each zoom level

		// more = better performance and smoother look, less = more accurate

		smoothFactor: 1.0,

		noClip: false

	},



	projectLatlngs: function () {

		this._originalPoints = [];



		for (var i = 0, len = this._latlngs.length; i < len; i++) {

			this._originalPoints[i] = this._map.latLngToLayerPoint(this._latlngs[i]);

		}

	},



	getPathString: function () {

		for (var i = 0, len = this._parts.length, str = ''; i < len; i++) {

			str += this._getPathPartStr(this._parts[i]);

		}

		return str;

	},



	getLatLngs: function () {

		return this._latlngs;

	},



	setLatLngs: function (latlngs) {

		this._latlngs = this._convertLatLngs(latlngs);

		return this.redraw();

	},



	addLatLng: function (latlng) {

		this._latlngs.push(L.latLng(latlng));

		return this.redraw();

	},



	spliceLatLngs: function () { // (Number index, Number howMany)

		var removed = [].splice.apply(this._latlngs, arguments);

		this._convertLatLngs(this._latlngs, true);

		this.redraw();

		return removed;

	},



	closestLayerPoint: function (p) {

		var minDistance = Infinity, parts = this._parts, p1, p2, minPoint = null;



		for (var j = 0, jLen = parts.length; j < jLen; j++) {

			var points = parts[j];

			for (var i = 1, len = points.length; i < len; i++) {

				p1 = points[i - 1];

				p2 = points[i];

				var sqDist = L.LineUtil._sqClosestPointOnSegment(p, p1, p2, true);

				if (sqDist < minDistance) {

					minDistance = sqDist;

					minPoint = L.LineUtil._sqClosestPointOnSegment(p, p1, p2);

				}

			}

		}

		if (minPoint) {

			minPoint.distance = Math.sqrt(minDistance);

		}

		return minPoint;

	},



	getBounds: function () {

		return new L.LatLngBounds(this.getLatLngs());

	},



	_convertLatLngs: function (latlngs, overwrite) {

		var i, len, target = overwrite ? latlngs : [];



		for (i = 0, len = latlngs.length; i < len; i++) {

			if (L.Util.isArray(latlngs[i]) && typeof latlngs[i][0] !== 'number') {

				return;

			}

			target[i] = L.latLng(latlngs[i]);

		}

		return target;

	},



	_initEvents: function () {

		L.Path.prototype._initEvents.call(this);

	},



	_getPathPartStr: function (points) {

		var round = L.Path.VML;



		for (var j = 0, len2 = points.length, str = '', p; j < len2; j++) {

			p = points[j];

			if (round) {

				p._round();

			}

			str += (j ? 'L' : 'M') + p.x + ' ' + p.y;

		}

		return str;

	},



	_clipPoints: function () {

		var points = this._originalPoints,

		    len = points.length,

		    i, k, segment;



		if (this.options.noClip) {

			this._parts = [points];

			return;

		}



		this._parts = [];



		var parts = this._parts,

		    vp = this._map._pathViewport,

		    lu = L.LineUtil;



		for (i = 0, k = 0; i < len - 1; i++) {

			segment = lu.clipSegment(points[i], points[i + 1], vp, i);

			if (!segment) {

				continue;

			}



			parts[k] = parts[k] || [];

			parts[k].push(segment[0]);



			// if segment goes out of screen, or it's the last one, it's the end of the line part

			if ((segment[1] !== points[i + 1]) || (i === len - 2)) {

				parts[k].push(segment[1]);

				k++;

			}

		}

	},



	// simplify each clipped part of the polyline

	_simplifyPoints: function () {

		var parts = this._parts,

		    lu = L.LineUtil;



		for (var i = 0, len = parts.length; i < len; i++) {

			parts[i] = lu.simplify(parts[i], this.options.smoothFactor);

		}

	},



	_updatePath: function () {

		if (!this._map) { return; }



		this._clipPoints();

		this._simplifyPoints();



		L.Path.prototype._updatePath.call(this);

	}

});



L.polyline = function (latlngs, options) {

	return new L.Polyline(latlngs, options);

};



/*

 * L.PolyUtil contains utility functions for polygons (clipping, etc.).

 */



/*jshint bitwise:false */ // allow bitwise operations here



L.PolyUtil = {};



/*

 * Sutherland-Hodgeman polygon clipping algorithm.

 * Used to avoid rendering parts of a polygon that are not currently visible.

 */

L.PolyUtil.clipPolygon = function (points, bounds) {

	var clippedPoints,

	    edges = [1, 4, 2, 8],

	    i, j, k,

	    a, b,

	    len, edge, p,

	    lu = L.LineUtil;



	for (i = 0, len = points.length; i < len; i++) {

		points[i]._code = lu._getBitCode(points[i], bounds);

	}



	// for each edge (left, bottom, right, top)

	for (k = 0; k < 4; k++) {

		edge = edges[k];

		clippedPoints = [];



		for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {

			a = points[i];

			b = points[j];



			// if a is inside the clip window

			if (!(a._code & edge)) {

				// if b is outside the clip window (a->b goes out of screen)

				if (b._code & edge) {

					p = lu._getEdgeIntersection(b, a, edge, bounds);

					p._code = lu._getBitCode(p, bounds);

					clippedPoints.push(p);

				}

				clippedPoints.push(a);



			// else if b is inside the clip window (a->b enters the screen)

			} else if (!(b._code & edge)) {

				p = lu._getEdgeIntersection(b, a, edge, bounds);

				p._code = lu._getBitCode(p, bounds);

				clippedPoints.push(p);

			}

		}

		points = clippedPoints;

	}



	return points;

};



/*

 * L.Polygon is used to display polygons on a map.

 */



L.Polygon = L.Polyline.extend({

	options: {

		fill: true

	},



	initialize: function (latlngs, options) {

		L.Polyline.prototype.initialize.call(this, latlngs, options);

		this._initWithHoles(latlngs);

	},



	_initWithHoles: function (latlngs) {

		var i, len, hole;

		if (latlngs && L.Util.isArray(latlngs[0]) && (typeof latlngs[0][0] !== 'number')) {

			this._latlngs = this._convertLatLngs(latlngs[0]);

			this._holes = latlngs.slice(1);



			for (i = 0, len = this._holes.length; i < len; i++) {

				hole = this._holes[i] = this._convertLatLngs(this._holes[i]);

				if (hole[0].equals(hole[hole.length - 1])) {

					hole.pop();

				}

			}

		}



		// filter out last point if its equal to the first one

		latlngs = this._latlngs;



		if (latlngs.length >= 2 && latlngs[0].equals(latlngs[latlngs.length - 1])) {

			latlngs.pop();

		}

	},



	projectLatlngs: function () {

		L.Polyline.prototype.projectLatlngs.call(this);



		// project polygon holes points

		// TODO move this logic to Polyline to get rid of duplication

		this._holePoints = [];



		if (!this._holes) { return; }



		var i, j, len, len2;



		for (i = 0, len = this._holes.length; i < len; i++) {

			this._holePoints[i] = [];



			for (j = 0, len2 = this._holes[i].length; j < len2; j++) {

				this._holePoints[i][j] = this._map.latLngToLayerPoint(this._holes[i][j]);

			}

		}

	},



	setLatLngs: function (latlngs) {

		if (latlngs && L.Util.isArray(latlngs[0]) && (typeof latlngs[0][0] !== 'number')) {

			this._initWithHoles(latlngs);

			return this.redraw();

		} else {

			return L.Polyline.prototype.setLatLngs.call(this, latlngs);

		}

	},



	_clipPoints: function () {

		var points = this._originalPoints,

		    newParts = [];



		this._parts = [points].concat(this._holePoints);



		if (this.options.noClip) { return; }



		for (var i = 0, len = this._parts.length; i < len; i++) {

			var clipped = L.PolyUtil.clipPolygon(this._parts[i], this._map._pathViewport);

			if (clipped.length) {

				newParts.push(clipped);

			}

		}



		this._parts = newParts;

	},



	_getPathPartStr: function (points) {

		var str = L.Polyline.prototype._getPathPartStr.call(this, points);

		return str + (L.Browser.svg ? 'z' : 'x');

	}

});



L.polygon = function (latlngs, options) {

	return new L.Polygon(latlngs, options);

};



/*

 * Contains L.MultiPolyline and L.MultiPolygon layers.

 */



(function () {

	function createMulti(Klass) {



		return L.FeatureGroup.extend({



			initialize: function (latlngs, options) {

				this._layers = {};

				this._options = options;

				this.setLatLngs(latlngs);

			},



			setLatLngs: function (latlngs) {

				var i = 0,

				    len = latlngs.length;



				this.eachLayer(function (layer) {

					if (i < len) {

						layer.setLatLngs(latlngs[i++]);

					} else {

						this.removeLayer(layer);

					}

				}, this);



				while (i < len) {

					this.addLayer(new Klass(latlngs[i++], this._options));

				}



				return this;

			},



			getLatLngs: function () {

				var latlngs = [];



				this.eachLayer(function (layer) {

					latlngs.push(layer.getLatLngs());

				});



				return latlngs;

			}

		});

	}



	L.MultiPolyline = createMulti(L.Polyline);

	L.MultiPolygon = createMulti(L.Polygon);



	L.multiPolyline = function (latlngs, options) {

		return new L.MultiPolyline(latlngs, options);

	};



	L.multiPolygon = function (latlngs, options) {

		return new L.MultiPolygon(latlngs, options);

	};

}());



/*

 * L.Rectangle extends Polygon and creates a rectangle when passed a LatLngBounds object.

 */



L.Rectangle = L.Polygon.extend({

	initialize: function (latLngBounds, options) {

		L.Polygon.prototype.initialize.call(this, this._boundsToLatLngs(latLngBounds), options);

	},



	setBounds: function (latLngBounds) {

		this.setLatLngs(this._boundsToLatLngs(latLngBounds));

	},



	_boundsToLatLngs: function (latLngBounds) {

		latLngBounds = L.latLngBounds(latLngBounds);

		return [

			latLngBounds.getSouthWest(),

			latLngBounds.getNorthWest(),

			latLngBounds.getNorthEast(),

			latLngBounds.getSouthEast()

		];

	}

});



L.rectangle = function (latLngBounds, options) {

	return new L.Rectangle(latLngBounds, options);

};



/*

 * L.Circle is a circle overlay (with a certain radius in meters).

 */



L.Circle = L.Path.extend({

	initialize: function (latlng, radius, options) {

		L.Path.prototype.initialize.call(this, options);



		this._latlng = L.latLng(latlng);

		this._mRadius = radius;

	},



	options: {

		fill: true

	},



	setLatLng: function (latlng) {

		this._latlng = L.latLng(latlng);

		return this.redraw();

	},



	setRadius: function (radius) {

		this._mRadius = radius;

		return this.redraw();

	},



	projectLatlngs: function () {

		var lngRadius = this._getLngRadius(),

		    latlng = this._latlng,

		    pointLeft = this._map.latLngToLayerPoint([latlng.lat, latlng.lng - lngRadius]);



		this._point = this._map.latLngToLayerPoint(latlng);

		this._radius = Math.max(this._point.x - pointLeft.x, 1);

	},



	getBounds: function () {

		var lngRadius = this._getLngRadius(),

		    latRadius = (this._mRadius / 40075017) * 360,

		    latlng = this._latlng;



		return new L.LatLngBounds(

		        [latlng.lat - latRadius, latlng.lng - lngRadius],

		        [latlng.lat + latRadius, latlng.lng + lngRadius]);

	},



	getLatLng: function () {

		return this._latlng;

	},



	getPathString: function () {

		var p = this._point,

		    r = this._radius;



		if (this._checkIfEmpty()) {

			return '';

		}



		if (L.Browser.svg) {

			return 'M' + p.x + ',' + (p.y - r) +

			       'A' + r + ',' + r + ',0,1,1,' +

			       (p.x - 0.1) + ',' + (p.y - r) + ' z';

		} else {

			p._round();

			r = Math.round(r);

			return 'AL ' + p.x + ',' + p.y + ' ' + r + ',' + r + ' 0,' + (65535 * 360);

		}

	},



	getRadius: function () {

		return this._mRadius;

	},



	// TODO Earth hardcoded, move into projection code!



	_getLatRadius: function () {

		return (this._mRadius / 40075017) * 360;

	},



	_getLngRadius: function () {

		return this._getLatRadius() / Math.cos(L.LatLng.DEG_TO_RAD * this._latlng.lat);

	},



	_checkIfEmpty: function () {

		if (!this._map) {

			return false;

		}

		var vp = this._map._pathViewport,

		    r = this._radius,

		    p = this._point;



		return p.x - r > vp.max.x || p.y - r > vp.max.y ||

		       p.x + r < vp.min.x || p.y + r < vp.min.y;

	}

});



L.circle = function (latlng, radius, options) {

	return new L.Circle(latlng, radius, options);

};



/*

 * L.CircleMarker is a circle overlay with a permanent pixel radius.

 */



L.CircleMarker = L.Circle.extend({

	options: {

		radius: 10,

		weight: 2

	},



	initialize: function (latlng, options) {

		L.Circle.prototype.initialize.call(this, latlng, null, options);

		this._radius = this.options.radius;

	},



	projectLatlngs: function () {

		this._point = this._map.latLngToLayerPoint(this._latlng);

	},



	_updateStyle : function () {

		L.Circle.prototype._updateStyle.call(this);

		this.setRadius(this.options.radius);

	},



	setLatLng: function (latlng) {

		L.Circle.prototype.setLatLng.call(this, latlng);

		if (this._popup && this._popup._isOpen) {

			this._popup.setLatLng(latlng);

		}

		return this;

	},



	setRadius: function (radius) {

		this.options.radius = this._radius = radius;

		return this.redraw();

	},



	getRadius: function () {

		return this._radius;

	}

});



L.circleMarker = function (latlng, options) {

	return new L.CircleMarker(latlng, options);

};



/*

 * Extends L.Polyline to be able to manually detect clicks on Canvas-rendered polylines.

 */



L.Polyline.include(!L.Path.CANVAS ? {} : {

	_containsPoint: function (p, closed) {

		var i, j, k, len, len2, dist, part,

		    w = this.options.weight / 2;



		if (L.Browser.touch) {

			w += 10; // polyline click tolerance on touch devices

		}



		for (i = 0, len = this._parts.length; i < len; i++) {

			part = this._parts[i];

			for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {

				if (!closed && (j === 0)) {

					continue;

				}



				dist = L.LineUtil.pointToSegmentDistance(p, part[k], part[j]);



				if (dist <= w) {

					return true;

				}

			}

		}

		return false;

	}

});



/*

 * Extends L.Polygon to be able to manually detect clicks on Canvas-rendered polygons.

 */



L.Polygon.include(!L.Path.CANVAS ? {} : {

	_containsPoint: function (p) {

		var inside = false,

		    part, p1, p2,

		    i, j, k,

		    len, len2;



		// TODO optimization: check if within bounds first



		if (L.Polyline.prototype._containsPoint.call(this, p, true)) {

			// click on polygon border

			return true;

		}



		// ray casting algorithm for detecting if point is in polygon



		for (i = 0, len = this._parts.length; i < len; i++) {

			part = this._parts[i];



			for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {

				p1 = part[j];

				p2 = part[k];



				if (((p1.y > p.y) !== (p2.y > p.y)) &&

						(p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {

					inside = !inside;

				}

			}

		}



		return inside;

	}

});



/*

 * Extends L.Circle with Canvas-specific code.

 */



L.Circle.include(!L.Path.CANVAS ? {} : {

	_drawPath: function () {

		var p = this._point;

		this._ctx.beginPath();

		this._ctx.arc(p.x, p.y, this._radius, 0, Math.PI * 2, false);

	},



	_containsPoint: function (p) {

		var center = this._point,

		    w2 = this.options.stroke ? this.options.weight / 2 : 0;



		return (p.distanceTo(center) <= this._radius + w2);

	}

});



/*
 * CircleMarker canvas specific drawing parts.
 */

L.CircleMarker.include(!L.Path.CANVAS ? {} : {
	_updateStyle: function () {
		L.Path.prototype._updateStyle.call(this);
	}
});


/*

 * L.GeoJSON turns any GeoJSON data into a Leaflet layer.

 */



L.GeoJSON = L.FeatureGroup.extend({



	initialize: function (geojson, options) {

		L.setOptions(this, options);



		this._layers = {};



		if (geojson) {

			this.addData(geojson);

		}

	},



	addData: function (geojson) {

		var features = L.Util.isArray(geojson) ? geojson : geojson.features,

		    i, len, feature;



		if (features) {

			for (i = 0, len = features.length; i < len; i++) {

				// Only add this if geometry or geometries are set and not null

				feature = features[i];

				if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {

					this.addData(features[i]);

				}

			}

			return this;

		}



		var options = this.options;



		if (options.filter && !options.filter(geojson)) { return; }



		var layer = L.GeoJSON.geometryToLayer(geojson, options.pointToLayer, options.coordsToLatLng, options);

		layer.feature = L.GeoJSON.asFeature(geojson);



		layer.defaultOptions = layer.options;

		this.resetStyle(layer);



		if (options.onEachFeature) {

			options.onEachFeature(geojson, layer);

		}



		return this.addLayer(layer);

	},



	resetStyle: function (layer) {

		var style = this.options.style;

		if (style) {

			// reset any custom styles

			L.Util.extend(layer.options, layer.defaultOptions);



			this._setLayerStyle(layer, style);

		}

	},



	setStyle: function (style) {

		this.eachLayer(function (layer) {

			this._setLayerStyle(layer, style);

		}, this);

	},



	_setLayerStyle: function (layer, style) {

		if (typeof style === 'function') {

			style = style(layer.feature);

		}

		if (layer.setStyle) {

			layer.setStyle(style);

		}

	}

});



L.extend(L.GeoJSON, {

	geometryToLayer: function (geojson, pointToLayer, coordsToLatLng, vectorOptions) {

		var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,

		    coords = geometry.coordinates,

		    layers = [],

		    latlng, latlngs, i, len;



		coordsToLatLng = coordsToLatLng || this.coordsToLatLng;



		switch (geometry.type) {

		case 'Point':

			latlng = coordsToLatLng(coords);

			return pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng);



		case 'MultiPoint':

			for (i = 0, len = coords.length; i < len; i++) {

				latlng = coordsToLatLng(coords[i]);

				layers.push(pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng));

			}

			return new L.FeatureGroup(layers);



		case 'LineString':

			latlngs = this.coordsToLatLngs(coords, 0, coordsToLatLng);

			return new L.Polyline(latlngs, vectorOptions);



		case 'Polygon':

			if (coords.length === 2 && !coords[1].length) {

				throw new Error('Invalid GeoJSON object.');

			}

			latlngs = this.coordsToLatLngs(coords, 1, coordsToLatLng);

			return new L.Polygon(latlngs, vectorOptions);



		case 'MultiLineString':

			latlngs = this.coordsToLatLngs(coords, 1, coordsToLatLng);

			return new L.MultiPolyline(latlngs, vectorOptions);



		case 'MultiPolygon':

			latlngs = this.coordsToLatLngs(coords, 2, coordsToLatLng);

			return new L.MultiPolygon(latlngs, vectorOptions);



		case 'GeometryCollection':

			for (i = 0, len = geometry.geometries.length; i < len; i++) {



				layers.push(this.geometryToLayer({

					geometry: geometry.geometries[i],

					type: 'Feature',

					properties: geojson.properties

				}, pointToLayer, coordsToLatLng, vectorOptions));

			}

			return new L.FeatureGroup(layers);



		default:

			throw new Error('Invalid GeoJSON object.');

		}

	},



	coordsToLatLng: function (coords) { // (Array[, Boolean]) -> LatLng

		return new L.LatLng(coords[1], coords[0], coords[2]);

	},



	coordsToLatLngs: function (coords, levelsDeep, coordsToLatLng) { // (Array[, Number, Function]) -> Array

		var latlng, i, len,

		    latlngs = [];



		for (i = 0, len = coords.length; i < len; i++) {

			latlng = levelsDeep ?

			        this.coordsToLatLngs(coords[i], levelsDeep - 1, coordsToLatLng) :

			        (coordsToLatLng || this.coordsToLatLng)(coords[i]);



			latlngs.push(latlng);

		}



		return latlngs;

	},



	latLngToCoords: function (latlng) {

		var coords = [latlng.lng, latlng.lat];



		if (latlng.alt !== undefined) {

			coords.push(latlng.alt);

		}

		return coords;

	},



	latLngsToCoords: function (latLngs) {

		var coords = [];



		for (var i = 0, len = latLngs.length; i < len; i++) {

			coords.push(L.GeoJSON.latLngToCoords(latLngs[i]));

		}



		return coords;

	},



	getFeature: function (layer, newGeometry) {

		return layer.feature ? L.extend({}, layer.feature, {geometry: newGeometry}) : L.GeoJSON.asFeature(newGeometry);

	},



	asFeature: function (geoJSON) {

		if (geoJSON.type === 'Feature') {

			return geoJSON;

		}



		return {

			type: 'Feature',

			properties: {},

			geometry: geoJSON

		};

	}

});



var PointToGeoJSON = {

	toGeoJSON: function () {

		return L.GeoJSON.getFeature(this, {

			type: 'Point',

			coordinates: L.GeoJSON.latLngToCoords(this.getLatLng())

		});

	}

};



L.Marker.include(PointToGeoJSON);

L.Circle.include(PointToGeoJSON);

L.CircleMarker.include(PointToGeoJSON);



L.Polyline.include({

	toGeoJSON: function () {

		return L.GeoJSON.getFeature(this, {

			type: 'LineString',

			coordinates: L.GeoJSON.latLngsToCoords(this.getLatLngs())

		});

	}

});



L.Polygon.include({

	toGeoJSON: function () {

		var coords = [L.GeoJSON.latLngsToCoords(this.getLatLngs())],

		    i, len, hole;



		coords[0].push(coords[0][0]);



		if (this._holes) {

			for (i = 0, len = this._holes.length; i < len; i++) {

				hole = L.GeoJSON.latLngsToCoords(this._holes[i]);

				hole.push(hole[0]);

				coords.push(hole);

			}

		}



		return L.GeoJSON.getFeature(this, {

			type: 'Polygon',

			coordinates: coords

		});

	}

});



(function () {

	function multiToGeoJSON(type) {

		return function () {

			var coords = [];



			this.eachLayer(function (layer) {

				coords.push(layer.toGeoJSON().geometry.coordinates);

			});



			return L.GeoJSON.getFeature(this, {

				type: type,

				coordinates: coords

			});

		};

	}



	L.MultiPolyline.include({toGeoJSON: multiToGeoJSON('MultiLineString')});

	L.MultiPolygon.include({toGeoJSON: multiToGeoJSON('MultiPolygon')});



	L.LayerGroup.include({

		toGeoJSON: function () {



			var geometry = this.feature && this.feature.geometry,

				jsons = [],

				json;



			if (geometry && geometry.type === 'MultiPoint') {

				return multiToGeoJSON('MultiPoint').call(this);

			}



			var isGeometryCollection = geometry && geometry.type === 'GeometryCollection';



			this.eachLayer(function (layer) {

				if (layer.toGeoJSON) {

					json = layer.toGeoJSON();

					jsons.push(isGeometryCollection ? json.geometry : L.GeoJSON.asFeature(json));

				}

			});



			if (isGeometryCollection) {

				return L.GeoJSON.getFeature(this, {

					geometries: jsons,

					type: 'GeometryCollection'

				});

			}



			return {

				type: 'FeatureCollection',

				features: jsons

			};

		}

	});

}());



L.geoJson = function (geojson, options) {

	return new L.GeoJSON(geojson, options);

};



/*

 * L.DomEvent contains functions for working with DOM events.

 */



L.DomEvent = {

	/* inspired by John Resig, Dean Edwards and YUI addEvent implementations */

	addListener: function (obj, type, fn, context) { // (HTMLElement, String, Function[, Object])



		var id = L.stamp(fn),

		    key = '_leaflet_' + type + id,

		    handler, originalHandler, newType;



		if (obj[key]) { return this; }



		handler = function (e) {

			return fn.call(context || obj, e || L.DomEvent._getEvent());

		};



		if (L.Browser.pointer && type.indexOf('touch') === 0) {

			return this.addPointerListener(obj, type, handler, id);

		}

		if (L.Browser.touch && (type === 'dblclick') && this.addDoubleTapListener) {

			this.addDoubleTapListener(obj, handler, id);

		}



		if ('addEventListener' in obj) {



			if (type === 'mousewheel') {

				obj.addEventListener('DOMMouseScroll', handler, false);

				obj.addEventListener(type, handler, false);



			} else if ((type === 'mouseenter') || (type === 'mouseleave')) {



				originalHandler = handler;

				newType = (type === 'mouseenter' ? 'mouseover' : 'mouseout');



				handler = function (e) {

					if (!L.DomEvent._checkMouse(obj, e)) { return; }

					return originalHandler(e);

				};



				obj.addEventListener(newType, handler, false);



			} else if (type === 'click' && L.Browser.android) {

				originalHandler = handler;

				handler = function (e) {

					return L.DomEvent._filterClick(e, originalHandler);

				};



				obj.addEventListener(type, handler, false);

			} else {

				obj.addEventListener(type, handler, false);

			}



		} else if ('attachEvent' in obj) {

			obj.attachEvent('on' + type, handler);

		}



		obj[key] = handler;



		return this;

	},



	removeListener: function (obj, type, fn) {  // (HTMLElement, String, Function)



		var id = L.stamp(fn),

		    key = '_leaflet_' + type + id,

		    handler = obj[key];



		if (!handler) { return this; }



		if (L.Browser.pointer && type.indexOf('touch') === 0) {

			this.removePointerListener(obj, type, id);

		} else if (L.Browser.touch && (type === 'dblclick') && this.removeDoubleTapListener) {

			this.removeDoubleTapListener(obj, id);



		} else if ('removeEventListener' in obj) {



			if (type === 'mousewheel') {

				obj.removeEventListener('DOMMouseScroll', handler, false);

				obj.removeEventListener(type, handler, false);



			} else if ((type === 'mouseenter') || (type === 'mouseleave')) {

				obj.removeEventListener((type === 'mouseenter' ? 'mouseover' : 'mouseout'), handler, false);

			} else {

				obj.removeEventListener(type, handler, false);

			}

		} else if ('detachEvent' in obj) {

			obj.detachEvent('on' + type, handler);

		}



		obj[key] = null;



		return this;

	},



	stopPropagation: function (e) {



		if (e.stopPropagation) {

			e.stopPropagation();

		} else {

			e.cancelBubble = true;

		}

		L.DomEvent._skipped(e);



		return this;

	},



	disableScrollPropagation: function (el) {

		var stop = L.DomEvent.stopPropagation;



		return L.DomEvent

			.on(el, 'mousewheel', stop)

			.on(el, 'MozMousePixelScroll', stop);

	},



	disableClickPropagation: function (el) {

		var stop = L.DomEvent.stopPropagation;



		for (var i = L.Draggable.START.length - 1; i >= 0; i--) {

			L.DomEvent.on(el, L.Draggable.START[i], stop);

		}



		return L.DomEvent

			.on(el, 'click', L.DomEvent._fakeStop)

			.on(el, 'dblclick', stop);

	},



	preventDefault: function (e) {



		if (e.preventDefault) {

			e.preventDefault();

		} else {

			e.returnValue = false;

		}

		return this;

	},



	stop: function (e) {

		return L.DomEvent

			.preventDefault(e)

			.stopPropagation(e);

	},



	getMousePosition: function (e, container) {

		if (!container) {

			return new L.Point(e.clientX, e.clientY);

		}



		var rect = container.getBoundingClientRect();



		return new L.Point(

			e.clientX - rect.left - container.clientLeft,

			e.clientY - rect.top - container.clientTop);

	},



	getWheelDelta: function (e) {



		var delta = 0;



		if (e.wheelDelta) {

			delta = e.wheelDelta / 120;

		}

		if (e.detail) {

			delta = -e.detail / 3;

		}

		return delta;

	},



	_skipEvents: {},



	_fakeStop: function (e) {

		// fakes stopPropagation by setting a special event flag, checked/reset with L.DomEvent._skipped(e)

		L.DomEvent._skipEvents[e.type] = true;

	},



	_skipped: function (e) {

		var skipped = this._skipEvents[e.type];

		// reset when checking, as it's only used in map container and propagates outside of the map

		this._skipEvents[e.type] = false;

		return skipped;

	},



	// check if element really left/entered the event target (for mouseenter/mouseleave)

	_checkMouse: function (el, e) {



		var related = e.relatedTarget;



		if (!related) { return true; }



		try {

			while (related && (related !== el)) {

				related = related.parentNode;

			}

		} catch (err) {

			return false;

		}

		return (related !== el);

	},



	_getEvent: function () { // evil magic for IE

		/*jshint noarg:false */

		var e = window.event;

		if (!e) {

			var caller = arguments.callee.caller;

			while (caller) {

				e = caller['arguments'][0];

				if (e && window.Event === e.constructor) {

					break;

				}

				caller = caller.caller;

			}

		}

		return e;

	},



	// this is a horrible workaround for a bug in Android where a single touch triggers two click events

	_filterClick: function (e, handler) {

		var timeStamp = (e.timeStamp || e.originalEvent.timeStamp),

			elapsed = L.DomEvent._lastClick && (timeStamp - L.DomEvent._lastClick);



		// are they closer together than 500ms yet more than 100ms?

		// Android typically triggers them ~300ms apart while multiple listeners

		// on the same event should be triggered far faster;

		// or check if click is simulated on the element, and if it is, reject any non-simulated events



		if ((elapsed && elapsed > 100 && elapsed < 500) || (e.target._simulatedClick && !e._simulated)) {

			L.DomEvent.stop(e);

			return;

		}

		L.DomEvent._lastClick = timeStamp;



		return handler(e);

	}

};



L.DomEvent.on = L.DomEvent.addListener;

L.DomEvent.off = L.DomEvent.removeListener;



/*

 * L.Draggable allows you to add dragging capabilities to any element. Supports mobile devices too.

 */



L.Draggable = L.Class.extend({

	includes: L.Mixin.Events,



	statics: {

		START: L.Browser.touch ? ['touchstart', 'mousedown'] : ['mousedown'],

		END: {

			mousedown: 'mouseup',

			touchstart: 'touchend',

			pointerdown: 'touchend',

			MSPointerDown: 'touchend'

		},

		MOVE: {

			mousedown: 'mousemove',

			touchstart: 'touchmove',

			pointerdown: 'touchmove',

			MSPointerDown: 'touchmove'

		}

	},



	initialize: function (element, dragStartTarget) {

		this._element = element;

		this._dragStartTarget = dragStartTarget || element;

	},



	enable: function () {

		if (this._enabled) { return; }



		for (var i = L.Draggable.START.length - 1; i >= 0; i--) {

			L.DomEvent.on(this._dragStartTarget, L.Draggable.START[i], this._onDown, this);

		}



		this._enabled = true;

	},



	disable: function () {

		if (!this._enabled) { return; }



		for (var i = L.Draggable.START.length - 1; i >= 0; i--) {

			L.DomEvent.off(this._dragStartTarget, L.Draggable.START[i], this._onDown, this);

		}



		this._enabled = false;

		this._moved = false;

	},



	_onDown: function (e) {

		this._moved = false;



		if (e.shiftKey || ((e.which !== 1) && (e.button !== 1) && !e.touches)) { return; }



		L.DomEvent.stopPropagation(e);



		if (L.Draggable._disabled) { return; }



		L.DomUtil.disableImageDrag();

		L.DomUtil.disableTextSelection();



		if (this._moving) { return; }



		var first = e.touches ? e.touches[0] : e;



		this._startPoint = new L.Point(first.clientX, first.clientY);

		this._startPos = this._newPos = L.DomUtil.getPosition(this._element);



		L.DomEvent

		    .on(document, L.Draggable.MOVE[e.type], this._onMove, this)

		    .on(document, L.Draggable.END[e.type], this._onUp, this);

	},



	_onMove: function (e) {

		if (e.touches && e.touches.length > 1) {

			this._moved = true;

			return;

		}



		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),

		    newPoint = new L.Point(first.clientX, first.clientY),

		    offset = newPoint.subtract(this._startPoint);



		if (!offset.x && !offset.y) { return; }

		if (L.Browser.touch && Math.abs(offset.x) + Math.abs(offset.y) < 3) { return; }



		L.DomEvent.preventDefault(e);



		if (!this._moved) {

			this.fire('dragstart');



			this._moved = true;

			this._startPos = L.DomUtil.getPosition(this._element).subtract(offset);



			L.DomUtil.addClass(document.body, 'leaflet-dragging');

			this._lastTarget = e.target || e.srcElement;

			L.DomUtil.addClass(this._lastTarget, 'leaflet-drag-target');

		}



		this._newPos = this._startPos.add(offset);

		this._moving = true;



		L.Util.cancelAnimFrame(this._animRequest);

		this._animRequest = L.Util.requestAnimFrame(this._updatePosition, this, true, this._dragStartTarget);

	},



	_updatePosition: function () {

		this.fire('predrag');

		L.DomUtil.setPosition(this._element, this._newPos);

		this.fire('drag');

	},



	_onUp: function () {

		L.DomUtil.removeClass(document.body, 'leaflet-dragging');



		if (this._lastTarget) {

			L.DomUtil.removeClass(this._lastTarget, 'leaflet-drag-target');

			this._lastTarget = null;

		}



		for (var i in L.Draggable.MOVE) {

			L.DomEvent

			    .off(document, L.Draggable.MOVE[i], this._onMove)

			    .off(document, L.Draggable.END[i], this._onUp);

		}



		L.DomUtil.enableImageDrag();

		L.DomUtil.enableTextSelection();



		if (this._moved && this._moving) {

			// ensure drag is not fired after dragend

			L.Util.cancelAnimFrame(this._animRequest);



			this.fire('dragend', {

				distance: this._newPos.distanceTo(this._startPos)

			});

		}



		this._moving = false;

	}

});



/*
	L.Handler is a base class for handler classes that are used internally to inject
	interaction features like dragging to classes like Map and Marker.
*/

L.Handler = L.Class.extend({
	initialize: function (map) {
		this._map = map;
	},

	enable: function () {
		if (this._enabled) { return; }

		this._enabled = true;
		this.addHooks();
	},

	disable: function () {
		if (!this._enabled) { return; }

		this._enabled = false;
		this.removeHooks();
	},

	enabled: function () {
		return !!this._enabled;
	}
});


/*
 * L.Handler.MapDrag is used to make the map draggable (with panning inertia), enabled by default.
 */

L.Map.mergeOptions({
	dragging: true,

	inertia: !L.Browser.android23,
	inertiaDeceleration: 3400, // px/s^2
	inertiaMaxSpeed: Infinity, // px/s
	inertiaThreshold: L.Browser.touch ? 32 : 18, // ms
	easeLinearity: 0.25,

	// TODO refactor, move to CRS
	worldCopyJump: false
});

L.Map.Drag = L.Handler.extend({
	addHooks: function () {
		if (!this._draggable) {
			var map = this._map;

			this._draggable = new L.Draggable(map._mapPane, map._container);

			this._draggable.on({
				'dragstart': this._onDragStart,
				'drag': this._onDrag,
				'dragend': this._onDragEnd
			}, this);

			if (map.options.worldCopyJump) {
				this._draggable.on('predrag', this._onPreDrag, this);
				map.on('viewreset', this._onViewReset, this);

				map.whenReady(this._onViewReset, this);
			}
		}
		this._draggable.enable();
	},

	removeHooks: function () {
		this._draggable.disable();
	},

	moved: function () {
		return this._draggable && this._draggable._moved;
	},

	_onDragStart: function () {
		var map = this._map;

		if (map._panAnim) {
			map._panAnim.stop();
		}

		map
		    .fire('movestart')
		    .fire('dragstart');

		if (map.options.inertia) {
			this._positions = [];
			this._times = [];
		}
	},

	_onDrag: function () {
		if (this._map.options.inertia) {
			var time = this._lastTime = +new Date(),
			    pos = this._lastPos = this._draggable._newPos;

			this._positions.push(pos);
			this._times.push(time);

			if (time - this._times[0] > 200) {
				this._positions.shift();
				this._times.shift();
			}
		}

		this._map
		    .fire('move')
		    .fire('drag');
	},

	_onViewReset: function () {
		// TODO fix hardcoded Earth values
		var pxCenter = this._map.getSize()._divideBy(2),
		    pxWorldCenter = this._map.latLngToLayerPoint([0, 0]);

		this._initialWorldOffset = pxWorldCenter.subtract(pxCenter).x;
		this._worldWidth = this._map.project([0, 180]).x;
	},

	_onPreDrag: function () {
		// TODO refactor to be able to adjust map pane position after zoom
		var worldWidth = this._worldWidth,
		    halfWidth = Math.round(worldWidth / 2),
		    dx = this._initialWorldOffset,
		    x = this._draggable._newPos.x,
		    newX1 = (x - halfWidth + dx) % worldWidth + halfWidth - dx,
		    newX2 = (x + halfWidth + dx) % worldWidth - halfWidth - dx,
		    newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;

		this._draggable._newPos.x = newX;
	},

	_onDragEnd: function (e) {
		var map = this._map,
		    options = map.options,
		    delay = +new Date() - this._lastTime,

		    noInertia = !options.inertia || delay > options.inertiaThreshold || !this._positions[0];

		map.fire('dragend', e);

		if (noInertia) {
			map.fire('moveend');

		} else {

			var direction = this._lastPos.subtract(this._positions[0]),
			    duration = (this._lastTime + delay - this._times[0]) / 1000,
			    ease = options.easeLinearity,

			    speedVector = direction.multiplyBy(ease / duration),
			    speed = speedVector.distanceTo([0, 0]),

			    limitedSpeed = Math.min(options.inertiaMaxSpeed, speed),
			    limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed),

			    decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease),
			    offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();

			if (!offset.x || !offset.y) {
				map.fire('moveend');

			} else {
				offset = map._limitOffset(offset, map.options.maxBounds);

				L.Util.requestAnimFrame(function () {
					map.panBy(offset, {
						duration: decelerationDuration,
						easeLinearity: ease,
						noMoveStart: true
					});
				});
			}
		}
	}
});

L.Map.addInitHook('addHandler', 'dragging', L.Map.Drag);


/*
 * L.Handler.DoubleClickZoom is used to handle double-click zoom on the map, enabled by default.
 */

L.Map.mergeOptions({
	doubleClickZoom: true
});

L.Map.DoubleClickZoom = L.Handler.extend({
	addHooks: function () {
		this._map.on('dblclick', this._onDoubleClick, this);
	},

	removeHooks: function () {
		this._map.off('dblclick', this._onDoubleClick, this);
	},

	_onDoubleClick: function (e) {
		var map = this._map,
		    zoom = map.getZoom() + (e.originalEvent.shiftKey ? -1 : 1);

		if (map.options.doubleClickZoom === 'center') {
			map.setZoom(zoom);
		} else {
			map.setZoomAround(e.containerPoint, zoom);
		}
	}
});

L.Map.addInitHook('addHandler', 'doubleClickZoom', L.Map.DoubleClickZoom);


/*
 * L.Handler.ScrollWheelZoom is used by L.Map to enable mouse scroll wheel zoom on the map.
 */

L.Map.mergeOptions({
	scrollWheelZoom: true
});

L.Map.ScrollWheelZoom = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, 'mousewheel', this._onWheelScroll, this);
		L.DomEvent.on(this._map._container, 'MozMousePixelScroll', L.DomEvent.preventDefault);
		this._delta = 0;
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'mousewheel', this._onWheelScroll);
		L.DomEvent.off(this._map._container, 'MozMousePixelScroll', L.DomEvent.preventDefault);
	},

	_onWheelScroll: function (e) {
		var delta = L.DomEvent.getWheelDelta(e);

		this._delta += delta;
		this._lastMousePos = this._map.mouseEventToContainerPoint(e);

		if (!this._startTime) {
			this._startTime = +new Date();
		}

		var left = Math.max(40 - (+new Date() - this._startTime), 0);

		clearTimeout(this._timer);
		this._timer = setTimeout(L.bind(this._performZoom, this), left);

		L.DomEvent.preventDefault(e);
		L.DomEvent.stopPropagation(e);
	},

	_performZoom: function () {
		var map = this._map,
		    delta = this._delta,
		    zoom = map.getZoom();

		delta = delta > 0 ? Math.ceil(delta) : Math.floor(delta);
		delta = Math.max(Math.min(delta, 4), -4);
		delta = map._limitZoom(zoom + delta) - zoom;

		this._delta = 0;
		this._startTime = null;

		if (!delta) { return; }

		if (map.options.scrollWheelZoom === 'center') {
			map.setZoom(zoom + delta);
		} else {
			map.setZoomAround(this._lastMousePos, zoom + delta);
		}
	}
});

L.Map.addInitHook('addHandler', 'scrollWheelZoom', L.Map.ScrollWheelZoom);


/*

 * Extends the event handling code with double tap support for mobile browsers.

 */



L.extend(L.DomEvent, {



	_touchstart: L.Browser.msPointer ? 'MSPointerDown' : L.Browser.pointer ? 'pointerdown' : 'touchstart',

	_touchend: L.Browser.msPointer ? 'MSPointerUp' : L.Browser.pointer ? 'pointerup' : 'touchend',



	// inspired by Zepto touch code by Thomas Fuchs

	addDoubleTapListener: function (obj, handler, id) {

		var last,

		    doubleTap = false,

		    delay = 250,

		    touch,

		    pre = '_leaflet_',

		    touchstart = this._touchstart,

		    touchend = this._touchend,

		    trackedTouches = [];



		function onTouchStart(e) {

			var count;



			if (L.Browser.pointer) {

				trackedTouches.push(e.pointerId);

				count = trackedTouches.length;

			} else {

				count = e.touches.length;

			}

			if (count > 1) {

				return;

			}



			var now = Date.now(),

				delta = now - (last || now);



			touch = e.touches ? e.touches[0] : e;

			doubleTap = (delta > 0 && delta <= delay);

			last = now;

		}



		function onTouchEnd(e) {

			if (L.Browser.pointer) {

				var idx = trackedTouches.indexOf(e.pointerId);

				if (idx === -1) {

					return;

				}

				trackedTouches.splice(idx, 1);

			}



			if (doubleTap) {

				if (L.Browser.pointer) {

					// work around .type being readonly with MSPointer* events

					var newTouch = { },

						prop;



					// jshint forin:false

					for (var i in touch) {

						prop = touch[i];

						if (typeof prop === 'function') {

							newTouch[i] = prop.bind(touch);

						} else {

							newTouch[i] = prop;

						}

					}

					touch = newTouch;

				}

				touch.type = 'dblclick';

				handler(touch);

				last = null;

			}

		}

		obj[pre + touchstart + id] = onTouchStart;

		obj[pre + touchend + id] = onTouchEnd;



		// on pointer we need to listen on the document, otherwise a drag starting on the map and moving off screen

		// will not come through to us, so we will lose track of how many touches are ongoing

		var endElement = L.Browser.pointer ? document.documentElement : obj;



		obj.addEventListener(touchstart, onTouchStart, false);

		endElement.addEventListener(touchend, onTouchEnd, false);



		if (L.Browser.pointer) {

			endElement.addEventListener(L.DomEvent.POINTER_CANCEL, onTouchEnd, false);

		}



		return this;

	},



	removeDoubleTapListener: function (obj, id) {

		var pre = '_leaflet_';



		obj.removeEventListener(this._touchstart, obj[pre + this._touchstart + id], false);

		(L.Browser.pointer ? document.documentElement : obj).removeEventListener(

		        this._touchend, obj[pre + this._touchend + id], false);



		if (L.Browser.pointer) {

			document.documentElement.removeEventListener(L.DomEvent.POINTER_CANCEL, obj[pre + this._touchend + id],

				false);

		}



		return this;

	}

});



/*
 * Extends L.DomEvent to provide touch support for Internet Explorer and Windows-based devices.
 */

L.extend(L.DomEvent, {

	//static
	POINTER_DOWN: L.Browser.msPointer ? 'MSPointerDown' : 'pointerdown',
	POINTER_MOVE: L.Browser.msPointer ? 'MSPointerMove' : 'pointermove',
	POINTER_UP: L.Browser.msPointer ? 'MSPointerUp' : 'pointerup',
	POINTER_CANCEL: L.Browser.msPointer ? 'MSPointerCancel' : 'pointercancel',

	_pointers: [],
	_pointerDocumentListener: false,

	// Provides a touch events wrapper for (ms)pointer events.
	// Based on changes by veproza https://github.com/CloudMade/Leaflet/pull/1019
	//ref http://www.w3.org/TR/pointerevents/ https://www.w3.org/Bugs/Public/show_bug.cgi?id=22890

	addPointerListener: function (obj, type, handler, id) {

		switch (type) {
		case 'touchstart':
			return this.addPointerListenerStart(obj, type, handler, id);
		case 'touchend':
			return this.addPointerListenerEnd(obj, type, handler, id);
		case 'touchmove':
			return this.addPointerListenerMove(obj, type, handler, id);
		default:
			throw 'Unknown touch event type';
		}
	},

	addPointerListenerStart: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    pointers = this._pointers;

		var cb = function (e) {
			if (e.pointerType !== 'mouse' && e.pointerType !== e.MSPOINTER_TYPE_MOUSE) {
				L.DomEvent.preventDefault(e);
			}

			var alreadyInArray = false;
			for (var i = 0; i < pointers.length; i++) {
				if (pointers[i].pointerId === e.pointerId) {
					alreadyInArray = true;
					break;
				}
			}
			if (!alreadyInArray) {
				pointers.push(e);
			}

			e.touches = pointers.slice();
			e.changedTouches = [e];

			handler(e);
		};

		obj[pre + 'touchstart' + id] = cb;
		obj.addEventListener(this.POINTER_DOWN, cb, false);

		// need to also listen for end events to keep the _pointers list accurate
		// this needs to be on the body and never go away
		if (!this._pointerDocumentListener) {
			var internalCb = function (e) {
				for (var i = 0; i < pointers.length; i++) {
					if (pointers[i].pointerId === e.pointerId) {
						pointers.splice(i, 1);
						break;
					}
				}
			};
			//We listen on the documentElement as any drags that end by moving the touch off the screen get fired there
			document.documentElement.addEventListener(this.POINTER_UP, internalCb, false);
			document.documentElement.addEventListener(this.POINTER_CANCEL, internalCb, false);

			this._pointerDocumentListener = true;
		}

		return this;
	},

	addPointerListenerMove: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    touches = this._pointers;

		function cb(e) {

			// don't fire touch moves when mouse isn't down
			if ((e.pointerType === e.MSPOINTER_TYPE_MOUSE || e.pointerType === 'mouse') && e.buttons === 0) { return; }

			for (var i = 0; i < touches.length; i++) {
				if (touches[i].pointerId === e.pointerId) {
					touches[i] = e;
					break;
				}
			}

			e.touches = touches.slice();
			e.changedTouches = [e];

			handler(e);
		}

		obj[pre + 'touchmove' + id] = cb;
		obj.addEventListener(this.POINTER_MOVE, cb, false);

		return this;
	},

	addPointerListenerEnd: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    touches = this._pointers;

		var cb = function (e) {
			for (var i = 0; i < touches.length; i++) {
				if (touches[i].pointerId === e.pointerId) {
					touches.splice(i, 1);
					break;
				}
			}

			e.touches = touches.slice();
			e.changedTouches = [e];

			handler(e);
		};

		obj[pre + 'touchend' + id] = cb;
		obj.addEventListener(this.POINTER_UP, cb, false);
		obj.addEventListener(this.POINTER_CANCEL, cb, false);

		return this;
	},

	removePointerListener: function (obj, type, id) {
		var pre = '_leaflet_',
		    cb = obj[pre + type + id];

		switch (type) {
		case 'touchstart':
			obj.removeEventListener(this.POINTER_DOWN, cb, false);
			break;
		case 'touchmove':
			obj.removeEventListener(this.POINTER_MOVE, cb, false);
			break;
		case 'touchend':
			obj.removeEventListener(this.POINTER_UP, cb, false);
			obj.removeEventListener(this.POINTER_CANCEL, cb, false);
			break;
		}

		return this;
	}
});


/*
 * L.Handler.TouchZoom is used by L.Map to add pinch zoom on supported mobile browsers.
 */

L.Map.mergeOptions({
	touchZoom: L.Browser.touch && !L.Browser.android23,
	bounceAtZoomLimits: true
});

L.Map.TouchZoom = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, 'touchstart', this._onTouchStart, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'touchstart', this._onTouchStart, this);
	},

	_onTouchStart: function (e) {
		var map = this._map;

		if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming) { return; }

		var p1 = map.mouseEventToLayerPoint(e.touches[0]),
		    p2 = map.mouseEventToLayerPoint(e.touches[1]),
		    viewCenter = map._getCenterLayerPoint();

		this._startCenter = p1.add(p2)._divideBy(2);
		this._startDist = p1.distanceTo(p2);

		this._moved = false;
		this._zooming = true;

		this._centerOffset = viewCenter.subtract(this._startCenter);

		if (map._panAnim) {
			map._panAnim.stop();
		}

		L.DomEvent
		    .on(document, 'touchmove', this._onTouchMove, this)
		    .on(document, 'touchend', this._onTouchEnd, this);

		L.DomEvent.preventDefault(e);
	},

	_onTouchMove: function (e) {
		var map = this._map;

		if (!e.touches || e.touches.length !== 2 || !this._zooming) { return; }

		var p1 = map.mouseEventToLayerPoint(e.touches[0]),
		    p2 = map.mouseEventToLayerPoint(e.touches[1]);

		this._scale = p1.distanceTo(p2) / this._startDist;
		this._delta = p1._add(p2)._divideBy(2)._subtract(this._startCenter);

		if (this._scale === 1) { return; }

		if (!map.options.bounceAtZoomLimits) {
			if ((map.getZoom() === map.getMinZoom() && this._scale < 1) ||
			    (map.getZoom() === map.getMaxZoom() && this._scale > 1)) { return; }
		}

		if (!this._moved) {
			L.DomUtil.addClass(map._mapPane, 'leaflet-touching');

			map
			    .fire('movestart')
			    .fire('zoomstart');

			this._moved = true;
		}

		L.Util.cancelAnimFrame(this._animRequest);
		this._animRequest = L.Util.requestAnimFrame(
		        this._updateOnMove, this, true, this._map._container);

		L.DomEvent.preventDefault(e);
	},

	_updateOnMove: function () {
		var map = this._map,
		    origin = this._getScaleOrigin(),
		    center = map.layerPointToLatLng(origin),
		    zoom = map.getScaleZoom(this._scale);

		map._animateZoom(center, zoom, this._startCenter, this._scale, this._delta, false, true);
	},

	_onTouchEnd: function () {
		if (!this._moved || !this._zooming) {
			this._zooming = false;
			return;
		}

		var map = this._map;

		this._zooming = false;
		L.DomUtil.removeClass(map._mapPane, 'leaflet-touching');
		L.Util.cancelAnimFrame(this._animRequest);

		L.DomEvent
		    .off(document, 'touchmove', this._onTouchMove)
		    .off(document, 'touchend', this._onTouchEnd);

		var origin = this._getScaleOrigin(),
		    center = map.layerPointToLatLng(origin),

		    oldZoom = map.getZoom(),
		    floatZoomDelta = map.getScaleZoom(this._scale) - oldZoom,
		    roundZoomDelta = (floatZoomDelta > 0 ?
		            Math.ceil(floatZoomDelta) : Math.floor(floatZoomDelta)),

		    zoom = map._limitZoom(oldZoom + roundZoomDelta),
		    scale = map.getZoomScale(zoom) / this._scale;

		map._animateZoom(center, zoom, origin, scale);
	},

	_getScaleOrigin: function () {
		var centerOffset = this._centerOffset.subtract(this._delta).divideBy(this._scale);
		return this._startCenter.add(centerOffset);
	}
});

L.Map.addInitHook('addHandler', 'touchZoom', L.Map.TouchZoom);


/*
 * L.Map.Tap is used to enable mobile hacks like quick taps and long hold.
 */

L.Map.mergeOptions({
	tap: true,
	tapTolerance: 15
});

L.Map.Tap = L.Handler.extend({
	addHooks: function () {
		L.DomEvent.on(this._map._container, 'touchstart', this._onDown, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._map._container, 'touchstart', this._onDown, this);
	},

	_onDown: function (e) {
		if (!e.touches) { return; }

		L.DomEvent.preventDefault(e);

		this._fireClick = true;

		// don't simulate click or track longpress if more than 1 touch
		if (e.touches.length > 1) {
			this._fireClick = false;
			clearTimeout(this._holdTimeout);
			return;
		}

		var first = e.touches[0],
		    el = first.target;

		this._startPos = this._newPos = new L.Point(first.clientX, first.clientY);

		// if touching a link, highlight it
		if (el.tagName && el.tagName.toLowerCase() === 'a') {
			L.DomUtil.addClass(el, 'leaflet-active');
		}

		// simulate long hold but setting a timeout
		this._holdTimeout = setTimeout(L.bind(function () {
			if (this._isTapValid()) {
				this._fireClick = false;
				this._onUp();
				this._simulateEvent('contextmenu', first);
			}
		}, this), 1000);

		L.DomEvent
			.on(document, 'touchmove', this._onMove, this)
			.on(document, 'touchend', this._onUp, this);
	},

	_onUp: function (e) {
		clearTimeout(this._holdTimeout);

		L.DomEvent
			.off(document, 'touchmove', this._onMove, this)
			.off(document, 'touchend', this._onUp, this);

		if (this._fireClick && e && e.changedTouches) {

			var first = e.changedTouches[0],
			    el = first.target;

			if (el && el.tagName && el.tagName.toLowerCase() === 'a') {
				L.DomUtil.removeClass(el, 'leaflet-active');
			}

			// simulate click if the touch didn't move too much
			if (this._isTapValid()) {
				this._simulateEvent('click', first);
			}
		}
	},

	_isTapValid: function () {
		return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
	},

	_onMove: function (e) {
		var first = e.touches[0];
		this._newPos = new L.Point(first.clientX, first.clientY);
	},

	_simulateEvent: function (type, e) {
		var simulatedEvent = document.createEvent('MouseEvents');

		simulatedEvent._simulated = true;
		e.target._simulatedClick = true;

		simulatedEvent.initMouseEvent(
		        type, true, true, window, 1,
		        e.screenX, e.screenY,
		        e.clientX, e.clientY,
		        false, false, false, false, 0, null);

		e.target.dispatchEvent(simulatedEvent);
	}
});

if (L.Browser.touch && !L.Browser.pointer) {
	L.Map.addInitHook('addHandler', 'tap', L.Map.Tap);
}


/*
 * L.Handler.ShiftDragZoom is used to add shift-drag zoom interaction to the map
  * (zoom to a selected bounding box), enabled by default.
 */

L.Map.mergeOptions({
	boxZoom: true
});

L.Map.BoxZoom = L.Handler.extend({
	initialize: function (map) {
		this._map = map;
		this._container = map._container;
		this._pane = map._panes.overlayPane;
		this._moved = false;
	},

	addHooks: function () {
		L.DomEvent.on(this._container, 'mousedown', this._onMouseDown, this);
	},

	removeHooks: function () {
		L.DomEvent.off(this._container, 'mousedown', this._onMouseDown);
		this._moved = false;
	},

	moved: function () {
		return this._moved;
	},

	_onMouseDown: function (e) {
		this._moved = false;

		if (!e.shiftKey || ((e.which !== 1) && (e.button !== 1))) { return false; }

		L.DomUtil.disableTextSelection();
		L.DomUtil.disableImageDrag();

		this._startLayerPoint = this._map.mouseEventToLayerPoint(e);

		L.DomEvent
		    .on(document, 'mousemove', this._onMouseMove, this)
		    .on(document, 'mouseup', this._onMouseUp, this)
		    .on(document, 'keydown', this._onKeyDown, this);
	},

	_onMouseMove: function (e) {
		if (!this._moved) {
			this._box = L.DomUtil.create('div', 'leaflet-zoom-box', this._pane);
			L.DomUtil.setPosition(this._box, this._startLayerPoint);

			//TODO refactor: move cursor to styles
			this._container.style.cursor = 'crosshair';
			this._map.fire('boxzoomstart');
		}

		var startPoint = this._startLayerPoint,
		    box = this._box,

		    layerPoint = this._map.mouseEventToLayerPoint(e),
		    offset = layerPoint.subtract(startPoint),

		    newPos = new L.Point(
		        Math.min(layerPoint.x, startPoint.x),
		        Math.min(layerPoint.y, startPoint.y));

		L.DomUtil.setPosition(box, newPos);

		this._moved = true;

		// TODO refactor: remove hardcoded 4 pixels
		box.style.width  = (Math.max(0, Math.abs(offset.x) - 4)) + 'px';
		box.style.height = (Math.max(0, Math.abs(offset.y) - 4)) + 'px';
	},

	_finish: function () {
		if (this._moved) {
			this._pane.removeChild(this._box);
			this._container.style.cursor = '';
		}

		L.DomUtil.enableTextSelection();
		L.DomUtil.enableImageDrag();

		L.DomEvent
		    .off(document, 'mousemove', this._onMouseMove)
		    .off(document, 'mouseup', this._onMouseUp)
		    .off(document, 'keydown', this._onKeyDown);
	},

	_onMouseUp: function (e) {

		this._finish();

		var map = this._map,
		    layerPoint = map.mouseEventToLayerPoint(e);

		if (this._startLayerPoint.equals(layerPoint)) { return; }

		var bounds = new L.LatLngBounds(
		        map.layerPointToLatLng(this._startLayerPoint),
		        map.layerPointToLatLng(layerPoint));

		map.fitBounds(bounds);

		map.fire('boxzoomend', {
			boxZoomBounds: bounds
		});
	},

	_onKeyDown: function (e) {
		if (e.keyCode === 27) {
			this._finish();
		}
	}
});

L.Map.addInitHook('addHandler', 'boxZoom', L.Map.BoxZoom);


/*
 * L.Map.Keyboard is handling keyboard interaction with the map, enabled by default.
 */

L.Map.mergeOptions({
	keyboard: true,
	keyboardPanOffset: 80,
	keyboardZoomOffset: 1
});

L.Map.Keyboard = L.Handler.extend({

	keyCodes: {
		left:    [37],
		right:   [39],
		down:    [40],
		up:      [38],
		zoomIn:  [187, 107, 61, 171],
		zoomOut: [189, 109, 173]
	},

	initialize: function (map) {
		this._map = map;

		this._setPanOffset(map.options.keyboardPanOffset);
		this._setZoomOffset(map.options.keyboardZoomOffset);
	},

	addHooks: function () {
		var container = this._map._container;

		// make the container focusable by tabbing
		if (container.tabIndex === -1) {
			container.tabIndex = '0';
		}

		L.DomEvent
		    .on(container, 'focus', this._onFocus, this)
		    .on(container, 'blur', this._onBlur, this)
		    .on(container, 'mousedown', this._onMouseDown, this);

		this._map
		    .on('focus', this._addHooks, this)
		    .on('blur', this._removeHooks, this);
	},

	removeHooks: function () {
		this._removeHooks();

		var container = this._map._container;

		L.DomEvent
		    .off(container, 'focus', this._onFocus, this)
		    .off(container, 'blur', this._onBlur, this)
		    .off(container, 'mousedown', this._onMouseDown, this);

		this._map
		    .off('focus', this._addHooks, this)
		    .off('blur', this._removeHooks, this);
	},

	_onMouseDown: function () {
		if (this._focused) { return; }

		var body = document.body,
		    docEl = document.documentElement,
		    top = body.scrollTop || docEl.scrollTop,
		    left = body.scrollLeft || docEl.scrollLeft;

		this._map._container.focus();

		window.scrollTo(left, top);
	},

	_onFocus: function () {
		this._focused = true;
		this._map.fire('focus');
	},

	_onBlur: function () {
		this._focused = false;
		this._map.fire('blur');
	},

	_setPanOffset: function (pan) {
		var keys = this._panKeys = {},
		    codes = this.keyCodes,
		    i, len;

		for (i = 0, len = codes.left.length; i < len; i++) {
			keys[codes.left[i]] = [-1 * pan, 0];
		}
		for (i = 0, len = codes.right.length; i < len; i++) {
			keys[codes.right[i]] = [pan, 0];
		}
		for (i = 0, len = codes.down.length; i < len; i++) {
			keys[codes.down[i]] = [0, pan];
		}
		for (i = 0, len = codes.up.length; i < len; i++) {
			keys[codes.up[i]] = [0, -1 * pan];
		}
	},

	_setZoomOffset: function (zoom) {
		var keys = this._zoomKeys = {},
		    codes = this.keyCodes,
		    i, len;

		for (i = 0, len = codes.zoomIn.length; i < len; i++) {
			keys[codes.zoomIn[i]] = zoom;
		}
		for (i = 0, len = codes.zoomOut.length; i < len; i++) {
			keys[codes.zoomOut[i]] = -zoom;
		}
	},

	_addHooks: function () {
		L.DomEvent.on(document, 'keydown', this._onKeyDown, this);
	},

	_removeHooks: function () {
		L.DomEvent.off(document, 'keydown', this._onKeyDown, this);
	},

	_onKeyDown: function (e) {
		var key = e.keyCode,
		    map = this._map;

		if (key in this._panKeys) {

			if (map._panAnim && map._panAnim._inProgress) { return; }

			map.panBy(this._panKeys[key]);

			if (map.options.maxBounds) {
				map.panInsideBounds(map.options.maxBounds);
			}

		} else if (key in this._zoomKeys) {
			map.setZoom(map.getZoom() + this._zoomKeys[key]);

		} else {
			return;
		}

		L.DomEvent.stop(e);
	}
});

L.Map.addInitHook('addHandler', 'keyboard', L.Map.Keyboard);


/*
 * L.Handler.MarkerDrag is used internally by L.Marker to make the markers draggable.
 */

L.Handler.MarkerDrag = L.Handler.extend({
	initialize: function (marker) {
		this._marker = marker;
	},

	addHooks: function () {
		var icon = this._marker._icon;
		if (!this._draggable) {
			this._draggable = new L.Draggable(icon, icon);
		}

		this._draggable
			.on('dragstart', this._onDragStart, this)
			.on('drag', this._onDrag, this)
			.on('dragend', this._onDragEnd, this);
		this._draggable.enable();
		L.DomUtil.addClass(this._marker._icon, 'leaflet-marker-draggable');
	},

	removeHooks: function () {
		this._draggable
			.off('dragstart', this._onDragStart, this)
			.off('drag', this._onDrag, this)
			.off('dragend', this._onDragEnd, this);

		this._draggable.disable();
		L.DomUtil.removeClass(this._marker._icon, 'leaflet-marker-draggable');
	},

	moved: function () {
		return this._draggable && this._draggable._moved;
	},

	_onDragStart: function () {
		this._marker
		    .closePopup()
		    .fire('movestart')
		    .fire('dragstart');
	},

	_onDrag: function () {
		var marker = this._marker,
		    shadow = marker._shadow,
		    iconPos = L.DomUtil.getPosition(marker._icon),
		    latlng = marker._map.layerPointToLatLng(iconPos);

		// update shadow position
		if (shadow) {
			L.DomUtil.setPosition(shadow, iconPos);
		}

		marker._latlng = latlng;

		marker
		    .fire('move', {latlng: latlng})
		    .fire('drag');
	},

	_onDragEnd: function (e) {
		this._marker
		    .fire('moveend')
		    .fire('dragend', e);
	}
});


/*

 * L.Control is a base class for implementing map controls. Handles positioning.

 * All other controls extend from this class.

 */



L.Control = L.Class.extend({

	options: {

		position: 'topright'

	},



	initialize: function (options) {

		L.setOptions(this, options);

	},



	getPosition: function () {

		return this.options.position;

	},



	setPosition: function (position) {

		var map = this._map;



		if (map) {

			map.removeControl(this);

		}



		this.options.position = position;



		if (map) {

			map.addControl(this);

		}



		return this;

	},



	getContainer: function () {

		return this._container;

	},



	addTo: function (map) {

		this._map = map;



		var container = this._container = this.onAdd(map),

		    pos = this.getPosition(),

		    corner = map._controlCorners[pos];



		L.DomUtil.addClass(container, 'leaflet-control');



		if (pos.indexOf('bottom') !== -1) {

			corner.insertBefore(container, corner.firstChild);

		} else {

			corner.appendChild(container);

		}



		return this;

	},



	removeFrom: function (map) {

		var pos = this.getPosition(),

		    corner = map._controlCorners[pos];



		corner.removeChild(this._container);

		this._map = null;



		if (this.onRemove) {

			this.onRemove(map);

		}



		return this;

	},



	_refocusOnMap: function () {

		if (this._map) {

			this._map.getContainer().focus();

		}

	}

});



L.control = function (options) {

	return new L.Control(options);

};





// adds control-related methods to L.Map



L.Map.include({

	addControl: function (control) {

		control.addTo(this);

		return this;

	},



	removeControl: function (control) {

		control.removeFrom(this);

		return this;

	},



	_initControlPos: function () {

		var corners = this._controlCorners = {},

		    l = 'leaflet-',

		    container = this._controlContainer =

		            L.DomUtil.create('div', l + 'control-container', this._container);



		function createCorner(vSide, hSide) {

			var className = l + vSide + ' ' + l + hSide;



			corners[vSide + hSide] = L.DomUtil.create('div', className, container);

		}



		createCorner('top', 'left');

		createCorner('top', 'right');

		createCorner('bottom', 'left');

		createCorner('bottom', 'right');

	},



	_clearControlPos: function () {

		this._container.removeChild(this._controlContainer);

	}

});



/*

 * L.Control.Zoom is used for the default zoom buttons on the map.

 */



L.Control.Zoom = L.Control.extend({

	options: {

		position: 'topleft',

		zoomInText: '+',

		zoomInTitle: 'Zoom in',

		zoomOutText: '-',

		zoomOutTitle: 'Zoom out'

	},



	onAdd: function (map) {

		var zoomName = 'leaflet-control-zoom',

		    container = L.DomUtil.create('div', zoomName + ' leaflet-bar');



		this._map = map;



		this._zoomInButton  = this._createButton(

		        this.options.zoomInText, this.options.zoomInTitle,

		        zoomName + '-in',  container, this._zoomIn,  this);

		this._zoomOutButton = this._createButton(

		        this.options.zoomOutText, this.options.zoomOutTitle,

		        zoomName + '-out', container, this._zoomOut, this);



		this._updateDisabled();

		map.on('zoomend zoomlevelschange', this._updateDisabled, this);



		return container;

	},



	onRemove: function (map) {

		map.off('zoomend zoomlevelschange', this._updateDisabled, this);

	},



	_zoomIn: function (e) {

		this._map.zoomIn(e.shiftKey ? 3 : 1);

	},



	_zoomOut: function (e) {

		this._map.zoomOut(e.shiftKey ? 3 : 1);

	},



	_createButton: function (html, title, className, container, fn, context) {

		var link = L.DomUtil.create('a', className, container);

		link.innerHTML = html;

		link.href = '#';

		link.title = title;



		var stop = L.DomEvent.stopPropagation;



		L.DomEvent

		    .on(link, 'click', stop)

		    .on(link, 'mousedown', stop)

		    .on(link, 'dblclick', stop)

		    .on(link, 'click', L.DomEvent.preventDefault)

		    .on(link, 'click', fn, context)

		    .on(link, 'click', this._refocusOnMap, context);



		return link;

	},



	_updateDisabled: function () {

		var map = this._map,

			className = 'leaflet-disabled';



		L.DomUtil.removeClass(this._zoomInButton, className);

		L.DomUtil.removeClass(this._zoomOutButton, className);



		if (map._zoom === map.getMinZoom()) {

			L.DomUtil.addClass(this._zoomOutButton, className);

		}

		if (map._zoom === map.getMaxZoom()) {

			L.DomUtil.addClass(this._zoomInButton, className);

		}

	}

});



L.Map.mergeOptions({

	zoomControl: true

});



L.Map.addInitHook(function () {

	if (this.options.zoomControl) {

		this.zoomControl = new L.Control.Zoom();

		this.addControl(this.zoomControl);

	}

});



L.control.zoom = function (options) {

	return new L.Control.Zoom(options);

};





/*

 * L.Control.Attribution is used for displaying attribution on the map (added by default).

 */



L.Control.Attribution = L.Control.extend({

	options: {

		position: 'bottomright',

		prefix: '<a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'

	},



	initialize: function (options) {

		L.setOptions(this, options);



		this._attributions = {};

	},



	onAdd: function (map) {

		this._container = L.DomUtil.create('div', 'leaflet-control-attribution');

		L.DomEvent.disableClickPropagation(this._container);



		for (var i in map._layers) {

			if (map._layers[i].getAttribution) {

				this.addAttribution(map._layers[i].getAttribution());

			}

		}

		

		map

		    .on('layeradd', this._onLayerAdd, this)

		    .on('layerremove', this._onLayerRemove, this);



		this._update();



		return this._container;

	},



	onRemove: function (map) {

		map

		    .off('layeradd', this._onLayerAdd)

		    .off('layerremove', this._onLayerRemove);



	},



	setPrefix: function (prefix) {

		this.options.prefix = prefix;

		this._update();

		return this;

	},



	addAttribution: function (text) {

		if (!text) { return; }



		if (!this._attributions[text]) {

			this._attributions[text] = 0;

		}

		this._attributions[text]++;



		this._update();



		return this;

	},



	removeAttribution: function (text) {

		if (!text) { return; }



		if (this._attributions[text]) {

			this._attributions[text]--;

			this._update();

		}



		return this;

	},



	_update: function () {

		if (!this._map) { return; }



		var attribs = [];



		for (var i in this._attributions) {

			if (this._attributions[i]) {

				attribs.push(i);

			}

		}



		var prefixAndAttribs = [];



		if (this.options.prefix) {

			prefixAndAttribs.push(this.options.prefix);

		}

		if (attribs.length) {

			prefixAndAttribs.push(attribs.join(', '));

		}



		this._container.innerHTML = prefixAndAttribs.join(' | ');

	},



	_onLayerAdd: function (e) {

		if (e.layer.getAttribution) {

			this.addAttribution(e.layer.getAttribution());

		}

	},



	_onLayerRemove: function (e) {

		if (e.layer.getAttribution) {

			this.removeAttribution(e.layer.getAttribution());

		}

	}

});



L.Map.mergeOptions({

	attributionControl: true

});



L.Map.addInitHook(function () {

	if (this.options.attributionControl) {

		this.attributionControl = (new L.Control.Attribution()).addTo(this);

	}

});



L.control.attribution = function (options) {

	return new L.Control.Attribution(options);

};



/*
 * L.Control.Scale is used for displaying metric/imperial scale on the map.
 */

L.Control.Scale = L.Control.extend({
	options: {
		position: 'bottomleft',
		maxWidth: 100,
		metric: true,
		imperial: true,
		updateWhenIdle: false
	},

	onAdd: function (map) {
		this._map = map;

		var className = 'leaflet-control-scale',
		    container = L.DomUtil.create('div', className),
		    options = this.options;

		this._addScales(options, className, container);

		map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
		map.whenReady(this._update, this);

		return container;
	},

	onRemove: function (map) {
		map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
	},

	_addScales: function (options, className, container) {
		if (options.metric) {
			this._mScale = L.DomUtil.create('div', className + '-line', container);
		}
		if (options.imperial) {
			this._iScale = L.DomUtil.create('div', className + '-line', container);
		}
	},

	_update: function () {
		var bounds = this._map.getBounds(),
		    centerLat = bounds.getCenter().lat,
		    halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180),
		    dist = halfWorldMeters * (bounds.getNorthEast().lng - bounds.getSouthWest().lng) / 180,

		    size = this._map.getSize(),
		    options = this.options,
		    maxMeters = 0;

		if (size.x > 0) {
			maxMeters = dist * (options.maxWidth / size.x);
		}

		this._updateScales(options, maxMeters);
	},

	_updateScales: function (options, maxMeters) {
		if (options.metric && maxMeters) {
			this._updateMetric(maxMeters);
		}

		if (options.imperial && maxMeters) {
			this._updateImperial(maxMeters);
		}
	},

	_updateMetric: function (maxMeters) {
		var meters = this._getRoundNum(maxMeters);

		this._mScale.style.width = this._getScaleWidth(meters / maxMeters) + 'px';
		this._mScale.innerHTML = meters < 1000 ? meters + ' m' : (meters / 1000) + ' km';
	},

	_updateImperial: function (maxMeters) {
		var maxFeet = maxMeters * 3.2808399,
		    scale = this._iScale,
		    maxMiles, miles, feet;

		if (maxFeet > 5280) {
			maxMiles = maxFeet / 5280;
			miles = this._getRoundNum(maxMiles);

			scale.style.width = this._getScaleWidth(miles / maxMiles) + 'px';
			scale.innerHTML = miles + ' mi';

		} else {
			feet = this._getRoundNum(maxFeet);

			scale.style.width = this._getScaleWidth(feet / maxFeet) + 'px';
			scale.innerHTML = feet + ' ft';
		}
	},

	_getScaleWidth: function (ratio) {
		return Math.round(this.options.maxWidth * ratio) - 10;
	},

	_getRoundNum: function (num) {
		var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
		    d = num / pow10;

		d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;

		return pow10 * d;
	}
});

L.control.scale = function (options) {
	return new L.Control.Scale(options);
};


/*

 * L.Control.Layers is a control to allow users to switch between different layers on the map.

 */



L.Control.Layers = L.Control.extend({

	options: {

		collapsed: true,

		position: 'topright',

		autoZIndex: true

	},



	initialize: function (baseLayers, overlays, options) {

		L.setOptions(this, options);



		this._layers = {};

		this._lastZIndex = 0;

		this._handlingClick = false;



		for (var i in baseLayers) {

			this._addLayer(baseLayers[i], i);

		}



		for (i in overlays) {

			this._addLayer(overlays[i], i, true);

		}

	},



	onAdd: function (map) {

		this._initLayout();

		this._update();



		map

		    .on('layeradd', this._onLayerChange, this)

		    .on('layerremove', this._onLayerChange, this);



		return this._container;

	},



	onRemove: function (map) {

		map

		    .off('layeradd', this._onLayerChange, this)

		    .off('layerremove', this._onLayerChange, this);

	},



	addBaseLayer: function (layer, name) {

		this._addLayer(layer, name);

		this._update();

		return this;

	},



	addOverlay: function (layer, name) {

		this._addLayer(layer, name, true);

		this._update();

		return this;

	},



	removeLayer: function (layer) {

		var id = L.stamp(layer);

		delete this._layers[id];

		this._update();

		return this;

	},



	_initLayout: function () {

		var className = 'leaflet-control-layers',

		    container = this._container = L.DomUtil.create('div', className);



		//Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released

		container.setAttribute('aria-haspopup', true);



		if (!L.Browser.touch) {

			L.DomEvent

				.disableClickPropagation(container)

				.disableScrollPropagation(container);

		} else {

			L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);

		}



		var form = this._form = L.DomUtil.create('form', className + '-list');



		if (this.options.collapsed) {

			if (!L.Browser.android) {

				L.DomEvent

				    .on(container, 'mouseover', this._expand, this)

				    .on(container, 'mouseout', this._collapse, this);

			}

			var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);

			link.href = '#';

			link.title = 'Layers';



			if (L.Browser.touch) {

				L.DomEvent

				    .on(link, 'click', L.DomEvent.stop)

				    .on(link, 'click', this._expand, this);

			}

			else {

				L.DomEvent.on(link, 'focus', this._expand, this);

			}

			//Work around for Firefox android issue https://github.com/Leaflet/Leaflet/issues/2033

			L.DomEvent.on(form, 'click', function () {

				setTimeout(L.bind(this._onInputClick, this), 0);

			}, this);



			this._map.on('click', this._collapse, this);

			// TODO keyboard accessibility

		} else {

			this._expand();

		}



		this._baseLayersList = L.DomUtil.create('div', className + '-base', form);

		this._separator = L.DomUtil.create('div', className + '-separator', form);

		this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);



		container.appendChild(form);

	},



	_addLayer: function (layer, name, overlay) {

		var id = L.stamp(layer);



		this._layers[id] = {

			layer: layer,

			name: name,

			overlay: overlay

		};



		if (this.options.autoZIndex && layer.setZIndex) {

			this._lastZIndex++;

			layer.setZIndex(this._lastZIndex);

		}

	},



	_update: function () {

		if (!this._container) {

			return;

		}



		this._baseLayersList.innerHTML = '';

		this._overlaysList.innerHTML = '';



		var baseLayersPresent = false,

		    overlaysPresent = false,

		    i, obj;



		for (i in this._layers) {

			obj = this._layers[i];

			this._addItem(obj);

			overlaysPresent = overlaysPresent || obj.overlay;

			baseLayersPresent = baseLayersPresent || !obj.overlay;

		}



		this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';

	},



	_onLayerChange: function (e) {

		var obj = this._layers[L.stamp(e.layer)];



		if (!obj) { return; }



		if (!this._handlingClick) {

			this._update();

		}



		var type = obj.overlay ?

			(e.type === 'layeradd' ? 'overlayadd' : 'overlayremove') :

			(e.type === 'layeradd' ? 'baselayerchange' : null);



		if (type) {

			this._map.fire(type, obj);

		}

	},



	// IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)

	_createRadioElement: function (name, checked) {



		var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' + name + '"';

		if (checked) {

			radioHtml += ' checked="checked"';

		}

		radioHtml += '/>';



		var radioFragment = document.createElement('div');

		radioFragment.innerHTML = radioHtml;



		return radioFragment.firstChild;

	},



	_addItem: function (obj) {

		var label = document.createElement('label'),

		    input,

		    checked = this._map.hasLayer(obj.layer);



		if (obj.overlay) {

			input = document.createElement('input');

			input.type = 'checkbox';

			input.className = 'leaflet-control-layers-selector';

			input.defaultChecked = checked;

		} else {

			input = this._createRadioElement('leaflet-base-layers', checked);

		}



		input.layerId = L.stamp(obj.layer);



		L.DomEvent.on(input, 'click', this._onInputClick, this);



		var name = document.createElement('span');

		name.innerHTML = ' ' + obj.name;



		label.appendChild(input);

		label.appendChild(name);



		var container = obj.overlay ? this._overlaysList : this._baseLayersList;

		container.appendChild(label);



		return label;

	},



	_onInputClick: function () {

		var i, input, obj,

		    inputs = this._form.getElementsByTagName('input'),

		    inputsLen = inputs.length;



		this._handlingClick = true;



		for (i = 0; i < inputsLen; i++) {

			input = inputs[i];

			obj = this._layers[input.layerId];



			if (input.checked && !this._map.hasLayer(obj.layer)) {

				this._map.addLayer(obj.layer);



			} else if (!input.checked && this._map.hasLayer(obj.layer)) {

				this._map.removeLayer(obj.layer);

			}

		}



		this._handlingClick = false;



		this._refocusOnMap();

	},



	_expand: function () {

		L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');

	},



	_collapse: function () {

		this._container.className = this._container.className.replace(' leaflet-control-layers-expanded', '');

	}

});



L.control.layers = function (baseLayers, overlays, options) {

	return new L.Control.Layers(baseLayers, overlays, options);

};



/*
 * L.PosAnimation is used by Leaflet internally for pan animations.
 */

L.PosAnimation = L.Class.extend({
	includes: L.Mixin.Events,

	run: function (el, newPos, duration, easeLinearity) { // (HTMLElement, Point[, Number, Number])
		this.stop();

		this._el = el;
		this._inProgress = true;
		this._newPos = newPos;

		this.fire('start');

		el.style[L.DomUtil.TRANSITION] = 'all ' + (duration || 0.25) +
		        's cubic-bezier(0,0,' + (easeLinearity || 0.5) + ',1)';

		L.DomEvent.on(el, L.DomUtil.TRANSITION_END, this._onTransitionEnd, this);
		L.DomUtil.setPosition(el, newPos);

		// toggle reflow, Chrome flickers for some reason if you don't do this
		L.Util.falseFn(el.offsetWidth);

		// there's no native way to track value updates of transitioned properties, so we imitate this
		this._stepTimer = setInterval(L.bind(this._onStep, this), 50);
	},

	stop: function () {
		if (!this._inProgress) { return; }

		// if we just removed the transition property, the element would jump to its final position,
		// so we need to make it stay at the current position

		L.DomUtil.setPosition(this._el, this._getPos());
		this._onTransitionEnd();
		L.Util.falseFn(this._el.offsetWidth); // force reflow in case we are about to start a new animation
	},

	_onStep: function () {
		var stepPos = this._getPos();
		if (!stepPos) {
			this._onTransitionEnd();
			return;
		}
		// jshint camelcase: false
		// make L.DomUtil.getPosition return intermediate position value during animation
		this._el._leaflet_pos = stepPos;

		this.fire('step');
	},

	// you can't easily get intermediate values of properties animated with CSS3 Transitions,
	// we need to parse computed style (in case of transform it returns matrix string)

	_transformRe: /([-+]?(?:\d*\.)?\d+)\D*, ([-+]?(?:\d*\.)?\d+)\D*\)/,

	_getPos: function () {
		var left, top, matches,
		    el = this._el,
		    style = window.getComputedStyle(el);

		if (L.Browser.any3d) {
			matches = style[L.DomUtil.TRANSFORM].match(this._transformRe);
			if (!matches) { return; }
			left = parseFloat(matches[1]);
			top  = parseFloat(matches[2]);
		} else {
			left = parseFloat(style.left);
			top  = parseFloat(style.top);
		}

		return new L.Point(left, top, true);
	},

	_onTransitionEnd: function () {
		L.DomEvent.off(this._el, L.DomUtil.TRANSITION_END, this._onTransitionEnd, this);

		if (!this._inProgress) { return; }
		this._inProgress = false;

		this._el.style[L.DomUtil.TRANSITION] = '';

		// jshint camelcase: false
		// make sure L.DomUtil.getPosition returns the final position value after animation
		this._el._leaflet_pos = this._newPos;

		clearInterval(this._stepTimer);

		this.fire('step').fire('end');
	}

});


/*
 * Extends L.Map to handle panning animations.
 */

L.Map.include({

	setView: function (center, zoom, options) {

		zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);
		center = this._limitCenter(L.latLng(center), zoom, this.options.maxBounds);
		options = options || {};

		if (this._panAnim) {
			this._panAnim.stop();
		}

		if (this._loaded && !options.reset && options !== true) {

			if (options.animate !== undefined) {
				options.zoom = L.extend({animate: options.animate}, options.zoom);
				options.pan = L.extend({animate: options.animate}, options.pan);
			}

			// try animating pan or zoom
			var animated = (this._zoom !== zoom) ?
				this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) :
				this._tryAnimatedPan(center, options.pan);

			if (animated) {
				// prevent resize handler call, the view will refresh after animation anyway
				clearTimeout(this._sizeTimer);
				return this;
			}
		}

		// animation didn't start, just reset the map view
		this._resetView(center, zoom);

		return this;
	},

	panBy: function (offset, options) {
		offset = L.point(offset).round();
		options = options || {};

		if (!offset.x && !offset.y) {
			return this;
		}

		if (!this._panAnim) {
			this._panAnim = new L.PosAnimation();

			this._panAnim.on({
				'step': this._onPanTransitionStep,
				'end': this._onPanTransitionEnd
			}, this);
		}

		// don't fire movestart if animating inertia
		if (!options.noMoveStart) {
			this.fire('movestart');
		}

		// animate pan unless animate: false specified
		if (options.animate !== false) {
			L.DomUtil.addClass(this._mapPane, 'leaflet-pan-anim');

			var newPos = this._getMapPanePos().subtract(offset);
			this._panAnim.run(this._mapPane, newPos, options.duration || 0.25, options.easeLinearity);
		} else {
			this._rawPanBy(offset);
			this.fire('move').fire('moveend');
		}

		return this;
	},

	_onPanTransitionStep: function () {
		this.fire('move');
	},

	_onPanTransitionEnd: function () {
		L.DomUtil.removeClass(this._mapPane, 'leaflet-pan-anim');
		this.fire('moveend');
	},

	_tryAnimatedPan: function (center, options) {
		// difference between the new and current centers in pixels
		var offset = this._getCenterOffset(center)._floor();

		// don't animate too far unless animate: true specified in options
		if ((options && options.animate) !== true && !this.getSize().contains(offset)) { return false; }

		this.panBy(offset, options);

		return true;
	}
});


/*
 * L.PosAnimation fallback implementation that powers Leaflet pan animations
 * in browsers that don't support CSS3 Transitions.
 */

L.PosAnimation = L.DomUtil.TRANSITION ? L.PosAnimation : L.PosAnimation.extend({

	run: function (el, newPos, duration, easeLinearity) { // (HTMLElement, Point[, Number, Number])
		this.stop();

		this._el = el;
		this._inProgress = true;
		this._duration = duration || 0.25;
		this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);

		this._startPos = L.DomUtil.getPosition(el);
		this._offset = newPos.subtract(this._startPos);
		this._startTime = +new Date();

		this.fire('start');

		this._animate();
	},

	stop: function () {
		if (!this._inProgress) { return; }

		this._step();
		this._complete();
	},

	_animate: function () {
		// animation loop
		this._animId = L.Util.requestAnimFrame(this._animate, this);
		this._step();
	},

	_step: function () {
		var elapsed = (+new Date()) - this._startTime,
		    duration = this._duration * 1000;

		if (elapsed < duration) {
			this._runFrame(this._easeOut(elapsed / duration));
		} else {
			this._runFrame(1);
			this._complete();
		}
	},

	_runFrame: function (progress) {
		var pos = this._startPos.add(this._offset.multiplyBy(progress));
		L.DomUtil.setPosition(this._el, pos);

		this.fire('step');
	},

	_complete: function () {
		L.Util.cancelAnimFrame(this._animId);

		this._inProgress = false;
		this.fire('end');
	},

	_easeOut: function (t) {
		return 1 - Math.pow(1 - t, this._easeOutPower);
	}
});


/*
 * Extends L.Map to handle zoom animations.
 */

L.Map.mergeOptions({
	zoomAnimation: true,
	zoomAnimationThreshold: 4
});

if (L.DomUtil.TRANSITION) {

	L.Map.addInitHook(function () {
		// don't animate on browsers without hardware-accelerated transitions or old Android/Opera
		this._zoomAnimated = this.options.zoomAnimation && L.DomUtil.TRANSITION &&
				L.Browser.any3d && !L.Browser.android23 && !L.Browser.mobileOpera;

		// zoom transitions run with the same duration for all layers, so if one of transitionend events
		// happens after starting zoom animation (propagating to the map pane), we know that it ended globally
		if (this._zoomAnimated) {
			L.DomEvent.on(this._mapPane, L.DomUtil.TRANSITION_END, this._catchTransitionEnd, this);
		}
	});
}

L.Map.include(!L.DomUtil.TRANSITION ? {} : {

	_catchTransitionEnd: function (e) {
		if (this._animatingZoom && e.propertyName.indexOf('transform') >= 0) {
			this._onZoomTransitionEnd();
		}
	},

	_nothingToAnimate: function () {
		return !this._container.getElementsByClassName('leaflet-zoom-animated').length;
	},

	_tryAnimatedZoom: function (center, zoom, options) {

		if (this._animatingZoom) { return true; }

		options = options || {};

		// don't animate if disabled, not supported or zoom difference is too large
		if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() ||
		        Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) { return false; }

		// offset is the pixel coords of the zoom origin relative to the current center
		var scale = this.getZoomScale(zoom),
		    offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale),
			origin = this._getCenterLayerPoint()._add(offset);

		// don't animate if the zoom origin isn't within one screen from the current center, unless forced
		if (options.animate !== true && !this.getSize().contains(offset)) { return false; }

		this
		    .fire('movestart')
		    .fire('zoomstart');

		this._animateZoom(center, zoom, origin, scale, null, true);

		return true;
	},

	_animateZoom: function (center, zoom, origin, scale, delta, backwards, forTouchZoom) {

		if (!forTouchZoom) {
			this._animatingZoom = true;
		}

		// put transform transition on all layers with leaflet-zoom-animated class
		L.DomUtil.addClass(this._mapPane, 'leaflet-zoom-anim');

		// remember what center/zoom to set after animation
		this._animateToCenter = center;
		this._animateToZoom = zoom;

		// disable any dragging during animation
		if (L.Draggable) {
			L.Draggable._disabled = true;
		}

		L.Util.requestAnimFrame(function () {
			this.fire('zoomanim', {
				center: center,
				zoom: zoom,
				origin: origin,
				scale: scale,
				delta: delta,
				backwards: backwards
			});
			// horrible hack to work around a Chrome bug https://github.com/Leaflet/Leaflet/issues/3689
			setTimeout(L.bind(this._onZoomTransitionEnd, this), 250);
		}, this);
	},

	_onZoomTransitionEnd: function () {
		if (!this._animatingZoom) { return; }

		this._animatingZoom = false;

		L.DomUtil.removeClass(this._mapPane, 'leaflet-zoom-anim');

		L.Util.requestAnimFrame(function () {
			this._resetView(this._animateToCenter, this._animateToZoom, true, true);

			if (L.Draggable) {
				L.Draggable._disabled = false;
			}
		}, this);
	}
});


/*
	Zoom animation logic for L.TileLayer.
*/

L.TileLayer.include({
	_animateZoom: function (e) {
		if (!this._animating) {
			this._animating = true;
			this._prepareBgBuffer();
		}

		var bg = this._bgBuffer,
		    transform = L.DomUtil.TRANSFORM,
		    initialTransform = e.delta ? L.DomUtil.getTranslateString(e.delta) : bg.style[transform],
		    scaleStr = L.DomUtil.getScaleString(e.scale, e.origin);

		bg.style[transform] = e.backwards ?
				scaleStr + ' ' + initialTransform :
				initialTransform + ' ' + scaleStr;
	},

	_endZoomAnim: function () {
		var front = this._tileContainer,
		    bg = this._bgBuffer;

		front.style.visibility = '';
		front.parentNode.appendChild(front); // Bring to fore

		// force reflow
		L.Util.falseFn(bg.offsetWidth);

		var zoom = this._map.getZoom();
		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
			this._clearBgBuffer();
		}

		this._animating = false;
	},

	_clearBgBuffer: function () {
		var map = this._map;

		if (map && !map._animatingZoom && !map.touchZoom._zooming) {
			this._bgBuffer.innerHTML = '';
			this._bgBuffer.style[L.DomUtil.TRANSFORM] = '';
		}
	},

	_prepareBgBuffer: function () {

		var front = this._tileContainer,
		    bg = this._bgBuffer;

		// if foreground layer doesn't have many tiles but bg layer does,
		// keep the existing bg layer and just zoom it some more

		var bgLoaded = this._getLoadedTilesPercentage(bg),
		    frontLoaded = this._getLoadedTilesPercentage(front);

		if (bg && bgLoaded > 0.5 && frontLoaded < 0.5) {

			front.style.visibility = 'hidden';
			this._stopLoadingImages(front);
			return;
		}

		// prepare the buffer to become the front tile pane
		bg.style.visibility = 'hidden';
		bg.style[L.DomUtil.TRANSFORM] = '';

		// switch out the current layer to be the new bg layer (and vice-versa)
		this._tileContainer = bg;
		bg = this._bgBuffer = front;

		this._stopLoadingImages(bg);

		//prevent bg buffer from clearing right after zoom
		clearTimeout(this._clearBgBufferTimer);
	},

	_getLoadedTilesPercentage: function (container) {
		var tiles = container.getElementsByTagName('img'),
		    i, len, count = 0;

		for (i = 0, len = tiles.length; i < len; i++) {
			if (tiles[i].complete) {
				count++;
			}
		}
		return count / len;
	},

	// stops loading all tiles in the background layer
	_stopLoadingImages: function (container) {
		var tiles = Array.prototype.slice.call(container.getElementsByTagName('img')),
		    i, len, tile;

		for (i = 0, len = tiles.length; i < len; i++) {
			tile = tiles[i];

			if (!tile.complete) {
				tile.onload = L.Util.falseFn;
				tile.onerror = L.Util.falseFn;
				tile.src = L.Util.emptyImageUrl;

				tile.parentNode.removeChild(tile);
			}
		}
	}
});


/*

 * Provides L.Map with convenient shortcuts for using browser geolocation features.

 */



L.Map.include({

	_defaultLocateOptions: {

		watch: false,

		setView: false,

		maxZoom: Infinity,

		timeout: 10000,

		maximumAge: 0,

		enableHighAccuracy: false

	},



	locate: function (/*Object*/ options) {



		options = this._locateOptions = L.extend(this._defaultLocateOptions, options);



		if (!navigator.geolocation) {

			this._handleGeolocationError({

				code: 0,

				message: 'Geolocation not supported.'

			});

			return this;

		}



		var onResponse = L.bind(this._handleGeolocationResponse, this),

			onError = L.bind(this._handleGeolocationError, this);



		if (options.watch) {

			this._locationWatchId =

			        navigator.geolocation.watchPosition(onResponse, onError, options);

		} else {

			navigator.geolocation.getCurrentPosition(onResponse, onError, options);

		}

		return this;

	},



	stopLocate: function () {

		if (navigator.geolocation) {

			navigator.geolocation.clearWatch(this._locationWatchId);

		}

		if (this._locateOptions) {

			this._locateOptions.setView = false;

		}

		return this;

	},



	_handleGeolocationError: function (error) {

		var c = error.code,

		    message = error.message ||

		            (c === 1 ? 'permission denied' :

		            (c === 2 ? 'position unavailable' : 'timeout'));



		if (this._locateOptions.setView && !this._loaded) {

			this.fitWorld();

		}



		this.fire('locationerror', {

			code: c,

			message: 'Geolocation error: ' + message + '.'

		});

	},



	_handleGeolocationResponse: function (pos) {

		var lat = pos.coords.latitude,

		    lng = pos.coords.longitude,

		    latlng = new L.LatLng(lat, lng),



		    latAccuracy = 180 * pos.coords.accuracy / 40075017,

		    lngAccuracy = latAccuracy / Math.cos(L.LatLng.DEG_TO_RAD * lat),



		    bounds = L.latLngBounds(

		            [lat - latAccuracy, lng - lngAccuracy],

		            [lat + latAccuracy, lng + lngAccuracy]),



		    options = this._locateOptions;



		if (options.setView) {

			var zoom = Math.min(this.getBoundsZoom(bounds), options.maxZoom);

			this.setView(latlng, zoom);

		}



		var data = {

			latlng: latlng,

			bounds: bounds,

			timestamp: pos.timestamp

		};



		for (var i in pos.coords) {

			if (typeof pos.coords[i] === 'number') {

				data[i] = pos.coords[i];

			}

		}



		this.fire('locationfound', data);

	}

});



}(window, document));
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/leaflet/dist/leaflet-src.js","/node_modules/leaflet/dist")

},{"_process":48,"buffer":13}],45:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
!function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a="function"==typeof require&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}for(var i="function"==typeof require&&require,o=0;o<r.length;o++)s(r[o]);return s}({1:[function(require,module,exports){function corslite(url,callback,cors){function isSuccessful(status){return status>=200&&300>status||304===status}function loaded(){void 0===x.status||isSuccessful(x.status)?callback.call(x,null,x):callback.call(x,x,null)}var sent=!1;if("undefined"==typeof window.XMLHttpRequest)return callback(Error("Browser not supported"));if("undefined"==typeof cors){var m=url.match(/^\s*https?:\/\/[^\/]*/);cors=m&&m[0]!==location.protocol+"//"+location.domain+(location.port?":"+location.port:"")}var x=new window.XMLHttpRequest;if(cors&&!("withCredentials"in x)){x=new window.XDomainRequest;var original=callback;callback=function(){if(sent)original.apply(this,arguments);else{var that=this,args=arguments;setTimeout(function(){original.apply(that,args)},0)}}}return"onload"in x?x.onload=loaded:x.onreadystatechange=function(){4===x.readyState&&loaded()},x.onerror=function(evt){callback.call(this,evt||!0,null),callback=function(){}},x.onprogress=function(){},x.ontimeout=function(evt){callback.call(this,evt,null),callback=function(){}},x.onabort=function(evt){callback.call(this,evt,null),callback=function(){}},x.open("GET",url,!0),x.send(null),sent=!0,x}"undefined"!=typeof module&&(module.exports=corslite)},{}],2:[function(require,module,exports){function encode(coordinate,factor){coordinate=Math.round(coordinate*factor),coordinate<<=1,0>coordinate&&(coordinate=~coordinate);for(var output="";coordinate>=32;)output+=String.fromCharCode((32|31&coordinate)+63),coordinate>>=5;return output+=String.fromCharCode(coordinate+63)}var polyline={};polyline.decode=function(str,precision){for(var latitude_change,longitude_change,index=0,lat=0,lng=0,coordinates=[],shift=0,result=0,byte=null,factor=Math.pow(10,precision||5);index<str.length;){byte=null,shift=0,result=0;do byte=str.charCodeAt(index++)-63,result|=(31&byte)<<shift,shift+=5;while(byte>=32);latitude_change=1&result?~(result>>1):result>>1,shift=result=0;do byte=str.charCodeAt(index++)-63,result|=(31&byte)<<shift,shift+=5;while(byte>=32);longitude_change=1&result?~(result>>1):result>>1,lat+=latitude_change,lng+=longitude_change,coordinates.push([lat/factor,lng/factor])}return coordinates},polyline.encode=function(coordinates,precision){if(!coordinates.length)return"";for(var factor=Math.pow(10,precision||5),output=encode(coordinates[0][0],factor)+encode(coordinates[0][1],factor),i=1;i<coordinates.length;i++){var a=coordinates[i],b=coordinates[i-1];output+=encode(a[0]-b[0],factor),output+=encode(a[1]-b[1],factor)}return output},void 0!==typeof module&&(module.exports=polyline)},{}],3:[function(require,module,exports){(function(global){!function(){"use strict";var t="undefined"!=typeof window?window.L:"undefined"!=typeof global?global.L:null,e=require("corslite"),n=require("polyline");t.Routing=t.Routing||{},t.Routing.Mapzen=t.Class.extend({options:{timeout:3e4},initialize:function(e,n){t.Util.setOptions(this,n),this._accessToken=e,this._hints={locations:{}}},route:function(n,i,o,s){var a,r,l,u,p=!1,c=[],h={};for(h=this.options||{},a=this.buildRouteUrl(n,h),r=setTimeout(function(){p=!0,i.call(o||i,{status:-1,message:"Time out."})},this.options.timeout),u=0;u<n.length;u++)l=n[u],c.push({latLng:l.latLng,name:l.name||"",options:l.options||{}});return e(a,t.bind(function(t,e){var n;clearTimeout(r),p||(t?(console.log("Error : "+t.response),i.call(o||i,{status:t.status,message:t.response})):(n=JSON.parse(e.responseText),this._routeDone(n,c,h,i,o)))},this),!0),this},_routeDone:function(t,e,i,o,s){var a,r,l,u;if(s=s||o,0!==t.trip.status)return void o.call(s,{status:t.status,message:t.status_message});for(var p=[],a=[],c=0,u=0;u<t.trip.legs.length;u++){for(var h=n.decode(t.trip.legs[u].shape,6),g=0;g<h.length;g++)a.push(h[g]);for(var _=0;_<t.trip.legs[u].maneuvers.length;_++){var m=t.trip.legs[u].maneuvers[_];m.distance=t.trip.legs[u].maneuvers[_].length,m.index=c+t.trip.legs[u].maneuvers[_].begin_shape_index,p.push(m)}"multimodal"===i.costing&&(p=this._unifyTransitManeuver(p)),c+=t.trip.legs[u].maneuvers[t.trip.legs[u].maneuvers.length-1].begin_shape_index}l=this._toWaypoints(e,t.trip.locations);var v;"multimodal"==i.costing&&(v=this._getSubRoutes(t.trip.legs)),r=[{name:this._trimLocationKey(e[0].latLng)+" , "+this._trimLocationKey(e[1].latLng),unit:t.trip.units,costing:i.costing,coordinates:a,subRoutes:v,instructions:p,summary:t.trip.summary?this._convertSummary(t.trip.summary):[],inputWaypoints:e,waypoints:l,waypointIndices:this._clampIndices([0,t.trip.legs[0].maneuvers.length],a)}],t.hint_data&&this._saveHintData(t.hint_data,e),o.call(s,null,r)},_unifyTransitManeuver:function(t){for(var e,n=t,i=0;i<n.length;i++)if(30==n[i].type){e=n[i].travel_type;break}for(var o=0;o<n.length;o++)n[o].type>29&&(n[o].edited_travel_type=e);return n},_getSubRoutes:function(t){for(var e=[],i=0;i<t.length;i++){for(var o,s=n.decode(t[i].shape,6),a=[],r=0;r<t[i].maneuvers.length;r++){var l=t[i].maneuvers[r],u=l.travel_type;u===o&&31!==l.type||(l.begin_shape_index>0&&a.push(l.begin_shape_index),l.transit_info?e.push({travel_type:u,styles:this._getPolylineColor(l.transit_info.color)}):e.push({travel_type:u})),o=u}a.push(s.length);for(var p=0,c=0;c<a.length;c++){var h=[],g=0;c!==a.length-1&&(g=1);for(var _=p;_<a[c]+g;_++)h.push(s[_]);var m=h;p=a[c],e[c].coordinates=m}}return e},_getPolylineColor:function(t){var e=t>>16&255,n=t>>8&255,i=t>>0&255,o=.299*e+.587*n+.114*i,s=o>187,a=16777216|16777215&t,r=a.toString(16).substring(1,7),l=[s?{color:"#000",opacity:.4,weight:10}:{color:"#fff",opacity:.8,weight:10},{color:"#"+r.toUpperCase(),opacity:1,weight:6}];return l},_saveHintData:function(t,e){var n;this._hints={checksum:t.checksum,locations:{}};for(var i=t.locations.length-1;i>=0;i--)n=e[i].latLng,this._hints.locations[this._locationKey(n)]=t.locations[i]},_toWaypoints:function(e,n){var i,o=[];for(i=0;i<n.length;i++)o.push(t.Routing.waypoint(t.latLng([n[i].lat,n[i].lon]),"name",{}));return o},buildRouteUrl:function(t,e){for(var n,i="https://valhalla.mapzen.com",o=[],s=e.costing,a=e.costing_options,r=e.directions_options,l=e.date_time,u=0;u<t.length;u++){var p;n=this._locationKey(t[u].latLng).split(","),p=0===u||u===t.length-1?{lat:parseFloat(n[0]),lon:parseFloat(n[1]),type:"break"}:{lat:parseFloat(n[0]),lon:parseFloat(n[1]),type:"through"},o.push(p)}var c=JSON.stringify({locations:o,costing:s,costing_options:a,directions_options:r,date_time:l});return i+"/route?json="+c+"&api_key="+this._accessToken},_locationKey:function(t){return t.lat+","+t.lng},_trimLocationKey:function(t){var e=(t.lat,t.lng,Math.floor(1e3*t.lat)/1e3),n=Math.floor(1e3*t.lng)/1e3;return e+" , "+n},_convertSummary:function(t){return{totalDistance:t.length,totalTime:t.time}},_convertInstructions:function(t){var e,n,i,o,s=[];for(e=0;e<t.length;e++)n=t[e],i=this._drivingDirectionType(n[0]),o=n[0].split("-"),i&&s.push({type:i,distance:n[2],time:n[4],road:n[1],direction:n[6],exit:o.length>1?o[1]:void 0,index:n[3]});return s},_clampIndices:function(t,e){var n,i=e.length-1;for(n=0;n<t.length;n++)t[n]=Math.min(i,Math.max(t[n],0))}}),t.Routing.mapzen=function(e,n){return new t.Routing.Mapzen(e,n)},module.exports=t.Routing.Mapzen}()}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{corslite:1,polyline:2}],4:[function(require,module,exports){(function(global){!function(){"use strict";var t="undefined"!=typeof window?window.L:"undefined"!=typeof global?global.L:null;t.Routing=t.Routing||{},t.Routing.MapzenFormatter=t.Class.extend({options:{units:"metric",unitNames:{meters:"m",kilometers:"km",yards:"yd",miles:"mi",hours:"h",minutes:"mín",seconds:"s"},language:"en",roundingSensitivity:1,distanceTemplate:"{value} {unit}"},initialize:function(e){t.setOptions(this,e)},formatDistance:function(e){var n,r,i=this.options.unitNames;return"imperial"===this.options.units?(e=1e3*e,e/=1.609344,r=e>=1e3?{value:this._round(e)/1e3,unit:i.miles}:{value:this._round(e/1.76),unit:i.yards}):(n=e,r={value:n>=1?n:1e3*n,unit:n>=1?i.kilometers:i.meters}),t.Util.template(this.options.distanceTemplate,r)},_round:function(t){var e=Math.pow(10,(Math.floor(t/this.options.roundingSensitivity)+"").length-1),n=Math.floor(t/e),r=n>5?e:e/2;return Math.round(t/r)*r},formatTime:function(t){return t>86400?Math.round(t/3600)+" h":t>3600?Math.floor(t/3600)+" h "+Math.round(t%3600/60)+" min":t>300?Math.round(t/60)+" min":t>60?Math.floor(t/60)+" min"+(t%60!==0?" "+t%60+" s":""):t+" s"},formatInstruction:function(t,e){return t.instruction},getIconName:function(t,e){switch(t.type){case 0:return"kNone";case 1:return"kStart";case 2:return"kStartRight";case 3:return"kStartLeft";case 4:return"kDestination";case 5:return"kDestinationRight";case 6:return"kDestinationLeft";case 7:return"kBecomes";case 8:return"kContinue";case 9:return"kSlightRight";case 10:return"kRight";case 11:return"kSharpRight";case 12:return"kUturnRight";case 13:return"kUturnLeft";case 14:return"kSharpLeft";case 15:return"kLeft";case 16:return"kSlightLeft";case 17:return"kRampStraight";case 18:return"kRampRight";case 19:return"kRampLeft";case 20:return"kExitRight";case 21:return"kExitLeft";case 22:return"kStayStraight";case 23:return"kStayRight";case 24:return"kStayLeft";case 25:return"kMerge";case 26:return"kRoundaboutEnter";case 27:return"kRoundaboutExit";case 28:return"kFerryEnter";case 29:return"kFerryExit";case 30:case 31:case 32:case 33:case 34:case 35:case 36:return t.edited_travel_type?"kTransit"+this._getCapitalizedName(t.edited_travel_type):"kTransit"}},_getInstructionTemplate:function(t,e){return t.instruction+" "+t.length},_getCapitalizedName:function(t){return t.charAt(0).toUpperCase()+t.slice(1)}}),t.Routing.mapzenFormatter=function(){return new t.Routing.MapzenFormatter},module.exports=t.Routing}()}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],5:[function(require,module,exports){(function(global){!function(){"use strict";var t="undefined"!=typeof window?window.L:"undefined"!=typeof global?global.L:null;t.Routing=t.Routing||{},t.Routing.MapzenLine=t.LayerGroup.extend({includes:t.Mixin.Events,options:{styles:[{color:"black",opacity:.15,weight:9},{color:"white",opacity:.8,weight:6},{color:"red",opacity:1,weight:2}],missingRouteStyles:[{color:"black",opacity:.15,weight:7},{color:"white",opacity:.6,weight:4},{color:"gray",opacity:.8,weight:2,dashArray:"7,12"}],addWaypoints:!0,extendToWaypoints:!0,missingRouteTolerance:10},initialize:function(i,e){if(t.setOptions(this,e),t.LayerGroup.prototype.initialize.call(this,e),this._route=i,this.options.extendToWaypoints&&this._extendToWaypoints(),i.subRoutes)for(var n=0;n<i.subRoutes.length;n++)i.subRoutes[n].styles||(i.subRoutes[n].styles=this.options.styles),this._addSegment(i.subRoutes[n].coordinates,i.subRoutes[n].styles,this.options.addWaypoints);else this._addSegment(i.coordinates,this.options.styles,this.options.addWaypoints)},addTo:function(t){return t.addLayer(this),this},getBounds:function(){return t.latLngBounds(this._route.coordinates)},_findWaypointIndices:function(){var t,i=this._route.inputWaypoints,e=[];for(t=0;t<i.length;t++)e.push(this._findClosestRoutePoint(i[t].latLng));return e},_findClosestRoutePoint:function(t){var i,e,n,o=Number.MAX_VALUE;for(e=this._route.coordinates.length-1;e>=0;e--)n=t.distanceTo(this._route.coordinates[e]),o>n&&(i=e,o=n);return i},_extendToWaypoints:function(){var i,e,n,o=this._route.inputWaypoints,s=this._getWaypointIndices();for(i=0;i<o.length;i++)e=o[i].latLng,n=t.latLng(this._route.coordinates[s[i]]),e.distanceTo(n)>this.options.missingRouteTolerance&&this._addSegment([e,n],this.options.missingRouteStyles)},_addSegment:function(i,e,n){var o,s;for(o=0;o<e.length;o++)s=t.polyline(i,e[o]),this.addLayer(s),n&&s.on("mousedown",this._onLineTouched,this)},_findNearestWpBefore:function(t){for(var i=this._getWaypointIndices(),e=i.length-1;e>=0&&i[e]>t;)e--;return e},_onLineTouched:function(t){var i=this._findNearestWpBefore(this._findClosestRoutePoint(t.latlng));this.fire("linetouched",{afterIndex:i,latlng:t.latlng})},_getWaypointIndices:function(){return this._wpIndices||(this._wpIndices=this._route.waypointIndices||this._findWaypointIndices()),this._wpIndices}}),t.Routing.mapzenLine=function(i,e){return new t.Routing.MapzenLine(i,e)},module.exports=t.Routing}()}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[3,4,5]);

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/lrm-mapzen/dist/lrm-mapzen.min.js","/node_modules/lrm-mapzen/dist")

},{"_process":48,"buffer":13,"corslite":14,"polyline":47}],46:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
module.exports=function(n){var t={},e=[];n=n||this,n.on=function(n,e,l){(t[n]=t[n]||[]).push([e,l])},n.off=function(n,l){n||(t={});for(var o=t[n]||e,i=o.length=l?o.length:0;i--;)l==o[i][0]&&o.splice(i,1)},n.emit=function(n){for(var l,o=t[n]||e,i=o.length>0?o.slice(0,o.length):o,c=0;l=i[c++];)l[0].apply(l[1],e.slice.call(arguments,1))}};
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/minivents/dist/minivents.commonjs.min.js","/node_modules/minivents/dist")

},{"_process":48,"buffer":13}],47:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var polyline = {};

// Based off of [the offical Google document](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
//
// Some parts from [this implementation](http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/PolylineEncoder.js)
// by [Mark McClure](http://facstaff.unca.edu/mcmcclur/)

function encode(coordinate, factor) {
    coordinate = Math.round(coordinate * factor);
    coordinate <<= 1;
    if (coordinate < 0) {
        coordinate = ~coordinate;
    }
    var output = '';
    while (coordinate >= 0x20) {
        output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
        coordinate >>= 5;
    }
    output += String.fromCharCode(coordinate + 63);
    return output;
}

// This is adapted from the implementation in Project-OSRM
// https://github.com/DennisOSRM/Project-OSRM-Web/blob/master/WebContent/routing/OSRM.RoutingGeometry.js
polyline.decode = function(str, precision) {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision || 5);

    // Coordinates have variable length when encoded, so just keep
    // track of whether we've hit the end of the string. In each
    // loop iteration, a single coordinate is decoded.
    while (index < str.length) {

        // Reset shift, result, and byte
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
};

polyline.encode = function(coordinates, precision) {
    if (!coordinates.length) return '';

    var factor = Math.pow(10, precision || 5),
        output = encode(coordinates[0][0], factor) + encode(coordinates[0][1], factor);

    for (var i = 1; i < coordinates.length; i++) {
        var a = coordinates[i], b = coordinates[i - 1];
        output += encode(a[0] - b[0], factor);
        output += encode(a[1] - b[1], factor);
    }

    return output;
};

if (typeof module !== undefined) module.exports = polyline;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/polyline/src/polyline.js","/node_modules/polyline/src")

},{"_process":48,"buffer":13}],48:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/process/browser.js","/node_modules/process")

},{"_process":48,"buffer":13}],49:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/*!
 * URI.js - Mutating URLs
 * IPv6 Support
 *
 * Version: 1.18.0
 *
 * Author: Rodney Rehm
 * Web: http://medialize.github.io/URI.js/
 *
 * Licensed under
 *   MIT License http://www.opensource.org/licenses/mit-license
 *
 */

(function (root, factory) {
  'use strict';
  // https://github.com/umdjs/umd/blob/master/returnExports.js
  if (typeof exports === 'object') {
    // Node
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory);
  } else {
    // Browser globals (root is window)
    root.IPv6 = factory(root);
  }
}(this, function (root) {
  'use strict';

  /*
  var _in = "fe80:0000:0000:0000:0204:61ff:fe9d:f156";
  var _out = IPv6.best(_in);
  var _expected = "fe80::204:61ff:fe9d:f156";

  console.log(_in, _out, _expected, _out === _expected);
  */

  // save current IPv6 variable, if any
  var _IPv6 = root && root.IPv6;

  function bestPresentation(address) {
    // based on:
    // Javascript to test an IPv6 address for proper format, and to
    // present the "best text representation" according to IETF Draft RFC at
    // http://tools.ietf.org/html/draft-ietf-6man-text-addr-representation-04
    // 8 Feb 2010 Rich Brown, Dartware, LLC
    // Please feel free to use this code as long as you provide a link to
    // http://www.intermapper.com
    // http://intermapper.com/support/tools/IPV6-Validator.aspx
    // http://download.dartware.com/thirdparty/ipv6validator.js

    var _address = address.toLowerCase();
    var segments = _address.split(':');
    var length = segments.length;
    var total = 8;

    // trim colons (:: or ::a:b:c… or …a:b:c::)
    if (segments[0] === '' && segments[1] === '' && segments[2] === '') {
      // must have been ::
      // remove first two items
      segments.shift();
      segments.shift();
    } else if (segments[0] === '' && segments[1] === '') {
      // must have been ::xxxx
      // remove the first item
      segments.shift();
    } else if (segments[length - 1] === '' && segments[length - 2] === '') {
      // must have been xxxx::
      segments.pop();
    }

    length = segments.length;

    // adjust total segments for IPv4 trailer
    if (segments[length - 1].indexOf('.') !== -1) {
      // found a "." which means IPv4
      total = 7;
    }

    // fill empty segments them with "0000"
    var pos;
    for (pos = 0; pos < length; pos++) {
      if (segments[pos] === '') {
        break;
      }
    }

    if (pos < total) {
      segments.splice(pos, 1, '0000');
      while (segments.length < total) {
        segments.splice(pos, 0, '0000');
      }
    }

    // strip leading zeros
    var _segments;
    for (var i = 0; i < total; i++) {
      _segments = segments[i].split('');
      for (var j = 0; j < 3 ; j++) {
        if (_segments[0] === '0' && _segments.length > 1) {
          _segments.splice(0,1);
        } else {
          break;
        }
      }

      segments[i] = _segments.join('');
    }

    // find longest sequence of zeroes and coalesce them into one segment
    var best = -1;
    var _best = 0;
    var _current = 0;
    var current = -1;
    var inzeroes = false;
    // i; already declared

    for (i = 0; i < total; i++) {
      if (inzeroes) {
        if (segments[i] === '0') {
          _current += 1;
        } else {
          inzeroes = false;
          if (_current > _best) {
            best = current;
            _best = _current;
          }
        }
      } else {
        if (segments[i] === '0') {
          inzeroes = true;
          current = i;
          _current = 1;
        }
      }
    }

    if (_current > _best) {
      best = current;
      _best = _current;
    }

    if (_best > 1) {
      segments.splice(best, _best, '');
    }

    length = segments.length;

    // assemble remaining segments
    var result = '';
    if (segments[0] === '')  {
      result = ':';
    }

    for (i = 0; i < length; i++) {
      result += segments[i];
      if (i === length - 1) {
        break;
      }

      result += ':';
    }

    if (segments[length - 1] === '') {
      result += ':';
    }

    return result;
  }

  function noConflict() {
    /*jshint validthis: true */
    if (root.IPv6 === this) {
      root.IPv6 = _IPv6;
    }
  
    return this;
  }

  return {
    best: bestPresentation,
    noConflict: noConflict
  };
}));

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/urijs/src/IPv6.js","/node_modules/urijs/src")

},{"_process":48,"buffer":13}],50:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/*!
 * URI.js - Mutating URLs
 * Second Level Domain (SLD) Support
 *
 * Version: 1.18.0
 *
 * Author: Rodney Rehm
 * Web: http://medialize.github.io/URI.js/
 *
 * Licensed under
 *   MIT License http://www.opensource.org/licenses/mit-license
 *
 */

(function (root, factory) {
  'use strict';
  // https://github.com/umdjs/umd/blob/master/returnExports.js
  if (typeof exports === 'object') {
    // Node
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory);
  } else {
    // Browser globals (root is window)
    root.SecondLevelDomains = factory(root);
  }
}(this, function (root) {
  'use strict';

  // save current SecondLevelDomains variable, if any
  var _SecondLevelDomains = root && root.SecondLevelDomains;

  var SLD = {
    // list of known Second Level Domains
    // converted list of SLDs from https://github.com/gavingmiller/second-level-domains
    // ----
    // publicsuffix.org is more current and actually used by a couple of browsers internally.
    // downside is it also contains domains like "dyndns.org" - which is fine for the security
    // issues browser have to deal with (SOP for cookies, etc) - but is way overboard for URI.js
    // ----
    list: {
      'ac':' com gov mil net org ',
      'ae':' ac co gov mil name net org pro sch ',
      'af':' com edu gov net org ',
      'al':' com edu gov mil net org ',
      'ao':' co ed gv it og pb ',
      'ar':' com edu gob gov int mil net org tur ',
      'at':' ac co gv or ',
      'au':' asn com csiro edu gov id net org ',
      'ba':' co com edu gov mil net org rs unbi unmo unsa untz unze ',
      'bb':' biz co com edu gov info net org store tv ',
      'bh':' biz cc com edu gov info net org ',
      'bn':' com edu gov net org ',
      'bo':' com edu gob gov int mil net org tv ',
      'br':' adm adv agr am arq art ato b bio blog bmd cim cng cnt com coop ecn edu eng esp etc eti far flog fm fnd fot fst g12 ggf gov imb ind inf jor jus lel mat med mil mus net nom not ntr odo org ppg pro psc psi qsl rec slg srv tmp trd tur tv vet vlog wiki zlg ',
      'bs':' com edu gov net org ',
      'bz':' du et om ov rg ',
      'ca':' ab bc mb nb nf nl ns nt nu on pe qc sk yk ',
      'ck':' biz co edu gen gov info net org ',
      'cn':' ac ah bj com cq edu fj gd gov gs gx gz ha hb he hi hl hn jl js jx ln mil net nm nx org qh sc sd sh sn sx tj tw xj xz yn zj ',
      'co':' com edu gov mil net nom org ',
      'cr':' ac c co ed fi go or sa ',
      'cy':' ac biz com ekloges gov ltd name net org parliament press pro tm ',
      'do':' art com edu gob gov mil net org sld web ',
      'dz':' art asso com edu gov net org pol ',
      'ec':' com edu fin gov info med mil net org pro ',
      'eg':' com edu eun gov mil name net org sci ',
      'er':' com edu gov ind mil net org rochest w ',
      'es':' com edu gob nom org ',
      'et':' biz com edu gov info name net org ',
      'fj':' ac biz com info mil name net org pro ',
      'fk':' ac co gov net nom org ',
      'fr':' asso com f gouv nom prd presse tm ',
      'gg':' co net org ',
      'gh':' com edu gov mil org ',
      'gn':' ac com gov net org ',
      'gr':' com edu gov mil net org ',
      'gt':' com edu gob ind mil net org ',
      'gu':' com edu gov net org ',
      'hk':' com edu gov idv net org ',
      'hu':' 2000 agrar bolt casino city co erotica erotika film forum games hotel info ingatlan jogasz konyvelo lakas media news org priv reklam sex shop sport suli szex tm tozsde utazas video ',
      'id':' ac co go mil net or sch web ',
      'il':' ac co gov idf k12 muni net org ',
      'in':' ac co edu ernet firm gen gov i ind mil net nic org res ',
      'iq':' com edu gov i mil net org ',
      'ir':' ac co dnssec gov i id net org sch ',
      'it':' edu gov ',
      'je':' co net org ',
      'jo':' com edu gov mil name net org sch ',
      'jp':' ac ad co ed go gr lg ne or ',
      'ke':' ac co go info me mobi ne or sc ',
      'kh':' com edu gov mil net org per ',
      'ki':' biz com de edu gov info mob net org tel ',
      'km':' asso com coop edu gouv k medecin mil nom notaires pharmaciens presse tm veterinaire ',
      'kn':' edu gov net org ',
      'kr':' ac busan chungbuk chungnam co daegu daejeon es gangwon go gwangju gyeongbuk gyeonggi gyeongnam hs incheon jeju jeonbuk jeonnam k kg mil ms ne or pe re sc seoul ulsan ',
      'kw':' com edu gov net org ',
      'ky':' com edu gov net org ',
      'kz':' com edu gov mil net org ',
      'lb':' com edu gov net org ',
      'lk':' assn com edu gov grp hotel int ltd net ngo org sch soc web ',
      'lr':' com edu gov net org ',
      'lv':' asn com conf edu gov id mil net org ',
      'ly':' com edu gov id med net org plc sch ',
      'ma':' ac co gov m net org press ',
      'mc':' asso tm ',
      'me':' ac co edu gov its net org priv ',
      'mg':' com edu gov mil nom org prd tm ',
      'mk':' com edu gov inf name net org pro ',
      'ml':' com edu gov net org presse ',
      'mn':' edu gov org ',
      'mo':' com edu gov net org ',
      'mt':' com edu gov net org ',
      'mv':' aero biz com coop edu gov info int mil museum name net org pro ',
      'mw':' ac co com coop edu gov int museum net org ',
      'mx':' com edu gob net org ',
      'my':' com edu gov mil name net org sch ',
      'nf':' arts com firm info net other per rec store web ',
      'ng':' biz com edu gov mil mobi name net org sch ',
      'ni':' ac co com edu gob mil net nom org ',
      'np':' com edu gov mil net org ',
      'nr':' biz com edu gov info net org ',
      'om':' ac biz co com edu gov med mil museum net org pro sch ',
      'pe':' com edu gob mil net nom org sld ',
      'ph':' com edu gov i mil net ngo org ',
      'pk':' biz com edu fam gob gok gon gop gos gov net org web ',
      'pl':' art bialystok biz com edu gda gdansk gorzow gov info katowice krakow lodz lublin mil net ngo olsztyn org poznan pwr radom slupsk szczecin torun warszawa waw wroc wroclaw zgora ',
      'pr':' ac biz com edu est gov info isla name net org pro prof ',
      'ps':' com edu gov net org plo sec ',
      'pw':' belau co ed go ne or ',
      'ro':' arts com firm info nom nt org rec store tm www ',
      'rs':' ac co edu gov in org ',
      'sb':' com edu gov net org ',
      'sc':' com edu gov net org ',
      'sh':' co com edu gov net nom org ',
      'sl':' com edu gov net org ',
      'st':' co com consulado edu embaixada gov mil net org principe saotome store ',
      'sv':' com edu gob org red ',
      'sz':' ac co org ',
      'tr':' av bbs bel biz com dr edu gen gov info k12 name net org pol tel tsk tv web ',
      'tt':' aero biz cat co com coop edu gov info int jobs mil mobi museum name net org pro tel travel ',
      'tw':' club com ebiz edu game gov idv mil net org ',
      'mu':' ac co com gov net or org ',
      'mz':' ac co edu gov org ',
      'na':' co com ',
      'nz':' ac co cri geek gen govt health iwi maori mil net org parliament school ',
      'pa':' abo ac com edu gob ing med net nom org sld ',
      'pt':' com edu gov int net nome org publ ',
      'py':' com edu gov mil net org ',
      'qa':' com edu gov mil net org ',
      're':' asso com nom ',
      'ru':' ac adygeya altai amur arkhangelsk astrakhan bashkiria belgorod bir bryansk buryatia cbg chel chelyabinsk chita chukotka chuvashia com dagestan e-burg edu gov grozny int irkutsk ivanovo izhevsk jar joshkar-ola kalmykia kaluga kamchatka karelia kazan kchr kemerovo khabarovsk khakassia khv kirov koenig komi kostroma kranoyarsk kuban kurgan kursk lipetsk magadan mari mari-el marine mil mordovia mosreg msk murmansk nalchik net nnov nov novosibirsk nsk omsk orenburg org oryol penza perm pp pskov ptz rnd ryazan sakhalin samara saratov simbirsk smolensk spb stavropol stv surgut tambov tatarstan tom tomsk tsaritsyn tsk tula tuva tver tyumen udm udmurtia ulan-ude vladikavkaz vladimir vladivostok volgograd vologda voronezh vrn vyatka yakutia yamal yekaterinburg yuzhno-sakhalinsk ',
      'rw':' ac co com edu gouv gov int mil net ',
      'sa':' com edu gov med net org pub sch ',
      'sd':' com edu gov info med net org tv ',
      'se':' a ac b bd c d e f g h i k l m n o org p parti pp press r s t tm u w x y z ',
      'sg':' com edu gov idn net org per ',
      'sn':' art com edu gouv org perso univ ',
      'sy':' com edu gov mil net news org ',
      'th':' ac co go in mi net or ',
      'tj':' ac biz co com edu go gov info int mil name net nic org test web ',
      'tn':' agrinet com defense edunet ens fin gov ind info intl mincom nat net org perso rnrt rns rnu tourism ',
      'tz':' ac co go ne or ',
      'ua':' biz cherkassy chernigov chernovtsy ck cn co com crimea cv dn dnepropetrovsk donetsk dp edu gov if in ivano-frankivsk kh kharkov kherson khmelnitskiy kiev kirovograd km kr ks kv lg lugansk lutsk lviv me mk net nikolaev od odessa org pl poltava pp rovno rv sebastopol sumy te ternopil uzhgorod vinnica vn zaporizhzhe zhitomir zp zt ',
      'ug':' ac co go ne or org sc ',
      'uk':' ac bl british-library co cym gov govt icnet jet lea ltd me mil mod national-library-scotland nel net nhs nic nls org orgn parliament plc police sch scot soc ',
      'us':' dni fed isa kids nsn ',
      'uy':' com edu gub mil net org ',
      've':' co com edu gob info mil net org web ',
      'vi':' co com k12 net org ',
      'vn':' ac biz com edu gov health info int name net org pro ',
      'ye':' co com gov ltd me net org plc ',
      'yu':' ac co edu gov org ',
      'za':' ac agric alt bourse city co cybernet db edu gov grondar iaccess imt inca landesign law mil net ngo nis nom olivetti org pix school tm web ',
      'zm':' ac co com edu gov net org sch '
    },
    // gorhill 2013-10-25: Using indexOf() instead Regexp(). Significant boost
    // in both performance and memory footprint. No initialization required.
    // http://jsperf.com/uri-js-sld-regex-vs-binary-search/4
    // Following methods use lastIndexOf() rather than array.split() in order
    // to avoid any memory allocations.
    has: function(domain) {
      var tldOffset = domain.lastIndexOf('.');
      if (tldOffset <= 0 || tldOffset >= (domain.length-1)) {
        return false;
      }
      var sldOffset = domain.lastIndexOf('.', tldOffset-1);
      if (sldOffset <= 0 || sldOffset >= (tldOffset-1)) {
        return false;
      }
      var sldList = SLD.list[domain.slice(tldOffset+1)];
      if (!sldList) {
        return false;
      }
      return sldList.indexOf(' ' + domain.slice(sldOffset+1, tldOffset) + ' ') >= 0;
    },
    is: function(domain) {
      var tldOffset = domain.lastIndexOf('.');
      if (tldOffset <= 0 || tldOffset >= (domain.length-1)) {
        return false;
      }
      var sldOffset = domain.lastIndexOf('.', tldOffset-1);
      if (sldOffset >= 0) {
        return false;
      }
      var sldList = SLD.list[domain.slice(tldOffset+1)];
      if (!sldList) {
        return false;
      }
      return sldList.indexOf(' ' + domain.slice(0, tldOffset) + ' ') >= 0;
    },
    get: function(domain) {
      var tldOffset = domain.lastIndexOf('.');
      if (tldOffset <= 0 || tldOffset >= (domain.length-1)) {
        return null;
      }
      var sldOffset = domain.lastIndexOf('.', tldOffset-1);
      if (sldOffset <= 0 || sldOffset >= (tldOffset-1)) {
        return null;
      }
      var sldList = SLD.list[domain.slice(tldOffset+1)];
      if (!sldList) {
        return null;
      }
      if (sldList.indexOf(' ' + domain.slice(sldOffset+1, tldOffset) + ' ') < 0) {
        return null;
      }
      return domain.slice(sldOffset+1);
    },
    noConflict: function(){
      if (root.SecondLevelDomains === this) {
        root.SecondLevelDomains = _SecondLevelDomains;
      }
      return this;
    }
  };

  return SLD;
}));

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/urijs/src/SecondLevelDomains.js","/node_modules/urijs/src")

},{"_process":48,"buffer":13}],51:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/*!
 * URI.js - Mutating URLs
 *
 * Version: 1.18.0
 *
 * Author: Rodney Rehm
 * Web: http://medialize.github.io/URI.js/
 *
 * Licensed under
 *   MIT License http://www.opensource.org/licenses/mit-license
 *
 */
(function (root, factory) {
  'use strict';
  // https://github.com/umdjs/umd/blob/master/returnExports.js
  if (typeof exports === 'object') {
    // Node
    module.exports = factory(require('./punycode'), require('./IPv6'), require('./SecondLevelDomains'));
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['./punycode', './IPv6', './SecondLevelDomains'], factory);
  } else {
    // Browser globals (root is window)
    root.URI = factory(root.punycode, root.IPv6, root.SecondLevelDomains, root);
  }
}(this, function (punycode, IPv6, SLD, root) {
  'use strict';
  /*global location, escape, unescape */
  // FIXME: v2.0.0 renamce non-camelCase properties to uppercase
  /*jshint camelcase: false */

  // save current URI variable, if any
  var _URI = root && root.URI;

  function URI(url, base) {
    var _urlSupplied = arguments.length >= 1;
    var _baseSupplied = arguments.length >= 2;

    // Allow instantiation without the 'new' keyword
    if (!(this instanceof URI)) {
      if (_urlSupplied) {
        if (_baseSupplied) {
          return new URI(url, base);
        }

        return new URI(url);
      }

      return new URI();
    }

    if (url === undefined) {
      if (_urlSupplied) {
        throw new TypeError('undefined is not a valid argument for URI');
      }

      if (typeof location !== 'undefined') {
        url = location.href + '';
      } else {
        url = '';
      }
    }

    this.href(url);

    // resolve to base according to http://dvcs.w3.org/hg/url/raw-file/tip/Overview.html#constructor
    if (base !== undefined) {
      return this.absoluteTo(base);
    }

    return this;
  }

  URI.version = '1.18.0';

  var p = URI.prototype;
  var hasOwn = Object.prototype.hasOwnProperty;

  function escapeRegEx(string) {
    // https://github.com/medialize/URI.js/commit/85ac21783c11f8ccab06106dba9735a31a86924d#commitcomment-821963
    return string.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
  }

  function getType(value) {
    // IE8 doesn't return [Object Undefined] but [Object Object] for undefined value
    if (value === undefined) {
      return 'Undefined';
    }

    return String(Object.prototype.toString.call(value)).slice(8, -1);
  }

  function isArray(obj) {
    return getType(obj) === 'Array';
  }

  function filterArrayValues(data, value) {
    var lookup = {};
    var i, length;

    if (getType(value) === 'RegExp') {
      lookup = null;
    } else if (isArray(value)) {
      for (i = 0, length = value.length; i < length; i++) {
        lookup[value[i]] = true;
      }
    } else {
      lookup[value] = true;
    }

    for (i = 0, length = data.length; i < length; i++) {
      /*jshint laxbreak: true */
      var _match = lookup && lookup[data[i]] !== undefined
        || !lookup && value.test(data[i]);
      /*jshint laxbreak: false */
      if (_match) {
        data.splice(i, 1);
        length--;
        i--;
      }
    }

    return data;
  }

  function arrayContains(list, value) {
    var i, length;

    // value may be string, number, array, regexp
    if (isArray(value)) {
      // Note: this can be optimized to O(n) (instead of current O(m * n))
      for (i = 0, length = value.length; i < length; i++) {
        if (!arrayContains(list, value[i])) {
          return false;
        }
      }

      return true;
    }

    var _type = getType(value);
    for (i = 0, length = list.length; i < length; i++) {
      if (_type === 'RegExp') {
        if (typeof list[i] === 'string' && list[i].match(value)) {
          return true;
        }
      } else if (list[i] === value) {
        return true;
      }
    }

    return false;
  }

  function arraysEqual(one, two) {
    if (!isArray(one) || !isArray(two)) {
      return false;
    }

    // arrays can't be equal if they have different amount of content
    if (one.length !== two.length) {
      return false;
    }

    one.sort();
    two.sort();

    for (var i = 0, l = one.length; i < l; i++) {
      if (one[i] !== two[i]) {
        return false;
      }
    }

    return true;
  }

  function trimSlashes(text) {
    var trim_expression = /^\/+|\/+$/g;
    return text.replace(trim_expression, '');
  }

  URI._parts = function() {
    return {
      protocol: null,
      username: null,
      password: null,
      hostname: null,
      urn: null,
      port: null,
      path: null,
      query: null,
      fragment: null,
      // state
      duplicateQueryParameters: URI.duplicateQueryParameters,
      escapeQuerySpace: URI.escapeQuerySpace
    };
  };
  // state: allow duplicate query parameters (a=1&a=1)
  URI.duplicateQueryParameters = false;
  // state: replaces + with %20 (space in query strings)
  URI.escapeQuerySpace = true;
  // static properties
  URI.protocol_expression = /^[a-z][a-z0-9.+-]*$/i;
  URI.idn_expression = /[^a-z0-9\.-]/i;
  URI.punycode_expression = /(xn--)/i;
  // well, 333.444.555.666 matches, but it sure ain't no IPv4 - do we care?
  URI.ip4_expression = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  // credits to Rich Brown
  // source: http://forums.intermapper.com/viewtopic.php?p=1096#1096
  // specification: http://www.ietf.org/rfc/rfc4291.txt
  URI.ip6_expression = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
  // expression used is "gruber revised" (@gruber v2) determined to be the
  // best solution in a regex-golf we did a couple of ages ago at
  // * http://mathiasbynens.be/demo/url-regex
  // * http://rodneyrehm.de/t/url-regex.html
  URI.find_uri_expression = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
  URI.findUri = {
    // valid "scheme://" or "www."
    start: /\b(?:([a-z][a-z0-9.+-]*:\/\/)|www\.)/gi,
    // everything up to the next whitespace
    end: /[\s\r\n]|$/,
    // trim trailing punctuation captured by end RegExp
    trim: /[`!()\[\]{};:'".,<>?«»“”„‘’]+$/
  };
  // http://www.iana.org/assignments/uri-schemes.html
  // http://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers#Well-known_ports
  URI.defaultPorts = {
    http: '80',
    https: '443',
    ftp: '21',
    gopher: '70',
    ws: '80',
    wss: '443'
  };
  // allowed hostname characters according to RFC 3986
  // ALPHA DIGIT "-" "." "_" "~" "!" "$" "&" "'" "(" ")" "*" "+" "," ";" "=" %encoded
  // I've never seen a (non-IDN) hostname other than: ALPHA DIGIT . -
  URI.invalid_hostname_characters = /[^a-zA-Z0-9\.-]/;
  // map DOM Elements to their URI attribute
  URI.domAttributes = {
    'a': 'href',
    'blockquote': 'cite',
    'link': 'href',
    'base': 'href',
    'script': 'src',
    'form': 'action',
    'img': 'src',
    'area': 'href',
    'iframe': 'src',
    'embed': 'src',
    'source': 'src',
    'track': 'src',
    'input': 'src', // but only if type="image"
    'audio': 'src',
    'video': 'src'
  };
  URI.getDomAttribute = function(node) {
    if (!node || !node.nodeName) {
      return undefined;
    }

    var nodeName = node.nodeName.toLowerCase();
    // <input> should only expose src for type="image"
    if (nodeName === 'input' && node.type !== 'image') {
      return undefined;
    }

    return URI.domAttributes[nodeName];
  };

  function escapeForDumbFirefox36(value) {
    // https://github.com/medialize/URI.js/issues/91
    return escape(value);
  }

  // encoding / decoding according to RFC3986
  function strictEncodeURIComponent(string) {
    // see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/encodeURIComponent
    return encodeURIComponent(string)
      .replace(/[!'()*]/g, escapeForDumbFirefox36)
      .replace(/\*/g, '%2A');
  }
  URI.encode = strictEncodeURIComponent;
  URI.decode = decodeURIComponent;
  URI.iso8859 = function() {
    URI.encode = escape;
    URI.decode = unescape;
  };
  URI.unicode = function() {
    URI.encode = strictEncodeURIComponent;
    URI.decode = decodeURIComponent;
  };
  URI.characters = {
    pathname: {
      encode: {
        // RFC3986 2.1: For consistency, URI producers and normalizers should
        // use uppercase hexadecimal digits for all percent-encodings.
        expression: /%(24|26|2B|2C|3B|3D|3A|40)/ig,
        map: {
          // -._~!'()*
          '%24': '$',
          '%26': '&',
          '%2B': '+',
          '%2C': ',',
          '%3B': ';',
          '%3D': '=',
          '%3A': ':',
          '%40': '@'
        }
      },
      decode: {
        expression: /[\/\?#]/g,
        map: {
          '/': '%2F',
          '?': '%3F',
          '#': '%23'
        }
      }
    },
    reserved: {
      encode: {
        // RFC3986 2.1: For consistency, URI producers and normalizers should
        // use uppercase hexadecimal digits for all percent-encodings.
        expression: /%(21|23|24|26|27|28|29|2A|2B|2C|2F|3A|3B|3D|3F|40|5B|5D)/ig,
        map: {
          // gen-delims
          '%3A': ':',
          '%2F': '/',
          '%3F': '?',
          '%23': '#',
          '%5B': '[',
          '%5D': ']',
          '%40': '@',
          // sub-delims
          '%21': '!',
          '%24': '$',
          '%26': '&',
          '%27': '\'',
          '%28': '(',
          '%29': ')',
          '%2A': '*',
          '%2B': '+',
          '%2C': ',',
          '%3B': ';',
          '%3D': '='
        }
      }
    },
    urnpath: {
      // The characters under `encode` are the characters called out by RFC 2141 as being acceptable
      // for usage in a URN. RFC2141 also calls out "-", ".", and "_" as acceptable characters, but
      // these aren't encoded by encodeURIComponent, so we don't have to call them out here. Also
      // note that the colon character is not featured in the encoding map; this is because URI.js
      // gives the colons in URNs semantic meaning as the delimiters of path segements, and so it
      // should not appear unencoded in a segment itself.
      // See also the note above about RFC3986 and capitalalized hex digits.
      encode: {
        expression: /%(21|24|27|28|29|2A|2B|2C|3B|3D|40)/ig,
        map: {
          '%21': '!',
          '%24': '$',
          '%27': '\'',
          '%28': '(',
          '%29': ')',
          '%2A': '*',
          '%2B': '+',
          '%2C': ',',
          '%3B': ';',
          '%3D': '=',
          '%40': '@'
        }
      },
      // These characters are the characters called out by RFC2141 as "reserved" characters that
      // should never appear in a URN, plus the colon character (see note above).
      decode: {
        expression: /[\/\?#:]/g,
        map: {
          '/': '%2F',
          '?': '%3F',
          '#': '%23',
          ':': '%3A'
        }
      }
    }
  };
  URI.encodeQuery = function(string, escapeQuerySpace) {
    var escaped = URI.encode(string + '');
    if (escapeQuerySpace === undefined) {
      escapeQuerySpace = URI.escapeQuerySpace;
    }

    return escapeQuerySpace ? escaped.replace(/%20/g, '+') : escaped;
  };
  URI.decodeQuery = function(string, escapeQuerySpace) {
    string += '';
    if (escapeQuerySpace === undefined) {
      escapeQuerySpace = URI.escapeQuerySpace;
    }

    try {
      return URI.decode(escapeQuerySpace ? string.replace(/\+/g, '%20') : string);
    } catch(e) {
      // we're not going to mess with weird encodings,
      // give up and return the undecoded original string
      // see https://github.com/medialize/URI.js/issues/87
      // see https://github.com/medialize/URI.js/issues/92
      return string;
    }
  };
  // generate encode/decode path functions
  var _parts = {'encode':'encode', 'decode':'decode'};
  var _part;
  var generateAccessor = function(_group, _part) {
    return function(string) {
      try {
        return URI[_part](string + '').replace(URI.characters[_group][_part].expression, function(c) {
          return URI.characters[_group][_part].map[c];
        });
      } catch (e) {
        // we're not going to mess with weird encodings,
        // give up and return the undecoded original string
        // see https://github.com/medialize/URI.js/issues/87
        // see https://github.com/medialize/URI.js/issues/92
        return string;
      }
    };
  };

  for (_part in _parts) {
    URI[_part + 'PathSegment'] = generateAccessor('pathname', _parts[_part]);
    URI[_part + 'UrnPathSegment'] = generateAccessor('urnpath', _parts[_part]);
  }

  var generateSegmentedPathFunction = function(_sep, _codingFuncName, _innerCodingFuncName) {
    return function(string) {
      // Why pass in names of functions, rather than the function objects themselves? The
      // definitions of some functions (but in particular, URI.decode) will occasionally change due
      // to URI.js having ISO8859 and Unicode modes. Passing in the name and getting it will ensure
      // that the functions we use here are "fresh".
      var actualCodingFunc;
      if (!_innerCodingFuncName) {
        actualCodingFunc = URI[_codingFuncName];
      } else {
        actualCodingFunc = function(string) {
          return URI[_codingFuncName](URI[_innerCodingFuncName](string));
        };
      }

      var segments = (string + '').split(_sep);

      for (var i = 0, length = segments.length; i < length; i++) {
        segments[i] = actualCodingFunc(segments[i]);
      }

      return segments.join(_sep);
    };
  };

  // This takes place outside the above loop because we don't want, e.g., encodeUrnPath functions.
  URI.decodePath = generateSegmentedPathFunction('/', 'decodePathSegment');
  URI.decodeUrnPath = generateSegmentedPathFunction(':', 'decodeUrnPathSegment');
  URI.recodePath = generateSegmentedPathFunction('/', 'encodePathSegment', 'decode');
  URI.recodeUrnPath = generateSegmentedPathFunction(':', 'encodeUrnPathSegment', 'decode');

  URI.encodeReserved = generateAccessor('reserved', 'encode');

  URI.parse = function(string, parts) {
    var pos;
    if (!parts) {
      parts = {};
    }
    // [protocol"://"[username[":"password]"@"]hostname[":"port]"/"?][path]["?"querystring]["#"fragment]

    // extract fragment
    pos = string.indexOf('#');
    if (pos > -1) {
      // escaping?
      parts.fragment = string.substring(pos + 1) || null;
      string = string.substring(0, pos);
    }

    // extract query
    pos = string.indexOf('?');
    if (pos > -1) {
      // escaping?
      parts.query = string.substring(pos + 1) || null;
      string = string.substring(0, pos);
    }

    // extract protocol
    if (string.substring(0, 2) === '//') {
      // relative-scheme
      parts.protocol = null;
      string = string.substring(2);
      // extract "user:pass@host:port"
      string = URI.parseAuthority(string, parts);
    } else {
      pos = string.indexOf(':');
      if (pos > -1) {
        parts.protocol = string.substring(0, pos) || null;
        if (parts.protocol && !parts.protocol.match(URI.protocol_expression)) {
          // : may be within the path
          parts.protocol = undefined;
        } else if (string.substring(pos + 1, pos + 3) === '//') {
          string = string.substring(pos + 3);

          // extract "user:pass@host:port"
          string = URI.parseAuthority(string, parts);
        } else {
          string = string.substring(pos + 1);
          parts.urn = true;
        }
      }
    }

    // what's left must be the path
    parts.path = string;

    // and we're done
    return parts;
  };
  URI.parseHost = function(string, parts) {
    // Copy chrome, IE, opera backslash-handling behavior.
    // Back slashes before the query string get converted to forward slashes
    // See: https://github.com/joyent/node/blob/386fd24f49b0e9d1a8a076592a404168faeecc34/lib/url.js#L115-L124
    // See: https://code.google.com/p/chromium/issues/detail?id=25916
    // https://github.com/medialize/URI.js/pull/233
    string = string.replace(/\\/g, '/');

    // extract host:port
    var pos = string.indexOf('/');
    var bracketPos;
    var t;

    if (pos === -1) {
      pos = string.length;
    }

    if (string.charAt(0) === '[') {
      // IPv6 host - http://tools.ietf.org/html/draft-ietf-6man-text-addr-representation-04#section-6
      // I claim most client software breaks on IPv6 anyways. To simplify things, URI only accepts
      // IPv6+port in the format [2001:db8::1]:80 (for the time being)
      bracketPos = string.indexOf(']');
      parts.hostname = string.substring(1, bracketPos) || null;
      parts.port = string.substring(bracketPos + 2, pos) || null;
      if (parts.port === '/') {
        parts.port = null;
      }
    } else {
      var firstColon = string.indexOf(':');
      var firstSlash = string.indexOf('/');
      var nextColon = string.indexOf(':', firstColon + 1);
      if (nextColon !== -1 && (firstSlash === -1 || nextColon < firstSlash)) {
        // IPv6 host contains multiple colons - but no port
        // this notation is actually not allowed by RFC 3986, but we're a liberal parser
        parts.hostname = string.substring(0, pos) || null;
        parts.port = null;
      } else {
        t = string.substring(0, pos).split(':');
        parts.hostname = t[0] || null;
        parts.port = t[1] || null;
      }
    }

    if (parts.hostname && string.substring(pos).charAt(0) !== '/') {
      pos++;
      string = '/' + string;
    }

    return string.substring(pos) || '/';
  };
  URI.parseAuthority = function(string, parts) {
    string = URI.parseUserinfo(string, parts);
    return URI.parseHost(string, parts);
  };
  URI.parseUserinfo = function(string, parts) {
    // extract username:password
    var firstSlash = string.indexOf('/');
    var pos = string.lastIndexOf('@', firstSlash > -1 ? firstSlash : string.length - 1);
    var t;

    // authority@ must come before /path
    if (pos > -1 && (firstSlash === -1 || pos < firstSlash)) {
      t = string.substring(0, pos).split(':');
      parts.username = t[0] ? URI.decode(t[0]) : null;
      t.shift();
      parts.password = t[0] ? URI.decode(t.join(':')) : null;
      string = string.substring(pos + 1);
    } else {
      parts.username = null;
      parts.password = null;
    }

    return string;
  };
  URI.parseQuery = function(string, escapeQuerySpace) {
    if (!string) {
      return {};
    }

    // throw out the funky business - "?"[name"="value"&"]+
    string = string.replace(/&+/g, '&').replace(/^\?*&*|&+$/g, '');

    if (!string) {
      return {};
    }

    var items = {};
    var splits = string.split('&');
    var length = splits.length;
    var v, name, value;

    for (var i = 0; i < length; i++) {
      v = splits[i].split('=');
      name = URI.decodeQuery(v.shift(), escapeQuerySpace);
      // no "=" is null according to http://dvcs.w3.org/hg/url/raw-file/tip/Overview.html#collect-url-parameters
      value = v.length ? URI.decodeQuery(v.join('='), escapeQuerySpace) : null;

      if (hasOwn.call(items, name)) {
        if (typeof items[name] === 'string' || items[name] === null) {
          items[name] = [items[name]];
        }

        items[name].push(value);
      } else {
        items[name] = value;
      }
    }

    return items;
  };

  URI.build = function(parts) {
    var t = '';

    if (parts.protocol) {
      t += parts.protocol + ':';
    }

    if (!parts.urn && (t || parts.hostname)) {
      t += '//';
    }

    t += (URI.buildAuthority(parts) || '');

    if (typeof parts.path === 'string') {
      if (parts.path.charAt(0) !== '/' && typeof parts.hostname === 'string') {
        t += '/';
      }

      t += parts.path;
    }

    if (typeof parts.query === 'string' && parts.query) {
      t += '?' + parts.query;
    }

    if (typeof parts.fragment === 'string' && parts.fragment) {
      t += '#' + parts.fragment;
    }
    return t;
  };
  URI.buildHost = function(parts) {
    var t = '';

    if (!parts.hostname) {
      return '';
    } else if (URI.ip6_expression.test(parts.hostname)) {
      t += '[' + parts.hostname + ']';
    } else {
      t += parts.hostname;
    }

    if (parts.port) {
      t += ':' + parts.port;
    }

    return t;
  };
  URI.buildAuthority = function(parts) {
    return URI.buildUserinfo(parts) + URI.buildHost(parts);
  };
  URI.buildUserinfo = function(parts) {
    var t = '';

    if (parts.username) {
      t += URI.encode(parts.username);
    }

    if (parts.password) {
      t += ':' + URI.encode(parts.password);
    }

    if (t) {
      t += '@';
    }

    return t;
  };
  URI.buildQuery = function(data, duplicateQueryParameters, escapeQuerySpace) {
    // according to http://tools.ietf.org/html/rfc3986 or http://labs.apache.org/webarch/uri/rfc/rfc3986.html
    // being »-._~!$&'()*+,;=:@/?« %HEX and alnum are allowed
    // the RFC explicitly states ?/foo being a valid use case, no mention of parameter syntax!
    // URI.js treats the query string as being application/x-www-form-urlencoded
    // see http://www.w3.org/TR/REC-html40/interact/forms.html#form-content-type

    var t = '';
    var unique, key, i, length;
    for (key in data) {
      if (hasOwn.call(data, key) && key) {
        if (isArray(data[key])) {
          unique = {};
          for (i = 0, length = data[key].length; i < length; i++) {
            if (data[key][i] !== undefined && unique[data[key][i] + ''] === undefined) {
              t += '&' + URI.buildQueryParameter(key, data[key][i], escapeQuerySpace);
              if (duplicateQueryParameters !== true) {
                unique[data[key][i] + ''] = true;
              }
            }
          }
        } else if (data[key] !== undefined) {
          t += '&' + URI.buildQueryParameter(key, data[key], escapeQuerySpace);
        }
      }
    }

    return t.substring(1);
  };
  URI.buildQueryParameter = function(name, value, escapeQuerySpace) {
    // http://www.w3.org/TR/REC-html40/interact/forms.html#form-content-type -- application/x-www-form-urlencoded
    // don't append "=" for null values, according to http://dvcs.w3.org/hg/url/raw-file/tip/Overview.html#url-parameter-serialization
    return URI.encodeQuery(name, escapeQuerySpace) + (value !== null ? '=' + URI.encodeQuery(value, escapeQuerySpace) : '');
  };

  URI.addQuery = function(data, name, value) {
    if (typeof name === 'object') {
      for (var key in name) {
        if (hasOwn.call(name, key)) {
          URI.addQuery(data, key, name[key]);
        }
      }
    } else if (typeof name === 'string') {
      if (data[name] === undefined) {
        data[name] = value;
        return;
      } else if (typeof data[name] === 'string') {
        data[name] = [data[name]];
      }

      if (!isArray(value)) {
        value = [value];
      }

      data[name] = (data[name] || []).concat(value);
    } else {
      throw new TypeError('URI.addQuery() accepts an object, string as the name parameter');
    }
  };
  URI.removeQuery = function(data, name, value) {
    var i, length, key;

    if (isArray(name)) {
      for (i = 0, length = name.length; i < length; i++) {
        data[name[i]] = undefined;
      }
    } else if (getType(name) === 'RegExp') {
      for (key in data) {
        if (name.test(key)) {
          data[key] = undefined;
        }
      }
    } else if (typeof name === 'object') {
      for (key in name) {
        if (hasOwn.call(name, key)) {
          URI.removeQuery(data, key, name[key]);
        }
      }
    } else if (typeof name === 'string') {
      if (value !== undefined) {
        if (getType(value) === 'RegExp') {
          if (!isArray(data[name]) && value.test(data[name])) {
            data[name] = undefined;
          } else {
            data[name] = filterArrayValues(data[name], value);
          }
        } else if (data[name] === String(value) && (!isArray(value) || value.length === 1)) {
          data[name] = undefined;
        } else if (isArray(data[name])) {
          data[name] = filterArrayValues(data[name], value);
        }
      } else {
        data[name] = undefined;
      }
    } else {
      throw new TypeError('URI.removeQuery() accepts an object, string, RegExp as the first parameter');
    }
  };
  URI.hasQuery = function(data, name, value, withinArray) {
    switch (getType(name)) {
      case 'String':
        // Nothing to do here
        break;

      case 'RegExp':
        for (var key in data) {
          if (hasOwn.call(data, key)) {
            if (name.test(key) && (value === undefined || URI.hasQuery(data, key, value))) {
              return true;
            }
          }
        }

        return false;

      case 'Object':
        for (var _key in name) {
          if (hasOwn.call(name, _key)) {
            if (!URI.hasQuery(data, _key, name[_key])) {
              return false;
            }
          }
        }

        return true;

      default:
        throw new TypeError('URI.hasQuery() accepts a string, regular expression or object as the name parameter');
    }

    switch (getType(value)) {
      case 'Undefined':
        // true if exists (but may be empty)
        return name in data; // data[name] !== undefined;

      case 'Boolean':
        // true if exists and non-empty
        var _booly = Boolean(isArray(data[name]) ? data[name].length : data[name]);
        return value === _booly;

      case 'Function':
        // allow complex comparison
        return !!value(data[name], name, data);

      case 'Array':
        if (!isArray(data[name])) {
          return false;
        }

        var op = withinArray ? arrayContains : arraysEqual;
        return op(data[name], value);

      case 'RegExp':
        if (!isArray(data[name])) {
          return Boolean(data[name] && data[name].match(value));
        }

        if (!withinArray) {
          return false;
        }

        return arrayContains(data[name], value);

      case 'Number':
        value = String(value);
        /* falls through */
      case 'String':
        if (!isArray(data[name])) {
          return data[name] === value;
        }

        if (!withinArray) {
          return false;
        }

        return arrayContains(data[name], value);

      default:
        throw new TypeError('URI.hasQuery() accepts undefined, boolean, string, number, RegExp, Function as the value parameter');
    }
  };


  URI.joinPaths = function() {
    var input = [];
    var segments = [];
    var nonEmptySegments = 0;

    for (var i = 0; i < arguments.length; i++) {
      var url = new URI(arguments[i]);
      input.push(url);
      var _segments = url.segment();
      for (var s = 0; s < _segments.length; s++) {
        if (typeof _segments[s] === 'string') {
          segments.push(_segments[s]);
        }

        if (_segments[s]) {
          nonEmptySegments++;
        }
      }
    }

    if (!segments.length || !nonEmptySegments) {
      return new URI('');
    }

    var uri = new URI('').segment(segments);

    if (input[0].path() === '' || input[0].path().slice(0, 1) === '/') {
      uri.path('/' + uri.path());
    }

    return uri.normalize();
  };

  URI.commonPath = function(one, two) {
    var length = Math.min(one.length, two.length);
    var pos;

    // find first non-matching character
    for (pos = 0; pos < length; pos++) {
      if (one.charAt(pos) !== two.charAt(pos)) {
        pos--;
        break;
      }
    }

    if (pos < 1) {
      return one.charAt(0) === two.charAt(0) && one.charAt(0) === '/' ? '/' : '';
    }

    // revert to last /
    if (one.charAt(pos) !== '/' || two.charAt(pos) !== '/') {
      pos = one.substring(0, pos).lastIndexOf('/');
    }

    return one.substring(0, pos + 1);
  };

  URI.withinString = function(string, callback, options) {
    options || (options = {});
    var _start = options.start || URI.findUri.start;
    var _end = options.end || URI.findUri.end;
    var _trim = options.trim || URI.findUri.trim;
    var _attributeOpen = /[a-z0-9-]=["']?$/i;

    _start.lastIndex = 0;
    while (true) {
      var match = _start.exec(string);
      if (!match) {
        break;
      }

      var start = match.index;
      if (options.ignoreHtml) {
        // attribut(e=["']?$)
        var attributeOpen = string.slice(Math.max(start - 3, 0), start);
        if (attributeOpen && _attributeOpen.test(attributeOpen)) {
          continue;
        }
      }

      var end = start + string.slice(start).search(_end);
      var slice = string.slice(start, end).replace(_trim, '');
      if (options.ignore && options.ignore.test(slice)) {
        continue;
      }

      end = start + slice.length;
      var result = callback(slice, start, end, string);
      string = string.slice(0, start) + result + string.slice(end);
      _start.lastIndex = start + result.length;
    }

    _start.lastIndex = 0;
    return string;
  };

  URI.ensureValidHostname = function(v) {
    // Theoretically URIs allow percent-encoding in Hostnames (according to RFC 3986)
    // they are not part of DNS and therefore ignored by URI.js

    if (v.match(URI.invalid_hostname_characters)) {
      // test punycode
      if (!punycode) {
        throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-] and Punycode.js is not available');
      }

      if (punycode.toASCII(v).match(URI.invalid_hostname_characters)) {
        throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-]');
      }
    }
  };

  // noConflict
  URI.noConflict = function(removeAll) {
    if (removeAll) {
      var unconflicted = {
        URI: this.noConflict()
      };

      if (root.URITemplate && typeof root.URITemplate.noConflict === 'function') {
        unconflicted.URITemplate = root.URITemplate.noConflict();
      }

      if (root.IPv6 && typeof root.IPv6.noConflict === 'function') {
        unconflicted.IPv6 = root.IPv6.noConflict();
      }

      if (root.SecondLevelDomains && typeof root.SecondLevelDomains.noConflict === 'function') {
        unconflicted.SecondLevelDomains = root.SecondLevelDomains.noConflict();
      }

      return unconflicted;
    } else if (root.URI === this) {
      root.URI = _URI;
    }

    return this;
  };

  p.build = function(deferBuild) {
    if (deferBuild === true) {
      this._deferred_build = true;
    } else if (deferBuild === undefined || this._deferred_build) {
      this._string = URI.build(this._parts);
      this._deferred_build = false;
    }

    return this;
  };

  p.clone = function() {
    return new URI(this);
  };

  p.valueOf = p.toString = function() {
    return this.build(false)._string;
  };


  function generateSimpleAccessor(_part){
    return function(v, build) {
      if (v === undefined) {
        return this._parts[_part] || '';
      } else {
        this._parts[_part] = v || null;
        this.build(!build);
        return this;
      }
    };
  }

  function generatePrefixAccessor(_part, _key){
    return function(v, build) {
      if (v === undefined) {
        return this._parts[_part] || '';
      } else {
        if (v !== null) {
          v = v + '';
          if (v.charAt(0) === _key) {
            v = v.substring(1);
          }
        }

        this._parts[_part] = v;
        this.build(!build);
        return this;
      }
    };
  }

  p.protocol = generateSimpleAccessor('protocol');
  p.username = generateSimpleAccessor('username');
  p.password = generateSimpleAccessor('password');
  p.hostname = generateSimpleAccessor('hostname');
  p.port = generateSimpleAccessor('port');
  p.query = generatePrefixAccessor('query', '?');
  p.fragment = generatePrefixAccessor('fragment', '#');

  p.search = function(v, build) {
    var t = this.query(v, build);
    return typeof t === 'string' && t.length ? ('?' + t) : t;
  };
  p.hash = function(v, build) {
    var t = this.fragment(v, build);
    return typeof t === 'string' && t.length ? ('#' + t) : t;
  };

  p.pathname = function(v, build) {
    if (v === undefined || v === true) {
      var res = this._parts.path || (this._parts.hostname ? '/' : '');
      return v ? (this._parts.urn ? URI.decodeUrnPath : URI.decodePath)(res) : res;
    } else {
      if (this._parts.urn) {
        this._parts.path = v ? URI.recodeUrnPath(v) : '';
      } else {
        this._parts.path = v ? URI.recodePath(v) : '/';
      }
      this.build(!build);
      return this;
    }
  };
  p.path = p.pathname;
  p.href = function(href, build) {
    var key;

    if (href === undefined) {
      return this.toString();
    }

    this._string = '';
    this._parts = URI._parts();

    var _URI = href instanceof URI;
    var _object = typeof href === 'object' && (href.hostname || href.path || href.pathname);
    if (href.nodeName) {
      var attribute = URI.getDomAttribute(href);
      href = href[attribute] || '';
      _object = false;
    }

    // window.location is reported to be an object, but it's not the sort
    // of object we're looking for:
    // * location.protocol ends with a colon
    // * location.query != object.search
    // * location.hash != object.fragment
    // simply serializing the unknown object should do the trick
    // (for location, not for everything...)
    if (!_URI && _object && href.pathname !== undefined) {
      href = href.toString();
    }

    if (typeof href === 'string' || href instanceof String) {
      this._parts = URI.parse(String(href), this._parts);
    } else if (_URI || _object) {
      var src = _URI ? href._parts : href;
      for (key in src) {
        if (hasOwn.call(this._parts, key)) {
          this._parts[key] = src[key];
        }
      }
    } else {
      throw new TypeError('invalid input');
    }

    this.build(!build);
    return this;
  };

  // identification accessors
  p.is = function(what) {
    var ip = false;
    var ip4 = false;
    var ip6 = false;
    var name = false;
    var sld = false;
    var idn = false;
    var punycode = false;
    var relative = !this._parts.urn;

    if (this._parts.hostname) {
      relative = false;
      ip4 = URI.ip4_expression.test(this._parts.hostname);
      ip6 = URI.ip6_expression.test(this._parts.hostname);
      ip = ip4 || ip6;
      name = !ip;
      sld = name && SLD && SLD.has(this._parts.hostname);
      idn = name && URI.idn_expression.test(this._parts.hostname);
      punycode = name && URI.punycode_expression.test(this._parts.hostname);
    }

    switch (what.toLowerCase()) {
      case 'relative':
        return relative;

      case 'absolute':
        return !relative;

      // hostname identification
      case 'domain':
      case 'name':
        return name;

      case 'sld':
        return sld;

      case 'ip':
        return ip;

      case 'ip4':
      case 'ipv4':
      case 'inet4':
        return ip4;

      case 'ip6':
      case 'ipv6':
      case 'inet6':
        return ip6;

      case 'idn':
        return idn;

      case 'url':
        return !this._parts.urn;

      case 'urn':
        return !!this._parts.urn;

      case 'punycode':
        return punycode;
    }

    return null;
  };

  // component specific input validation
  var _protocol = p.protocol;
  var _port = p.port;
  var _hostname = p.hostname;

  p.protocol = function(v, build) {
    if (v !== undefined) {
      if (v) {
        // accept trailing ://
        v = v.replace(/:(\/\/)?$/, '');

        if (!v.match(URI.protocol_expression)) {
          throw new TypeError('Protocol "' + v + '" contains characters other than [A-Z0-9.+-] or doesn\'t start with [A-Z]');
        }
      }
    }
    return _protocol.call(this, v, build);
  };
  p.scheme = p.protocol;
  p.port = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v !== undefined) {
      if (v === 0) {
        v = null;
      }

      if (v) {
        v += '';
        if (v.charAt(0) === ':') {
          v = v.substring(1);
        }

        if (v.match(/[^0-9]/)) {
          throw new TypeError('Port "' + v + '" contains characters other than [0-9]');
        }
      }
    }
    return _port.call(this, v, build);
  };
  p.hostname = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v !== undefined) {
      var x = {};
      var res = URI.parseHost(v, x);
      if (res !== '/') {
        throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-]');
      }

      v = x.hostname;
    }
    return _hostname.call(this, v, build);
  };

  // compound accessors
  p.origin = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v === undefined) {
      var protocol = this.protocol();
      var authority = this.authority();
      if (!authority) {
        return '';
      }

      return (protocol ? protocol + '://' : '') + this.authority();
    } else {
      var origin = URI(v);
      this
        .protocol(origin.protocol())
        .authority(origin.authority())
        .build(!build);
      return this;
    }
  };
  p.host = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v === undefined) {
      return this._parts.hostname ? URI.buildHost(this._parts) : '';
    } else {
      var res = URI.parseHost(v, this._parts);
      if (res !== '/') {
        throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-]');
      }

      this.build(!build);
      return this;
    }
  };
  p.authority = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v === undefined) {
      return this._parts.hostname ? URI.buildAuthority(this._parts) : '';
    } else {
      var res = URI.parseAuthority(v, this._parts);
      if (res !== '/') {
        throw new TypeError('Hostname "' + v + '" contains characters other than [A-Z0-9.-]');
      }

      this.build(!build);
      return this;
    }
  };
  p.userinfo = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v === undefined) {
      var t = URI.buildUserinfo(this._parts);
      return t ? t.substring(0, t.length -1) : t;
    } else {
      if (v[v.length-1] !== '@') {
        v += '@';
      }

      URI.parseUserinfo(v, this._parts);
      this.build(!build);
      return this;
    }
  };
  p.resource = function(v, build) {
    var parts;

    if (v === undefined) {
      return this.path() + this.search() + this.hash();
    }

    parts = URI.parse(v);
    this._parts.path = parts.path;
    this._parts.query = parts.query;
    this._parts.fragment = parts.fragment;
    this.build(!build);
    return this;
  };

  // fraction accessors
  p.subdomain = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    // convenience, return "www" from "www.example.org"
    if (v === undefined) {
      if (!this._parts.hostname || this.is('IP')) {
        return '';
      }

      // grab domain and add another segment
      var end = this._parts.hostname.length - this.domain().length - 1;
      return this._parts.hostname.substring(0, end) || '';
    } else {
      var e = this._parts.hostname.length - this.domain().length;
      var sub = this._parts.hostname.substring(0, e);
      var replace = new RegExp('^' + escapeRegEx(sub));

      if (v && v.charAt(v.length - 1) !== '.') {
        v += '.';
      }

      if (v) {
        URI.ensureValidHostname(v);
      }

      this._parts.hostname = this._parts.hostname.replace(replace, v);
      this.build(!build);
      return this;
    }
  };
  p.domain = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (typeof v === 'boolean') {
      build = v;
      v = undefined;
    }

    // convenience, return "example.org" from "www.example.org"
    if (v === undefined) {
      if (!this._parts.hostname || this.is('IP')) {
        return '';
      }

      // if hostname consists of 1 or 2 segments, it must be the domain
      var t = this._parts.hostname.match(/\./g);
      if (t && t.length < 2) {
        return this._parts.hostname;
      }

      // grab tld and add another segment
      var end = this._parts.hostname.length - this.tld(build).length - 1;
      end = this._parts.hostname.lastIndexOf('.', end -1) + 1;
      return this._parts.hostname.substring(end) || '';
    } else {
      if (!v) {
        throw new TypeError('cannot set domain empty');
      }

      URI.ensureValidHostname(v);

      if (!this._parts.hostname || this.is('IP')) {
        this._parts.hostname = v;
      } else {
        var replace = new RegExp(escapeRegEx(this.domain()) + '$');
        this._parts.hostname = this._parts.hostname.replace(replace, v);
      }

      this.build(!build);
      return this;
    }
  };
  p.tld = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (typeof v === 'boolean') {
      build = v;
      v = undefined;
    }

    // return "org" from "www.example.org"
    if (v === undefined) {
      if (!this._parts.hostname || this.is('IP')) {
        return '';
      }

      var pos = this._parts.hostname.lastIndexOf('.');
      var tld = this._parts.hostname.substring(pos + 1);

      if (build !== true && SLD && SLD.list[tld.toLowerCase()]) {
        return SLD.get(this._parts.hostname) || tld;
      }

      return tld;
    } else {
      var replace;

      if (!v) {
        throw new TypeError('cannot set TLD empty');
      } else if (v.match(/[^a-zA-Z0-9-]/)) {
        if (SLD && SLD.is(v)) {
          replace = new RegExp(escapeRegEx(this.tld()) + '$');
          this._parts.hostname = this._parts.hostname.replace(replace, v);
        } else {
          throw new TypeError('TLD "' + v + '" contains characters other than [A-Z0-9]');
        }
      } else if (!this._parts.hostname || this.is('IP')) {
        throw new ReferenceError('cannot set TLD on non-domain host');
      } else {
        replace = new RegExp(escapeRegEx(this.tld()) + '$');
        this._parts.hostname = this._parts.hostname.replace(replace, v);
      }

      this.build(!build);
      return this;
    }
  };
  p.directory = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v === undefined || v === true) {
      if (!this._parts.path && !this._parts.hostname) {
        return '';
      }

      if (this._parts.path === '/') {
        return '/';
      }

      var end = this._parts.path.length - this.filename().length - 1;
      var res = this._parts.path.substring(0, end) || (this._parts.hostname ? '/' : '');

      return v ? URI.decodePath(res) : res;

    } else {
      var e = this._parts.path.length - this.filename().length;
      var directory = this._parts.path.substring(0, e);
      var replace = new RegExp('^' + escapeRegEx(directory));

      // fully qualifier directories begin with a slash
      if (!this.is('relative')) {
        if (!v) {
          v = '/';
        }

        if (v.charAt(0) !== '/') {
          v = '/' + v;
        }
      }

      // directories always end with a slash
      if (v && v.charAt(v.length - 1) !== '/') {
        v += '/';
      }

      v = URI.recodePath(v);
      this._parts.path = this._parts.path.replace(replace, v);
      this.build(!build);
      return this;
    }
  };
  p.filename = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v === undefined || v === true) {
      if (!this._parts.path || this._parts.path === '/') {
        return '';
      }

      var pos = this._parts.path.lastIndexOf('/');
      var res = this._parts.path.substring(pos+1);

      return v ? URI.decodePathSegment(res) : res;
    } else {
      var mutatedDirectory = false;

      if (v.charAt(0) === '/') {
        v = v.substring(1);
      }

      if (v.match(/\.?\//)) {
        mutatedDirectory = true;
      }

      var replace = new RegExp(escapeRegEx(this.filename()) + '$');
      v = URI.recodePath(v);
      this._parts.path = this._parts.path.replace(replace, v);

      if (mutatedDirectory) {
        this.normalizePath(build);
      } else {
        this.build(!build);
      }

      return this;
    }
  };
  p.suffix = function(v, build) {
    if (this._parts.urn) {
      return v === undefined ? '' : this;
    }

    if (v === undefined || v === true) {
      if (!this._parts.path || this._parts.path === '/') {
        return '';
      }

      var filename = this.filename();
      var pos = filename.lastIndexOf('.');
      var s, res;

      if (pos === -1) {
        return '';
      }

      // suffix may only contain alnum characters (yup, I made this up.)
      s = filename.substring(pos+1);
      res = (/^[a-z0-9%]+$/i).test(s) ? s : '';
      return v ? URI.decodePathSegment(res) : res;
    } else {
      if (v.charAt(0) === '.') {
        v = v.substring(1);
      }

      var suffix = this.suffix();
      var replace;

      if (!suffix) {
        if (!v) {
          return this;
        }

        this._parts.path += '.' + URI.recodePath(v);
      } else if (!v) {
        replace = new RegExp(escapeRegEx('.' + suffix) + '$');
      } else {
        replace = new RegExp(escapeRegEx(suffix) + '$');
      }

      if (replace) {
        v = URI.recodePath(v);
        this._parts.path = this._parts.path.replace(replace, v);
      }

      this.build(!build);
      return this;
    }
  };
  p.segment = function(segment, v, build) {
    var separator = this._parts.urn ? ':' : '/';
    var path = this.path();
    var absolute = path.substring(0, 1) === '/';
    var segments = path.split(separator);

    if (segment !== undefined && typeof segment !== 'number') {
      build = v;
      v = segment;
      segment = undefined;
    }

    if (segment !== undefined && typeof segment !== 'number') {
      throw new Error('Bad segment "' + segment + '", must be 0-based integer');
    }

    if (absolute) {
      segments.shift();
    }

    if (segment < 0) {
      // allow negative indexes to address from the end
      segment = Math.max(segments.length + segment, 0);
    }

    if (v === undefined) {
      /*jshint laxbreak: true */
      return segment === undefined
        ? segments
        : segments[segment];
      /*jshint laxbreak: false */
    } else if (segment === null || segments[segment] === undefined) {
      if (isArray(v)) {
        segments = [];
        // collapse empty elements within array
        for (var i=0, l=v.length; i < l; i++) {
          if (!v[i].length && (!segments.length || !segments[segments.length -1].length)) {
            continue;
          }

          if (segments.length && !segments[segments.length -1].length) {
            segments.pop();
          }

          segments.push(trimSlashes(v[i]));
        }
      } else if (v || typeof v === 'string') {
        v = trimSlashes(v);
        if (segments[segments.length -1] === '') {
          // empty trailing elements have to be overwritten
          // to prevent results such as /foo//bar
          segments[segments.length -1] = v;
        } else {
          segments.push(v);
        }
      }
    } else {
      if (v) {
        segments[segment] = trimSlashes(v);
      } else {
        segments.splice(segment, 1);
      }
    }

    if (absolute) {
      segments.unshift('');
    }

    return this.path(segments.join(separator), build);
  };
  p.segmentCoded = function(segment, v, build) {
    var segments, i, l;

    if (typeof segment !== 'number') {
      build = v;
      v = segment;
      segment = undefined;
    }

    if (v === undefined) {
      segments = this.segment(segment, v, build);
      if (!isArray(segments)) {
        segments = segments !== undefined ? URI.decode(segments) : undefined;
      } else {
        for (i = 0, l = segments.length; i < l; i++) {
          segments[i] = URI.decode(segments[i]);
        }
      }

      return segments;
    }

    if (!isArray(v)) {
      v = (typeof v === 'string' || v instanceof String) ? URI.encode(v) : v;
    } else {
      for (i = 0, l = v.length; i < l; i++) {
        v[i] = URI.encode(v[i]);
      }
    }

    return this.segment(segment, v, build);
  };

  // mutating query string
  var q = p.query;
  p.query = function(v, build) {
    if (v === true) {
      return URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
    } else if (typeof v === 'function') {
      var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
      var result = v.call(this, data);
      this._parts.query = URI.buildQuery(result || data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
      this.build(!build);
      return this;
    } else if (v !== undefined && typeof v !== 'string') {
      this._parts.query = URI.buildQuery(v, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
      this.build(!build);
      return this;
    } else {
      return q.call(this, v, build);
    }
  };
  p.setQuery = function(name, value, build) {
    var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);

    if (typeof name === 'string' || name instanceof String) {
      data[name] = value !== undefined ? value : null;
    } else if (typeof name === 'object') {
      for (var key in name) {
        if (hasOwn.call(name, key)) {
          data[key] = name[key];
        }
      }
    } else {
      throw new TypeError('URI.addQuery() accepts an object, string as the name parameter');
    }

    this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
    if (typeof name !== 'string') {
      build = value;
    }

    this.build(!build);
    return this;
  };
  p.addQuery = function(name, value, build) {
    var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
    URI.addQuery(data, name, value === undefined ? null : value);
    this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
    if (typeof name !== 'string') {
      build = value;
    }

    this.build(!build);
    return this;
  };
  p.removeQuery = function(name, value, build) {
    var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
    URI.removeQuery(data, name, value);
    this._parts.query = URI.buildQuery(data, this._parts.duplicateQueryParameters, this._parts.escapeQuerySpace);
    if (typeof name !== 'string') {
      build = value;
    }

    this.build(!build);
    return this;
  };
  p.hasQuery = function(name, value, withinArray) {
    var data = URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace);
    return URI.hasQuery(data, name, value, withinArray);
  };
  p.setSearch = p.setQuery;
  p.addSearch = p.addQuery;
  p.removeSearch = p.removeQuery;
  p.hasSearch = p.hasQuery;

  // sanitizing URLs
  p.normalize = function() {
    if (this._parts.urn) {
      return this
        .normalizeProtocol(false)
        .normalizePath(false)
        .normalizeQuery(false)
        .normalizeFragment(false)
        .build();
    }

    return this
      .normalizeProtocol(false)
      .normalizeHostname(false)
      .normalizePort(false)
      .normalizePath(false)
      .normalizeQuery(false)
      .normalizeFragment(false)
      .build();
  };
  p.normalizeProtocol = function(build) {
    if (typeof this._parts.protocol === 'string') {
      this._parts.protocol = this._parts.protocol.toLowerCase();
      this.build(!build);
    }

    return this;
  };
  p.normalizeHostname = function(build) {
    if (this._parts.hostname) {
      if (this.is('IDN') && punycode) {
        this._parts.hostname = punycode.toASCII(this._parts.hostname);
      } else if (this.is('IPv6') && IPv6) {
        this._parts.hostname = IPv6.best(this._parts.hostname);
      }

      this._parts.hostname = this._parts.hostname.toLowerCase();
      this.build(!build);
    }

    return this;
  };
  p.normalizePort = function(build) {
    // remove port of it's the protocol's default
    if (typeof this._parts.protocol === 'string' && this._parts.port === URI.defaultPorts[this._parts.protocol]) {
      this._parts.port = null;
      this.build(!build);
    }

    return this;
  };
  p.normalizePath = function(build) {
    var _path = this._parts.path;
    if (!_path) {
      return this;
    }

    if (this._parts.urn) {
      this._parts.path = URI.recodeUrnPath(this._parts.path);
      this.build(!build);
      return this;
    }

    if (this._parts.path === '/') {
      return this;
    }

    _path = URI.recodePath(_path);

    var _was_relative;
    var _leadingParents = '';
    var _parent, _pos;

    // handle relative paths
    if (_path.charAt(0) !== '/') {
      _was_relative = true;
      _path = '/' + _path;
    }

    // handle relative files (as opposed to directories)
    if (_path.slice(-3) === '/..' || _path.slice(-2) === '/.') {
      _path += '/';
    }

    // resolve simples
    _path = _path
      .replace(/(\/(\.\/)+)|(\/\.$)/g, '/')
      .replace(/\/{2,}/g, '/');

    // remember leading parents
    if (_was_relative) {
      _leadingParents = _path.substring(1).match(/^(\.\.\/)+/) || '';
      if (_leadingParents) {
        _leadingParents = _leadingParents[0];
      }
    }

    // resolve parents
    while (true) {
      _parent = _path.search(/\/\.\.(\/|$)/);
      if (_parent === -1) {
        // no more ../ to resolve
        break;
      } else if (_parent === 0) {
        // top level cannot be relative, skip it
        _path = _path.substring(3);
        continue;
      }

      _pos = _path.substring(0, _parent).lastIndexOf('/');
      if (_pos === -1) {
        _pos = _parent;
      }
      _path = _path.substring(0, _pos) + _path.substring(_parent + 3);
    }

    // revert to relative
    if (_was_relative && this.is('relative')) {
      _path = _leadingParents + _path.substring(1);
    }

    this._parts.path = _path;
    this.build(!build);
    return this;
  };
  p.normalizePathname = p.normalizePath;
  p.normalizeQuery = function(build) {
    if (typeof this._parts.query === 'string') {
      if (!this._parts.query.length) {
        this._parts.query = null;
      } else {
        this.query(URI.parseQuery(this._parts.query, this._parts.escapeQuerySpace));
      }

      this.build(!build);
    }

    return this;
  };
  p.normalizeFragment = function(build) {
    if (!this._parts.fragment) {
      this._parts.fragment = null;
      this.build(!build);
    }

    return this;
  };
  p.normalizeSearch = p.normalizeQuery;
  p.normalizeHash = p.normalizeFragment;

  p.iso8859 = function() {
    // expect unicode input, iso8859 output
    var e = URI.encode;
    var d = URI.decode;

    URI.encode = escape;
    URI.decode = decodeURIComponent;
    try {
      this.normalize();
    } finally {
      URI.encode = e;
      URI.decode = d;
    }
    return this;
  };

  p.unicode = function() {
    // expect iso8859 input, unicode output
    var e = URI.encode;
    var d = URI.decode;

    URI.encode = strictEncodeURIComponent;
    URI.decode = unescape;
    try {
      this.normalize();
    } finally {
      URI.encode = e;
      URI.decode = d;
    }
    return this;
  };

  p.readable = function() {
    var uri = this.clone();
    // removing username, password, because they shouldn't be displayed according to RFC 3986
    uri.username('').password('').normalize();
    var t = '';
    if (uri._parts.protocol) {
      t += uri._parts.protocol + '://';
    }

    if (uri._parts.hostname) {
      if (uri.is('punycode') && punycode) {
        t += punycode.toUnicode(uri._parts.hostname);
        if (uri._parts.port) {
          t += ':' + uri._parts.port;
        }
      } else {
        t += uri.host();
      }
    }

    if (uri._parts.hostname && uri._parts.path && uri._parts.path.charAt(0) !== '/') {
      t += '/';
    }

    t += uri.path(true);
    if (uri._parts.query) {
      var q = '';
      for (var i = 0, qp = uri._parts.query.split('&'), l = qp.length; i < l; i++) {
        var kv = (qp[i] || '').split('=');
        q += '&' + URI.decodeQuery(kv[0], this._parts.escapeQuerySpace)
          .replace(/&/g, '%26');

        if (kv[1] !== undefined) {
          q += '=' + URI.decodeQuery(kv[1], this._parts.escapeQuerySpace)
            .replace(/&/g, '%26');
        }
      }
      t += '?' + q.substring(1);
    }

    t += URI.decodeQuery(uri.hash(), true);
    return t;
  };

  // resolving relative and absolute URLs
  p.absoluteTo = function(base) {
    var resolved = this.clone();
    var properties = ['protocol', 'username', 'password', 'hostname', 'port'];
    var basedir, i, p;

    if (this._parts.urn) {
      throw new Error('URNs do not have any generally defined hierarchical components');
    }

    if (!(base instanceof URI)) {
      base = new URI(base);
    }

    if (!resolved._parts.protocol) {
      resolved._parts.protocol = base._parts.protocol;
    }

    if (this._parts.hostname) {
      return resolved;
    }

    for (i = 0; (p = properties[i]); i++) {
      resolved._parts[p] = base._parts[p];
    }

    if (!resolved._parts.path) {
      resolved._parts.path = base._parts.path;
      if (!resolved._parts.query) {
        resolved._parts.query = base._parts.query;
      }
    } else if (resolved._parts.path.substring(-2) === '..') {
      resolved._parts.path += '/';
    }

    if (resolved.path().charAt(0) !== '/') {
      basedir = base.directory();
      basedir = basedir ? basedir : base.path().indexOf('/') === 0 ? '/' : '';
      resolved._parts.path = (basedir ? (basedir + '/') : '') + resolved._parts.path;
      resolved.normalizePath();
    }

    resolved.build();
    return resolved;
  };
  p.relativeTo = function(base) {
    var relative = this.clone().normalize();
    var relativeParts, baseParts, common, relativePath, basePath;

    if (relative._parts.urn) {
      throw new Error('URNs do not have any generally defined hierarchical components');
    }

    base = new URI(base).normalize();
    relativeParts = relative._parts;
    baseParts = base._parts;
    relativePath = relative.path();
    basePath = base.path();

    if (relativePath.charAt(0) !== '/') {
      throw new Error('URI is already relative');
    }

    if (basePath.charAt(0) !== '/') {
      throw new Error('Cannot calculate a URI relative to another relative URI');
    }

    if (relativeParts.protocol === baseParts.protocol) {
      relativeParts.protocol = null;
    }

    if (relativeParts.username !== baseParts.username || relativeParts.password !== baseParts.password) {
      return relative.build();
    }

    if (relativeParts.protocol !== null || relativeParts.username !== null || relativeParts.password !== null) {
      return relative.build();
    }

    if (relativeParts.hostname === baseParts.hostname && relativeParts.port === baseParts.port) {
      relativeParts.hostname = null;
      relativeParts.port = null;
    } else {
      return relative.build();
    }

    if (relativePath === basePath) {
      relativeParts.path = '';
      return relative.build();
    }

    // determine common sub path
    common = URI.commonPath(relativePath, basePath);

    // If the paths have nothing in common, return a relative URL with the absolute path.
    if (!common) {
      return relative.build();
    }

    var parents = baseParts.path
      .substring(common.length)
      .replace(/[^\/]*$/, '')
      .replace(/.*?\//g, '../');

    relativeParts.path = (parents + relativeParts.path.substring(common.length)) || './';

    return relative.build();
  };

  // comparing URIs
  p.equals = function(uri) {
    var one = this.clone();
    var two = new URI(uri);
    var one_map = {};
    var two_map = {};
    var checked = {};
    var one_query, two_query, key;

    one.normalize();
    two.normalize();

    // exact match
    if (one.toString() === two.toString()) {
      return true;
    }

    // extract query string
    one_query = one.query();
    two_query = two.query();
    one.query('');
    two.query('');

    // definitely not equal if not even non-query parts match
    if (one.toString() !== two.toString()) {
      return false;
    }

    // query parameters have the same length, even if they're permuted
    if (one_query.length !== two_query.length) {
      return false;
    }

    one_map = URI.parseQuery(one_query, this._parts.escapeQuerySpace);
    two_map = URI.parseQuery(two_query, this._parts.escapeQuerySpace);

    for (key in one_map) {
      if (hasOwn.call(one_map, key)) {
        if (!isArray(one_map[key])) {
          if (one_map[key] !== two_map[key]) {
            return false;
          }
        } else if (!arraysEqual(one_map[key], two_map[key])) {
          return false;
        }

        checked[key] = true;
      }
    }

    for (key in two_map) {
      if (hasOwn.call(two_map, key)) {
        if (!checked[key]) {
          // two contains a parameter not present in one
          return false;
        }
      }
    }

    return true;
  };

  // state
  p.duplicateQueryParameters = function(v) {
    this._parts.duplicateQueryParameters = !!v;
    return this;
  };

  p.escapeQuerySpace = function(v) {
    this._parts.escapeQuerySpace = !!v;
    return this;
  };

  return URI;
}));

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/urijs/src/URI.js","/node_modules/urijs/src")

},{"./IPv6":49,"./SecondLevelDomains":50,"./punycode":52,"_process":48,"buffer":13}],52:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/*! https://mths.be/punycode v1.4.0 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.3.2',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/urijs/src/punycode.js","/node_modules/urijs/src")

},{"_process":48,"buffer":13}],53:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (!body) {
        this._bodyText = ''
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = input
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = (xhr.getAllResponseHeaders() || '').trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input
      } else {
        request = new Request(input, init)
      }

      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/node_modules/whatwg-fetch/fetch.js","/node_modules/whatwg-fetch")

},{"_process":48,"buffer":13}]},{},[11])


//# sourceMappingURL=portal.js.map
