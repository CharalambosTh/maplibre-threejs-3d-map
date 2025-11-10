import { Matrix4 } from 'https://cdn.jsdelivr.net/npm/math.gl@4.0.0/+esm';
/**
 * Deck.gl-based 3D trail system for drone path visualization
 * Compatible with MapLibre GL JS using the MapboxOverlay pattern
 */
import { deckOverlay } from './main.js';
let mapInstance = null;
let globalIsTrailVisible = true; // Use a global visibility flag

/**
 * Trail manager class for handling deck.gl line layers
 */
export class TrailManager {
    constructor() {
        this.droneTrails = new Map();
    }

    createTrailForDrone(droneId, map) {
        const trail = new DroneTrail(droneId, map);
        this.droneTrails.set(droneId, trail);
        return trail;
    }

    getTrail(droneId) {
        return this.droneTrails.get(droneId) || null;
    }

    removeTrail(droneId) {
        if (this.droneTrails.has(droneId)) {
            this.droneTrails.delete(droneId);
            this.updateAllLayers(); // Trigger a redraw to remove the layer
        }
    }

    clearAllTrails() {
        for (const trail of this.droneTrails.values()) {
            trail.clear(); // This will trigger one update, which is fine
        }
    }

    toggleAllTrailsVisibility() {
        globalIsTrailVisible = !globalIsTrailVisible;
        this.updateAllLayers(); // Just trigger a single global update
        return globalIsTrailVisible;
    }

    updateAllLayers() {
        const layers = [];

        //130 is the offset to level the line with the drone model
        const VERTICAL_OFFSET = 130;

        const modelMatrix = new Matrix4().translate([0, 0, VERTICAL_OFFSET]);

        // Only add layers if they are globally visible
        if (globalIsTrailVisible) {
            for (const trail of this.droneTrails.values()) {
                layers.push(
                    new LineLayer({
                        id: trail.layerId,
                        data: trail.getPathSegments(),
                        modelMatrix: modelMatrix,
                        getSourcePosition: d => d.source,
                        getTargetPosition: d => d.dest,
                        getColor: d => d.color,
                        getWidth: d => d.width,
                        widthMinPixels: 2,
                        widthMaxPixels: 8
                    })
                );
            }
        }
        console.log('About to set props. Layers array:', layers);
        // debugger; // This will pause execution in your browser's dev tools

        deckOverlay.setProps({ layers: layers });
    }
}

/**
 * Individual drone trail handler.
 * Now it's just a data manager.
 */
export class DroneTrail {
    constructor(droneId, map) {
        this.droneId = droneId;
        this.map = map;
        this.layerId = `drone-trail-${droneId}`;
        this.pathSegments = [];
        console.log(`DroneTrail data handler created for: ${droneId}`);
    }

    addPathSegment(fromPosition, toPosition, velocity = 0) {
        if (this.calculateDistance(fromPosition, toPosition) < 0.000009) {
            return;
        }
        const color = this.getColorByVelocity(velocity);
        const width = this.getWidthByAltitude(toPosition[2]);
        const segment = {
            source: [...fromPosition],
            dest: [...toPosition],
            color: color,
            width: width,
            velocity: velocity
        };
        this.pathSegments.push(segment);
        if (this.pathSegments.length > 300) {
            this.pathSegments.shift();
        }
        trailManager.updateAllLayers();
    }
  
  
    destroy() {
        this.pathSegments = [];
        console.log(`Trail data destroyed for drone: ${this.droneId}`);
    }

    /**
     * Get color based on velocity (green=slow, yellow=medium, red=fast)
     * @param {number} velocity - Velocity in m/s
     * @returns {[number, number, number]} RGB color array
     */
    getColorByVelocity(velocity) {
        if (velocity < 2) return [0, 255, 0];     // Green for slow
        if (velocity < 8) return [255, 255, 0];   // Yellow for medium  
        if (velocity < 15) return [255, 165, 0];  // Orange for fast
        return [255, 0, 0];                       // Red for very fast
    }

    /**
     * Get line width based on altitude (thicker at higher altitudes)
     * @param {number} altitude - Altitude in meters
     * @returns {number} Line width
     */
    getWidthByAltitude(altitude) {
        const baseWidth = 3;
        const altitudeFactor = Math.max(1, altitude / 100); // Scale with altitude
        return Math.min(baseWidth * altitudeFactor, 8); // Cap at 8 pixels
    }

