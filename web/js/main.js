// Map configuration and initialization
import { addMapControls } from './controls.js';
import { ThreeJSLayer } from './threejs-layer.js';
import { UIControls } from './ui-controls.js';

// Map configuration object
const mapConfig = {
    container: 'map',
    zoom: 12,
    center: [33.3823, 35.1856], // Nicosia, Cyprus coordinates
    pitch: 70,
    hash: true,
    style: 'http://localhost:8081/styles/local-style/style.json', // Use style from tile server
    maxZoom: 18,
    maxPitch: 90,
    canvasContextAttributes: {antialias: true} // Enable antialiasing for 3D models
};

// Initialize and export the map
export function initializeMap() {
    const map = new maplibregl.Map(mapConfig);
    
    // Initialize Three.js layer
    const threeJSLayer = new ThreeJSLayer();
    
    // Initialize UI controls
    let uiControls;
    
    // Add controls when map is loaded
    map.on('load', () => {
        addMapControls(map);
        
        // Initialize Three.js layer
        threeJSLayer.initializeLayer(map);
        
        // Initialize UI controls
        uiControls = new UIControls(map, threeJSLayer);
        
        // Example: Add a demo model (optional - remove in production)
        addDemoModel(threeJSLayer, uiControls);
    });
    
    // Make map and layers available globally for debugging
    window.map = map;
    window.threeJSLayer = threeJSLayer;
    window.uiControls = uiControls;
    
    return { map, threeJSLayer, uiControls };
}

/**
 * Add a demo model for testing (optional)
 */
async function addDemoModel(threeJSLayer, uiControls) {
    try {
        // Add drone model from local models folder
        const demoModelId = 'drone-model';
        const demoCoordinates = [33.3823, 35.1856]; // Nicosia, Cyprus (longitude, latitude)
        
        await threeJSLayer.addModel(
            demoModelId,
            'models/drone.glb', // Use your local drone model
            demoCoordinates,
            {
                altitude: 50, // Place the drone 50 meters above ground
                rotation: [0, 0, 0], // No rotation for the drone
                scale: 1
            }
        );
        
        // Add UI control for the drone model
        uiControls.addModelControl(demoModelId, 'Drone');
        
        console.log('Drone model added successfully');
    } catch (error) {
        console.error('Failed to add drone model:', error);
    }
}

// Auto-initialize when module loads
export const mapInstance = initializeMap();