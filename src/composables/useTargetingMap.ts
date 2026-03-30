// src/composables/useTargetingMap.ts
import { ref, type Ref } from "vue";
import L from "leaflet";
import "leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import type { TargetingArea } from "@/types/campaign";

// Fix leaflet-draw circle bug: "radius is not defined" in strict mode (Vite ES modules)
// leaflet-draw 1.0.4 assigns to undeclared `radius` variable in two places
// Patch 1: L.Edit.Circle._move (circle dragging during edit)
const Ledit = (L as any).Edit;
if (Ledit?.Circle?.prototype?._move) {
  Ledit.Circle.prototype._move = function (latlng: any) {
    const r = this._shape.getRadius();
    this._shape.setLatLng(latlng);
    this._shape.setRadius(r);
    this._shape.fire("edit");
  };
}
// Patch 2: L.Draw.Circle._onMouseMove (tooltip radius display during draw + edit)
const Ldraw = (L as any).Draw;
if (Ldraw?.Circle?.prototype?._onMouseMove) {
  const origOnMouseMove = Ldraw.Circle.prototype._onMouseMove;
  Ldraw.Circle.prototype._onMouseMove = function (e: any) {
    try {
      origOnMouseMove.call(this, e);
    } catch {
      // Swallow "radius is not defined" ReferenceError in strict mode
      // The tooltip display fails silently — drawing/editing still works
    }
  };
}

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
  const drawnItems = new L.FeatureGroup();
  const jobMarkers = new L.FeatureGroup();
  const areas = ref<TargetingArea[]>([]);
  const activeDrawTool = ref<string | null>(null);
  let docMouseUpHandler: (() => void) | null = null;

  function initMap(center?: [number, number]) {
    if (!mapRef.value || map) return;

    map = L.map(mapRef.value, {
      center: center ?? DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
    }).addTo(map);

    drawnItems.addTo(map);
    jobMarkers.addTo(map);

    // Add draw control to map (needed for editing drag handlers to work)
    // The default toolbar is hidden via CSS — custom buttons in TargetingMap.vue replace it
    const drawControl = new L.Control.Draw({
      edit: { featureGroup: drawnItems, remove: true },
      draw: { polyline: false, marker: false, circlemarker: false,
        circle: { shapeOptions: SHAPE_STYLE },
        rectangle: { shapeOptions: SHAPE_STYLE },
        polygon: { shapeOptions: SHAPE_STYLE },
      },
    });
    map.addControl(drawControl);
    // Hide the default toolbar — our custom buttons replace it
    const toolbar = document.querySelector(".leaflet-draw") as HTMLElement;
    if (toolbar) toolbar.style.display = "none";

    // Handle drawn shapes
    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      // Auto-enable editing (drag handles + resize)
      if ((layer as any).editing) (layer as any).editing.enable();
      // Sync when user drags handles to resize/move
      layer.on("edit", () => syncAreasFromLayers());
      addShapeClickHandler(layer);
      syncAreasFromLayers();
      activeDrawTool.value = null;
    });

    map.on(L.Draw.Event.DELETED, () => {
      syncAreasFromLayers();
    });

    map.on(L.Draw.Event.EDITED, () => {
      syncAreasFromLayers();
    });

    // Sync areas on every mouseup anywhere in the document — catches edit handle drags
    // Edit handles are DOM elements above the map, so map.on("mouseup") misses them
    docMouseUpHandler = () => {
      if (drawnItems.getLayers().length > 0) syncAreasFromLayers();
    };
    document.addEventListener("mouseup", docMouseUpHandler);

    // Fix map size after render
    setTimeout(() => map?.invalidateSize(), 100);
  }

  // Custom draw handlers — bypasses Leaflet-Draw's broken SimpleShape interaction
  let drawCleanup: (() => void) | null = null;

  function startDrawing(type: "circle" | "rectangle" | "polygon") {
    if (!map) return;
    // Cancel any active drawing
    if (drawCleanup) { drawCleanup(); drawCleanup = null; }

    if (type === "polygon") {
      // Polygons use Leaflet-Draw (multi-click, not drag-based)
      activeDrawTool.value = type;
      const handler = new (L.Draw as any).Polygon(map, { shapeOptions: SHAPE_STYLE });
      handler.enable();
      return;
    }

    // For circle and rectangle: custom click-drag drawing
    activeDrawTool.value = type;
    map.dragging.disable();
    const container = map.getContainer();
    container.style.cursor = "crosshair";
    let startLatLng: L.LatLng | null = null;
    let preview: L.Circle | L.Rectangle | null = null;

    function onMouseDown(e: L.LeafletMouseEvent) {
      startLatLng = e.latlng;
      L.DomEvent.preventDefault(e.originalEvent);
    }

    function onMouseMove(e: L.LeafletMouseEvent) {
      if (!startLatLng || !map) return;
      if (preview) map.removeLayer(preview);
      if (type === "circle") {
        const radius = startLatLng.distanceTo(e.latlng);
        preview = L.circle(startLatLng, { radius, ...SHAPE_STYLE }).addTo(map);
      } else {
        preview = L.rectangle(L.latLngBounds(startLatLng, e.latlng), SHAPE_STYLE).addTo(map);
      }
    }

    function onMouseUp(e: L.LeafletMouseEvent) {
      if (!startLatLng || !map) { cleanup(); return; }
      // Remove preview
      if (preview) map.removeLayer(preview);
      // Create final shape (only if dragged a meaningful distance)
      const dist = map.latLngToContainerPoint(startLatLng).distanceTo(map.latLngToContainerPoint(e.latlng));
      if (dist < 5) { cleanup(); return; } // too small, ignore

      let layer: L.Layer;
      if (type === "circle") {
        const radius = startLatLng.distanceTo(e.latlng);
        layer = L.circle(startLatLng, { radius, ...SHAPE_STYLE });
      } else {
        layer = L.rectangle(L.latLngBounds(startLatLng, e.latlng), SHAPE_STYLE);
      }
      drawnItems.addLayer(layer);
      if ((layer as any).editing) (layer as any).editing.enable();
      layer.on("edit", () => syncAreasFromLayers());
      addShapeClickHandler(layer);
      syncAreasFromLayers();
      cleanup();
    }

    function cleanup() {
      if (!map) return;
      map.off("mousedown", onMouseDown);
      map.off("mousemove", onMouseMove);
      map.off("mouseup", onMouseUp);
      map.dragging.enable();
      container.style.cursor = "";
      activeDrawTool.value = null;
      startLatLng = null;
      drawCleanup = null;
    }

    map.on("mousedown", onMouseDown);
    map.on("mousemove", onMouseMove);
    map.on("mouseup", onMouseUp);
    drawCleanup = cleanup;
  }

  function addShapeClickHandler(layer: L.Layer) {
    layer.on("click", (e: any) => {
      if (!map) return;
      L.DomEvent.stopPropagation(e);

      // Build popup content via DOM to avoid raw HTML injection
      const btn = L.DomUtil.create("button", "pc-delete-shape");
      btn.textContent = "Remove area";
      btn.style.cssText =
        "background:#ef4444;color:white;border:none;padding:6px 16px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;";
      btn.addEventListener("click", () => {
        drawnItems.removeLayer(layer);
        map!.closePopup();
        syncAreasFromLayers();
      });

      L.popup({
        closeButton: false,
        className: "pc-shape-popup",
        offset: [0, -10] as L.PointExpression,
      })
        .setLatLng(e.latlng)
        .setContent(btn)
        .openOn(map);

      // No setTimeout/querySelector needed — button is already wired up
    });
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

  function restoreAreas(savedAreas: TargetingArea[]) {
    if (!map) return;
    drawnItems.clearLayers();
    for (const area of savedAreas) {
      let layer: L.Layer | null = null;
      if (area.type === "circle" && area.radiusMiles && area.coordinates[0]) {
        layer = L.circle(
          [area.coordinates[0][0], area.coordinates[0][1]] as L.LatLngExpression,
          { radius: area.radiusMiles * 1609.34, ...SHAPE_STYLE },
        );
      } else if (area.type === "rectangle" && area.coordinates.length >= 2) {
        layer = L.rectangle(
          [
            area.coordinates[0] as L.LatLngTuple,
            area.coordinates[1] as L.LatLngTuple,
          ],
          SHAPE_STYLE,
        );
      } else if (area.type === "polygon" && area.coordinates.length >= 3) {
        layer = L.polygon(
          area.coordinates as L.LatLngTuple[],
          SHAPE_STYLE,
        );
      }
      if (layer) {
        drawnItems.addLayer(layer);
        if ((layer as any).editing) (layer as any).editing.enable();
        layer.on("edit", () => syncAreasFromLayers());
        addShapeClickHandler(layer);
      }
    }
    syncAreasFromLayers();
    // Fit map to show all restored shapes
    if (drawnItems.getLayers().length > 0) {
      map.fitBounds(drawnItems.getBounds().pad(0.2));
    }
  }

  function clearAll() {
    drawnItems.clearLayers();
    jobMarkers.clearLayers();
    areas.value = [];
  }

  function destroy() {
    if (docMouseUpHandler) {
      document.removeEventListener("mouseup", docMouseUpHandler);
      docMouseUpHandler = null;
    }
    if (drawCleanup) {
      drawCleanup();
      drawCleanup = null;
    }
    activeDrawTool.value = null;
    if (map) {
      map.remove();
      map = null;
    }
  }

  return {
    initMap,
    addJobRadii,
    highlightZips,
    restoreAreas,
    startDrawing,
    clearAll,
    destroy,
    areas,
    activeDrawTool,
  };
}
