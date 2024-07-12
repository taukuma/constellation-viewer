let tmp;
let constellations = {
  path: './src/data/constellations',
  path_lineDef: './src/data/mitaka/constellation_lines.json',
  isInitialized: false,
  data: new Array(),
  options: {},
  setOptions: (renderParams) => {
    constellations.options = {
      focalLength : parseFloat(renderParams.focalLength ?? 45),
      grid        : renderParams.grid == '1',
      earthView   : renderParams.earthView == '1',
      showLine    : (renderParams.showLine ?? true) != '0',
      rotate      : parseFloat(renderParams.rotate ?? 0) * Math.PI / 180,
      worldRotateX: parseFloat(renderParams.worldRotateX ?? 0) * Math.PI / 180,
      worldRotateY: parseFloat(renderParams.worldRotateY ?? 0) * Math.PI / 180,
      worldRotateZ: parseFloat(renderParams.worldRotateZ ?? 0) * Math.PI / 180,
      autoRotate  : renderParams.autoRotate == '1',
      distance    : (renderParams.distance ?? true) != '0'
    };
  },
  init: async (symbol, updateProgressBar) => {
    constellations.isInitialized = false;
    symbol = (Array.isArray(symbol)) ? symbol : [symbol];
    let stars = (await Promise.all(symbol.map(s => constellations.loadStarData(s, updateProgressBar))))
      .reduce((acc,curr) => acc.concat(curr));
    let lines = (await Promise.all(symbol.map(s => constellations.loadLineData(s, stars, updateProgressBar))))
      .reduce((acc,curr) => acc.concat(curr));
    constellations.isInitialized = true;
    return {stars: stars, lines: lines};
  },
  loadStarData: async (symbol, updateProgressBar) => {
    symbol ??= "";
    if (!Object.keys(constants.symbols).includes(symbol)) {
      return;
    }
    let data = await constellations.loadData(symbol);
    if (data.length === 0) {
      return;
    }
    updateProgressBar ?? (()=>{});
    updateProgressBar();
    
    // 恒星情報を取得
    return data.stars.map((s) => {
      let isEmpty = (str) => str == undefined || str == null || str == "" || str == {} || str == [];
      let spectralClassString = ((!isEmpty(s["スペクトル分類"])  ? s["スペクトル分類"] : s["スペクトル型"]) ?? "").replace(/\-/g,'');
      let absoluteMagnitude   =  !isEmpty(s["絶対等級"])         ? s["絶対等級"]       : !isEmpty(s.additional_info["絶対等級 (MV)"]) ? s.additional_info["絶対等級 (MV)"] : 1;
      let distance            =  !isEmpty(s["宇宙の距離梯子"])   ? s["宇宙の距離梯子"] : s.additional_info["距離"];
      let hip                 =  !isEmpty(s["ヒッパルコス星表"]) ? `HIP_${s["ヒッパルコス星表"]}` : 'HIP_' + Object.keys(s.additional_info).map(k => (k.includes("HIP")?k:"").replace(/.*HIP ([0-9]+).*/g,'$1')).filter(f => f !== '')[0]
     
      let size = converters.getStarRadiusFromStellarClassString(spectralClassString);
      let color = converters.getColorFromStellarClassString(spectralClassString);
      let coordinates = converters.getCoordinates(s["赤経"], s["赤緯"], distance, constellations.options.distance);

      if (coordinates == undefined || absoluteMagnitude == undefined || size == undefined || color == undefined) {
        return undefined;
      }

      return {
        name:s["名前"],
        coordinates: coordinates,
        size: size,
        color: color,
        "スペクトル分類": spectralClassString, 
        brightness: absoluteMagnitude * size.brightness,
        id: hip
      }
    }).filter(s => s !== undefined);
  },
  loadLineData: async (symbol, stars) => {
    symbol ??= "";
    if (!Object.keys(constants.symbols).includes(symbol)) {
      return;
    }
    // 星座線を取得
    let mitakaData = (await constellations.loadJSON(constellations.path_lineDef))
      .ConstellationLines
      .filter(l => l.Key === `CNST_${symbol}`)[0].Lines
    let lines = mitakaData
      .map(l => l.map(hip => (stars.filter(s => s.id === hip)[0] ?? {}).coordinates).filter(s => s !== undefined))
    console.log(symbol, {stars: stars, lines: lines, originalLineData: {mitakaData: mitakaData, lineStarMap: mitakaData.map(l => l.map(hip => (stars.filter(s => s.id === hip)[0] ?? {})))}});
    
    return lines;
  },
  render: async (stars, linePaths) => {
    let options = constellations.options;
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
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(
      45,
      windowSize.width / windowSize.height,
      1,
      999999
    );
    
    let renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    let orbit = new THREE.OrbitControls(camera, renderer.domElement);
    //scene.fog = new THREE.Fog(0x000000, 100, 50);

    // レンダラーとDOMの設定
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(windowSize.width, windowSize.height);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = Math.pow(0.8, 2.0);
    renderer.setClearColor( 0x000000, 0.5 )
    document.body.appendChild(renderer.domElement);
    
    // コントローラーの定義
    orbit.target = (options.earthView)
      ? new THREE.Vector3(1, 1, 1)
      : new THREE.Vector3(linePositionInfo.center.x, linePositionInfo.center.y, linePositionInfo.center.z);
    // Enable infinite orbiting
    orbit.maxPolarAngle = Infinity;
    orbit.minPolarAngle = -Infinity;
    orbit.maxAzimuthAngle = Infinity;
    orbit.minAzimuthAngle = -Infinity;
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.05;
    orbit.enablePan = true;
    orbit.enableZoom = true;
    orbit.enableRotate = true;
    orbit.autoRotate = options.autoRotate;
    orbit.autoRotateSpeed = 1.0;
    orbit.update();
    tmp = {orbit:orbit, camera:camera, pos: linePositionInfo};
    
    // グリッド
    if (options.grid == true) {
      scene.add(new THREE.GridHelper( 1000, 100, 0x5a0a0a, 0x0a0a0a))
      scene.add(new THREE.AxesHelper());
    }
    
    let group = new THREE.Group();

    // 恒星の描画 using InstancedMesh
    const starGeometry = new THREE.SphereGeometry(1, 12, 12); // Higher resolution geometry
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const starMesh = new THREE.InstancedMesh(starGeometry, starMaterial, stars.length);
    const dummy = new THREE.Object3D();

    stars.forEach((s, i) => {
      dummy.position.set(s.coordinates.x, s.coordinates.y, s.coordinates.z);
      dummy.scale.setScalar(s.size.radius / 20);
      dummy.updateMatrix();
      starMesh.setMatrixAt(i, dummy.matrix);

      // Initial twinkle effect (if needed)
      const twinkleFactor = Math.sin(Date.now() * 0.001 + i) * 0.8 + 1.2; // Initial twinkle effect
      const twinkleColor = new THREE.Color(s.color).multiplyScalar(twinkleFactor);

      starMesh.setColorAt(i, twinkleColor);
    });

    group.add(starMesh);

    // 星座線の描画
    if (options.showLine) {
      const material = new THREE.LineBasicMaterial({
        color: 0x0055ff
      });
      linePaths.forEach((points,i) => {
        let bufGeometry = new THREE.BufferGeometry();
        bufGeometry.setFromPoints(points.map(p => new THREE.Vector3(p.x, p.y, p.z)));
        let line = new THREE.Line(bufGeometry, material);
        group.add(line);
      });
    }
    group.rotation.x = options.worldRotateX;
    group.rotation.y = options.worldRotateY;
    group.rotation.z = options.worldRotateZ;
    scene.add(group);
    
    // composer setting
    const renderScene   = new THREE.RenderPass( scene, camera );
    const composer      = new THREE.EffectComposer( renderer );
    const bloomComposer = new THREE.EffectComposer(renderer);
    const finalComposer = new THREE.EffectComposer(renderer);
    composer.setSize(windowSize.width, windowSize.height);
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(renderScene);
    
    // Bloom
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(windowSize.width, windowSize.height), 3, 0.5, 0.2);
    bloomComposer.addPass(bloomPass);
    const finalPass = new THREE.ShaderPass(
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

    // Add diffraction spike pass
    const DiffractionSpikeShader = {
        uniforms: {
            'tDiffuse': { value: null },
            'resolution': { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            'spikeIntensity': { value: 5.0 }, // Increased intensity
            'spikeLength': { value: 3.0 } // Increased length
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform vec2 resolution;
            uniform float spikeIntensity;
            uniform float spikeLength;
            varying vec2 vUv;

            void main() {
                vec2 uv = vUv;
                vec4 color = texture2D(tDiffuse, uv);

                // Simulate diffraction spikes
                float spike = 0.0;
                for (float i = 0.0; i < 8.0; i++) {
                    float angle = i * 3.14159 / 4.0;
                    vec2 offset = vec2(cos(angle), sin(angle)) * spikeLength / resolution;
                    spike += texture2D(tDiffuse, uv + offset).r;
                    spike += texture2D(tDiffuse, uv - offset).r;
                }
                spike = spike * spikeIntensity / 8.0;

                color.rgb += spike;

                gl_FragColor = color;
            }
        `
    };

    const diffractionSpikePass = new THREE.ShaderPass(DiffractionSpikeShader);
    composer.addPass(diffractionSpikePass);
    composer.addPass( renderScene );
    renderer.setAnimationLoop((_) => {
      stars.forEach((s, i) => {
        // Update twinkle effect in each frame
        const twinkleFactor = Math.sin(Date.now() * 0.004 + i) * 0.8 + 2; // More pronounced and slower twinkle effect
        const randomFactor = Math.random() * 0.3 + 0.7; // Add some randomness
        const finalTwinkleFactor = twinkleFactor * randomFactor;
    
        const twinkleColor = new THREE.Color(s.color).multiplyScalar(finalTwinkleFactor);
    
        starMesh.setColorAt(i, twinkleColor);
      });
    
      starMesh.instanceMatrix.needsUpdate = true; // Ensure updates are reflected
      starMesh.instanceColor.needsUpdate = true; // Ensure color updates are reflected
    
      renderer.render(scene, camera);
      composer.render();
      bloomComposer.render();
      finalComposer.render();
      if (options.autoRotate) {
        orbit.update();
      }
    });
  },
  reset: () => {
    constellations.data = new Array();
    constellations.isInitialized = false;
  },
  loadData: async (symbol) => await constellations.loadJSON(`${constellations.path}/${symbol}.json`),
  loadJSON: async (path) => await fetch(path).then((res) => res.json()),
}