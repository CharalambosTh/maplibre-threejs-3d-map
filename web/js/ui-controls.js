/**
 * UI Controls Module
 * Handles user interface elements and interactions for 3D models
 */

export class UIControls {
    constructor(map, threeJSLayer) {
        this.map = map;
        this.threeJSLayer = threeJSLayer;
        this.controlsContainer = null;
        this.init();
    }

    /**
     * Initialize the UI controls
     */
    init() {
        this.createControlsContainer();
        this.createModelControls();
    }

    /**
     * Create the main controls container
     */
    createControlsContainer() {
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.className = 'model-controls';
        this.controlsContainer.innerHTML = `
            <div class="controls-header">
                <h3>3D Models</h3>
            </div>
            <div class="controls-content">
                <div class="model-list" id="model-list">
                    <!-- Dynamic model controls will be added here -->
                </div>
                <div class="control-actions">
                    <button id="add-model-btn" class="control-btn">Add Model</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.controlsContainer);
        this.attachEventListeners();
    }

    /**
     * Create controls for managing models
     */
    createModelControls() {
        // This will be populated dynamically as models are added
    }

    /**
     * Add a model control panel
     * @param {string} modelId - Model identifier
     * @param {string} modelName - Display name for the model
     */
    addModelControl(modelId, modelName = modelId) {
        const modelList = document.getElementById('model-list');
        const modelControl = document.createElement('div');
        modelControl.className = 'model-control-item';
        modelControl.id = `model-control-${modelId}`;
        
        modelControl.innerHTML = `
            <div class="model-info">
                <span class="model-name">${modelName}</span>
            </div>
            <div class="model-actions">
                <button class="btn-small zoom-btn" data-model-id="${modelId}" title="Zoom to model">
                    📍
                </button>
                <button class="btn-small visibility-btn" data-model-id="${modelId}" title="Toggle visibility">
                    👁️
                </button>
                <button class="btn-small remove-btn" data-model-id="${modelId}" title="Remove model">
                    🗑️
                </button>
            </div>
        `;

        modelList.appendChild(modelControl);
        this.attachModelEventListeners(modelControl, modelId);
    }

    /**
     * Remove a model control panel
     * @param {string} modelId - Model identifier
     */
    removeModelControl(modelId) {
        const modelControl = document.getElementById(`model-control-${modelId}`);
        if (modelControl) {
            modelControl.remove();
        }
    }

    /**
     * Attach event listeners to main controls
     */
    attachEventListeners() {
        const addModelBtn = document.getElementById('add-model-btn');
        addModelBtn.addEventListener('click', () => {
            this.showAddModelDialog();
        });
    }

    /**
     * Attach event listeners to model-specific controls
     * @param {HTMLElement} modelControl - The model control element
     * @param {string} modelId - Model identifier
     */
    attachModelEventListeners(modelControl, modelId) {
        // Zoom to model button
        const zoomBtn = modelControl.querySelector('.zoom-btn');
        zoomBtn.addEventListener('click', () => {
            this.zoomToModel(modelId);
        });

        // Toggle visibility button
        const visibilityBtn = modelControl.querySelector('.visibility-btn');
        visibilityBtn.addEventListener('click', () => {
            this.toggleModelVisibility(modelId, visibilityBtn);
        });

        // Remove model button
        const removeBtn = modelControl.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
            this.removeModel(modelId);
        });
    }

    /**
     * Zoom map to a specific model
     * @param {string} modelId - Model identifier
     */
    zoomToModel(modelId) {
        const coordinates = this.threeJSLayer.getModelCoordinates(modelId);
        if (coordinates) {
            this.map.flyTo({
                center: coordinates,
                zoom: 18,
                pitch: 60,
                bearing: 0,
                duration: 2000
            });
        }
    }

    /**
     * Toggle model visibility
     * @param {string} modelId - Model identifier
     * @param {HTMLElement} button - The visibility button element
     */
    toggleModelVisibility(modelId, button) {
        const isVisible = button.textContent === '👁️';
        this.threeJSLayer.setModelVisibility(modelId, !isVisible);
        button.textContent = isVisible ? '🙈' : '👁️';
        button.title = isVisible ? 'Show model' : 'Hide model';
    }

    /**
     * Remove a model
     * @param {string} modelId - Model identifier
     */
    removeModel(modelId) {
        if (confirm(`Are you sure you want to remove the model "${modelId}"?`)) {
            this.threeJSLayer.removeModel(modelId);
            this.removeModelControl(modelId);
        }
    }

    /**
     * Show dialog for adding a new model
     */
    showAddModelDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'model-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Add 3D Model</h3>
                <form id="add-model-form">
                    <div class="form-group">
                        <label for="model-name">Model Name:</label>
                        <input type="text" id="model-name" required>
                    </div>
                    <div class="form-group">
                        <label for="model-file">Model File:</label>
                        <select id="model-file" required>
                            <option value="">Select a model...</option>
                            <option value="models/drone.glb">Drone (Local GLB)</option>
                            <option value="https://maplibre.org/maplibre-gl-js/docs/assets/34M_17/34M_17.gltf">Demo Building (Remote)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="model-coordinates">Coordinates (lng, lat):</label>
                        <input type="text" id="model-coordinates" placeholder="e.g., 148.9819, -35.3981" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit">Add Model</button>
                        <button type="button" id="cancel-dialog">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(dialog);

        // Handle form submission
        const form = document.getElementById('add-model-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddModel(dialog);
        });

        // Handle cancel
        document.getElementById('cancel-dialog').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }

    /**
     * Handle adding a new model from the dialog
     * @param {HTMLElement} dialog - The dialog element
     */
    async handleAddModel(dialog) {
        const name = document.getElementById('model-name').value;
        const file = document.getElementById('model-file').value;
        const coordinatesStr = document.getElementById('model-coordinates').value;

        try {
            // Parse coordinates
            const [lng, lat] = coordinatesStr.split(',').map(s => parseFloat(s.trim()));
            
            if (isNaN(lng) || isNaN(lat)) {
                throw new Error('Invalid coordinates format');
            }

            // Add the model
            const modelId = `model_${Date.now()}`;
            await this.threeJSLayer.addModel(modelId, file, [lng, lat]);
            
            // Add UI control
            this.addModelControl(modelId, name);
            
            // Close dialog
            document.body.removeChild(dialog);
            
            // Zoom to the new model
            this.zoomToModel(modelId);
            
        } catch (error) {
            alert(`Failed to add model: ${error.message}`);
        }
    }

    /**
     * Create a quick zoom button for a specific model
     * @param {string} modelId - Model identifier
     * @param {Array} coordinates - [longitude, latitude]
     * @returns {HTMLElement} The created button element
     */
    createQuickZoomButton(modelId, coordinates) {
        const button = document.createElement('button');
        button.className = 'quick-zoom-btn';
        button.textContent = `📍 ${modelId}`;
        button.title = `Zoom to ${modelId}`;
        
        button.addEventListener('click', () => {
            this.map.flyTo({
                center: coordinates,
                zoom: 18,
                pitch: 60,
                bearing: 0,
                duration: 2000
            });
        });

        return button;
    }
}