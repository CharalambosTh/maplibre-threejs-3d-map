let trailPoints = [];
let trailSource = null;
let isTrailVisible = true;
let mapInstance = null;

export function initTrail(map) {
    mapInstance = map;
    
    // Initialize empty trail source with 3D coordinates
    map.addSource('drone-trail', {
        type: 'geojson',
        data: {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: []
            }
        }
    });
    
    // Add trail line layer with elevation and enhanced styling for 3D visibility
    map.addLayer({
        id: 'drone-trail',
        type: 'line',
        source: 'drone-trail',
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#00ff00',
            'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 2,
                15, 4,
                20, 6
            ],
            'line-opacity': 0.9,
            'line-blur': 1
        }
    });
    
    console.log('3D Trail system initialized');
}

export function addTrailPoint(coordinates, altitude = null) {
    if (trailPoints.length === 0) {
        // First point, just add it with altitude
        const point = altitude !== null ? [coordinates[0], coordinates[1], altitude] : coordinates;
        trailPoints.push(point);
        return;
    }
    
    // Check if this point is significantly different from the last one
    const lastPoint = trailPoints[trailPoints.length - 1];
    const distance = calculateDistance([lastPoint[0], lastPoint[1]], coordinates);
    
    // Only add point if it's more than 1 meter away from the last point
    if (distance > 0.000009) { // approximately 1 meter in degrees
        const point = altitude !== null ? [coordinates[0], coordinates[1], altitude] : coordinates;
        trailPoints.push(point);
        
        // Limit trail length to last 200 points for better performance with 3D
        if (trailPoints.length > 200) {
            trailPoints.shift();
        }
        
        updateTrailOnMap();
    }
}

export function updateTrailOnMap() {
    if (mapInstance && mapInstance.getSource('drone-trail') && trailPoints.length > 1) {
        // Ensure all points have 3 coordinates (longitude, latitude, altitude)
        const coordinates3D = trailPoints.map(point => {
            if (point.length === 2) {
                return [point[0], point[1], 0]; // Add default altitude if missing
            }
            return point;
        });
        
        mapInstance.getSource('drone-trail').setData({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: coordinates3D
            }
        });
    }
}

export function clearTrail(map) {
    trailPoints = [];
    if (map && map.getSource('drone-trail')) {
        map.getSource('drone-trail').setData({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: []
            }
        });
    }
    console.log('3D Trail cleared');
}

export function toggleTrailVisibility(map) {
    isTrailVisible = !isTrailVisible;
    if (map && map.getLayer('drone-trail')) {
        map.setLayoutProperty('drone-trail', 'visibility', isTrailVisible ? 'visible' : 'none');
    }
    return isTrailVisible;
}

export function getTrailPoints() {
    return [...trailPoints];
}

export function isTrailEmpty() {
    return trailPoints.length === 0;
}

// Helper function to calculate distance between two points
function calculateDistance(point1, point2) {
    const [lng1, lat1] = point1;
    const [lng2, lat2] = point2;
    return Math.sqrt(Math.pow(lng2 - lng1, 2) + Math.pow(lat2 - lat1, 2));
}