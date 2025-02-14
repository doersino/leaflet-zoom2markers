/*
 * leaflet.zoom2markers
 * (c) Noah Doersing; MIT License
 * Uses fragments from the package 'leaflet.fullscreen' by Bruno B.
 */
(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		// define an AMD module that requires 'leaflet'
		// and resolve to an object containing leaflet
		define('leafletZoom2Markers', ['leaflet'], factory);
	} else if (typeof module === 'object' && module.exports) {
		// define a CommonJS module that requires 'leaflet'
		module.exports = factory(require('leaflet'));
	} else {
		// Assume 'leaflet' are loaded into global variable already
		factory(root.L);
	}
}(typeof self !== 'undefined'
	? self
	: this, (leaflet) => {
	'use strict';

	if (typeof document === 'undefined') {
		console.warn('"window.document" is undefined; leaflet.zoom2markers requires this object to access the DOM');
		return false;
	}

	leaflet.Control.Zoom2Markers = leaflet.Control.extend({
		options: {
			position: 'topleft',
			title: 'Zoom to Markers',
			maxZoom: null,  // maximum zoom level, set to 17 or 18 to avoid going in too close when there's only one marker
			forceSeparateButton: false,  // separate from +/- zoom controls?
		},

		onAdd(map) {
			let className = 'leaflet-control-zoom-zoom2markers';
			let container;
			let content = '';

			if (map.zoomControl && !this.options.forceSeparateButton) {
				container = map.zoomControl._container;
			} else {
				container = leaflet.DomUtil.create('div', 'leaflet-bar');
			}

			if (this.options.content) {
				content = this.options.content;
			} else {
				className += ' zoom2markers-icon';
			}

			this._createButton(this.options.title, className, content, container, this.doZoom2Markers, this);
			this._map.zoom2MarkersControl = this;

			return container;
		},

		onRemove() {
			leaflet.DomEvent
				.off(this.link, 'click', leaflet.DomEvent.stop)
				.off(this.link, 'click', this.doZoom2Markers, this);
		},

		// based on https://stackoverflow.com/questions/68020915/leaflet-js-zoom-map-to-visible-markers
		doZoom2Markers() {

			// collect non-excluded markers into a feature group
			const markerFeatureGroup = new leaflet.FeatureGroup();
			this._map.eachLayer(function(layer) {
				if (layer instanceof leaflet.Marker && !layer.options.zoom2MarkersExclude) {
					markerFeatureGroup.addLayer(layer);
				}
			});

			// unless empty...
			if (markerFeatureGroup.getLayers().length > 0) {

				// ...get bounds and zoom to them, passing along any extra options specified
				const bounds = markerFeatureGroup.getBounds();
				this._map.fitBounds(bounds, this.options);
			}
		},

		_createButton(title, className, content, container, fn, context) {
			this.link = leaflet.DomUtil.create('a', className, container);
			this.link.href = '#';
			this.link.title = title;
			this.link.innerHTML = content;

			this.link.setAttribute('role', 'button');
			this.link.setAttribute('aria-label', title);

			leaflet.DomEvent.disableClickPropagation(container);

			leaflet.DomEvent
				.on(this.link, 'click', leaflet.DomEvent.stop)
				.on(this.link, 'click', fn, context);

			return this.link;
		}
	});

	leaflet.Map.addInitHook(function() {
		if (this.options.zoom2MarkersControl) {
			this.addControl(leaflet.control.zoom2markers(this.options.zoom2MarkersControlOptions));
		}
	});

	leaflet.control.zoom2markers = function(options) {
		return new leaflet.Control.Zoom2Markers(options);
	};

	return { leaflet };
}));
