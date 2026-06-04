'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface LiveMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  sublabel?: string;
  heading?: number | null;
  /** Tailwind-ish hex for the marker fill. */
  color?: string;
  /** Marker style: teardrop pin (default), circular driver badge, or square vendor badge. */
  icon?: 'pin' | 'driver' | 'vendor';
  /** Show a live pulsing halo (use for active/moving drivers). */
  pulse?: boolean;
  /** Driver profile photo URL — shown inside the badge with a status ring. */
  photo?: string | null;
}

interface LiveMapProps {
  markers: LiveMarker[];
  selectedId?: string | null;
  onMarkerClick?: (id: string) => void;
  /** When true (default) the view auto-fits to show all markers. */
  autoFit?: boolean;
  height?: string | number;
  className?: string;
}

// Self-contained SVG pin so we don't depend on Leaflet's default marker images
// (which 404 under bundlers unless manually wired). A small triangle conveys
// heading when we have it.
function pinIcon(color: string, heading: number | null | undefined, selected: boolean): L.DivIcon {
  const size = selected ? 38 : 30;
  const rot = heading == null ? null : Math.round(heading);
  const arrow =
    rot != null
      ? `<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%) rotate(${rot}deg);transform-origin:50% 26px;">
           <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:9px solid ${color};"></div>
         </div>`
      : '';
  return L.divIcon({
    className: 'tr-live-pin',
    html: `<div style="position:relative;width:${size}px;height:${size}px;">
        ${arrow}
        <div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35);border:2px solid #fff;${selected ? 'outline:3px solid rgba(59,130,246,.5);outline-offset:2px;' : ''}"></div>
        <div style="position:absolute;top:${selected ? 11 : 8}px;left:50%;transform:translateX(-50%);width:${selected ? 14 : 11}px;height:${selected ? 14 : 11}px;border-radius:50%;background:#fff;"></div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Circular driver badge. With a profile photo it's a premium avatar marker
// ringed in the status colour; without one it falls back to the driver's
// initial (their name's first letter) on a coloured disc — never a stock image.
// Both have a pointer to the exact spot and an optional pulse.
function driverIcon(color: string, selected: boolean, pulse: boolean, photo?: string | null, initial?: string): L.DivIcon {
  const size = selected ? 48 : 42;
  const sel = selected ? `,0 0 0 6px rgba(59,130,246,.4)` : '';

  // Layered rings: thin white gap, then the status-colour ring, then a drop shadow.
  const ring = `border:2px solid #fff;box-shadow:0 0 0 3px ${color}${sel},0 3px 8px rgba(0,0,0,.35);`;

  // On photo-load failure we fall back to the initial, not a broken image.
  const letter = (initial || '?').slice(0, 1).toUpperCase();
  const initialHtml = `<span style="color:#fff;font-weight:700;font-size:${Math.round(size * 0.44)}px;font-family:system-ui,-apple-system,sans-serif;line-height:1;">${letter}</span>`;
  const inner = photo
    ? `<img src="${photo}" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.outerHTML='${initialHtml.replace(/'/g, "\\'")}';" />`
    : initialHtml;

  return L.divIcon({
    className: 'tr-driver-marker',
    html: `<div style="position:relative;width:${size}px;height:${size + 9}px;">
        ${pulse ? `<span class="tr-driver-pulse" style="position:absolute;top:0;left:50%;margin-left:-${size / 2}px;width:${size}px;height:${size}px;border-radius:50%;background:${color};"></span>` : ''}
        <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;background:${color};display:flex;align-items:center;justify-content:center;${ring}">
          ${inner}
        </div>
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${color};"></div>
      </div>`,
    iconSize: [size, size + 9],
    iconAnchor: [size / 2, size + 9],
    popupAnchor: [0, -(size + 9)],
  });
}

// Square vendor badge with a storefront glyph — deliberately a different shape
// (rounded square vs the drivers' circles) so the two are easy to tell apart
// on a shared map.
function vendorIcon(color: string, selected: boolean): L.DivIcon {
  const size = selected ? 44 : 38;
  const glyph = Math.round(size * 0.52);
  const sel = selected ? `,0 0 0 6px rgba(99,102,241,.35)` : '';
  return L.divIcon({
    className: 'tr-vendor-marker',
    html: `<div style="position:relative;width:${size}px;height:${size + 8}px;">
        <div style="width:${size}px;height:${size}px;border-radius:11px;background:${color};border:2px solid #fff;box-shadow:0 0 0 2px ${color}${sel},0 3px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;">
          <svg width="${glyph}" height="${glyph}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-5h6v5"/>
          </svg>
        </div>
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color};"></div>
      </div>`,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });
}

// Imperatively keeps the viewport sensible as markers come and go / move.
function ViewController({ markers, selectedId, autoFit }: { markers: LiveMarker[]; selectedId?: string | null; autoFit: boolean }) {
  const map = useMap();
  const key = markers.map((m) => `${m.id}:${m.lat.toFixed(4)},${m.lng.toFixed(4)}`).join('|');

  useEffect(() => {
    if (!markers.length) return;
    const selected = selectedId ? markers.find((m) => m.id === selectedId) : null;
    if (selected) {
      map.setView([selected.lat, selected.lng], Math.max(map.getZoom(), 14), { animate: true });
      return;
    }
    if (!autoFit) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 14, { animate: true });
    } else {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, selectedId]);

  return null;
}

export default function LiveMapInner({
  markers,
  selectedId,
  onMarkerClick,
  autoFit = true,
  height = '100%',
  className,
}: LiveMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (markers.length) return [markers[0].lat, markers[0].lng];
    return [20.5937, 78.9629]; // India centroid fallback
  }, [markers]);

  return (
    <MapContainer
      center={center}
      zoom={markers.length ? 12 : 5}
      scrollWheelZoom
      style={{ height, width: '100%' }}
      className={className}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={
            m.icon === 'driver'
              ? driverIcon(m.color || '#2563eb', m.id === selectedId, m.pulse ?? false, m.photo, (m.label || '?').trim().charAt(0))
              : m.icon === 'vendor'
              ? vendorIcon(m.color || '#6366f1', m.id === selectedId)
              : pinIcon(m.color || '#2563eb', m.heading, m.id === selectedId)
          }
          eventHandlers={onMarkerClick ? { click: () => onMarkerClick(m.id) } : undefined}
        >
          {(m.label || m.sublabel) && (
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <div style={{ fontWeight: 600 }}>{m.label}</div>
              {m.sublabel && <div style={{ fontSize: 11, color: '#555' }}>{m.sublabel}</div>}
            </Tooltip>
          )}
        </Marker>
      ))}
      <ViewController markers={markers} selectedId={selectedId} autoFit={autoFit} />
    </MapContainer>
  );
}
