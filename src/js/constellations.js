import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TrackballControls} from 'three/addons/controls/TrackballControls.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {Lensflare, LensflareElement} from 'three/addons/objects/Lensflare.js';

class Constellations {
  constructor() {
    this.path = './src/data/constellations';
    this.path_lineDef = './src/data/mitaka/constellation_lines.json';
    this.path_lineDef_custom = './src/data/mitaka/constelation_lines_custom.json';
    this.isInitialized = false;
    this.data = new Array();
    this.options = {}
    this.perspectiveCamera = undefined;
    this.orbitControls = undefined;
    this.trackballControls = undefined
  };

  setOptions = (renderParams) => {
    this.options = {
      focalLength : parseFloat(renderParams.focalLength ?? 45),
      grid        : renderParams.grid == '1',
      earthView   : renderParams.earthView == '1',
      showLine    : (renderParams.showLine ?? true) != '0',
      showStarName: renderParams.showStarName == '1',
      showConstellationName: renderParams.showConstellationName == '1',
      showGuideConstellations: renderParams.showGuideConstellations == '1',
      rotateX      : parseFloat(renderParams.rotateX ?? 0) * Math.PI / 180,
      rotateY      : parseFloat(renderParams.rotateY ?? 0) * Math.PI / 180,
      rotateZ      : parseFloat(renderParams.rotateZ ?? 0) * Math.PI / 180,
      worldRotateX: parseFloat(renderParams.worldRotateX ?? 0) * Math.PI / 180,
      worldRotateY: parseFloat(renderParams.worldRotateY ?? 90) * Math.PI / 180,
      worldRotateZ: parseFloat(renderParams.worldRotateZ ?? 0) * Math.PI / 180,
      autoRotate  : renderParams.autoRotate == '1',
      autoRotateSpeed: renderParams.autoRotateSpeed,
      distance    : (renderParams.distance ?? true) != '0',
      renderMode  : renderParams.renderMode,
    };
  };

  init = async (symbol, updateProgressBar) => {
    this.isInitialized = false;
    symbol = (Array.isArray(symbol)) ? symbol : [symbol];
    this.symbol = symbol;
    let starData = (await Promise.all(symbol.map(s => this.loadStarData(s, updateProgressBar))));
    let stars = starData.map(s => s.stars)
      .reduce((acc,curr) => acc.concat(curr));
    let lines = (await Promise.all(symbol.map(s => this.loadLineData(s, stars, updateProgressBar))))
      .reduce((acc,curr) => acc.concat(curr));
      this.isInitialized = true;
    return {stars: stars, lines: lines, constellation: starData.map(s => s.constellation)};
  };

