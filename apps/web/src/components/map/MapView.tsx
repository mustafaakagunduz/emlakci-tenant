import { useCallback, useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { KONYA_CENTER, DEFAULT_ZOOM, TILE_URL, TILE_ATTRIBUTION } from '../../lib/mapConstants';
import { statusTone } from '../../features/properties/format';
import type { PropertyMarker } from '../../features/properties/types';

// Marker renkleri, liste görünümündeki status badge'leriyle aynı tonu kullanır
// (bkz. features/properties/format.ts -> statusTone) — tek kaynaktan yönetilir.
const TONE_COLOR: Record<'green' | 'gray' | 'blue' | 'red', string> = {
  green: '#16a34a',
  gray: '#9ca3af',
  blue: '#3b82f6',
  red: '#f87171',
};
const SELECTED_COLOR = '#f59e0b';

// Leaflet'in varsayılan pin görselini kullanmak yerine renk/durum ile
// ayrışan basit bir damla-ikon: rotated + rounded div, ekstra asset gerekmez.
function pinIcon(color: string, size: number) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

// Mobilde harita sekmesi başlangıçta display:none iken mount olur; Leaflet
// o an 0x0 boyut ölçer ve pixel origin'i buna göre hesaplar. Container
// görünür olduğunda yalnızca invalidateSize çağırmak marker konumlarını
// düzeltmeye yetmiyor — bounds'u da o anki gerçek boyutla yeniden fit'lemek
// gerekiyor. Bu yüzden resize (sekme değişimi, pencere resize) her olduğunda
// invalidateSize + fitBounds birlikte tetiklenir.
function MapSizeAndBounds({ markers }: { markers: PropertyMarker[] }) {
  const map = useMap();
  const idsKey = markers.map((m) => m.id).join(',');

  const fit = useCallback(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].latitude, markers[0].longitude], 15);
      return;
    }
    const bounds = L.latLngBounds(
      markers.map((m) => [m.latitude, m.longitude] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, map]);

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      fit();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map, fit]);

  useEffect(() => {
    fit();
  }, [fit]);

  return null;
}

// Mobilde seçili marker'ın özet kartı haritanın altına (tab bar'ın üstüne)
// sabitlenir; marker'ı tam ekran merkezine alırsak kartın hemen arkasında/
// altında kalıyor. Bu yüzden mobilde hedef noktayı ekranda yukarı kaydırıp
// (piksel uzayında project/unproject ile) marker'ın karta yer açacak şekilde
// merkezin üstünde kalmasını sağlıyoruz. Masaüstünde kart sol üstte olduğu
// için bu kaydırmaya gerek yok.
const MOBILE_SUMMARY_OFFSET_PX = 220;

function FlyToSelected({ marker }: { marker: PropertyMarker | null }) {
  const map = useMap();

  useEffect(() => {
    if (!marker) return;

    // Liste görünümünden harita sekmesine geçerken container aynı render
    // içinde display:none'dan görünür hale geliyor; Leaflet'in boyutu henüz
    // tazelenmemiş olabilir. flyTo'dan önce invalidateSize ile güncelliyoruz.
    map.invalidateSize();

    // Container görünür olmadan (ör. mobilde liste sekmesindeyken) map.getZoom()
    // undefined dönebilir; Math.max(undefined, 15) NaN üretip flyTo'yu
    // "Invalid LatLng" hatasıyla çökertir. Bu yüzden geçerli bir sayı değilse
    // varsayılan zoom'a düş.
    const currentZoom = map.getZoom();
    const zoom = Number.isFinite(currentZoom) ? Math.max(currentZoom, 15) : 15;
    const targetLatLng = L.latLng(marker.latitude, marker.longitude);
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      const point = map.project(targetLatLng, zoom).add([0, MOBILE_SUMMARY_OFFSET_PX / 2]);
      map.flyTo(map.unproject(point, zoom), zoom, { duration: 0.5 });
    } else {
      map.flyTo(targetLatLng, zoom, { duration: 0.5 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker?.id]);

  return null;
}

interface MapViewProps {
  markers: PropertyMarker[];
  selectedId: string | null;
  onSelectMarker: (id: string) => void;
}

export function MapView({ markers, selectedId, onSelectMarker }: MapViewProps) {
  const selectedMarker = useMemo(
    () => markers.find((m) => m.id === selectedId) ?? null,
    [markers, selectedId],
  );

  return (
    <MapContainer center={KONYA_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full">
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
      <MapSizeAndBounds markers={markers} />
      <FlyToSelected marker={selectedMarker} />
      {markers.map((marker) => {
        const selected = marker.id === selectedId;
        return (
          <Marker
            key={marker.id}
            position={[marker.latitude, marker.longitude]}
            icon={pinIcon(selected ? SELECTED_COLOR : TONE_COLOR[statusTone[marker.status]], selected ? 36 : 26)}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e.originalEvent);
                onSelectMarker(marker.id);
              },
            }}
          />
        );
      })}
    </MapContainer>
  );
}
