// Map controls module
// Handles navigation controls, terrain controls, and other UI elements

/**
 * Add navigation control to the map
 * @param {maplibregl.Map} map - The MapLibre GL map instance
 */
export function addNavigationControl(map) {
    const navigationControl = new maplibregl.NavigationControl({
        visualizePitch: true,
        showZoom: true,
        showCompass: true
    });
    
    map.addControl(navigationControl);
}

/**
 * Add terrain control to the map
 * @param {maplibregl.Map} map - The MapLibre GL map instance
 */
export function addTerrainControl(map) {
    const terrainControl = new maplibregl.TerrainControl({
        source: 'terrainSource',
        exaggeration: 1
    });
    
    map.addControl(terrainControl);
}

/**
 * Add all default controls to the map
 * @param {maplibregl.Map} map - The MapLibre GL map instance
 */
export function addMapControls(map) {
    addNavigationControl(map);
    addTerrainControl(map);
}

