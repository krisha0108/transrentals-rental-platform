import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

// Self-contained Leaflet map (no API key):
//   street    = OpenStreetMap tiles
//   satellite = Esri World Imagery (free, key-less)
// Markers + layer are pushed via injectJavaScript so the map never reloads.
const HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>html,body,#map{height:100%;margin:0;padding:0;background:#e8eef3}</style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([20.5937, 78.9629], 4);
    var street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
    var sat    = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
    street.addTo(map);
    var current = 'street';
    var layer = L.layerGroup().addTo(map);
    var COLORS = { moving: '#10B981', idle: '#F59E0B', offline: '#cbd5e1' };
    var firstFit = true;

    window.__setLayer = function (t) {
      if (t === current) return;
      if (t === 'satellite') { map.removeLayer(street); sat.addTo(map); }
      else { map.removeLayer(sat); street.addTo(map); }
      current = t;
    };

    window.__setMarkers = function (list) {
      try {
        layer.clearLayers();
        var pts = [];
        (list || []).forEach(function (d) {
          if (d.lat == null || d.lng == null) return;
          var color = COLORS[d.status] || '#cbd5e1';
          var initial = (d.name || 'D').trim().charAt(0).toUpperCase() || 'D';
          // Avatar marker: profile photo if present, else the name's first letter.
          // url() is unquoted on purpose (avoids quote-escaping inside this string).
          var bg = d.photo
            ? 'background-color:' + color + ';background-image:url(' + d.photo + ');background-size:cover;background-position:center;'
            : 'background-color:' + color + ';';
          var letter = d.photo ? '' : initial;
          var html =
            '<div style="position:relative;width:38px;height:38px">' +
              '<div style="width:38px;height:38px;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.4);overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;font-family:-apple-system,Roboto,sans-serif;' + bg + '">' + letter + '</div>' +
              '<div style="position:absolute;bottom:0;right:0;width:12px;height:12px;border-radius:50%;background:' + color + ';border:2px solid #fff"></div>' +
            '</div>';
          var icon = L.divIcon({ className: '', html: html, iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -19] });
          var m = L.marker([d.lat, d.lng], { icon: icon }).addTo(layer);
          if (d.label) m.bindPopup(d.label);
          pts.push([d.lat, d.lng]);
        });
        if (pts.length === 1) { map.setView(pts[0], 14); }
        else if (pts.length > 1 && firstFit) { map.fitBounds(pts, { padding: [40, 40] }); }
        if (pts.length > 0) firstFit = false;
        setTimeout(function () { map.invalidateSize(); }, 80);
      } catch (e) {}
    };

    window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ready');
  </script>
</body>
</html>`;

export default function LiveMap({ markers = [], satellite = false, style }) {
  const ref = useRef(null);
  const ready = useRef(false);

  const push = useCallback(() => {
    if (!ready.current || !ref.current) return;
    ref.current.injectJavaScript(
      `window.__setLayer('${satellite ? 'satellite' : 'street'}'); window.__setMarkers(${JSON.stringify(markers)}); true;`
    );
  }, [markers, satellite]);

  useEffect(() => { push(); }, [push]);

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={{ html: HTML }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onMessage={() => { ready.current = true; push(); }}
        startInLoadingState
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: '#e8eef3' },
  web:  { flex: 1, backgroundColor: 'transparent' },
});
