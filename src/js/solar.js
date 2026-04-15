
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
            jupiter: 5,
            saturn: 6,
            uranus: 7,
            neptune: 8,
            pluto: 9,
        };
        this.planets = planets;
    };
    getOrbitPosition = (t, params, scale = 1) => {
      const { a, e, i, omega, Omega, T } = params;
    
      // 離心近点角 E を解く
      const solveKepler = (M, e, tolerance = 1e-6) => {
        let E = M;
        let delta = 1;
        while (Math.abs(delta) > tolerance) {
          delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
          E -= delta;
        }
        return E;
      };
    
      // 平均近点角 M
      const M = (2 * Math.PI / T) * t;
      const E = solveKepler(M, e);
    
      // 軌道平面座標（XY平面上）
      const x = a * (Math.cos(E) - e);
      const y = a * Math.sqrt(1 - e * e) * Math.sin(E);
      const z = 0;
    
      // 回転行列適用
      const pos = new THREE.Vector3(x, y, z);
      const rot = new THREE.Matrix4()
        .makeRotationZ(THREE.MathUtils.degToRad(Omega))
        .multiply(new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(i)))
        .multiply(new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(omega)));
    
      pos.applyMatrix4(rot);
    
      // === 🚀 ここが重要 ===
      // XY基準をXZ基準に変換（Yを高さ軸に）
      const converted = new THREE.Vector3(pos.x, pos.z, -pos.y);
    
      return converted.multiplyScalar(scale);
    };
    createOrbitLine = (orbit, segments = 512, scale = 1) => {
      const positions = [];
    
      for (let i = 0; i <= segments; i++) {
        const M = (2 * Math.PI * i) / segments;
    
        let E = M;
        for (let j = 0; j < 5; j++) {
          E = M + orbit.e * Math.sin(E);
        }
    
        const x = orbit.a * (Math.cos(E) - orbit.e);
        const y = orbit.a * Math.sqrt(1 - orbit.e * orbit.e) * Math.sin(E);
        const z = 0;
    
        const pos = new THREE.Vector3(x, y, z);
    
        const rot = new THREE.Matrix4()
          .makeRotationZ(THREE.MathUtils.degToRad(orbit.Omega))
          .multiply(new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(orbit.i)))
          .multiply(new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(orbit.omega)));
    
        pos.applyMatrix4(rot);
    
        // === 🚀 軌道線も同様に座標変換 ===
        const converted = new THREE.Vector3(pos.x, pos.z, -pos.y);
    
        positions.push(converted.x * scale, converted.y * scale, converted.z * scale);
      }
    
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    
      const material = new THREE.LineBasicMaterial({
        color: 0xaaaaaa,
        transparent: true,
        opacity: 0.4,
      });
    
      return new THREE.LineLoop(geometry, material);
    };
    

    getObjects = (planets, baseRadius = 0.05, radiusScale = 1.00) => {
      const planetGroup = new THREE.Group();
      let getPlanetGroup = (options) => {
        const radius = options.radius || 2;
        const cloudRadius = radius * (1 + radius * 0.025)
        const atmosphereRadius = radius;
        const numberOfMesh = 256
        const textureLoader = new THREE.TextureLoader();
        const diffuseMap = textureLoader.load(options.diffuseMapPath);
        const normalMap = (options.normalMapPath !== undefined) ? textureLoader.load(options.normalMapPath) : undefined;

        // Material
        const material = new THREE.MeshStandardMaterial({
          map: diffuseMap,
          displacementMap: normalMap,
          displacementScale: radius * (options.displacementScale ? options.displacementScale : -0.05),
          transparent: false,
          opacity: 1,
          //blending: THREE.NoBlending,
        });

        // Sphere
        const geometry = new THREE.SphereGeometry(radius, numberOfMesh, numberOfMesh);  // Adjust size as needed
        const planetMesh = new THREE.Mesh(geometry, material);
        
        // Group
        const group = new THREE.Group();
        group.add(planetMesh);
        
        return group;
      };
      
      switch (planets) {
        case this.planets.sun: {
          const radius = (baseRadius) * 109.25 * radiusScale;
          const color = converters.getColorFromStellarClassString("G2V");
          const colorCode = `#${('0'+parseInt(color.r).toString(16)).slice(-2)}${('0'+parseInt(color.g).toString(16)).slice(-2)}${('0'+parseInt(color.b).toString(16)).slice(-2)}`
          const orbitParam = {
            a: radius * 0,        // 太陽は中心に固定
            e: 0,                    // 公転しない
            i: 0,
            Omega: 0,
            omega: 0,
            T:Infinity
          };

          const starGeometry = new THREE.SphereGeometry(radius, 256, 256); // Higher resolution geometry
          const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const starMesh = new THREE.InstancedMesh(starGeometry, starMaterial, 1);
          const dummy = new THREE.Object3D();
          starMesh.setMatrixAt(0, dummy.matrix);

          // Initial twinkle effect (if needed)
          const twinkleFactor = Math.sin(Date.now() * 0.005) * 0.8 + 2 ; // Initial twinkle effect
          const twinkleColor = new THREE.Color(colorCode).multiplyScalar(twinkleFactor);    
          starMesh.setColorAt(0, twinkleColor);

          planetGroup.add(starMesh);

          planetGroup.updateOrbit = (tDays, scale = 1, callback = (pos)=>{}) => {
            const pos = this.getOrbitPosition(tDays, orbitParam, scale);
            planetGroup.position.copy(pos);
            callback(pos, planetGroup);
          }
          planetGroup.getOrbitLine = (scale = 1) => this.createOrbitLine(orbitParam, 512, scale);
        } break;
        case this.planets.mercury: {
          const radius = (baseRadius) * 0.383;
          console.log(baseRadius, radius);
          const orbitParam = {
            a: radius * 23736.14,    // a (地球半径単位)
            e: 0.20563069,
            i: 7.00487,
            Omega: 48.33167,
            omega: 29.12478,  // argument of perihelion = pi - Omega
            T: 87.968
          };

          planetGroup.add(getPlanetGroup({
            radius: radius * radiusScale, 
            diffuseMapPath: './src/img/textures/mercury/mercurymap.jpg', 
            normalMapPath: './src/img/textures/mercury/mercurybump.jpg',
            displacementScale: -0.005
          }));
          planetGroup.updateOrbit = (tDays, scale = 1, callback = (pos)=>{}) => {
            const pos = this.getOrbitPosition(tDays, orbitParam, scale);
            planetGroup.position.copy(pos);
            callback(pos, planetGroup);
          }
          planetGroup.getOrbitLine = (scale = 1) => this.createOrbitLine(orbitParam, 512, scale);
        } break;
        case this.planets.venus: {
          const radius = (baseRadius) * 0.950;
          console.log(baseRadius, radius);
          const orbitParam = {
            a: radius * 17880.30,
            e: 0.00677323,
            i: 3.39471,
            Omega: 76.68069,
            omega: 54.85229,
            T: 224.697
          };

          planetGroup.add(getPlanetGroup({
            radius: radius * radiusScale, 
            diffuseMapPath: './src/img/textures/venus/venusmap.jpg', 
            normalMapPath: './src/img/textures/venus/venusbump.jpg',
            displacementScale: -0.0025
          }));
          planetGroup.updateOrbit = (tDays, scale = 1, callback = (pos)=>{}) => {
            const pos = this.getOrbitPosition(tDays, orbitParam, scale);
            planetGroup.position.copy(pos);
            callback(pos, planetGroup);
          }
          planetGroup.getOrbitLine = (scale = 1) => this.createOrbitLine(orbitParam, 512, scale);
        } break;
        case this.planets.earth: {

          // planets
          // Load Textures
          const earthRadius = baseRadius * radiusScale;
          console.log(baseRadius, earthRadius);
          const cloudRadius = earthRadius * (1 + earthRadius * 0.025)
          const atmosphereRadius = earthRadius * (1 + earthRadius * 0.2);
          const numberOfMesh = 256
          const textureLoader = new THREE.TextureLoader();
          const diffuseMap = textureLoader.load('./src/img/textures/earth/Earth_Diffuse_6K_edit.jpg');
          //const glossinessMap = textureLoader.load('./src/img/textures/earth/Earth_Glossiness_6K.jpg');
          //const illuminationMap = textureLoader.load('./src/img/textures/earth/Earth_Illumination_6K.jpg');
          const normalMap = textureLoader.load('./src/img/textures/earth/Earth_NormalNRM_6K.jpg');
          const cloudMap = textureLoader.load('./src/img/textures/earth/Earth_Clouds_6K.jpg');
          const orbitParam = {
            a: baseRadius * 23481.07,
            e: 0.0167,
            i: 0.00005,
            Omega: -11.26064,
            omega: 102.94719,
            T: 365.256
          };
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

          //const light = new THREE.SpotLight(0xeeaaee, 4, 0, Math.PI / 4, 10, 0.5);
          //light.position.set(3, 50, 3);
    
          earthGroup.rotation.z = THREE.MathUtils.degToRad(23.4);
          planetGroup.add(earthGroup);

          planetGroup.updateOrbit = (tDays, scale = 1, callback = (pos)=>{}) => {
            const pos = this.getOrbitPosition(tDays, orbitParam, scale);
            planetGroup.position.copy(pos);
            callback(pos, planetGroup);
          }
          planetGroup.getOrbitLine = (scale = 1) => this.createOrbitLine(orbitParam, 512, scale);
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
        case this.planets.mars: {
          const radius = (baseRadius) * 0.532;
          const orbitParam = {
            a: radius * 67248.62,
            e: 0.09341233,
            i: 1.85061,
            Omega: 49.57854,
            omega: 286.46230,
            T: 686.980
          };

          planetGroup.add(getPlanetGroup({
            radius: radius * radiusScale, 
            diffuseMapPath: './src/img/textures/mars/mars_1k_color.jpg', 
            normalMapPath: './src/img/textures/mars/marsbump1k.jpg',
            displacementScale: -0.05
          }));

          planetGroup.updateOrbit = (tDays, scale = 1, callback = (pos)=>{}) => {
            const pos = this.getOrbitPosition(tDays, orbitParam, scale);
            planetGroup.position.copy(pos);
            callback(pos, planetGroup);
          }
          planetGroup.getOrbitLine = (scale = 1) => this.createOrbitLine(orbitParam, 512, scale);
        } break;
        case this.planets.jupiter: {
          const radius = (baseRadius) * 10.97;
          const orbitParam = {
            a: radius * 11133.31,
            e: 0.04839266,
            i: 1.30530,
            Omega: 100.55615,
            omega:  (14.75385), // already argument of perihelion in source
            T: 4332.589
          };
          planetGroup.add(getPlanetGroup({
            radius: radius * radiusScale,
            diffuseMapPath: './src/img/textures/jupiter/jupiter2_4k.jpg'
          }));

          planetGroup.updateOrbit = (tDays, scale = 1, callback = (pos)=>{}) => {
            const pos = this.getOrbitPosition(tDays, orbitParam, scale);
            planetGroup.position.copy(pos);
            callback(pos, planetGroup);
          }
          planetGroup.getOrbitLine = (scale = 1) => this.createOrbitLine(orbitParam, 512, scale);
        } break;
        case this.planets.saturn: {
          const radius = (baseRadius) * 9.14;
          console.log(baseRadius, radius);
          const orbitParam = {
            a: radius * 24499.70,
            e: 0.05415060,
            i: 2.48446,
            Omega: 113.71504,
            omega:  (92.43194),
            T: 10757.533
          };

          // Ring
          const innerRadius = radius * 1.24 * radiusScale;
          const outerRadius = radius * 2.33 * radiusScale;
          const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 256);
          const uv = ringGeometry.attributes.uv;
          const pos = ringGeometry.attributes.position;
          for (let i = 0; i < uv.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            // 角度を0～1に正規化
            const theta = (Math.atan2(y, x) + Math.PI) / (2 * Math.PI);
          
            // 半径を0～1に正規化
            const r = (Math.sqrt(x * x + y * y) - innerRadius) / (outerRadius - innerRadius);
          
            // U と V を入れ替える
            uv.setXY(i, r, theta);
          }
          uv.needsUpdate = true;

          // === マテリアル ===
          const texture = new THREE.TextureLoader().load('./src/img/textures/saturn/saturnringcolor.jpg');
          const alphaMap = new THREE.TextureLoader().load('./src/img/textures/saturn/saturnringpattern.gif');
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          
          const ringMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            alphaMap: alphaMap,
            side: THREE.DoubleSide,
            transparent: true,
          });
          const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial)
          const ringGroup = new THREE.Group();
          ringMesh.rotation.x = THREE.MathUtils.degToRad(90)
          ringGroup.add(ringMesh);;

          // planet
          planetGroup.add(getPlanetGroup({
            radius: radius * radiusScale,
            diffuseMapPath: './src/img/textures/saturn/saturnmap.jpg'
          }));
          planetGroup.add(ringGroup);

          planetGroup.updateOrbit = (tDays, scale = 1, callback = (pos)=>{}) => {
            const pos = this.getOrbitPosition(tDays, orbitParam, scale);
            planetGroup.position.copy(pos);
            callback(pos, planetGroup);
          }
          planetGroup.getOrbitLine = (scale = 1) => this.createOrbitLine(orbitParam, 512, scale);
        } break;
        case this.planets.uranus: {
          const radius = (baseRadius) * 3.98;
          console.log(baseRadius, radius);
          const orbitParam = {
            a: radius * 113199.76,
            e: 0.04716771,
            i: 0.76986,
            Omega: 74.22988,
            omega: 96.73436,
            T: 30707.580
          };

          // Ring
          const innerRadius = radius * 2.02 * radiusScale;
          const outerRadius = radius * 2.04 * radiusScale;
          const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 256);
          const uv = ringGeometry.attributes.uv;
          const pos = ringGeometry.attributes.position;
          for (let i = 0; i < uv.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            // 角度を0～1に正規化
            const theta = (Math.atan2(y, x) + Math.PI) / (2 * Math.PI);
          
            // 半径を0～1に正規化
            const r = (Math.sqrt(x * x + y * y) - innerRadius) / (outerRadius - innerRadius);
          
            // U と V を入れ替える
            uv.setXY(i, r, theta);
          }
          uv.needsUpdate = true;

          // === マテリアル ===
          const texture = new THREE.TextureLoader().load('./src/img/textures/uranus/uranusringcolour.jpg');
          const alphaMap = new THREE.TextureLoader().load('./src/img/textures/uranus/uranusringtrans.gif');
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          
          const ringMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            alphaMap: alphaMap,
            side: THREE.DoubleSide,
            transparent: true,
          });
          const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial)
          const ringGroup = new THREE.Group();
          ringMesh.rotation.x = THREE.MathUtils.degToRad(90)
          ringGroup.add(ringMesh);;

          // planet
          planetGroup.add(getPlanetGroup({
            radius: radius * radiusScale,
            diffuseMapPath: './src/img/textures/uranus/uranusmap.jpg'
          }));
          planetGroup.add(ringGroup);

          planetGroup.updateOrbit = (tDays, scale = 1, callback = (pos)=>{}) => {
            const pos = this.getOrbitPosition(tDays, orbitParam, scale);
            planetGroup.position.copy(pos);
            callback(pos, planetGroup);
          }
          planetGroup.getOrbitLine = (scale = 1) => this.createOrbitLine(orbitParam, 512, scale);

        } break;
        case this.planets.neptune: {
          const radius = (baseRadius) * 3.87
          console.log(baseRadius, radius);
          const orbitParam = {
            a: radius * 182692.43,
            e: 0.00858587,
            i: 1.76917,
            Omega: 131.72169,
            omega: -86.75034,
            T: 60223.766
          };

          planetGroup.add(getPlanetGroup({
            radius: radius * radiusScale,
            diffuseMapPath: './src/img/textures/neptune/neptunemap.jpg'
          }));

          planetGroup.updateOrbit = (tDays, scale = 1, callback = (pos)=>{}) => {
            const pos = this.getOrbitPosition(tDays, orbitParam, scale);
            planetGroup.position.copy(pos);
            callback(pos, planetGroup);
          }
          planetGroup.getOrbitLine = (scale = 1) => this.createOrbitLine(orbitParam, 512, scale);
        } break;
        case this.planets.pluto: {
          const radius = (baseRadius) * 0.186;
          const orbitParam = {
            a: radius * 4970445.17,   // 冥王星の軌道長半径（他と同じ比率に基づく）
            e: 0.2488,
            i: 17.16,
            Omega: 110.299,
            omega: 113.834,
            T: 90560,                // 公転周期 [days]
          };
          console.log(baseRadius, radius);

          planetGroup.add(getPlanetGroup({
            radius: radius * radiusScale, 
            diffuseMapPath: './src/img/textures/pluto/plutomap2k.jpg', 
            normalMapPath: './src/img/textures/pluto/plutobump2k.jpg',
            displacementScale: -0.025
          }));
          
          planetGroup.updateOrbit = (tDays, scale = 1, callback = (pos)=>{}) => {
            const pos = this.getOrbitPosition(tDays, orbitParam, scale);
            planetGroup.position.copy(pos);
            callback(pos, planetGroup);
          }
          planetGroup.getOrbitLine = (scale = 1) => this.createOrbitLine(orbitParam, 512, scale);
        } break;
        default: {} break;
      }
      return planetGroup;
    }
    
    getBelt = (beltType, scale = 1.00) => {
      const createBeltMaterial = (beltType) => {
        const params = {
          asteroid: {
            color: new THREE.Color(0x5a503e),
            innerRadius: 2.2 * 1.00,
            thickness: 0.3,
            noiseScale: Math.random() * 25,   // 粒子感アップ
            noiseStrength: Math.random(), // ノイズの強さ
            alphaScale: Math.random()     // 全体の透明度スケール
          },
          kuiper: {
            color: new THREE.Color(0x4d647c),
            innerRadius: 12.0 * 1.00,
            thickness: 1.0,
            noiseScale: Math.random() * 60,
            noiseStrength: 0.05 * Math.random(),
            alphaScale: Math.random()
          }
        }[beltType];
      
        return new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: params.color },
            uNoiseScale: { value: params.noiseScale },
            uNoiseStrength: { value: params.noiseStrength },
            uThickness: { value: params.thickness },
            uAlphaScale: { value: params.alphaScale },
          },
      
          vertexShader: `
            varying vec3 vPosition;
            void main() {
              vPosition = normalize(position);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
      
          fragmentShader: `
            varying vec3 vPosition;
            uniform float uTime;
            uniform vec3 uColor;
            uniform float uThickness;
            uniform float uNoiseScale;
            uniform float uNoiseStrength;
            uniform float uAlphaScale;
      
            // hash & noise
            float hash(vec3 p) {
              p = vec3(dot(p, vec3(127.1,311.7,74.7)),
                       dot(p, vec3(269.5,183.3,246.1)),
                       dot(p, vec3(113.5,271.9,124.6)));
              return fract(sin(p.x+p.y+p.z)*43758.5453123);
            }
      
            float noise(vec3 p) {
              vec3 i = floor(p);
              vec3 f = fract(p);
              float n = mix(
                mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                    mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                    mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
                f.z
              );
              return n;
            }
      
            void main() {
              float latitude = acos(vPosition.y);
              float band = smoothstep(uThickness, 0.0, abs(latitude - 3.1415926 / 2.0));
      
              // より粒状のノイズ
              float n = noise(vPosition * uNoiseScale + vec3(0.0, uTime * 0.1, 0.0));
      
              // コントラストを強調（粒子感アップ）
              n = pow(n, 3.0);
      
              // α（透明度）を低めに
              float alpha = band * (0.1 + n * uNoiseStrength) * uAlphaScale;
      
              if (alpha < 0.05) discard;
      
              gl_FragColor = vec4(uColor * (0.4 + 0.6 * n), alpha);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          //side: THREE.DoubleSide,
          depthWrite: false,
        });
      };
      
    
      const group = new THREE.Group();
      switch (beltType) {
        case "asteroid": {
          let meshList = (new Array(10)).fill().map((v,i) => (3800 + i * 190) * scale);

          meshList.forEach(s => {
            const mesh = new THREE.Mesh(
              new THREE.SphereGeometry(s, 32, 32),
              createBeltMaterial("asteroid")
            );
            group.add(mesh);
          })

          break;
        }
        case "kuiper": {
          let meshList = (new Array(30)).fill().map((v,i) => (42000 + i * 1500) * scale);
          meshList.forEach(s => {
            const mesh = new THREE.Mesh(
              new THREE.SphereGeometry(s, 16, 16),
              createBeltMaterial("kuiper")
            );
            group.add(mesh);
          })
          break;
        }
      }
    
      return group;
    };

    // ===== 彗星・流星群母天体データ =====
    COMET_DATA = {
      // --- 著名彗星 ---
      halley: {
        nameEn: "1P/Halley",
        nameJa: "ハレー彗星",
        meteorShower: "オリオン座流星群・みずがめ座η流星群",
        a_AU: 17.83,
        e: 0.9671,
        i: 162.26,
        Omega: 58.42,
        omega: 111.33,
        T: 27507,
        color: 0xaaddff,
      },
      encke: {
        nameEn: "2P/Encke",
        nameJa: "エンケ彗星",
        meteorShower: "おうし座流星群",
        a_AU: 2.2179,
        e: 0.84834,
        i: 11.782,
        Omega: 334.567,
        omega: 186.544,
        T: 1205,
        color: 0xbbddff,
      },
      neowise: {
        nameEn: "C/2020 F3",
        nameJa: "ネオワイズ彗星",
        meteorShower: null,
        a_AU: 358.0,
        e: 0.99922,
        i: 128.93,
        Omega: 61.01,
        omega: 37.28,
        T: 2474620,
        color: 0xffeecc,
      },
      tempel1: {
        nameEn: "9P/Tempel",
        nameJa: "テンペル第1彗星",
        meteorShower: null,
        a_AU: 3.1237,
        e: 0.5175,
        i: 10.53,
        Omega: 68.98,
        omega: 178.84,
        T: 2017,
        color: 0xaaddff,
      },
      chury: {
        nameEn: "67P/C-G",
        nameJa: "チュリュモフ・ゲラシメンコ彗星",
        meteorShower: null,
        a_AU: 3.4630,
        e: 0.6410,
        i: 7.044,
        Omega: 50.147,
        omega: 12.802,
        T: 2352,
        color: 0xaaddff,
      },
      // --- 流星群の母天体 ---
      swiftTuttle: {
        nameEn: "109P/Swift-Tuttle",
        nameJa: "スイフト・タットル彗星",
        meteorShower: "ペルセウス座流星群",
        a_AU: 26.09,
        e: 0.9632,
        i: 113.45,
        Omega: 139.38,
        omega: 152.98,
        T: 47490,
        color: 0xccddff,
      },
      tempelTuttle: {
        nameEn: "55P/Tempel-Tuttle",
        nameJa: "テンペル・タットル彗星",
        meteorShower: "しし座流星群",
        a_AU: 10.33,
        e: 0.9055,
        i: 162.49,
        Omega: 235.27,
        omega: 172.50,
        T: 12125,
        color: 0xddeeff,
      },
      giacobiniZinner: {
        nameEn: "21P/Giacobini-Zinner",
        nameJa: "ジャコビニ・ツィナー彗星",
        meteorShower: "りゅう座流星群",
        a_AU: 3.5227,
        e: 0.7067,
        i: 31.79,
        Omega: 195.07,
        omega: 172.52,
        T: 2411,
        color: 0xaaccee,
      },
      thatcher: {
        nameEn: "C/1861 G1 (Thatcher)",
        nameJa: "サッチャー彗星",
        meteorShower: "こと座流星群",
        a_AU: 55.68,
        e: 0.9824,
        i: 79.78,
        Omega: 31.78,
        omega: 213.68,
        T: 151577,
        color: 0xeeeeff,
      },
      eh1: {
        nameEn: "2003 EH1",
        nameJa: "2003 EH1（消滅彗星核）",
        meteorShower: "しぶんぎ座流星群",
        a_AU: 3.124,
        e: 0.619,
        i: 70.84,
        Omega: 282.96,
        omega: 171.36,
        T: 2016,
        color: 0xddccff,
      },
      phaethon: {
        nameEn: "3200 Phaethon",
        nameJa: "ファエトン（岩石彗星）",
        meteorShower: "ふたご座流星群",
        a_AU: 1.271,
        e: 0.890,
        i: 22.18,
        Omega: 265.20,
        omega: 322.12,
        T: 523,
        color: 0xffddcc,
      },
    };

    // ===== 彗星オブジェクト生成 =====
    // 核 (nucleus)、コマ (coma)、イオン尾 (tail) を持つグループを返す
    getComet = (cometData, baseRadius = 0.05, radiusScale = 1) => {
      const group = new THREE.Group();

      // AU → シーン単位系変換係数 (Earth の a 計算に合わせる)
      const AU_to_units = baseRadius * 23481.07;

      const orbitParam = {
        a: cometData.a_AU * AU_to_units,
        e: cometData.e,
        i: cometData.i,
        Omega: cometData.Omega,
        omega: cometData.omega,
        T: cometData.T,
      };

      // --- 核 ---
      const nucleusRadius = baseRadius * 0.12 * radiusScale;
      const nucleusGeo = new THREE.SphereGeometry(nucleusRadius, 8, 8);
      const nucleusMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);

      // --- コマ (edge-glow halo) ---
      const comaRadius = nucleusRadius * 8;
      const comaGeo = new THREE.SphereGeometry(comaRadius, 16, 16);
      const comaMat = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(cometData.color) },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPos.xyz;
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec3 viewDir = normalize(vViewPosition);
            float intensity = 1.0 - abs(dot(vNormal, viewDir));
            intensity = pow(intensity, 1.8);
            gl_FragColor = vec4(color, intensity * 0.75);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.FrontSide,
      });
      const coma = new THREE.Mesh(comaGeo, comaMat);

      // --- 尾 (イオンテール: 太陽と反対方向に伸びる円錐) ---
      const tailLength = comaRadius * 60;
      const tailBaseRadius = comaRadius * 2.5;
      const tailGeo = new THREE.ConeGeometry(tailBaseRadius, tailLength, 8, 1, true);
      const tailMat = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(cometData.color) },
          uTailLength: { value: tailLength },
        },
        vertexShader: `
          uniform float uTailLength;
          varying float vFade;
          void main() {
            // ConeGeometry: 先端 +tailLength/2, 底面 -tailLength/2
            // tail.position.y = -tailLength/2 でオフセット → 先端がグループ原点
            // したがって position.y は 0(先端)〜-tailLength(底面)
            vFade = clamp(-position.y / uTailLength, 0.0, 1.0);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          varying float vFade;
          void main() {
            float alpha = vFade * 0.45;
            if (alpha < 0.005) discard;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const tail = new THREE.Mesh(tailGeo, tailMat);
      // 円錐の先端をグループ原点 (彗星核の位置) に合わせる
      tail.position.y = -tailLength / 2;

      // tailGroup を回転させて尾の方向を制御する
      const tailGroup = new THREE.Group();
      tailGroup.add(tail);

      group.add(nucleus);
      group.add(coma);
      group.add(tailGroup);

      const _up = new THREE.Vector3(0, 1, 0);

      group.updateOrbit = (tDays, scale = 1, callback = (pos) => {}) => {
        const pos = this.getOrbitPosition(tDays, orbitParam, scale);
        group.position.copy(pos);

        // 尾を太陽と反対方向に向ける
        // ConeGeometry: +Y が先端 → +Y を太陽方向 (-pos) に向けると
        // -Y (底面) が太陽の逆方向 = 尾が太陽から離れる方向に伸びる
        if (pos.lengthSq() > 1e-10) {
          const towardSun = pos.clone().negate().normalize();
          const dot = _up.dot(towardSun);
          if (Math.abs(dot + 1) < 1e-6) {
            // ほぼ逆平行: 任意軸で 180° 回転
            tailGroup.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
          } else {
            tailGroup.quaternion.setFromUnitVectors(_up, towardSun);
          }
        }

        callback(pos, group);
      };

      group.getOrbitLine = (scale = 1) => this.createCometOrbitLine(orbitParam, scale);

      return group;
    };

    // ===== 彗星軌道線生成 (真近点角ベース・高離心率軌道は弧のみ表示) =====
    createCometOrbitLine = (orbit, segments = 256, scale = 1) => {
      const { a, e, i, omega, Omega } = orbit;
      const positions = [];
      const showFullOrbit = e < 0.7;

      // e >= 0.7 の高離心率彗星は近日点付近 ±150° の弧のみ表示
      const fStart = showFullOrbit ? 0 : -Math.PI * (5 / 6);
      const fEnd   = showFullOrbit ? 2 * Math.PI : Math.PI * (5 / 6);

      for (let idx = 0; idx <= segments; idx++) {
        const f = fStart + (fEnd - fStart) * idx / segments;

        // 真近点角 f から極座標 r を計算
        const denom = 1 + e * Math.cos(f);
        if (Math.abs(denom) < 1e-10) continue;
        const r = a * (1 - e * e) / denom;
        if (!isFinite(r) || r < 0) continue;

        const x = r * Math.cos(f);
        const y = r * Math.sin(f);
        const z = 0;

        const pos = new THREE.Vector3(x, y, z);
        const rot = new THREE.Matrix4()
          .makeRotationZ(THREE.MathUtils.degToRad(Omega))
          .multiply(new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(i)))
          .multiply(new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(omega)));
        pos.applyMatrix4(rot);

        // 惑星と同じ座標変換: XY基準 → XZ基準
        const converted = new THREE.Vector3(pos.x, pos.z, -pos.y);
        positions.push(converted.x * scale, converted.y * scale, converted.z * scale);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

      const material = new THREE.LineBasicMaterial({
        color: 0x6699bb,
        transparent: true,
        opacity: 0.5,
      });

      // 低離心率は閉じたループ、高離心率は開いた弧
      return showFullOrbit
        ? new THREE.LineLoop(geometry, material)
        : new THREE.Line(geometry, material);
    };

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
        console.log("####################")
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