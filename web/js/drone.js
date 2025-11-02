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
                this.rtcGroup = MTP.Creator.createRTCGroup(this.getPosition());
                this.model = gltf.scene;
                this.model.scale.set(10, 10, 10);
                this.model.position.set(0, 0, 0);
                this.rtcGroup.add(this.model);
                mapScene.addObject(this.rtcGroup);
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
            // Calculate heading using your formula
            const dx = targetLon - this.longitude;  // East-West difference
            const dy = targetLat - this.latitude;   // North-South difference
            
            // Calculate heading in degrees (-180 to 180)
            const headingDegrees = Math.atan2(dy, dx) * (180 / Math.PI);
            
            // Convert to radians and set rotation
            // Try different orientation options - uncomment the one that works:
            
            // Option 1: Direct conversion
            // const headingRadians = THREE.MathUtils.degToRad(headingDegrees);
            
            // Option 2: Add 180 degrees (face opposite direction)
            const headingRadians = THREE.MathUtils.degToRad(headingDegrees + 180);
            
            // Option 3: Add 90 degrees
            // const headingRadians = THREE.MathUtils.degToRad(headingDegrees + 90);
            
            // Option 4: Subtract 90 degrees  
            // const headingRadians = THREE.MathUtils.degToRad(headingDegrees - 90);
            
            this.rtcGroup.rotation.y = headingRadians;
            
            console.log(`Drone heading set to: ${headingDegrees.toFixed(1)}° (adjusted: ${(headingDegrees + 180).toFixed(1)}°) target: [${targetLon.toFixed(6)}, ${targetLat.toFixed(6)}])`);
        }
    }

    /**
     * Test method to manually set drone orientation for debugging
     * @param {number} degrees - Angle in degrees to test
     */
    testOrientation(degrees) {
        if (this.rtcGroup) {
            this.rtcGroup.rotation.y = THREE.MathUtils.degToRad(degrees);
            console.log(`Drone orientation set to: ${degrees}°`);
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