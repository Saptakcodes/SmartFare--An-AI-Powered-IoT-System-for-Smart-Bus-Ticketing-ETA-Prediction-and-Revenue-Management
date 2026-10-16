export interface MapStop {
  stop_id: string;
  name: string;
  latitude: number;
  longitude: number;
  seq: number;
}

export interface MapBus {
  bus_id: string;
  latitude: number;
  longitude: number;
  route_id?: string | null;
}

export interface LiveMapProps {
  center: { lat: number; lon: number };
  zoom?: number;
  routeStops?: MapStop[];
  buses?: MapBus[];
  onBusPress?: (busId: string) => void;
}