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
    dist     = parseFloat(replaceHyphens(distanceString.replace(/[,]/,""), "-").replace(/^[^0-9\-\+]/g,''));
    //dist     = (enableDistance) ? dist / 20 + 100 : 100;
    dist     = ((enableDistance) ? dist * multiplyScalar + 10 : 100);


    alpha    = converters.getThetaFromAlpha(alphaArr[0],alphaArr[1],alphaArr[2]);
    dec      = converters.getThetaFromDec(decArr[0],decArr[1],decArr[2]);
    return converters.getCoordinatesFromAlphaAndDec(dist,alpha,dec);
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
};