let targetMarker = null;

export function addTargetMarker(map, coordinates) {
    // Remove existing marker if any
    removeTargetMarker(map);
    
    // Add target marker as a pin-like symbol
    map.addSource('target-marker', {
        type: 'geojson',
        data: {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: coordinates
            },
            properties: {
                title: 'Target Location'
            }
        }
    });
    
    // Add pin-like marker with custom styling
    map.addLayer({
        id: 'target-marker-shadow',
        type: 'circle',
        source: 'target-marker',
        paint: {
            'circle-radius': 8,
            'circle-color': 'rgba(0,0,0,0.3)',
            'circle-translate': [2, 2]
        }
    });
    
    map.addLayer({
        id: 'target-marker',
        type: 'circle',
        source: 'target-marker',
        paint: {
            'circle-radius': 6,
            'circle-color': '#ff4444',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff'
        }
    });
    
    // Add a small stem to make it look more like a pin
    map.addLayer({
        id: 'target-marker-stem',
        type: 'circle',
        source: 'target-marker',
        paint: {
            'circle-radius': 1,
            'circle-color': '#aa2222',
            'circle-translate': [0, 8]
        }
    });
    
    targetMarker = coordinates;
    console.log(`Target marker added at: [${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}]`);
}

export function removeTargetMarker(map) {
    if (targetMarker) {
        try {
            if (map.getLayer('target-marker')) map.removeLayer('target-marker');
            if (map.getLayer('target-marker-shadow')) map.removeLayer('target-marker-shadow');
            if (map.getLayer('target-marker-stem')) map.removeLayer('target-marker-stem');
            if (map.getSource('target-marker')) map.removeSource('target-marker');
            targetMarker = null;
            console.log('Target marker removed');
        } catch (error) {
            console.warn('Error removing target marker:', error);
        }
    }
}

export function hasTargetMarker() {
    return targetMarker !== null;
}

export function getTargetMarker() {
    return targetMarker;
}