import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { defaultIcon } from '../../lib/leafletIcons';
import { DEFAULT_ZOOM, TILE_URL, TILE_ATTRIBUTION } from '../../lib/mapConstants';

interface StaticLocationMapProps {
  latitude: number;
  longitude: number;
  interactive?: boolean;
  className?: string;
}

export function StaticLocationMap({
  latitude,
  longitude,
  interactive = false,
  className = 'h-48 w-full',
}: StaticLocationMapProps) {
  return (
    <div className={`overflow-hidden rounded-md border border-gray-300 ${className}`}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        dragging={interactive}
        scrollWheelZoom={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        zoomControl={interactive}
        attributionControl={false}
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <Marker position={[latitude, longitude]} icon={defaultIcon} />
      </MapContainer>
    </div>
  );
}
