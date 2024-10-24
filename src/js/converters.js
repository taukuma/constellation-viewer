converters = {
  getThetaFromAlpha: (h,m,s) => Math.round((h+m/60+s/3600)*15*1000000)/1000000,
  getThetaFromDec: (d,m,s) => Math.round((d+m/60+s/3600)*1000000)/1000000,
  deg2rad: (v) => v * Math.PI / 180,
  getCoordinatesFromAlphaAndDec: (d,alpha,dec) => {return {
/* original
    x: d * Math.cos(converters.deg2rad(dec)) * Math.cos(converters.deg2rad(alpha)), 
    y: d * Math.cos(converters.deg2rad(dec)) * Math.sin(converters.deg2rad(alpha)), 
    z: d * Math.sin(converters.deg2rad(dec))}
*  original */ 

    x: d * Math.cos(converters.deg2rad(dec)) * Math.cos(converters.deg2rad(alpha)), 
    z: -d * Math.cos(converters.deg2rad(dec)) * Math.sin(converters.deg2rad(alpha)), 
    y: d * Math.sin(converters.deg2rad(dec))}

  },
  getCoordinates: (alphaString, decString, distanceString, enableDistance, multiplyScalar = 1) => {
    enableDistance ??= true;
    if ((alphaString ?? '') == '' || (decString ?? '') == '' || (distanceString ?? '') == '') return undefined;
    let replaceHyphens = (str,replaceWith) => str.trim().replace(/[-－﹣−‐⁃‑‒–—﹘―⎯⏤ーｰ─━]/g, replaceWith);
    alphaArr = replaceHyphens(alphaString, "-").replace(/ s/g,'').replace(/h|m/g,";").split(";").map(v=>parseFloat(v));
    decArr   = replaceHyphens(decString, "-").replace(/″/g,'').replace(/°|′/g,';').split(";").map(v=>parseFloat(v));
    distance = parseFloat(replaceHyphens(distanceString.replace(/[,]/,""), "-").replace(/^[^0-9\-\+]/g,''));
    //dist     = (enableDistance) ? distance / 20 + 100 : 100;
    dist     = ((enableDistance) ? distance * multiplyScalar + 10 : 100);


    alpha    = converters.getThetaFromAlpha(alphaArr[0],alphaArr[1],alphaArr[2]);
    dec      = converters.getThetaFromDec(decArr[0],decArr[1],decArr[2]);
    return {coordinate:converters.getCoordinatesFromAlphaAndDec(dist,alpha,dec),distance: distance, render_distance: dist};
  },
  kelvin2rgb: (k) => {
    // from (https://tannerhelland.com/2012/09/18/convert-temperature-rgb-algorithm-code.html)
    let temp = k / 100.0;
    return {
      r: (temp <= 66) ? 255 : 329.698727446 * Math.pow((temp - 60), -0.1332047592),
      g: (temp <= 66) ? 99.4708025861 * Math.log(temp) - 161.1195681661 : 288.1221695283 * Math.pow((temp - 60), -0.0755148492),
      b: (temp > 66) ? 255 : (temp <= 19) ? 0 : 138.5177312231 * Math.log(temp - 10) - 305.0447927307
    }
  },
  getRomanNumberFromStellarClassString: (stellarClassStr) => {
    let luminosityClassExtractPattern = new RegExp(`^[${Object.keys(constants.SPECT_CLASS).join('')}][0-9.]+(${Object.keys(constants.LUMINOSITY_CLASS).join("|").replace(/\+/g,"\\+")}).*`)
    let romanNo = stellarClassStr.replace(luminosityClassExtractPattern,"$1");
    return romanNo;
  },  
  getColorFromStellarClassString: (stellarClassStr) => {
    stellarClassStr ??= "";
    if (stellarClassStr === "") {
      return undefined;
    }
    const SPECT_MAP = constants.SPECT_CLASS;
    let spectClass = stellarClassStr.charAt(0);
    let spectStrength = parseFloat(stellarClassStr.substring(1, stellarClassStr.length).replace(/([0-9.]+).*/g, "$1"));

    let rgba = (SPECT_MAP[spectClass] === undefined || isNaN(spectStrength))
      ? undefined
      : converters.kelvin2rgb(SPECT_MAP[spectClass].min + SPECT_MAP[spectClass].step * spectStrength);
    if (rgba) {
      let romanNo = converters.getRomanNumberFromStellarClassString(stellarClassStr);
      rgba.a = (constants.LUMINOSITY_CLASS[romanNo] ?? constants.LUMINOSITY_CLASS["V"]).brightness;
    }
    return rgba;

  },
  getStarRadiusFromStellarClassString: (stellarClassStr, distance = true) => {
    stellarClassStr ??= "";
    if (stellarClassStr === "") {
      return undefined;
    }
    //I II III IV VI VII ia ia+ ia0 sd
    if (distance) {
      let romanNo = converters.getRomanNumberFromStellarClassString(stellarClassStr);
      //let radiusParam = (constants.SPECT_CLASS[stellarClassStr.charAt(0)] ?? {}).radius ?? 1;
      let radius = (constants.LUMINOSITY_CLASS[romanNo] ?? constants.LUMINOSITY_CLASS['V']).radius;
      return constants.LUMINOSITY_CLASS[romanNo] ?? {radius: radius, brightness: 1};
    } else {
      let luminosityClassExtractPattern = new RegExp(`^[${Object.keys(constants.SPECT_CLASS).join('')}][0-9.]+(${Object.keys(constants.LUMINOSITY_CLASS).join("|").replace(/\+/g,"\\+")}).*`)
      let romanNo = stellarClassStr.replace(luminosityClassExtractPattern,"$1");
      return constants.LUMINOSITY_CLASS[romanNo]
          ?? {radius: (constants.SPECT_CLASS[stellarClassStr.charAt(0)] ?? {}).radius ?? 1, brightness: 1};
          // Luminosityクラスが必ずしもスペクトル分類に含まれないので、その場合はStellarClassから取得
    }
  },
  getRotateVerticalLevel: (cameraDirection, verticalLevel, theta) => {
    // Convert theta from degrees to radians
    const thetaRad = theta * (- Math.PI / 180);

    // Normalize the direction vector
    const d = cameraDirection;
    const dNorm = Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z);
    const u = d.x / dNorm;
    const v = d.y / dNorm;
    const w = d.z / dNorm;

    // Construct the rotation matrix
    const cosTheta = Math.cos(thetaRad);
    const sinTheta = Math.sin(thetaRad);
    const oneMinusCosTheta = 1 - cosTheta;

    const R = [
        [
            cosTheta + u * u * oneMinusCosTheta,
            u * v * oneMinusCosTheta - w * sinTheta,
            u * w * oneMinusCosTheta + v * sinTheta
        ],
        [
            v * u * oneMinusCosTheta + w * sinTheta,
            cosTheta + v * v * oneMinusCosTheta,
            v * w * oneMinusCosTheta - u * sinTheta
        ],
        [
            w * u * oneMinusCosTheta - v * sinTheta,
            w * v * oneMinusCosTheta + u * sinTheta,
            cosTheta + w * w * oneMinusCosTheta
        ]
    ];

    // Apply the rotation matrix to the vertical level vector
    const vPrime = {
        x: R[0][0] * verticalLevel.x + R[0][1] * verticalLevel.y + R[0][2] * verticalLevel.z,
        y: R[1][0] * verticalLevel.x + R[1][1] * verticalLevel.y + R[1][2] * verticalLevel.z,
        z: R[2][0] * verticalLevel.x + R[2][1] * verticalLevel.y + R[2][2] * verticalLevel.z
    };

    return vPrime;
  }
};