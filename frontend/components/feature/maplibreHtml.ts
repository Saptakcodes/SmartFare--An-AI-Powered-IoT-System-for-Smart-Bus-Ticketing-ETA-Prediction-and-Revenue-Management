import { LiveMapProps } from "./LiveMap.types";

/**
 * Returns a self-contained HTML page that renders a MapLibre GL map.
 * Loaded via CDN so both WebView (native) and iframe (web) can use it.
 */
export function buildMapHtml(props: LiveMapProps): string {
  const {
    center,
    zoom = 13,
    routeStops = [],
    buses = [],
  } = props;

  const stopsJson = JSON.stringify(routeStops);
  const busesJson = JSON.stringify(buses);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>SmartFare Live Map</title>
  <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
    body { background: #050B1E; }
    .bus-marker {
      width: 26px; height: 26px; border-radius: 13px;
      background: linear-gradient(135deg, #1E6BFF, #22D3EE);
      border: 2px solid #fff;
      box-shadow: 0 0 12px rgba(34, 211, 238, 0.7);
      cursor: pointer;
      position: relative;
    }
    .bus-marker::after {
      content: '';
      position: absolute; inset: -8px;
      border-radius: 50%;
      border: 2px solid rgba(34, 211, 238, 0.5);
      animation: pulse 2s ease-out infinite;
    }
    @keyframes pulse {
      0%   { transform: scale(1);   opacity: 0.8; }
      100% { transform: scale(2);   opacity: 0; }
    }
    .stop-marker {
      width: 12px; height: 12px; border-radius: 6px;
      background: #ffffff;
      border: 2px solid #22D3EE;
      box-shadow: 0 0 6px rgba(34, 211, 238, 0.6);
    }
    .stop-label {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      color: #fff;
      background: rgba(5, 11, 30, 0.85);
      padding: 3px 7px;
      border-radius: 6px;
      border: 1px solid rgba(120, 170, 255, 0.3);
      white-space: nowrap;
      margin-top: 3px;
    }
    .maplibregl-popup-content {
      background: #0B1736;
      color: #fff;
      border: 1px solid rgba(120, 170, 255, 0.3);
      border-radius: 12px;
      padding: 12px 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
    }
    .maplibregl-popup-close-button { color: #fff; font-size: 16px; padding: 2px 6px; }
    .maplibregl-popup-tip { border-top-color: #0B1736 !important; border-bottom-color: #0B1736 !important; }
    .maplibregl-ctrl-attrib { background: rgba(5, 11, 30, 0.7); }
    .maplibregl-ctrl-attrib a { color: #A9B8D9; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
  <script>
    (function() {
      var stops = ${stopsJson};
      var buses = ${busesJson};

      var map = new maplibregl.Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [${center.lon}, ${center.lat}],
        zoom: ${zoom},
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

      map.on('load', function() {
        // Route polyline
        if (stops.length >= 2) {
          var coords = stops
            .slice()
            .sort(function(a, b) { return a.seq - b.seq; })
            .map(function(s) { return [s.longitude, s.latitude]; });

          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: coords },
              properties: {},
            },
          });
          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#22D3EE',
              'line-width': 4,
              'line-opacity': 0.85,
            },
          });
        }

        // Stop markers
        stops.forEach(function(s) {
          var el = document.createElement('div');
          el.className = 'stop-marker';
          var label = document.createElement('div');
          label.className = 'stop-label';
          label.textContent = s.name;

          new maplibregl.Marker({ element: el, anchor: 'top' })
            .setLngLat([s.longitude, s.latitude])
            .setPopup(new maplibregl.Popup({ offset: 20 }).setHTML(
              '<strong>' + s.name + '</strong><br/><span style="color:#A9B8D9;font-size:11px">Stop ' + s.seq + ' · ' + s.stop_id + '</span>'
            ))
            .addTo(map);

          new maplibregl.Marker({ element: label, anchor: 'bottom' })
            .setLngLat([s.longitude, s.latitude])
            .addTo(map);
        });

        // Bus markers
        buses.forEach(function(b) {
          var el = document.createElement('div');
          el.className = 'bus-marker';
          el.onclick = function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'busPress', busId: b.bus_id
              }));
            } else if (window.parent !== window) {
              window.parent.postMessage({ type: 'busPress', busId: b.bus_id }, '*');
            }
          };

          new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat([b.longitude, b.latitude])
            .setPopup(new maplibregl.Popup({ offset: 16 }).setHTML(
              '<strong>Bus ' + b.bus_id.slice(-6) + '</strong><br/><span style="color:#A9B8D9;font-size:11px">' + (b.route_id || 'Active') + '</span>'
            ))
            .addTo(map);
        });

        // Fit to route
        if (stops.length >= 2) {
          var bounds = new maplibregl.LngLatBounds();
          stops.forEach(function(s) { bounds.extend([s.longitude, s.latitude]); });
          buses.forEach(function(b) { bounds.extend([b.longitude, b.latitude]); });
          map.fitBounds(bounds, { padding: 60, duration: 0 });
        }
      });
    })();
  </script>
</body>
</html>`;
}