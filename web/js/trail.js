/**
 * Deck.gl-based 3D trail system for drone path visualization
 * Compatible with MapLibre GL JS using the MapboxLayer bridge
 */

let mapInstance = null;
let isTrailVisible = true;

/**
 * Get deck.gl classes safely after they're loaded
 */
function getDeckGLClasses() {
    if (typeof deck === 'undefined') {
        throw new Error('deck.gl not loaded. Make sure deck.gl script is included before this module.');
    }
    return {
        MapboxLayer: deck.MapboxLayer,
        LineLayer: deck.LineLayer
    };
}

/**
 * Trail manager class for handling deck.gl line layers
 */
export class TrailManager {
    constructor() {
        /** @type {Map<string, DroneTrail>} */
        this.droneTrails = new Map();
    }

    /**
     * Create a new trail for a drone
     * @param {string} droneId - Unique identifier for the drone
     * @param {import('maplibre-gl').Map} map - MapLibre map instance
     */
    createTrailForDrone(droneId, map) {
        const trail = new DroneTrail(droneId, map);
        this.droneTrails.set(droneId, trail);
        return trail;
    }

    /**
     * Get trail for a specific drone
     * @param {string} droneId - Drone identifier
     * @returns {DroneTrail|null}
     */
    getTrail(droneId) {
        return this.droneTrails.get(droneId) || null;
    }

    /**
     * Remove trail for a drone
     * @param {string} droneId - Drone identifier
     */
    removeTrail(droneId) {
        const trail = this.droneTrails.get(droneId);
        if (trail) {
            trail.destroy();
            this.droneTrails.delete(droneId);
        }
    }

    /**
     * Clear all trails
     */
    clearAllTrails() {
        for (const trail of this.droneTrails.values()) {
            trail.clear();
        }
    }

    /**
     * Toggle visibility of all trails
     * @returns {boolean} New visibility state
     */
    toggleAllTrailsVisibility() {
        isTrailVisible = !isTrailVisible;
        for (const trail of this.droneTrails.values()) {
            trail.setVisibility(isTrailVisible);
        }
        return isTrailVisible;
    }
}

/**
 * Individual drone trail handler
 */
export class DroneTrail {
    /**
     * @param {string} droneId - Unique drone identifier
     * @param {import('maplibre-gl').Map} map - MapLibre map instance
     */
    constructor(droneId, map) {
        this.droneId = droneId;
        this.map = map;
        this.layerId = `drone-trail-${droneId}`;
        
        /** @type {Array<{source: [number, number, number], dest: [number, number, number], color: [number, number, number], velocity?: number}>} */
        this.pathSegments = [];
        
        this.layer = this.createLineLayer();
        this.map.addLayer(this.layer);
        
        console.log(`Deck.gl trail created for drone: ${droneId}`);
    }

    /**
     * Create the deck.gl LineLayer
     * @returns {MapboxLayer}
     */
    createLineLayer() {
        const { MapboxLayer, LineLayer } = getDeckGLClasses();
        
        return new MapboxLayer({
            id: this.layerId,
            type: LineLayer,
            data: [],
            getSourcePosition: d => d.source,
            getTargetPosition: d => d.dest,
            getColor: d => d.color || [0, 255, 0], // Default green
            getWidth: d => d.width || 3,
            widthMinPixels: 2,
            widthMaxPixels: 8,
            parameters: {
                depthTest: true,
                depthWrite: true
            },
            // Enhanced 3D rendering properties
            opacity: 0.9,
            pickable: false,
            autoHighlight: false,
            highlightColor: [255, 255, 255, 100]
        });
    }

    /**
     * Add a new path segment to the trail
     * @param {[number, number, number]} fromPosition - [longitude, latitude, altitude]
     * @param {[number, number, number]} toPosition - [longitude, latitude, altitude]
     * @param {number} velocity - Optional velocity for color coding
     */
    addPathSegment(fromPosition, toPosition, velocity = 0) {
        // Skip if positions are too close (less than ~1 meter)
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

        // Limit trail length for performance (keep last 300 segments)
        if (this.pathSegments.length > 300) {
            this.pathSegments.shift();
        }

        this.updateLayer();
    }

    /**
     * Update the deck.gl layer with current path data
     */
    updateLayer() {
        if (this.layer && this.pathSegments.length > 0) {
            this.layer.setProps({
                data: [...this.pathSegments] // Create a copy to ensure deck.gl detects the change
            });
        }
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

    /**
     * Clear the trail path
     */
    clear() {
        this.pathSegments = [];
        this.updateLayer();
        console.log(`Trail cleared for drone: ${this.droneId}`);
    }

    /**
     * Set trail visibility
     * @param {boolean} visible - Whether trail should be visible
     */
    setVisibility(visible) {
        if (this.layer) {
            this.layer.setProps({
                visible: visible
            });
        }
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

    /**
     * Remove trail from map and clean up
     */
    destroy() {
        if (this.map && this.layer) {
            try {
                this.map.removeLayer(this.layerId);
                console.log(`Trail layer removed for drone: ${this.droneId}`);
            } catch (error) {
                console.warn(`Error removing trail layer: ${error.message}`);
            }
        }
        this.pathSegments = [];
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
    const defaultDroneId = 'default-drone';
    let trail = trailManager.getTrail(defaultDroneId);
    
    if (!trail && mapInstance) {
        trail = trailManager.createTrailForDrone(defaultDroneId, mapInstance);
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