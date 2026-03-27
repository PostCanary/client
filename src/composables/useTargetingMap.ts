// src/composables/useTargetingMap.ts
import { ref, type Ref } from "vue";
import L from "leaflet";
import "leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import type { TargetingArea } from "@/types/campaign";

// leaflet-draw extends L namespace at runtime but @types/leaflet doesn't know about it
declare module "leaflet" {
  namespace Control {
    class Draw extends L.Control {
      constructor(options?: any);
    }
  }
  namespace Draw {
    const Event: {
      CREATED: string;
      DELETED: string;
      EDITED: string;
    };
  }
}

const TEAL = "#47bfa9";
const SHAPE_STYLE: L.PathOptions = {
  fillColor: TEAL,
  fillOpacity: 0.2,
  color: TEAL,
  weight: 2,
};

// Default center: Phoenix, AZ
const DEFAULT_CENTER: L.LatLngExpression = [33.4484, -111.949];
const DEFAULT_ZOOM = 12;

export function useTargetingMap(mapRef: Ref<HTMLElement | null>) {
  let map: L.Map | null = null;
  let drawControl: L.Control.Draw | null = null;
  const drawnItems = new L.FeatureGroup();
  const jobMarkers = new L.FeatureGroup();
  const areas = ref<TargetingArea[]>([]);

  function initMap(center?: [number, number]) {
    if (!mapRef.value || map) return;

    map = L.map(mapRef.value, {
      center: center ?? DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    drawnItems.addTo(map);
    jobMarkers.addTo(map);

    // Draw controls
    drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
      draw: {
        polyline: false,
        marker: false,
        circlemarker: false,
        circle: { shapeOptions: SHAPE_STYLE },
        rectangle: { shapeOptions: SHAPE_STYLE },
        polygon: { shapeOptions: SHAPE_STYLE },
      },
    });
    map.addControl(drawControl);

    // Handle drawn shapes
    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      syncAreasFromLayers();
    });

    map.on(L.Draw.Event.DELETED, () => {
      syncAreasFromLayers();
    });

    map.on(L.Draw.Event.EDITED, () => {
      syncAreasFromLayers();
    });

    // Fix map size after render
    setTimeout(() => map?.invalidateSize(), 100);
  }

  function syncAreasFromLayers() {
    const result: TargetingArea[] = [];
    drawnItems.eachLayer((layer: any) => {
      if (layer instanceof L.Circle) {
        const center = layer.getLatLng();
        const radius = layer.getRadius() / 1609.34; // meters to miles
        result.push({
          type: "circle",
          coordinates: [[center.lat, center.lng]],
          radiusMiles: radius,
        });
      } else if (layer instanceof L.Rectangle) {
        const bounds = layer.getBounds();
        result.push({
          type: "rectangle",
          coordinates: [
            [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
            [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
          ],
        });
      } else if (layer instanceof L.Polygon) {
        const latlngs = (layer.getLatLngs()[0] as L.LatLng[]).map(
          (ll: L.LatLng) => [ll.lat, ll.lng],
        );
        result.push({ type: "polygon", coordinates: latlngs });
      }
    });
    areas.value = result;
  }

  function addJobRadii(
    jobs: { lat: number; lng: number; id: string }[],
    radiusMiles: number,
  ) {
    jobMarkers.clearLayers();
    const radiusMeters = radiusMiles * 1609.34;

    for (const job of jobs) {
      // Pin marker
      L.circleMarker([job.lat, job.lng], {
        radius: 6,
        fillColor: "#0b2d50",
        fillOpacity: 1,
        color: "#fff",
        weight: 2,
      }).addTo(jobMarkers);

      // Radius circle
      L.circle([job.lat, job.lng], {
        radius: radiusMeters,
        ...SHAPE_STYLE,
      }).addTo(jobMarkers);
    }

    // Fit map to show all jobs
    if (jobs.length > 0) {
      const bounds = L.latLngBounds(jobs.map((j) => [j.lat, j.lng]));
      map?.fitBounds(bounds.pad(0.3));
    }
  }

  function highlightZips(zips: string[]) {
    // Round 1: center map on first ZIP and add a rough area marker
    // Real ZIP boundary data comes in Round 2 with Melissa Data
    // For now, just add a visual indicator
    if (zips.length > 0) {
      // We don't have ZIP centroid data in Round 1, so this is a no-op visually
      // The area/count calculations use the mock estimateHouseholds function
    }
  }

  function clearAll() {
    drawnItems.clearLayers();
    jobMarkers.clearLayers();
    areas.value = [];
  }

  function destroy() {
    if (map) {
      map.remove();
      map = null;
    }
  }

  return {
    initMap,
    addJobRadii,
    highlightZips,
    clearAll,
    destroy,
    areas,
  };
}
