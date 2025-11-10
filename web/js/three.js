import { map } from "./main.js";
import * as THREE from 'three';
import * as MTP from '@dvt3d/maplibre-three-plugin';
import { Drone } from './drone.js';
import { Navigation } from './navigation.js';
import { UI } from './ui.js';
import { initTrail } from './trail.js';

export async function init() {
    // Initialize 3D scene
    const mapScene = new MTP.MapScene(map);
    mapScene.addLight(new THREE.AmbientLight(0xffffff, 0.8));

    // Initialize trail system
    initTrail(map);

    // Create drone instance
    const drone = new Drone(33.3823, 35.1856, 50);
    
    try {
        // Load drone model
        await drone.loadModel(mapScene);
        
        // Initialize navigation system
        const navigation = new Navigation(drone, map);
        
        // Initialize UI
        const ui = new UI(drone, navigation, map);
        
        console.log("3D map system initialized successfully");
        
    } catch (error) {
        console.error("Failed to load drone model:", error);
    }

    // Set up render loop
    map.on('render', () => mapScene.render());
}
