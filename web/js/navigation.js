import { removeTargetMarker } from './markers.js';
import { addTrailPoint } from './trail.js';

/**
 * Navigation system for controlling drone movement
 */
export class Navigation {
    /**
     * @param {import('./drone.js').Drone} drone - The drone instance to control
     * @param {import('maplibre-gl').Map} map - The MapLibre map instance
     */
    constructor(drone, map) {
        /** @type {import('./drone.js').Drone} */
        this.drone = drone;
        /** @type {import('maplibre-gl').Map} */
        this.map = map;
    }

    /**
     * Move drone toward a target location with smooth animation
     * @param {[number, number]} target - Target coordinates [longitude, latitude]
     * @param {number} targetAlt - Target altitude in meters
     * @param {number} stepMeters - Distance to move per step in meters
     * @param {Function|null} onComplete - Callback function when movement completes
     */
    moveDroneToward(target, targetAlt, stepMeters, onComplete = null) {
        if (this.drone.move_interval) {
            clearInterval(this.drone.move_interval);
        }

        // Set drone heading to face the target before starting movement
        this.drone.setHeadingToTarget(target[0], target[1]);

        this.drone.move_interval = setInterval(() => {
            const pointA = [this.drone.latitude, this.drone.longitude];
            const pointB = [target[1], target[0]];  // note: lat/lon order
            const latA = pointA[0], lonA = pointA[1];
            const latB = pointB[0], lonB = pointB[1];

            // Calculate distance using approximate conversion: 1 degree ≈ 111 km
            const totalDist = Math.sqrt((latB - latA) ** 2 + (lonB - lonA) ** 2) * 111000;
            
            if (totalDist === 0) {
                clearInterval(this.drone.move_interval);
                if (onComplete) onComplete();
                return;
            }

            // Calculate next position
            const factor = stepMeters / totalDist;
            const newLat = latA + factor * (latB - latA);
            const newLon = lonA + factor * (lonB - lonA);
            
            // Add current position to trail before moving (with altitude for 3D trail)
            addTrailPoint([this.drone.longitude, this.drone.latitude], this.drone.altitude);
            
            this.drone.setPosition(newLon, newLat, this.drone.altitude);

            // Adjust altitude gradually
            if (Math.abs(this.drone.altitude - targetAlt) > 0.5) {
                if (this.drone.altitude < targetAlt) {
                    this.drone.altitude += this.drone.vertical_speed / this.drone.move_frequency;
                } else {
                    this.drone.altitude -= this.drone.vertical_speed / this.drone.move_frequency;
                }
            } else {
                this.drone.altitude = targetAlt;
            }

            // Update 3D model position
            this.drone.updatePosition(this.map);
            console.log(this.drone.toString());

            // Stop when within one step
            if (totalDist <= stepMeters) {
                clearInterval(this.drone.move_interval);
                console.log("Drone reached target");
                
                // Remove target marker when reached
                removeTargetMarker(this.map);
                
                if (onComplete) onComplete();
            }

        }, 1000 / this.drone.move_frequency);
    }

    /**
     * Fly drone to a specific position
     * @param {number} longitude - Target longitude
     * @param {number} latitude - Target latitude  
     * @param {number|null} altitude - Target altitude (uses current altitude if null)
     */
    flyToPosition(longitude, latitude, altitude = null) {
        const targetAlt = altitude || this.drone.altitude;
        const stepDist = 2; // meters per step
        this.moveDroneToward([longitude, latitude], targetAlt, stepDist);
    }
}