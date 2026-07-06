import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type L from 'leaflet';
import { defaultIcon } from '../../lib/leafletIcons';
import { KONYA_CENTER, DEFAULT_ZOOM, TILE_URL, TILE_ATTRIBUTION } from '../../lib/mapConstants';

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number) => void;
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

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const hasPosition = latitude !== undefined && longitude !== undefined;
  const center = useMemo<[number, number]>(
    () => (hasPosition ? [latitude!, longitude!] : KONYA_CENTER),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="h-80 w-full overflow-hidden rounded-md border border-gray-300">
      <MapContainer center={center} zoom={DEFAULT_ZOOM} className="h-full w-full">
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <ClickHandler onChange={onChange} />
        <RecenterOnValue latitude={latitude} longitude={longitude} />
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
