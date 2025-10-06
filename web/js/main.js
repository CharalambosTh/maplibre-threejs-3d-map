// Map configuration and initialization
import { addMapControls } from './controls.js';

// Map configuration object
const mapConfig = {
    container: 'map',
    zoom: 12,
    center: [35.1264, 33.4299], // Cyprus coordinates
    pitch: 70,
    hash: true,
    style: 'http://localhost:8081/styles/local-style/style.json',
    maxZoom: 18,
    maxPitch: 85
};

// Initialize and export the map
export function initializeMap() {
    const map = new maplibregl.Map(mapConfig);
    
    // Add controls when map is loaded
    map.on('load', () => {
        addMapControls(map);
    });
    
    // Make map available globally for debugging
    window.map = map;
    
    return map;
}

// Auto-initialize when module loads
export const map = initializeMap();