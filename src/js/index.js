/* アクセス
   ../index.html?constellations=Ori+And+Tau&grid=1
 */

let progress = 0;
let progressAmount = 0;
let playButton = document.querySelector(".play");
let loadingContainer = document.querySelector(".progress-bar-container");
let loadingText = document.querySelector(".loading-text");
let progressBar = document.querySelector(".progress-bar");
let titleBox = document.querySelector("#title-box-container");
let titleContainer = document.querySelector("#title-container");

let scripts = [
  'src/js/three/three.min.js',
  'src/js/three/OrbitControls.js',
  'src/js/three/Pass.js',
  'src/js/three/ShaderPass.js',
  'src/js/three/EffectComposer.js',
  'src/js/three/RenderPass.js',
  'src/js/three/LuminosityHighPassShader.js',
  'src/js/three/CopyShader.js',
  'src/js/three/UnrealBloomPass.js'
];
let updateProgressBar = () => {
  progress += progressAmount;
  console.log(progress)
  progressBar.style.width = `${progress}%`
}

//load scripts
let loadScripts = async () => {
  for await (path of scripts) {
    await (new Promise((res,rej) => {
      const script = document.createElement('script');
      document.body.appendChild(script);
      script.onload = res;
      script.onerror = rej;
      script.src = path;
    }));
    updateProgressBar();
  }
}

//get url params
let params={};
location.search.replace(/^\?/g,'').split('&').map(s => p=s.split("=")).forEach(p=>{params[p[0]]=p[1]});
let constellationList = (params.constellations !== undefined)
  ? (params.constellations == "ALL") 
    ? Object.keys(constants.symbols)
    : params.constellations.split("+").map(c => decodeURI(c))
  : undefined;

//init
let initApp = async () => {
  titleBox.style.display = "none";
  playButton.style.display = "none";
  loadingText.style.display = "block";
  progressAmount = 100 / (constellationList.length + scripts.length);
  
  await loadScripts();
  data = await constellations.init(constellationList, updateProgressBar);
  console.log(data);
  await constellations.render(
    data.stars,
    data.lines,
    params
  )
  loadingContainer.style.display = "none";
};

let updateLink = (target) => {
  let focalLength = document.querySelector("input[name=focalLength]:checked").value;
  let rotate = document.querySelector("input[name=rotate]:checked").value;
  let showLine = document.querySelector("input[name=param-showLine]").checked ? 1 : 0;
  let autoLoad = document.querySelector("input[name=param-autoLoad]").checked ? 1 : 0;
  let grid = document.querySelector("input[name=param-grid]").checked ? 1 : 0;
  let autoRotate = document.querySelector("input[name=param-autoRotate]").checked ? 1 : 0;
  return `index.html?constellations=${target}&focalLength=${focalLength}&rotate=${rotate}&showLine=${showLine}&autoLoad=${autoLoad}&grid=${grid}&autoRotate=${autoRotate}`;
};

let init = () => {
  //main
  if (params.constellations) {
    if (params.autoLoad === "1") {
      initApp();
    } else {
      let targetConstellationLabels = constellationList.map(s => constants.symbols[s].label);
      document.querySelector("#title-text").innerHTML = targetConstellationLabels.filter((v,i) => i < 6).join("</br>") + ((targetConstellationLabels.length >= 6) ? `<br>...他 ${targetConstellationLabels.length - 6} 星座` : "");
      playButton.onclick = initApp;
    }
  } else {
    document.querySelector("#constellation_list").setAttribute("class", "");
    document.querySelector("#constellation-link-container").innerHTML = Object.keys(constants.symbols).map(s => `<li><a class="constellation-link" href="#" title="${s}">${s} - ${constants.symbols[s].label}</a></li>`).join("")
    titleContainer.className = "hide"
    document.body.setAttribute("class", "");
    document.querySelectorAll(".constellation-link").forEach(v => v.onclick=()=>{window.location.href=updateLink(v.title)});
    
  }
};

document.addEventListener("DOMContentLoaded", init);