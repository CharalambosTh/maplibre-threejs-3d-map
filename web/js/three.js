import { map } from "./main.js";
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as MTP from '@dvt3d/maplibre-three-plugin';

export function init() {
    //init three scene
    const mapScene= new MTP.MapScene(map)

    //add light
    mapScene.addLight(new THREE.AmbientLight())

    //add model
    const glTFLoader= new GLTFLoader();

    glTFLoader.load('./js/models/drone.glb', (gltf) => {
    let rtcGroup = MTP.Creator.createRTCGroup([33.3823, 35.1856,100])
    gltf.scene.scale.set(10, 10, 10);
    rtcGroup.add(gltf.scene)
    mapScene.addObject(rtcGroup)
    })

    // create button dynamically
    const btn = document.createElement('button');
    btn.textContent = "Fly to Drone";
    btn.style.position = "absolute";
    btn.style.top = "10px";
    btn.style.left = "10px";
    btn.style.zIndex = 10;
    document.body.appendChild(btn);

    // on click, zoom to the drone location
    btn.onclick = () => {
    map.flyTo({
        center: [33.3823, 35.1856], // [lon, lat]
        zoom: 19,     // same zoom as in URL
        pitch: -90,       // look straight down
        bearing: 0,   // slight rotation for same view
        speed: 0.8,
        curve: 1.2
    });
    };

    map.on('render', () => {
        mapScene.render();
    });

}