    /**
     * Calculate distance between two coordinates
     * @param {[number, number, number]} pos1 - First position
     * @param {[number, number, number]} pos2 - Second position
     * @returns {number} Distance in degrees
     */
    calculateDistance(pos1, pos2) {
        const dx = pos2[0] - pos1[0];
        const dy = pos2[1] - pos1[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

   
    clear() {
        this.pathSegments = [];
        // Tell the manager to redraw everything, which will remove this trail's line
        trailManager.updateAllLayers();
        console.log(`Trail cleared for drone: ${this.droneId}`);
    }


    /**
     * Get current path segments
     * @returns {Array} Copy of path segments
     */
    getPathSegments() {
        return [...this.pathSegments];
    }

    /**
     * Get trail statistics
     * @returns {Object} Trail statistics
     */
    getStats() {
        return {
            segmentCount: this.pathSegments.length,
            totalDistance: this.pathSegments.reduce((total, segment) => {
                return total + this.calculateDistance(segment.source, segment.dest);
            }, 0),
            avgVelocity: this.pathSegments.length > 0 ? 
                this.pathSegments.reduce((sum, seg) => sum + (seg.velocity || 0), 0) / this.pathSegments.length : 0
        };
    }
}

// Global trail manager instance
const trailManager = new TrailManager();

/**
 * Initialize trail system with map instance
 * @param {import('maplibre-gl').Map} map - MapLibre map instance
 */
export function initTrail(map) {
    mapInstance = map;
    console.log('Deck.gl 3D Trail system initialized');
}

/**
 * Add trail point for default drone (maintains compatibility with existing code)
 * @param {[number, number]} coordinates - [longitude, latitude]
 * @param {number|null} altitude - Altitude in meters
 * @param {number} velocity - Velocity for color coding
 */
export function addTrailPoint(coordinates, altitude = null, velocity = 0) {
    console.log('addTrailPoint called with:', coordinates); 
    const defaultDroneId = 'default-drone';
    let trail = trailManager.getTrail(defaultDroneId);
    
    if (!trail && mapInstance) {
        trail = trailManager.createTrailForDrone(defaultDroneId, mapInstance, altitude);
    }
    
    if (trail) {
        const currentPos = [coordinates[0], coordinates[1], altitude || 0];
        const segments = trail.getPathSegments();
        
        if (segments.length > 0) {
            const lastSegment = segments[segments.length - 1];
            trail.addPathSegment(lastSegment.dest, currentPos, velocity);
        } else {
            // For the first point, create a minimal segment
            const startPos = [currentPos[0] - 0.00001, currentPos[1] - 0.00001, currentPos[2]];
            trail.addPathSegment(startPos, currentPos, velocity);
        }
    }
}

/**
 * Clear trail for default drone (maintains compatibility)
 * @param {import('maplibre-gl').Map} map - Map instance (unused but kept for compatibility)
 */
export function clearTrail(map) {
    const defaultDroneId = 'default-drone';
    const trail = trailManager.getTrail(defaultDroneId);
    if (trail) {
        trail.clear();
    }
    console.log('Default drone trail cleared');
}

/**
 * Toggle trail visibility (maintains compatibility)
 * @param {import('maplibre-gl').Map} map - Map instance (unused but kept for compatibility)
 * @returns {boolean} New visibility state
 */
export function toggleTrailVisibility(map) {
    return trailManager.toggleAllTrailsVisibility();
}

/**
 * Get trail points (maintains compatibility)
 * @returns {Array} Trail segments as coordinate pairs
 */
export function getTrailPoints() {
    const defaultDroneId = 'default-drone';
    const trail = trailManager.getTrail(defaultDroneId);
    if (trail) {
        return trail.getPathSegments().map(segment => [
            segment.dest[0], segment.dest[1], segment.dest[2]
        ]);
    }
    return [];
}

/**
 * Check if trail is empty (maintains compatibility)
 * @returns {boolean}
 */
export function isTrailEmpty() {
    const defaultDroneId = 'default-drone';
    const trail = trailManager.getTrail(defaultDroneId);
    return !trail || trail.getPathSegments().length === 0;
}

// Export the trail manager for advanced use cases
export { trailManager };