  loadStarData = async (symbol, updateProgressBar) => {
    symbol ??= "";
    if (!Object.keys(constants.symbols).includes(symbol)) {
      return;
    }
    let data = await this.loadData(symbol);
    if (data.length === 0) {
      return;
    }
    updateProgressBar ?? (()=>{});
    updateProgressBar();
    
    window.starDistance = [];
    // 恒星情報を取得
    let starData = data.stars.map((s) => {
      let isEmpty = (str) => str == undefined || str == null || str == "" || str == {} || str == [];
      let spectralClassString = ((!isEmpty(s["スペクトル分類"])  
        ? s["スペクトル分類"] 
        : s["スペクトル型"]) ?? "").replace(/\-/g,'');
      let absoluteMagnitude   =  parseFloat(!isEmpty(s["絶対等級"])         
        ? s["絶対等級"]
        : !isEmpty(s.additional_info["絶対等級 (MV)"] || s.additional_info["絶対等級 (mv)"]) 
          ? (s.additional_info["絶対等級 (MV)"] || s.additional_info["絶対等級 (mv)"])
          : 10);
      let magnitude           =  Math.min(
        parseFloat(!isEmpty(s["見かけの等級"])
          ? s["見かけの等級"]   
            : !isEmpty(s.additional_info["見かけの等級 (MV)"] || s.additional_info["見かけの等級 (mv)"]) 
              ? (s.additional_info["見かけの等級 (MV)"] || s.additional_info["見かけの等級 (mv)"])
              : 10),
        parseFloat(!isEmpty(s["等級 (天文)"])
            ? s["等級 (天文)"] 
            : !isEmpty(s.additional_info["等級 (天文)"])
              ? s.additional_info["等級 (天文)"]
              : 10)
      );
      let distance            =  !isEmpty(s["宇宙の距離梯子"])   ? s["宇宙の距離梯子"] : s.additional_info["距離"];
      let hip                 =  !isEmpty(s["ヒッパルコス星表"]) ? `HIP_${s["ヒッパルコス星表"]}` : 'HIP_' + Object.keys(s.additional_info).map(k => (k.includes("HIP")?k:"").replace(/.*HIP ([0-9]+).*/g,'$1')).filter(f => f !== '')[0]
     
      let size = converters.getStarRadiusFromStellarClassString(spectralClassString, this.options.distance);
  //###### tmp realistic change ######
      let radiusOnAdditionalInfo = (s.additional_info["半径"]) ? s.additional_info["半径"].replace(/\([0-9]+\)|\[[0-9]+\]/g,"").replace(/^[^0-9]+/,"") : undefined;
      (size||{}).defined_radius = (radiusOnAdditionalInfo) ? (radiusOnAdditionalInfo.includes("km")) ? parseFloat(radiusOnAdditionalInfo) / constants.SUN_DIAMETER * 2 : parseFloat(radiusOnAdditionalInfo) : undefined; 

      let color = converters.getColorFromStellarClassString(spectralClassString);
      let coordinates = converters.getCoordinates(s["赤経"], s["赤緯"], distance, this.options.distance, 1/5);
      

      if (coordinates == undefined || absoluteMagnitude == undefined || distance == undefined || size == undefined || color == undefined) {
        return undefined;
      }

      return {
        name:s["名前"],
        coordinates: coordinates,
        size: size,
        color: color,
        "スペクトル分類": spectralClassString, 
        absoluteMagnitude: absoluteMagnitude,
        magnitude: magnitude,
        id: hip
      }
    }).filter(s => s !== undefined);
    return {
      constellation: {
        label: constants.symbols[symbol].label,
        coordinates: starData[0].coordinates
      },
      stars: starData
    }
  }

  loadLineData = async (symbol, stars) => {
    symbol ??= "";
    if (!Object.keys(constants.symbols).includes(symbol)) {
      return;
    }
    // 星座線を取得
    let lineData = (await this.loadJSON(this.path_lineDef))
      .ConstellationLines
      .filter(l => l.Key === `CNST_${symbol}`)[0].Lines
    let lines = lineData
      .map(l => l.map(hip => (stars.filter(s => s.id === hip)[0] ?? {}).coordinates).filter(s => s !== undefined))
    return lines;
  };
  loadGuideLineData = async (symbol, target = "guide") => {
    // usage: await constellations.loadGuideLineData("Summer Triangle", (await Promise.all(["Lyr", "Cyg", "Aql"].map(s => constellations.loadStarData(s,()=>{})))).map(s => s.stars).reduce((a,c) => a.concat(c)))
    symbol ??= "";
    if (!Object.keys(constants.additionalConstellations).includes(symbol)) {
      return;
    }
    // get stars
    let stars = (await Promise.all(constants.additionalConstellations[symbol].NearBy.map(s => constellations.loadStarData(s,()=>{})))).map(s => s.stars).reduce((a,c) => a.concat(c))
    // 星座線を取得
    switch (target) {
      case "guide":
      case "obsolete":
        let lineData = (await this.loadJSON(this.path_lineDef_custom))
          .guide.ConstellationLines
          .filter(l => l.Key === symbol)[0]
        let lines = lineData.Lines
          .map(l => l.map(hip => (stars.filter(s => s.id === hip)[0] ?? {}).coordinates).filter(s => s !== undefined))
        return {lines: lines, LineStyle: lineData.LineStyle};
      case "domestic":
        return undefined;
      default:
        return undefined;
    }
  };

