let tmp;
let constellations = {
  path: './src/data/constellations',
  path_lineDef: './src/data/mitaka/constellation_lines.json',
  isInitialized: false,
  data: new Array(),
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
      let absoluteMagnitude   =  !isEmpty(s["絶対等級"])         ? s["絶対等級"]       : s.additional_info["絶対等級 (MV)"];
      let distance            =  !isEmpty(s["宇宙の距離梯子"])   ? s["宇宙の距離梯子"] : s.additional_info["距離"];
      let hip                 =  !isEmpty(s["ヒッパルコス星表"]) ? `HIP_${s["ヒッパルコス星表"]}` : 'HIP_' + Object.keys(s.additional_info).map(k => (k.includes("HIP")?k:"").replace(/.*HIP ([0-9]+).*/g,'$1')).filter(f => f !== '')[0]
     
      let size = converters.getStarRadiusFromStellarClassString(spectralClassString);
      let color = converters.getColorFromStellarClassString(spectralClassString);
      let coordinates = converters.getCoordinates(s["赤経"], s["赤緯"], distance);

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
    let lines = (await constellations.loadJSON(constellations.path_lineDef))
      .ConstellationLines
      .filter(l => l.Key === `CNST_${symbol}`)[0].Lines
      .map(l => l.map(hip => (stars.filter(s => s.id === hip)[0] ?? {}).coordinates).filter(s => s !== undefined))
    console.log({stars: stars, lines: lines});
    
    return lines;
  },
  render: async (stars, linePaths, renderParams) => {
    let options = {
      focalLength: parseFloat(renderParams.focalLength ?? 45),
      grid       : renderParams.grid == '1',
      earthView  : renderParams.earthView == '1',
      showLine   : (renderParams.showLine ?? true) != '0',
      rotate     : parseFloat(renderParams.rotate ?? 0) * Math.PI / 180,
      autoRotate : renderParams.autoRotate == '1'
    };
    console.log(options)
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
    let starPositionInfo = getCoordinateInfo(stars.map(s => s.coordinates));
    let linePositionInfo = getCoordinateInfo(linePaths.reduce((acc,curr) => acc.concat(curr)));

    // シーンとカメラ
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      999999
    );
    
    let renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    let orbit = new THREE.OrbitControls(camera, renderer.domElement);
    //scene.fog = new THREE.Fog(0x000000, 100, 500);

    // レンダラーとDOMの設定
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = Math.pow(0.8, 2.0);
    renderer.setClearColor( 0x000000, 0.5 )
    document.body.appendChild(renderer.domElement);
    
    // コントローラーの定義
    orbit.target = (options.earthView)
      ? new THREE.Vector3(1, 1, 1)
      : new THREE.Vector3(linePositionInfo.center.x, linePositionInfo.center.y, linePositionInfo.center.z);
    // カメラ位置
    camera.setFocalLength(options.focalLength ?? 45);
    camera.position.set(0, 0, 0);
    camera.rotation.order = "XYZ";
    camera.lookAt((options.earthView) 
      ? new THREE.Vector3(0,0,0)
      : new THREE.Vector3(linePositionInfo.center.x, linePositionInfo.center.y, linePositionInfo.center.z));
    camera.up = new THREE.Vector3(0,1,options.rotate);
    if (options.autoRotate) {
      orbit.autoRotate = true;
    }
    orbit.update();
    tmp = {orbit:orbit, camera:camera, pos: linePositionInfo};
    
    // グリッド
    if (options.grid == true) {
      scene.add(new THREE.GridHelper( 1000, 100, 0x5a0a0a, 0x0a0a0a))
      scene.add(new THREE.AxesHelper());
    }

    // composer
    const renderScene = new THREE.RenderPass( scene, camera );
    let composer = new THREE.EffectComposer( renderer );
    let sg = new SelectiveGlow(scene, camera, renderer);
    composer.addPass( renderScene );
    
    // 恒星の描画
    stars.forEach((s,i) => {
      s.color = `#${('0'+parseInt(s.color.r).toString(16)).slice(-2)}${('0'+parseInt(s.color.g).toString(16)).slice(-2)}${('0'+parseInt(s.color.b).toString(16)).slice(-2)}`
      s.mesh = new THREE.Mesh(
        new THREE.SphereGeometry(s.size.radius / 20),
        new THREE.MeshBasicMaterial({ color: s.color, opacity: 1, transparent: true })
      );
      s.mesh.position.set(s.coordinates.x, s.coordinates.y, s.coordinates.z);
      s.mesh.material.color.set(s.color);
      scene.add(s.mesh);
    })

    if (options.showLine) {
      // 星座線の描画
      const material = new THREE.LineBasicMaterial({
        color: 0x0055ff
      });
      linePaths.forEach((points,i) => {
        let bufGeometry = new THREE.BufferGeometry();
        bufGeometry.setFromPoints(points.map(p => new THREE.Vector3(p.x, p.y, p.z)));
        let line = new THREE.Line(bufGeometry, material);
        scene.add(line);
      });
    }
    
    renderer.setAnimationLoop((_) => {
      renderer.render(scene, camera);
      composer.render();
      sg.bloom1.render();
      sg.bloom2.render();
      sg.final.render();
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