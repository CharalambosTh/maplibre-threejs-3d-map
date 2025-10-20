// Map configuration and initialization
import { addMapControls } from './controls.js';
import { init } from './three.js';
// Map configuration object
const mapConfig = {
    container: 'map',
    zoom: 12,
    center: [33.3823, 35.1856], // Nicosia, Cyprus coordinates
    pitch: 70,
    hash: true,
    style: 'http://localhost:8081/styles/local-style/style.json', // Use style from tile server
    maxZoom: 20,
    maxPitch: 90,
    canvasContextAttributes: {antialias: true} // Enable antialiasing for potential 3D content
};

// Initialize and export the map
export function initializeMap() {
    const map = new maplibregl.Map(mapConfig);
    
    // Add controls when map is loaded
    map.on('load', () => {
        addMapControls(map);
        init(); // Initialize Three.js after map is loaded
    });
    
    // Make map available globally for debugging and external access
    window.map = map;
    
    return map;
}

// Auto-initialize when module loads
export const map = initializeMap();