  render = async (stars, linePaths, constellationInfo) => {
    let options = this.options;
    console.log(options);
    let group = new THREE.Group();

    // 中心座標の取得
    let getCoordinateInfo = (list) => list.reduce((acc,curr,i)=> {return {
        min: {
            x:Math.min((acc.min ?? {}).x ?? acc.x, curr.x),
            y:Math.min((acc.min ?? {}).y ?? acc.y, curr.y),
            z:Math.min((acc.min ?? {}).z ?? acc.z, curr.z),
        },
        max: {
            x:Math.max((acc.max ?? {}).x ?? acc.x, curr.x),
            y:Math.max((acc.max ?? {}).y ?? acc.y, curr.y),
            z:Math.max((acc.max ?? {}).z ?? acc.z, curr.z),
        },
        center: {
            x: (((acc.center ?? {}).x ?? acc.x) * i + curr.x)/(i + 1),
            y: (((acc.center ?? {}).y ?? acc.y) * i + curr.y)/(i + 1),
            z: (((acc.center ?? {}).z ?? acc.z) * i + curr.z)/(i + 1),
        },
      }
    });
    let windowSize = {
      height: (window.innerHeight < window.innerWidth)
        ? window.innerHeight
        : window.innerWidth * 16 / 9,
      width: window.innerWidth
    };
    let starPositionInfo = getCoordinateInfo(stars.map(s => s.coordinates));
    let linePositionInfo = getCoordinateInfo(linePaths.reduce((acc,curr) => acc.concat(curr)));

    // シーンとカメラ
    const ASPECT = windowSize.width / windowSize.height;
    let scene = new THREE.Scene();
    this.perspectiveCamera = new THREE.PerspectiveCamera(
      options.focalLength ?? 45,
      ASPECT,
      1,
      999999
    );

    let renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    //scene.fog = new THREE.Fog(0x0000000, 0, 150);

    // レンダラーとDOMの設定
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(windowSize.width, windowSize.height);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = Math.pow(0.8, 2.0);
    renderer.setClearColor( 0x000000, 0.5 )
    //renderer.domElement.style.setProperty("mix-blend-mode", "color-burn")
    document.body.appendChild(renderer.domElement);
    
    // コントローラーの定義
    // Trackball Controls
    this.trackballControls = new TrackballControls(this.perspectiveCamera, renderer.domElement);
    this.trackballControls.target = (options.earthView) ? new THREE.Vector3(1, 1, 1) : new THREE.Vector3(linePositionInfo.center.x, linePositionInfo.center.y, linePositionInfo.center.z);
    this.trackballControls.rotateSpeed = 2.0;
    this.trackballControls.zoomSpeed = 1.2;
    this.trackballControls.panSpeed = 0.8;
    this.trackballControls.noRotate = false;
    this.trackballControls.noZoom = true;
    this.trackballControls.noPan = true;
    this.trackballControls.staticMoving = false;
    this.trackballControls.dynamicDampingFactor = 0.05;
    this.trackballControls.keys = [ 'KeyA', 'KeyS', 'KeyD' ]; // [ rotateKey, zoomKey, panKey ]
    this.trackballControls.rotateSpeed = 0.5;
    this.trackballControls.update();
    // Orbit Controls
    this.orbitControls = new OrbitControls(this.perspectiveCamera, renderer.domElement);
    this.orbitControls.target = (options.earthView)
      ? new THREE.Vector3(1, 1, 1)
      : new THREE.Vector3(linePositionInfo.center.x, linePositionInfo.center.y, linePositionInfo.center.z);
    this.orbitControls.maxPolarAngle = Infinity;
    this.orbitControls.minPolarAngle = -Infinity;
    this.orbitControls.maxAzimuthAngle = Infinity;
    this.orbitControls.minAzimuthAngle = -Infinity;
    this.orbitControls.enableDamping = false;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.enablePan = true;
    this.orbitControls.enableZoom = true;
    this.orbitControls.enableRotate = false;
    this.orbitControls.autoRotate = options.autoRotate;
    this.orbitControls.autoRotateSpeed = options.autoRotateSpeed || 1.0;
    this.orbitControls.update();

    // カメラ位置
    this.perspectiveCamera.setFocalLength(options.focalLength ?? 45);
    this.perspectiveCamera.position.set(0, 0, 0);
    this.perspectiveCamera.rotation.order = "XYZ";
    this.perspectiveCamera.lookAt((options.earthView)
      ? new THREE.Vector3(0,0,0)
      : new THREE.Vector3(linePositionInfo.center.x, linePositionInfo.center.y, linePositionInfo.center.z));
    this.perspectiveCamera.up = new THREE.Vector3(options.rotateX * 100, options.rotateY * 100,options.rotateZ * 100);
    
    // グリッド
    if (options.grid == true) {
      let size = 100
      scene.add(new THREE.GridHelper( size * 100, size * 10, 0xfa0a0a, 0x333333))
      scene.add(new THREE.AxesHelper(size));
      let label_x = createLabel ("x", {r: 255, g:100, b: 100}, 24, 1);
      let label_y = createLabel ("y", {r: 100, g:255, b: 100}, 24, 1);
      let label_z = createLabel ("z", {r: 100, g:100, b: 255}, 24, 1);
      label_x.position.set(size / 2, 0.5, 0.5);
      label_y.position.set(0.5, size / 2, 0.5);
      label_z.position.set(0.5, 0.5, size / 2);
      group.add(label_x);
      group.add(label_y);
      group.add(label_z);
    }

    // 星座線の描画
    if (options.showLine) {
      const material = new THREE.LineBasicMaterial({
        color: 0x002299
      });
      linePaths.forEach((points,i) => {
        let bufGeometry = new THREE.BufferGeometry();
        bufGeometry.setFromPoints(points.map(p => new THREE.Vector3(p.x, p.y, p.z)));
        let line = new THREE.Line(bufGeometry, material);
        group.add(line);
      });
    }

    //星座名の表示
    let constellatinNamePositionOffset = (options.distance) ? 20 : 100;
    let constellatinNameScalorFactor = (options.distance) ? 1/100 : 1/25;
    let constellatinNameFontSize = 38;
    let constellatinNameOpacity = 1;
    if (options.showConstellationName) {
      constellationInfo.forEach(c => {
        let label = createLabel(c.label, {r:0, g:125, b:255}, constellatinNameFontSize, constellatinNameOpacity, constellatinNameScalorFactor)
        let labelCoordinate = new THREE.Vector3(c.coordinates.x, c.coordinates.y, c.coordinates.z);
        labelCoordinate.setLength(constellatinNamePositionOffset);
        label.position.set(labelCoordinate.x, labelCoordinate.y, labelCoordinate.z);
        group.add(label);
      })
    }

    // 特殊星座の描画
    if (options.showGuideConstellations) {

      const guideMaterial = new THREE.LineBasicMaterial({color: 0xffaa00});
      const guideMaterial_dashed = new THREE.LineDashedMaterial({color: 0xff5500, dashSize: 0.5, gapSize: 0.5});
      const guideConstellationList = Object.keys(constants.additionalConstellations);
      guideConstellationList.forEach(async c => {
        if (!(constants.additionalConstellations[c].NearBy.map(n => this.symbol.includes(n)).reduce((a,c) => a || c))) return;
        let guideData = await this.loadGuideLineData(c);
        guideData.lines.forEach((points, i) => {
          if (guideData.LineStyle !== undefined && guideData.LineStyle.type === "CatmullRomCurve") {
            // 星座線
            let curve = new THREE.CatmullRomCurve3( points.map(p => new THREE.Vector3(p.x, p.y, p.z)));
            let curvePoints = curve.getPoints( 60 );
            let bufGeometry = new THREE.BufferGeometry().setFromPoints( curvePoints );
            let line = new THREE.Line( bufGeometry, guideData.LineStyle.style === "dashed" ? guideMaterial_dashed : guideMaterial );
            line.computeLineDistances();
            group.add(line)
            // 星座名
            if (options.showConstellationName) {
              let centerCoordinate = points.filter((v,i) => i < points.length - 1).reduce((acc, curr, i) => {return {
                x: (((acc.center ?? {}).x ?? acc.x) * i + curr.x)/(i + 1),
                y: (((acc.center ?? {}).y ?? acc.y) * i + curr.y)/(i + 1),
                z: (((acc.center ?? {}).z ?? acc.z) * i + curr.z)/(i + 1),
              }});
              let labelCoordinate = new THREE.Vector3(centerCoordinate.x, centerCoordinate.y, centerCoordinate.z);
              labelCoordinate.setLength(constellatinNamePositionOffset);
              let label = createLabel(constants.additionalConstellations[c].label, {r:0xff, g:0x55, b:0x00}, constellatinNameFontSize, constellatinNameOpacity, constellatinNameScalorFactor);
              label.position.set(labelCoordinate.x, labelCoordinate.y, labelCoordinate.z);
              group.add(label);
            }
          } else {
            // 星座線
            let bufGeometry = new THREE.BufferGeometry();
            bufGeometry.setFromPoints(points.map(p => new THREE.Vector3(p.x, p.y, p.z)));
            let line = new THREE.Line(bufGeometry, guideMaterial);
            group.add(line);

            // 星座名
            if (options.showConstellationName) {
              let centerCoordinate = points.reduce((acc, curr, i) => {return {
                x: (((acc.center ?? {}).x ?? acc.x) * i + curr.x)/(i + 1),
                y: (((acc.center ?? {}).y ?? acc.y) * i + curr.y)/(i + 1),
                z: (((acc.center ?? {}).z ?? acc.z) * i + curr.z)/(i + 1),
              }});
              let labelCoordinate = new THREE.Vector3(centerCoordinate.x, centerCoordinate.y, centerCoordinate.z);
              labelCoordinate.setLength(constellatinNamePositionOffset);
              let label = createLabel(constants.additionalConstellations[c].label, {r:0xff, g:0xaa, b:0x00}, constellatinNameFontSize, constellatinNameOpacity, constellatinNameScalorFactor);
              label.position.set(labelCoordinate.x, labelCoordinate.y, labelCoordinate.z);
              group.add(label);
            }
          }
        });

      })
    }

    // 恒星の描画
    const starGeometry = new THREE.SphereGeometry(1, 12, 12); // Higher resolution geometry
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const starMesh = new THREE.InstancedMesh(starGeometry, starMaterial, stars.length);
    const dummy = new THREE.Object3D();
    switch (options.renderMode) {
/*
      //using point light and lensflare
      case 'PointLight': {

        let isStarFormsConstellationLine = (s) => linePaths.reduce((acc,curr) => acc.concat(curr)).filter(l => l.x === s.x && l.y === s.y && l.z === s.z).length > 0;
        const textureLoader = new THREE.TextureLoader();
        const textureFlare0 = textureLoader.load( "./src/img/textures/lensflare/lensflare0_mono.png" );

        stars.forEach((s, i) => {
          let color = new THREE.Color(`#${('0'+parseInt(s.color.r).toString(16)).slice(-2)}${('0'+parseInt(s.color.g).toString(16)).slice(-2)}${('0'+parseInt(s.color.b).toString(16)).slice(-2)}`);
          let light = new THREE.PointLight(color, 1.5, 1000); // Create PointLight with star color and intensity
          let mesh = new THREE.Mesh(
            new THREE.SphereGeometry(3),
            new THREE.MeshBasicMaterial({color: color, transparent: true, opacity: 1})
          );
          mesh.scale.setScalar(s.size.radius / 50)
          light.add(mesh);
          light.position.set(s.coordinates.x, s.coordinates.y, s.coordinates.z);
          group.add(light);
    
          //flare
          const lensflare = new Lensflare();
          lensflare.addElement( new LensflareElement( textureFlare0, 128, 0, color) );
          if (isStarFormsConstellationLine(s.coordinates)) light.add( lensflare );
          
          // 星名の表示
          if (options.showStarName) {
            let label = createLabel(s.name, s.color);
            label.position.copy(light.position);
            group.add(label);
          }
    
          // Initial twinkle effect (if needed)
          const twinkleFactor = Math.sin(Date.now() * 0.005 + i) * 0.8 + 2; // Initial twinkle effect
          s.color = `#${('0'+parseInt(s.color.r).toString(16)).slice(-2)}${('0'+parseInt(s.color.g).toString(16)).slice(-2)}${('0'+parseInt(s.color.b).toString(16)).slice(-2)}`;
          const twinkleColor = new THREE.Color(s.color.r, s.color.g, s.color.b).multiplyScalar(twinkleFactor);
    
          light.color.set(twinkleColor);
        });
        console.log("render with PointLight");
      } break;
*/
      //using InstancedMesh
      case 'InstancedMesh':
      default: {
        stars.forEach((s, i) => {
          let radius = 0;
          let magnitude = Math.pow(1/2.5, s.magnitude);
          if (options.distance) {
            radius = (
                (
                  (s.size.defined_radius) 
                    ? s.size.defined_radius 
                    : s.size.radius
                )
                * (constants.SUN_DIAMETER / constants.LIGHT_YEAR / 2) 
              + 0.01)
              * magnitude
              + 0.05;
          } else {
            radius = Math.min(magnitude, 0.5) + 0.05;
          }
          dummy.position.set(s.coordinates.x, s.coordinates.y, s.coordinates.z);
          dummy.scale.setScalar(radius);
          dummy.updateMatrix();
          starMesh.setMatrixAt(i, dummy.matrix);

          // 星名の表示
          if (options.showStarName) {
            let label = createLabel(s.name, s.color, 38, 1, 0.001);
            label.position.set(dummy.position.x, dummy.position.y + radius * 1.5, dummy.position.z);
            group.add(label)
          }
    
          // Initial twinkle effect (if needed)
          const twinkleFactor = Math.sin(Date.now() * 0.005 + i) * 0.8 + 2; // Initial twinkle effect
          s.color = `#${('0'+parseInt(s.color.r).toString(16)).slice(-2)}${('0'+parseInt(s.color.g).toString(16)).slice(-2)}${('0'+parseInt(s.color.b).toString(16)).slice(-2)}`;
          const twinkleColor = new THREE.Color(s.color).multiplyScalar(twinkleFactor);
    
          starMesh.setColorAt(i, twinkleColor);
        });
    
        group.add(starMesh);
      } break;
    }

    group.rotation.x = options.worldRotateX;
    group.rotation.y = options.worldRotateY;
    group.rotation.z = options.worldRotateZ;
    scene.add(group);
    
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

    function createLabel(text, color, size = 16, opacity = 0.4, scaleFactor = 1/25) {
      const width = size * 15;
      const height = size * 6;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.canvas.width = width;
      context.canvas.height = height;
      context.fillStyle = 'rgba(0, 0, 255, 0.5)'
      context.font = `${size}px 'Klee One', 'Zen Maru Gothic', 'Noto Sans JP', san-serif`
      context.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
      context.fillText(text, width / 2 - (text.length / 2 * size), height / 2 - size);
    
      const texture = new THREE.CanvasTexture(canvas);
      //texture.minFilter = THREE.LinearFilter;
      //texture.wrapS = THREE.ClampToEdgeWrapping;
      //texture.wrapT = THREE.ClampToEdgeWrapping;
    
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(width *scaleFactor, height * scaleFactor, 1);
    
      return sprite;
    }

    composer.addPass( renderScene );
    renderer.setAnimationLoop((_) => {

      stars.forEach((s, i) => {
        // Update twinkle effect in each frame
        const twinkleFactor = Math.sin(Date.now() / (10000 * Math.random()) + i) * 0.2 + 2; // More pronounced and slower twinkle effect
        const randomFactor = 0.8; // Add some randomness
        const finalTwinkleFactor = twinkleFactor * randomFactor;
    
        const twinkleColor = new THREE.Color(s.color).multiplyScalar(finalTwinkleFactor);
    
        starMesh.setColorAt(i, twinkleColor);
      });
    
      starMesh.instanceMatrix.needsUpdate = true; // Ensure updates are reflected
      starMesh.instanceColor.needsUpdate = true; // Ensure color updates are reflected


      renderer.render(scene, this.perspectiveCamera);
      composer.render();
      bloomComposer.render();
      finalComposer.render();
      this.trackballControls.update();
      this.orbitControls.update();
    });
  }

  reset =  () => {
    this.data = new Array();
    this.isInitialized = false;
  }

  loadData = async (symbol) => await this.loadJSON(`${this.path}/${symbol}.json`)
  loadJSON = async (path) => await fetch(path).then((res) => res.json())
}

export default Constellations;