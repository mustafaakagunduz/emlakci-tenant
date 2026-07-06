import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { defaultIcon } from '../../lib/leafletIcons';
import { DEFAULT_ZOOM, TILE_URL, TILE_ATTRIBUTION } from '../../lib/mapConstants';

interface StaticLocationMapProps {
  latitude: number;
  longitude: number;
}

export function StaticLocationMap({ latitude, longitude }: StaticLocationMapProps) {
  return (
    <div className="h-48 w-full overflow-hidden rounded-md border border-gray-300">
      <MapContainer
        center={[latitude, longitude]}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <Marker position={[latitude, longitude]} icon={defaultIcon} />
      </MapContainer>
    </div>
  );
}
