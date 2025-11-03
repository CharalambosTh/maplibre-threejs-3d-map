import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as MTP from '@dvt3d/maplibre-three-plugin';

export class Drone {
    constructor(longitude = 33.3823, latitude = 35.1856, altitude = 100) {
        this.longitude = longitude;
        this.latitude = latitude;
        this.altitude = altitude;
        this.vertical_speed = 2;       // m/s climb or descent rate
        this.move_frequency = 1;       // Hz (updates per second)
        this.move_interval = null;     // store interval ID
        this.rtcGroup = null;
        this.model = null;
    }

    getPosition() {
        return [this.longitude, this.latitude, this.altitude];
    }

    setPosition(lon, lat, alt) {
        this.longitude = lon;
        this.latitude = lat;
        this.altitude = alt;
    }

    toString() {
        return `Drone @ [${this.longitude.toFixed(6)}, ${this.latitude.toFixed(6)}], alt ${this.altitude.toFixed(1)}m`;
    }

    async loadModel(mapScene) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load('./js/models/drone.glb', (gltf) => {
                // Create the group that will be managed by the map plugin
                this.rtcGroup = MTP.Creator.createRTCGroup(this.getPosition());

                // --- Setup the drone model ---
                this.model = gltf.scene;
                this.model.scale.set(15, 15, 15);
                
                // For this test, ensure the model starts at the group's center with no rotation
                this.model.position.set(0, 0, 0);
             
                // Add the drone model to the group
                this.rtcGroup.add(this.model);

                // Arrow Debugging
                // // Define the "forward" vector in three.js (positive Z)
                // const forwardDirection = new THREE.Vector3(0, 0, 1);

                // // The arrow starts at the group's origin
                // const origin = new THREE.Vector3(0, 0, 0);

                // // NOTE: Increased arrow length to be visible against your scaled-up model
                // const arrowLength = 30; 
                // const arrowColor = 0xff0000; // Red
                // const arrowHelper = new THREE.ArrowHelper(forwardDirection, origin, arrowLength, arrowColor);

                // // KEY CHANGE: Add the arrow to the RTC Group, NOT the mapScene directly.
                // // This ensures the arrow is positioned relative to your drone.
                // this.rtcGroup.add(arrowHelper);
                // mapScene.addObject(this.rtcGroup);
                
                console.log("Drone loaded:", this.toString());
                resolve(this);

            }, undefined, reject);
        });
    }

    updatePosition(map) {
        if (this.rtcGroup) {
            const newVec = MTP.SceneTransform.lngLatToVector3([this.longitude, this.latitude, this.altitude]);
            this.rtcGroup.position.copy(newVec);
            map.triggerRepaint();
        }
    }

    rotate(angleDegrees) {
        if (this.rtcGroup) {
            const angle = THREE.MathUtils.degToRad(angleDegrees);
            this.rtcGroup.rotation.y += angle;
        }
    }

    setHeadingToTarget(targetLon, targetLat) {
        if (this.rtcGroup) {
            // Calculate difference
            const dx = targetLon - this.longitude;  // East-West difference (X-axis)
            const dy = targetLat - this.latitude;   // North-South difference (Z-axis)
            
            const headingRadians = Math.atan2(dx, dy) + Math.PI; // Add PI for offset correction 
            this.rtcGroup.rotation.y = headingRadians;
            
            console.log(`Drone heading set to: ${(headingRadians * 180 / Math.PI).toFixed(1)}°`);
        }
    }

    /**
     * Test method to manually set drone orientation for debugging
     * @param {number} degrees - Angle in degrees to test
     */
    testOrientation(degrees) {
        if (this.rtcGroup) {
            this.rtcGroup.rotation.y += THREE.MathUtils.degToRad(degrees);
            console.log(`Drone orientation set to: ${this.rtcGroup.rotation.y}°`);
        }
    }

    get3DPosition() {
        if (this.rtcGroup) {
            return this.rtcGroup.position.clone();
        }
        return null;
    }

    stopMovement() {
        if (this.move_interval) {
            clearInterval(this.move_interval);
            this.move_interval = null;
        }
    }
}