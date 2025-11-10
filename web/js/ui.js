import { addTargetMarker } from './markers.js';
import { clearTrail, toggleTrailVisibility } from './trail.js';

export class UI {
    constructor(drone, navigation, map) {
        this.drone = drone;
        this.navigation = navigation;
        this.map = map;
        this.isSettingTarget = false;
        this.targetCoordinates = null;
        this.buttons = {};
        
        this.createButtons();
        this.setupEventListeners();
    }

    createButtons() {
        // Fly to Drone button
        this.buttons.flyToDrone = this.createButton("Fly to Drone", "10px", "10px");
        this.buttons.flyToDrone.onclick = () => this.flyToDroneCamera();

        // Move Drone button (preset movement)
        this.buttons.moveDrone = this.createButton("Move Drone", "50px", "10px");
        this.buttons.moveDrone.onclick = () => this.moveToPresetLocation();

        // Rotate Drone button
        this.buttons.rotateDrone = this.createButton("Rotate Drone", "90px", "10px");
        this.buttons.rotateDrone.onclick = () => this.rotateDrone();

        // Set Target button
        this.buttons.setTarget = this.createButton("Set Target", "130px", "10px");
        this.buttons.setTarget.onclick = () => this.toggleTargetSetting();

        // Clear Trail button
        this.buttons.clearTrail = this.createButton("Clear Trail", "170px", "10px");
        this.buttons.clearTrail.onclick = () => this.clearDroneTrail();

        // Toggle Trail button
        this.buttons.toggleTrail = this.createButton("Hide Trail", "210px", "10px");
        this.buttons.toggleTrail.onclick = () => this.toggleTrailVisibility();

        // Test Orientation button (for debugging drone facing direction)
        this.buttons.testOrientation = this.createButton("Test Orient", "250px", "10px");
        this.buttons.testOrientation.onclick = () => this.testDroneOrientation();
    }

    createButton(text, top, left) {
        const btn = document.createElement('button');
        btn.textContent = text;
        Object.assign(btn.style, {
            position: "absolute",
            top: top,
            left: left,
            zIndex: 10,
            padding: "8px 12px",
            backgroundColor: "#007cbf",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px"
        });
        
        // Add hover effect
        btn.addEventListener('mouseenter', () => {
            btn.style.backgroundColor = "#005a87";
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.backgroundColor = "#007cbf";
        });
        
        document.body.appendChild(btn);
        return btn;
    }

    setupEventListeners() {
        // Map click handler for setting target
        this.map.on('click', (e) => {
            if (!this.isSettingTarget) return;
            
            const { lng, lat } = e.lngLat;
            this.targetCoordinates = [lng, lat];
            
            // Add target marker to map
            addTargetMarker(this.map, [lng, lat]);
            
            // Exit target setting mode
            this.exitTargetSettingMode();
            
            console.log(`Target set at: [${lng.toFixed(6)}, ${lat.toFixed(6)}]`);
            
            // Start navigation to target
            this.navigateToTarget();
        });
    }

    flyToDroneCamera() {
        this.map.flyTo({
            center: [this.drone.longitude, this.drone.latitude],
            zoom: 19,
            pitch: -90,
            bearing: 0,
            speed: 0.8,
            curve: 1.2
        });
    }

    moveToPresetLocation() {
        if (!this.drone.rtcGroup) {
            alert("Drone not loaded yet!");
            return;
        }
        
        const target = [33.3835, 35.1865];   // preset target lon/lat
        const targetAlt = 100;               // target altitude
        const stepDist = 2;                  // meters per step
        this.navigation.moveDroneToward(target, targetAlt, stepDist);
    }

    rotateDrone() {
        if (!this.drone.rtcGroup) {
            alert("Drone not loaded yet!");
            return;
        }
        
        this.drone.rotate(45); // Rotate 45 degrees
        this.map.triggerRepaint();
    }

    toggleTargetSetting() {
        if (this.isSettingTarget) {
            this.exitTargetSettingMode();
        } else {
            this.enterTargetSettingMode();
        }
    }

    enterTargetSettingMode() {
        this.isSettingTarget = true;
        this.buttons.setTarget.textContent = "Cancel Target";
        this.buttons.setTarget.style.backgroundColor = "#ff6b6b";
        this.map.getCanvas().style.cursor = "crosshair";
    }

    exitTargetSettingMode() {
        this.isSettingTarget = false;
        this.buttons.setTarget.textContent = "Set Target";
        this.buttons.setTarget.style.backgroundColor = "#007cbf";
        this.map.getCanvas().style.cursor = "";
    }

    navigateToTarget() {
        if (!this.targetCoordinates) {
            console.log("No target set!");
            return;
        }
        
        if (!this.drone.rtcGroup) {
            alert("Drone not loaded yet!");
            return;
        }
        
        console.log(`Navigating to target: [${this.targetCoordinates[0].toFixed(6)}, ${this.targetCoordinates[1].toFixed(6)}]`);

        const targetAlt = this.drone.altitude; // Same altitude
        const stepDist = 2;    // 2 meters per step
        
        this.navigation.moveDroneToward(this.targetCoordinates, targetAlt, stepDist);
    }

    clearDroneTrail() {
        clearTrail(this.map);
    }

    toggleTrailVisibility() {
        const isVisible = toggleTrailVisibility(this.map);
        this.buttons.toggleTrail.textContent = isVisible ? "Hide Trail" : "Show Trail";
    }

    testDroneOrientation() {
        if (!this.drone.rtcGroup) {
            alert("Drone not loaded yet!");
            return;
        }
        
        // Cycle through different orientations to find the correct one
        const orientations = 90;
        
        this.drone.testOrientation(orientations);
    }
}