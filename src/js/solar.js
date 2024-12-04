
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TrackballControls} from 'three/addons/controls/TrackballControls.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {Lensflare, LensflareElement} from 'three/addons/objects/Lensflare.js';
import {Text} from 'trioka-three-text';

class Solar {
    constructor() {
        const planets = {
            sun: 0,
            mercury: 1,
            venus: 2,
            earth: 3,
            mars: 4,
            jupitor: 5,
            saturn: 6,
            uranus: 7,
            neptune: 8,
            pluto: 9,
        };
        this.planets = planets;
    };

    getObjects = (planets, baseRadius = 2) => {
      const planetGroup = new THREE.Group();
      switch (planets) {
        case this.planets.sun: {} break;
        case this.planets.mercury: {} break;
        case this.planets.venus: {} break;
        case this.planets.earth: {

          // planets
          // Load Textures
          const earthRadius = baseRadius || 2;
          const cloudRadius = earthRadius * (1 + earthRadius * 0.025)
          const atmosphereRadius = earthRadius * (1 + earthRadius * 0.2);
          const numberOfMesh = 256
          const textureLoader = new THREE.TextureLoader();
          const diffuseMap = textureLoader.load('./src/img/textures/earth/Earth_Diffuse_6K_edit.jpg');
          //const glossinessMap = textureLoader.load('./src/img/textures/earth/Earth_Glossiness_6K.jpg');
          //const illuminationMap = textureLoader.load('./src/img/textures/earth/Earth_Illumination_6K.jpg');
          const normalMap = textureLoader.load('./src/img/textures/earth/Earth_NormalNRM_6K.jpg');
          const cloudMap = textureLoader.load('./src/img/textures/earth/Earth_Clouds_6K.jpg');

          // Earth Material
          const earthMaterial = new THREE.MeshStandardMaterial({
            map: diffuseMap,
            //roughnessMap: glossinessMap,  // Might need to adjust depending on map type
            //roughness: 10,
            //emissiveMap: illuminationMap,
            //emissiveIntensity: 1,       // Adjust based on how bright you want city lights
            displacementMap: normalMap,
            displacementScale: earthRadius * 0.0025,
            transparent: false,
            opacity: 1,
            //blending: THREE.NoBlending,
          });

          // Earth Sphere
          const earthGeometry = new THREE.SphereGeometry(earthRadius, numberOfMesh, numberOfMesh);  // Adjust size as needed
          const earth = new THREE.Mesh(earthGeometry, earthMaterial);

          // Clouds (Separate Sphere with Transparency)
          const cloudMaterial = new THREE.MeshStandardMaterial({
            map: cloudMap,
            displacementMap: cloudMap,
            displacementScale: cloudRadius * 0.01,
            transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: 0.9,                 // Adjust for desired cloud density
          });
          const cloudGeometry = new THREE.SphereGeometry(cloudRadius, numberOfMesh, numberOfMesh);  // Slightly larger than Earth
          const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
          //clouds.geometry.boundingSphere = 500;

          // Haze Material
          const hazeShaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
              color: { value: new THREE.Color(0x0055ff) },
              opacity: { value: 0.5 },
              blurAmount: { value: 1.0 } // Control the blur intensity
            },
            vertexShader: `
              varying vec3 vPosition;
              void main() {
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform vec3 color;
              uniform float opacity;
              uniform float blurAmount;
              varying vec3 vPosition;
              void main() {
                float dist = length(vPosition);
                float alpha = opacity * smoothstep(1.0, 1.0 + blurAmount, dist); // Fades at the edge
                gl_FragColor = vec4(color, alpha);
              }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
          });
          const hazeGeometry = new THREE.SphereGeometry(atmosphereRadius, numberOfMesh, numberOfMesh);
          const atmosphereHaze = new THREE.Mesh(hazeGeometry, hazeShaderMaterial);
          
          // Group Earth and Clouds
          const earthGroup = new THREE.Group();
          earthGroup.add(earth);
          earthGroup.add(clouds);
          earthGroup.add(atmosphereHaze);

          const ambientLight = new THREE.AmbientLight(0xaaaaaa);  // Soft light
          //const light = new THREE.SpotLight(0xeeaaee, 4, 0, Math.PI / 4, 10, 0.5);
          //light.position.set(3, 50, 3);
    
          planetGroup.add(earthGroup);
          planetGroup.add(ambientLight);
          //planetGroup.add(light);

/*    
          // Load Textures
          const earthRadius = 5;
          const cloudRadius = earthRadius * 1.001;
          const atmosphereRadius = earthRadius * 1.01;
          const numberOfMesh = 256;
          const textureLoader = new THREE.TextureLoader();
          const diffuseMap = textureLoader.load('./src/img/textures/earth/Earth_Diffuse_6K.jpg');
          const glossinessMap = textureLoader.load('./src/img/textures/earth/Earth_Glossiness_6K.jpg');
          const illuminationMap = textureLoader.load('./src/img/textures/earth/Earth_Illumination_6K.jpg');
          const normalMap = textureLoader.load('./src/img/textures/earth/Earth_NormalNRM_6K.jpg');
          const cloudMap = textureLoader.load('./src/img/textures/earth/Earth_Clouds_6K.jpg');

          // Earth Shader Material
          const earthShaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
              dayMap: { value: diffuseMap },
              glossinessMap: { value: glossinessMap },
              nightMap: { value: illuminationMap },
              normalMap: { value: normalMap },
              lightDirection: { value: new THREE.Vector3(5, 3, 5).normalize() } // Initial light direction
            },
            vertexShader: `
              varying vec2 vUv;
              varying vec3 vNormal;
              void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform sampler2D dayMap;
              uniform sampler2D nightMap;
              uniform sampler2D normalMap;
              uniform vec3 lightDirection;
              varying vec2 vUv;
              varying vec3 vNormal;

              void main() {
                // Calculate light factor
                float lightFactor = dot(vNormal, lightDirection);

                // Sample day (diffuse) and night (illumination) textures
                vec4 dayColor = texture2D(dayMap, vUv);
                vec4 nightColor = texture2D(nightMap, vUv);

                // Mix colors based on light factor: day color when lit, night color when in shadow
                vec4 color = mix(nightColor, dayColor, step(0.0, lightFactor));
                gl_FragColor = color;
              }
            `,
            transparent: true,
          });

          // Earth Sphere
          const earthGeometry = new THREE.SphereGeometry(earthRadius, numberOfMesh, numberOfMesh);
          const earth = new THREE.Mesh(earthGeometry, earthShaderMaterial);

          // Clouds (Separate Sphere with Transparency)
          const cloudMaterial = new THREE.MeshStandardMaterial({
            map: cloudMap,
            transparent: true,
            opacity: 0.5,  // Adjust for desired cloud density
          });
          const cloudGeometry = new THREE.SphereGeometry(cloudRadius, numberOfMesh, numberOfMesh);
          const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);

          // Haze Material
          const hazeShaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
              color: { value: new THREE.Color(0x55aaff) },
              opacity: { value: 0.8 },
              blurAmount: { value: 1 } // Control the blur intensity
            },
            vertexShader: `
              varying vec3 vPosition;
              void main() {
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
            fragmentShader: `
              uniform vec3 color;
              uniform float opacity;
              uniform float blurAmount;
              varying vec3 vPosition;
              void main() {
                float dist = length(vPosition);
                float alpha = opacity * smoothstep(1.0, 1.0 + blurAmount, dist); // Fades at the edge
                gl_FragColor = vec4(color, alpha);
              }
            `,
            transparent: true,
            blending: THREE.NormalBlending,
            side: THREE.BackSide,
          });
          const hazeGeometry = new THREE.SphereGeometry(atmosphereRadius, numberOfMesh, numberOfMesh);
          const atmosphereHaze = new THREE.Mesh(hazeGeometry, hazeShaderMaterial);

          // Group Earth and Clouds
          const earthGroup = new THREE.Group();
          earthGroup.add(earth);
          earthGroup.add(clouds);
          earthGroup.add(atmosphereHaze);
          planetGroup.add(earthGroup);
*/

        } break;
        case this.planets.mars: {} break;
        case this.planets.jupitor: {} break;
        case this.planets.saturn: {} break;
        case this.planets.uranus: {} break;
        case this.planets.neptune: {} break;
        case this.planets.pluto: {} break;
        default: {} break;
      }
      return planetGroup;
    }
    
    render = (planets, renderElement) => {
      let world = new THREE.Group();
      this.labels = [];
      let windowSize = {
        height: (window.innerHeight < window.innerWidth)
          ? window.innerHeight
          : window.innerWidth * 16 / 9,
        width: window.innerWidth
      };
      // シーンとカメラ
      const ASPECT = windowSize.width / windowSize.height;
      this.scene = new THREE.Scene();
      let scene = this.scene;
      this.perspectiveCamera = new THREE.PerspectiveCamera(
        14,
        ASPECT,
        0.001,
        999999
      );

      this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
      let renderer = this.renderer;
      //scene.fog = new THREE.Fog(0x0000000, 0, 150);

      // レンダラーとDOMの設定
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(windowSize.width, windowSize.height);
      renderer.toneMapping = THREE.ReinhardToneMapping;
      renderer.toneMappingExposure = Math.pow(0.8, 2.0);
      renderer.setClearColor( 0x000000, 0.5 )
      renderer.domElement.style.transform = `scale(${((window.innerHeight < window.innerWidth)? 1 : window.innerHeight / windowSize.height)})`;
      renderElement.appendChild(renderer.domElement);
      // コントローラーの定義
      let target = new THREE.Vector3(0, 0, 0) 
      this.resetController(target);

      // カメラ位置
      this.initialDirection = new THREE.Vector3(0,1,0)
      this.perspectiveCamera.setFocalLength(14);
      this.perspectiveCamera.position.set(5, 0, 0);
      this.perspectiveCamera.rotation.order = "XYZ";
      this.perspectiveCamera.lookAt(this.initialDirection);
      this.perspectiveCamera.up = new THREE.Vector3(0, 1, 0);
      this.trackballControls.target = target;
      this.orbitControls.target = target;

      // Planets
      let objectsGroup = this.getObjects(planets);
      world.add(objectsGroup);

      scene.add(world);
      // composer setting
      const renderScene   = new RenderPass( scene, this.perspectiveCamera );
      const composer      = new EffectComposer( renderer );
      const bloomComposer = new EffectComposer(renderer);
      const finalComposer = new EffectComposer(renderer);
      composer.setSize(windowSize.width, windowSize.height);
      bloomComposer.renderToScreen = false;
      bloomComposer.addPass(renderScene);
      
      // Bloom
      const bloomParams = {
        exposure: 2.1,
        bloomStrength: .95,
        bloomRadius: 1.1,
        bloomThreshold: 0,
      };
      renderer.toneMapping = THREE.ReinhardToneMapping;
      renderer.toneMappingExposure = bloomParams.exposure;
      const bloomPass = new UnrealBloomPass(new THREE.Vector2(windowSize.width, windowSize.height), bloomParams.bloomStrength, bloomParams.bloomRadius, bloomParams.bloomThreshold);
      bloomComposer.addPass(bloomPass);
      const finalPass = new ShaderPass(
        new THREE.ShaderMaterial({
          uniforms: {
            baseTexture: { value: null },
            bloomTexture: { value: bloomComposer.renderTarget2.texture },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
            `,
          fragmentShader: `
            uniform sampler2D baseTexture;
            uniform sampler2D bloomTexture;
            varying vec2 vUv;
            void main() {
              gl_FragColor = texture2D( baseTexture, vUv );
              gl_FragColor += vec4( 1.0 ) * texture2D( bloomTexture, vUv );
            }
            `,
          defines: {}
        }),
        "baseTexture"
      );
      finalPass.needsSwap = true;
      finalComposer.addPass(renderScene);
      finalComposer.addPass(finalPass);
      composer.addPass( renderScene );
      renderer.setAnimationLoop((_) => {
        renderer.render(scene, this.perspectiveCamera);
        composer.render();
        bloomComposer.render();
        finalComposer.render();
        this.trackballControls.update();
        this.orbitControls.update();
      });
      this.updateScene = () => {
        renderer.render(scene, this.perspectiveCamera);
      }

    }
    resetController = (target) => {
      this.trackballControls = new TrackballControls(this.perspectiveCamera, this.renderer.domElement);
      this.trackballControls.target = target
      this.trackballControls.noZoom = false;
      this.trackballControls.zoomSpeed = 2;
      this.trackballControls.noPan = false;
      this.trackballControls.panSpeed = 0.02;
      this.trackballControls.noRotate = false;
      this.trackballControls.rotateSpeed = 0.5; // to make it opposite set -0.5
      this.trackballControls.staticMoving = false;
      this.trackballControls.dynamicDampingFactor = 0.05;
      this.trackballControls.keys = [ 'KeyA', 'KeyS', 'KeyD' ]; // [ rotateKey, zoomKey, panKey ]
      this.trackballControls.update();
      // Orbit Controls
      this.orbitControls = new OrbitControls(this.perspectiveCamera, this.renderer.domElement);
      this.orbitControls.target = target;
      this.orbitControls.maxPolarAngle = Infinity;
      this.orbitControls.minPolarAngle = -Infinity;
      this.orbitControls.maxAzimuthAngle = Infinity;
      this.orbitControls.minAzimuthAngle = -Infinity;
      this.orbitControls.enableDamping = true;
      this.orbitControls.dampingFactor = 0.02;
      this.orbitControls.enablePan = false;
      this.orbitControls.enableZoom = false;
      this.orbitControls.enableRotate = false;
      this.orbitControls.autoRotate = true;
      this.orbitControls.autoRotateSpeed = 1.0;
      this.orbitControls.update();
    };
}

export default Solar;