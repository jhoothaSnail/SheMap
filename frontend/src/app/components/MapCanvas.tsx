import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

interface MapCanvasProps {
  activeRoute?: number;
  showDangerZones?: boolean;
  showIncidents?: boolean;
}

export function MapCanvas({
  activeRoute,
  showDangerZones,
  showIncidents,
}: MapCanvasProps) {
  return (
    <MapContainer
      center={[13.0827, 80.2707]}
      zoom={13}
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[13.0827, 80.2707]}>
        <Popup>
          SheMap Active Location
        </Popup>
      </Marker>
    </MapContainer>
  );
}