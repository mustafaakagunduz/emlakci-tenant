import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type L from 'leaflet';
import { defaultIcon } from '../../lib/leafletIcons';
import { KONYA_CENTER, DEFAULT_ZOOM, TILE_URL, TILE_ATTRIBUTION } from '../../lib/mapConstants';

interface FlyTarget {
  lat: number;
  lng: number;
  zoom: number;
}

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number) => void;
  flyTo?: FlyTarget | null;
  isLocating?: boolean;
  locatingLabel?: string;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnValue({ latitude, longitude }: { latitude?: number; longitude?: number }) {
  const map = useMap();
  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      map.setView([latitude, longitude], map.getZoom());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// İl/ilçe seçiminden gelen "haritayı uçur" komutunu uygular. Pini TAŞIMAZ —
// yalnızca kullanıcının haritada tıklayıp/sürükleyip pin koyması pini belirler.
function FlyToController({ target }: { target?: FlyTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], target.zoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return null;
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  flyTo,
  isLocating,
  locatingLabel,
}: LocationPickerProps) {
  const hasPosition = latitude !== undefined && longitude !== undefined;
  const center = useMemo<[number, number]>(
    () => (hasPosition ? [latitude!, longitude!] : KONYA_CENTER),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-md border border-gray-300 sm:aspect-[3/2] sm:h-auto">
      {isLocating && (
        <div className="absolute top-2 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow">
          {locatingLabel ?? 'Konum bulunuyor…'}
        </div>
      )}
      <MapContainer center={center} zoom={DEFAULT_ZOOM} className="h-full w-full">
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <ClickHandler onChange={onChange} />
        <RecenterOnValue latitude={latitude} longitude={longitude} />
        <FlyToController target={flyTo} />
        {hasPosition && (
          <Marker
            position={[latitude!, longitude!]}
            icon={defaultIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target as L.Marker;
                const pos = marker.getLatLng();
                onChange(pos.lat, pos.lng);
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
