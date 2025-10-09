/**
 * Three.js Layer Module for MapLibre GL JS
 * Handles 3D model operations: add, move, remove, and manage models on the map
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ThreeJSLayer {
    constructor() {
        this.models = new Map(); // Store multiple models
        this.customLayer = null;
        this.map = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
    }

    /**
     * Initialize the Three.js custom layer
     * @param {maplibregl.Map} map - MapLibre GL JS map instance
     */
    initializeLayer(map) {
        this.map = map;
        
        this.customLayer = {
            id: '3d-models',
            type: 'custom',
            renderingMode: '3d',
            onAdd: this.onAdd.bind(this),
            render: this.render.bind(this)
        };

        // Add the layer when the style is loaded
        if (map.isStyleLoaded()) {
            map.addLayer(this.customLayer);
        } else {
            map.on('style.load', () => {
                map.addLayer(this.customLayer);
            });
        }
    }

    /**
     * Called when the custom layer is added to the map
     */
    onAdd(map, gl) {
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();

        // Create lighting for the scene
        this.setupLighting();

        // Initialize the Three.js renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
        });
        this.renderer.autoClear = false;
    }

    /**
     * Setup lighting for the 3D scene
     */
    setupLighting() {
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Directional lights from different angles
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(0, -70, 100).normalize();
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight2.position.set(0, 70, 100).normalize();
        this.scene.add(directionalLight2);
    }

    /**
     * Add a 3D model to the map
     * @param {string} id - Unique identifier for the model
     * @param {string} modelPath - Path to the 3D model file
     * @param {Array} coordinates - [longitude, latitude] coordinates
     * @param {Object} options - Additional options (altitude, rotation, scale)
     */
    async addModel(id, modelPath, coordinates, options = {}) {
        const {
            altitude = 0,
            rotation = [Math.PI / 2, 0, 0],
            scale = 1
        } = options;

        // Calculate mercator coordinates
        const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
            coordinates,
            altitude
        );

        // Create model transform
        const modelTransform = {
            translateX: modelAsMercatorCoordinate.x,
            translateY: modelAsMercatorCoordinate.y,
            translateZ: modelAsMercatorCoordinate.z,
            rotateX: rotation[0],
            rotateY: rotation[1],
            rotateZ: rotation[2],
            scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * scale
        };

        try {
            // Load the 3D model
            const loader = new GLTFLoader();
            const gltf = await new Promise((resolve, reject) => {
                loader.load(modelPath, resolve, undefined, reject);
            });

            // Store model data
            const modelData = {
                id,
                gltf,
                coordinates,
                transform: modelTransform,
                visible: true
            };

            this.models.set(id, modelData);
            
            // Add to scene if scene exists
            if (this.scene) {
                this.scene.add(gltf.scene);
            }

            return modelData;
        } catch (error) {
            console.error(`Failed to load model ${id}:`, error);
            throw error;
        }
    }

    /**
     * Remove a model from the map
     * @param {string} id - Model identifier
     */
    removeModel(id) {
        const modelData = this.models.get(id);
        if (modelData && this.scene) {
            this.scene.remove(modelData.gltf.scene);
            this.models.delete(id);
        }
    }

    /**
     * Move a model to new coordinates
     * @param {string} id - Model identifier
     * @param {Array} newCoordinates - [longitude, latitude]
     * @param {number} altitude - New altitude
     */
    moveModel(id, newCoordinates, altitude = 0) {
        const modelData = this.models.get(id);
        if (!modelData) return;

        // Update coordinates
        modelData.coordinates = newCoordinates;
        
        // Recalculate transform
        const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
            newCoordinates,
            altitude
        );

        modelData.transform.translateX = modelAsMercatorCoordinate.x;
        modelData.transform.translateY = modelAsMercatorCoordinate.y;
        modelData.transform.translateZ = modelAsMercatorCoordinate.z;
    }

    /**
     * Get model coordinates for camera positioning
     * @param {string} id - Model identifier
     * @returns {Array|null} [longitude, latitude] or null if model not found
     */
    getModelCoordinates(id) {
        const modelData = this.models.get(id);
        return modelData ? modelData.coordinates : null;
    }

    /**
     * Toggle model visibility
     * @param {string} id - Model identifier
     * @param {boolean} visible - Visibility state
     */
    setModelVisibility(id, visible) {
        const modelData = this.models.get(id);
        if (modelData) {
            modelData.visible = visible;
            modelData.gltf.scene.visible = visible;
        }
    }

    /**
     * Get all model IDs
     * @returns {Array} Array of model IDs
     */
    getModelIds() {
        return Array.from(this.models.keys());
    }

    /**
     * Render function called by MapLibre
     */
    render(gl, args) {
        if (!this.scene || !this.camera || !this.renderer) return;

        // Apply transformations for each model
        this.models.forEach((modelData) => {
            if (!modelData.visible) return;

            const { transform } = modelData;
            
            const rotationX = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(1, 0, 0),
                transform.rotateX
            );
            const rotationY = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(0, 1, 0),
                transform.rotateY
            );
            const rotationZ = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(0, 0, 1),
                transform.rotateZ
            );

            const m = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);
            const l = new THREE.Matrix4()
                .makeTranslation(
                    transform.translateX,
                    transform.translateY,
                    transform.translateZ
                )
                .scale(
                    new THREE.Vector3(
                        transform.scale,
                        -transform.scale,
                        transform.scale
                    )
                )
                .multiply(rotationX)
                .multiply(rotationY)
                .multiply(rotationZ);

            this.camera.projectionMatrix = m.multiply(l);
        });

        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
    }
}