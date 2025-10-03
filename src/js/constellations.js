import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TrackballControls} from 'three/addons/controls/TrackballControls.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {Lensflare, LensflareElement} from 'three/addons/objects/Lensflare.js';
import {Text} from 'trioka-three-text';
import Solar from 'solar';

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
    this.trackballControls = undefined;
    this.predefinedLocations = {Origin: {x: 0, y: 0, z:0}};
    this.symbol = undefined;
    this.isAwayFromEarth = false;
    this.command = {
      options: {
        duration: 5000,
        stopoffset: 0,
        easing: "power2.inOut",
        mode: "sync",
        lookAtTarget: new THREE.Object3D()
      },
      getCommands: (input) => {
        // Split the input string by semi-colon, trim, and filter out empty commands
        const commands = input.split(';')
                             .map(cmd => cmd.trim())
                             .filter(cmd => cmd.length > 0);
    
        // Initialize an array to hold the parsed commands
        const parsedCommands = [];
    
        // Regular expressions to match commands
        const lookatPattern = /^lookat\s+(\(([^,]+),([^,]+),([^)]+)\)|.*)$/;
        const targettoPattern = /^targetto\s+(\(([^,]+),([^,]+),([^)]+)\)|.*)$/;
        const gotoPattern = /^goto\s+(\(([^,]+),([^,]+),([^)]+)\)|.*)$/;
        const polartoPattern = /^polarto\s+(\(([^,]+),([^,]+),([^)]+)\)|.*)$/;
        const zoomPattern = /^zoomto\s+(\d+)$/;
        const rotatePattern = /^rotate\s+([+-]?\d+)$/;
        const waitPattern = /^wait\s+(\d+)$/;
        const setDurationPattern = /^set\s+duration\s*=\s*(\d+)$/;
        const setEasingPattern = /^set\s+easing\s*=\s*([\w\d]+\.[\w\d]+|\w+)$/;
        const setModePattern = /^set\s+mode\s*=\s*(async|sync)$/;
        const setStopOffsetPattern = /^set\s+stopoffset\s*=\s*(\d+|\d+\.\d+)$/;
        const setRotationOriginPattern = /^set\s+rotationorigin\s*=\s*(\(([^,]+),([^,]+),([^)]+)\)|.*)$/;
        const enableAutoRotatePattern = /^(enable|start)\s+(autorotate|autoRotate|AutoRotate)$/;
        const disableAutoRotatePattern = /^(disable|stop)\s+(autorotate|autoRotate|AutoRotate)$/;
    
        // Iterate over each command and parse it
        commands.forEach(command => {
            let match;
    
            // lookat
            if (match = command.match(lookatPattern)) {
                const target = match[1].trim();
    
                if (target.startsWith('(')) {
                    // Direct coordinates
                    parsedCommands.push({
                        action: 'lookat',
                        value: {
                            x: parseFloat(match[2].trim()),
                            y: parseFloat(match[3].trim()),
                            z: parseFloat(match[4].trim())
                        }
                    });
                } else if (this.predefinedLocations[target]) {
                    // Predefined location
                    parsedCommands.push({
                        action: 'lookat',
                        value: this.predefinedLocations[target]
                    });
                } else {
                    console.error(`Invalid target location: ${target}`);
                }
            } 
            // targetto
            else if (match = command.match(targettoPattern)) {
              const target = match[1].trim();
  
              if (target.startsWith('(')) {
                  // Direct coordinates
                  parsedCommands.push({
                      action: 'targetto',
                      value: {
                          x: parseFloat(match[2].trim()),
                          y: parseFloat(match[3].trim()),
                          z: parseFloat(match[4].trim())
                      }
                  });
              } else if (this.predefinedLocations[target]) {
                  // Predefined location
                  parsedCommands.push({
                      action: 'targetto',
                      value: this.predefinedLocations[target]
                  });
              } else {
                  console.error(`Invalid target location: ${target}`);
              }
          } 
            // goto
            else if (match = command.match(gotoPattern)) {
                const target = match[1].trim();
    
                if (target.startsWith('(')) {
                    // Direct coordinates
                    parsedCommands.push({
                        action: 'goto',
                        value: {
                            x: parseFloat(match[2].trim()),
                            y: parseFloat(match[3].trim()),
                            z: parseFloat(match[4].trim())
                        }
                    });
                } else if (this.predefinedLocations[target]) {
                    // Predefined location
                    parsedCommands.push({
                        action: 'goto',
                        value: this.predefinedLocations[target]
                    });
                } else {
                    console.error(`Invalid target location: ${target}`);
                }
            } 
            // polarto
            else if (match = command.match(polartoPattern)) {
                const target = match[1].trim();
    
                if (target.startsWith('(')) {
                    // Direct coordinates
                    parsedCommands.push({
                        action: 'polarto',
                        value: {
                            x: parseFloat(match[2].trim()),
                            y: parseFloat(match[3].trim()),
                            z: parseFloat(match[4].trim())
                        }
                    });
                } else if (this.predefinedLocations[target]) {
                    // Predefined location
                    parsedCommands.push({
                        action: 'polarto',
                        value: this.predefinedLocations[target]
                    });
                } else {
                    console.error(`Invalid polar location: ${target}`);
                }
            } 
            // wait
            else if (match = command.match(waitPattern)) {
              const duration = parseInt(match[1].trim(), 10);
              parsedCommands.push({
                  action: 'wait',
                  value: duration
              });
            }
            // set duration
            else if (match = command.match(setDurationPattern)) {
              const duration = parseInt(match[1].trim(), 10);
              parsedCommands.push({
                action: 'set duration',
                value: duration
              });
            }
            // set stopoffset
            else if (match = command.match(setStopOffsetPattern)) {
              const offset = parseFloat(match[1].trim(), 10);
              parsedCommands.push({
                action: 'set stopoffset',
                value: offset
              });
            }
            // set easing
            else if (match = command.match(setEasingPattern)) {
              const easing = match[1].trim();
              parsedCommands.push({
                action: 'set easing',
                value: easing
              });
            }
            // set mode
            else if (match = command.match(setModePattern)) {
              const mode = match[1].trim();
              parsedCommands.push({
                action: 'set mode',
                value: mode
              })
            }
            // set rotationorigin
            else if (match = command.match(setRotationOriginPattern)) {
              const target = match[1].trim();
  
              if (target.startsWith('(')) {
                  // Direct coordinates
                  parsedCommands.push({
                      action: 'set rotationorigin',
                      value: {
                          x: parseFloat(match[2].trim()),
                          y: parseFloat(match[3].trim()),
                          z: parseFloat(match[4].trim())
                      }
                  });
              } else if (this.predefinedLocations[target]) {
                  // Predefined location
                  parsedCommands.push({
                      action: 'set rotationorigin',
                      value: this.predefinedLocations[target]
                  });
              } else {
                  console.error(`Invalid rotationorigin location: ${target}`);
              }
          } 
          // wait
            // enable autorotate
            else if (match = command.match(enableAutoRotatePattern)) {
              parsedCommands.push({
                action: 'enable autorotate',
                value: undefined
              })
            }
            // disable autorotate
            else if (match = command.match(disableAutoRotatePattern)) {
              parsedCommands.push({
                action: 'disable autorotate',
                value: undefined
              })
            }
            // rotate
            else if (match = command.match(rotatePattern)) {
              const theta = parseInt(match[1].trim(), 10);
              parsedCommands.push({
                action: 'rotate',
                value: theta
              });
            }
            // zoomto
            else if (match = command.match(zoomPattern)) {
              const focalLength = parseInt(match[1].trim(), 10);
              parsedCommands.push({
                action: 'zoomto',
                value: focalLength
              });
            }
            // Handle invalid commands
            else {
                console.error(`Invalid command: ${command}`);
            }
        });
    
        return parsedCommands;
      },
      groupCommands: (commands) => {
        const groupedCommands = [];
        let currentMode = 'sync';  // Default mode
        let currentGroup = { mode: currentMode, commands: [] };
    
        commands.forEach(command => {
            if (command.action === 'set mode') {
                // If there's already a group with commands, push it to groupedCommands
                if (currentGroup.commands.length > 0) {
                    groupedCommands.push(currentGroup);
                }
                // Start a new group with the new mode
                currentMode = command.value;
                currentGroup = { mode: currentMode, commands: [] };
            } else {
                // Add the command to the current group
                currentGroup.commands.push(command);
            }
        });
    
        // Push the last group if it has any commands
        if (currentGroup.commands.length > 0) {
            groupedCommands.push(currentGroup);
        }
    
        return groupedCommands;
      },
      getOffsetCoordinate: (coordinate1, coordinate2, distanceAmount) => {
        // Calculate the direction vector from coordinate1 to coordinate2
        let direction = {
          x: coordinate2.x - coordinate1.x,
          y: coordinate2.y - coordinate1.y,
          z: coordinate2.z - coordinate1.z
        };
      
        // Normalize the direction vector
        let length = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
        let normalizedDirection = {
          x: direction.x / length,
          y: direction.y / length,
          z: direction.z / length
        };
      
        // Calculate the new coordinate based on the distanceAmount
        let newCoordinate = {
          x: coordinate2.x - normalizedDirection.x * distanceAmount,
          y: coordinate2.y - normalizedDirection.y * distanceAmount,
          z: coordinate2.z - normalizedDirection.z * distanceAmount
        };
      
        return newCoordinate;
      },
      run: async (input) => {
        const commandGroup = this.command.groupCommands(this.command.getCommands(input));
        const execCommand = (cmd) => new Promise((res,rej) => {
          switch (cmd.action) {
            case "set mode": {
              //async or sync
              res();
            } break;
            case "set duration": {
              this.command.options.duration = cmd.value;
              res();
            } break;
            case "set stopoffset": {
              this.command.options.stopoffset = cmd.value;
              res();
            } break;
            case "set rotationorigin": {
              let cameraDirection = new THREE.Vector3();
              this.perspectiveCamera.getWorldDirection(cameraDirection);
              this.orbitControls.target = new THREE.Vector3(cmd.value.x, cmd.value.y, cmd.value.z);
              this.trackballControls.target = new THREE.Vector3(cmd.value.x,cmd.value.y,cmd.value.z);
              this.perspectiveCamera.lookAt(cameraDirection.x, cameraDirection.y, cameraDirection.z);
              console.log("set rotateorigin command",  this.orbitControls.target, this.trackballControls.target)
              res();
            } break;
            case "set easing": {
              // see https://gsap.com/docs/v3/Eases/
              switch (cmd.value) {
                case "power1.in": case "power1.out": case "power1.inOut":
                case "power2.in": case "power2.out": case "power2.inOut":
                case "power3.in": case "power3.out": case "power3.inOut":
                case "power4.in": case "power4.out": case "power4.inOut":
                case "back.in":   case "back.out":   case "back.inOut":
                case "bounce.in": case "bounce.out": case "bounce.inOut":
                case "circ.in":   case "circ.out":   case "circ.inOut":
                case "elastic.in":case "elastic.out":case "elastic.inOut":
                case "expo.in":   case "expo.out":   case "expo.inOut":
                case "sine.in":   case "sine.out":   case "sine.inOut":
                case "steps.in":  case "steps.out":  case "steps.inOut":
                case "none":
                  this.command.options.easing = cmd.value;
                  break;
                default: 
                  this.command.options.easing = "none";
                  break;
              }
              res();
            } break;
            case "goto":{

              let destination = (this.command.options.stopoffset === 0)
                ? cmd.value
                : this.command.getOffsetCoordinate(
                  {x:this.perspectiveCamera.position.x,y:this.perspectiveCamera.position.y,z:this.perspectiveCamera.position.z},
                  cmd.value,
                  this.command.options.stopoffset);
              gsap.to(this.perspectiveCamera.position, {
                x: destination.x,
                y: destination.y,
                z: destination.z,
                duration: this.command.options.duration / 1000,
                ease: this.command.options.easing,
                onStart: () => {
                  this.orbitControls.enabled = false;
                  this.trackballControls.enabled = false;
                },
                onUpdate: () => {
                  this.perspectiveCamera.lookAt(this.command.options.lookAtTarget.position);
                },
                onComplete: () => {
                  this.perspectiveCamera.lookAt(this.command.options.lookAtTarget.position);
                  
                  this.orbitControls.enabled = true;
                  this.trackballControls.enabled = true;
                  console.log("done");
                  res()
                }
              })
            } break;
            case "polarto": {
              gsap.to(this.perspectiveCamera.up, {
                x: cmd.value.x,
                y: cmd.value.y,
                z: cmd.value.z,
                duration: this.command.options.duration / 1000,
                ease: this.command.options.easing,
                onStart: () => {
                  this.orbitControls.enabled = false;
                  this.trackballControls.enabled = false;
                },
                onUpdate: () => {
                },
                onComplete: () => {
                  this.orbitControls.enabled = true;
                  this.trackballControls.enabled = true;
                  console.log("done");
                  res()
                }
              })
            } break;
            case "lookat": {
              this.command.options.lookAtTarget.position.copy(this.perspectiveCamera.getWorldDirection(new THREE.Vector3()).add(this.perspectiveCamera.position));
              this.resetController(this.command.options.lookAtTarget.position);
              
              gsap.to(this.command.options.lookAtTarget.position, {
                x: cmd.value.x,
                y: cmd.value.y,
                z: cmd.value.z,
                duration: this.command.options.duration / 1000,
                ease: this.command.options.easing,
                onStart: () => {
                  this.orbitControls.enabled = false;
                  this.trackballControls.enabled = false;
                },
                onUpdate: () => {
                  this.perspectiveCamera.lookAt(this.command.options.lookAtTarget.position);
                  
                  let direction = new THREE.Vector3();
                  let distancefactor = -0.005;
                  direction.subVectors(this.perspectiveCamera.position, this.command.options.lookAtTarget.position).normalize();
                  let rotationOrigin = new THREE.Vector3().copy(this.perspectiveCamera.position).add(direction.multiplyScalar(distancefactor));
                  this.orbitControls.target = rotationOrigin;
                  this.trackballControls.target = rotationOrigin;
                },
                onComplete: () => {
                  this.orbitControls.enabled = true;
                  this.trackballControls.enabled = true;
                  //console.log("done");
                  res()
                }
              })
            } break;
            case "targetto": {
              this.command.options.lookAtTarget.position.copy(this.perspectiveCamera.getWorldDirection(new THREE.Vector3()).add(this.perspectiveCamera.position));

              gsap.to(this.command.options.lookAtTarget.position, {
                x: cmd.value.x,
                y: cmd.value.y,
                z: cmd.value.z,
                duration: this.command.options.duration / 1000,
                ease: this.command.options.easing,
                onStart: () => {
                  this.orbitControls.enabled = false;
                  this.trackballControls.enabled = false;
                },
                onUpdate: () => {
                  this.perspectiveCamera.lookAt(this.command.options.lookAtTarget.position)
                },
                onComplete: () => {
                  this.orbitControls.target = new THREE.Vector3(cmd.value.x, cmd.value.y, cmd.value.z);
                  this.trackballControls.target = new THREE.Vector3(cmd.value.x, cmd.value.y, cmd.value.z);

                  const targetQuaternion = this.perspectiveCamera.quaternion.clone(); // Get the final orientation
                  this.perspectiveCamera.quaternion.copy(targetQuaternion); // Apply it directly

                  this.orbitControls.enabled = true;
                  this.trackballControls.enabled = true;
                  console.log("done");
                  res()
                }
              })
            } break;
            case "enable autorotate": {
              this.orbitControls.autoRotate = true;
            } break
            case "disable autorotate": {
              this.orbitControls.autoRotate = false;
            } break
            case "rotate": {
              const cameraDirection = new THREE.Vector3();
              const currentlookAtPoint = new THREE.Vector3();
              const verticalLevel = {x: this.perspectiveCamera.up.x, y: this.perspectiveCamera.up.y, z: this.perspectiveCamera.up.z};
              //get current direction
              this.perspectiveCamera.getWorldDirection(cameraDirection);
              currentlookAtPoint.addVectors(this.perspectiveCamera.position, cameraDirection)
              const updateCoordinate = converters.getRotateVerticalLevel(currentlookAtPoint, verticalLevel, cmd.value);

              gsap.to(this.perspectiveCamera.up, {
                x: updateCoordinate.x,
                y: updateCoordinate.y,
                z: updateCoordinate.z,
                duration: this.command.options.duration / 1000,
                ease: this.command.options.easing,
                onStart: () => {
                  this.orbitControls.enabled = false;
                  this.trackballControls.enabled = false;
                },
                onUpdate: () => {
                },
                onComplete: () => {
                  this.orbitControls.enabled = true;
                  this.trackballControls.enabled = true;
                  console.log("done");
                  res()
                }
              })
            } break;
            case "zoomto": {
              const focalLengthProxy = { value: this.perspectiveCamera.getFocalLength() };
              gsap.to(focalLengthProxy, {
                value: cmd.value,
                duration: this.command.options.duration / 1000,
                ease: this.command.options.easing,
                onStart: () => {
                  this.orbitControls.enabled = false;
                  this.trackballControls.enabled = false;
                },
                onUpdate: () => {
                  this.perspectiveCamera.setFocalLength(focalLengthProxy.value);
                  this.perspectiveCamera.updateProjectionMatrix();
                },
                onComplete: () => {
                  this.orbitControls.enabled = true;
                  this.trackballControls.enabled = true;
                  console.log("done");
                  res()
                }
              });
            } break;
            case "wait":{
              setTimeout(res,cmd.value)
            } break;
            default:
              res();
          }
        })

        //run commands
        for await (let group of commandGroup) {
          switch (group.mode) {
            case "async": {
              await Promise.all(group.commands.map(cmd => execCommand(cmd)));
            } break;
            case "sync":
            default: {
              for await (let cmd of group.commands) {
                await execCommand(cmd);
              }
            } break;
          }
        }
      }
    }
  };
  newVector = (...args) => new THREE.Vector3(...args);
  newQuaternion = (...args) => (new THREE.Quaternion()).setFromAxisAngle( new THREE.Vector3(...args), Math.PI / 2 );
  newMatrix = () => new THREE.Matrix4();
  getProjectivePlaneCoordinateForCanvasSize = (coordinate, canvas, width = 192, height = 192) => {
    // Get the object's 3D position
    const vector = new THREE.Vector3(coordinate.x, coordinate.y, coordinate.z);
    
    // Project the 3D position to 2D screen space
    vector.project(this.perspectiveCamera);

    // Calculate the aspect ratios
    const canvasAspectRatio = canvas.clientWidth / canvas.clientHeight;
    const targetAspectRatio = width / height;

    // Convert the normalized device coordinates to 2D screen space
    let scaleX = width / 2;
    let scaleY = height / 2;

    // Adjust for aspect ratio difference
    if (canvasAspectRatio > targetAspectRatio) {
        // Canvas is wider than target, scale by height
        scaleX = scaleY * canvasAspectRatio / targetAspectRatio;
    } else {
        // Canvas is taller than target, scale by width
        scaleY = scaleX * targetAspectRatio / canvasAspectRatio;
    }

    const x = (vector.x * scaleX) + width / 2;
    const y = -(vector.y * scaleY) + height / 2;

    return { x, y };
    //this.constellations.data.lines[0].map(ls => ls.map(l => this.constellations.getProjectivePlaneCoordinateForCanvasSize(l, document.querySelector("canvas"))).map(l => l.x + " " + l.y).join(" L ")).join(" M ").replace(/^/g,"M ").replace(/^/g, `<svg xmlns="http://www.w3.org/2000/svg"><path d="`).replace(/$/g, `" stroke="#FF0000" stroke-width="1" fill="none"/></svg>`)
  };
  setOptions = (renderParams) => {
    this.options = {
      focalLength : parseFloat(renderParams.focalLength ?? 45),
      grid        : renderParams.grid == '1',
      earthView   : renderParams.earthView == '1',
      showEarth   : renderParams.showEarth == '1',
      showLine    :renderParams.showLine != '0',
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
      distance    : renderParams.distance != '0',
      distanceMultiplyScalar: Math.pow(10, parseFloat(renderParams.distanceMultiplyScalar ?? 0)),
      nav         : renderParams.nav == '1',
      renderMode  : renderParams.renderMode,
      twincle     : renderParams.twincle == '1',
      orbit       : renderParams.orbit == "1",
      lang        : renderParams.lang || "ja"
    };
  };

  toKatakana = (str) => str.replace(/[\u3041-\u3096]/g, function(match) {
		var chr = match.charCodeAt(0) + 0x60;
		return String.fromCharCode(chr);
	});

  init = async (symbol, updateProgressBar) => {
    this.isInitialized = false;
    symbol = (Array.isArray(symbol)) ? symbol : [symbol];
    this.symbol = symbol;
    let starData = (await Promise.all(symbol.map(s => this.loadStarData(s, updateProgressBar))));
    let stars = starData.map(s => s.stars)
      .reduce((acc,curr) => acc.concat(curr));
    let lines = (await Promise.all(symbol.map(s => this.loadLineData(s, stars, updateProgressBar))));
      this.isInitialized = true;
    return {stars: stars, lines: lines, constellation: starData.map(s => s.constellation)};
  };

  
  initNavigation = async () => {
    const navMenu = document.querySelector("#navigation-menu");

    // focal length
    const focalLengthList = [
      {label: "8mm",   value: 8},
      {label: "14mm",  value: 14},
      {label: "24mm",  value: 24},
      {label: "28mm",  value: 28},
      {label: "35mm",  value: 35},
      {label: "45mm",  value: 45},
      {label: "50mm",  value: 50},
      {label: "70mm",  value: 70},
      {label: "85mm",  value: 85},
      {label: "135mm", value: 135},
      {label: "200mm", value: 200},
      {label: "400mm", value: 400},
      {label: "800mm", value: 800},
      {label: "1000mm", value: 1000},
      {label: "1500mm", value: 1500},
      {label: "2000mm", value: 2000}
    ];
    const focalLength = UI.Component.scrollselect.get(focalLengthList, "FOCAL LENGTH");
    let focalLengthInitialIndex = focalLengthList.indexOf(focalLengthList.filter(f => this.options.focalLength <= f.value)[0]);
    focalLength.style.transform = "scale(0.7)";
    navMenu.append(focalLength);
    UI.Component.scrollselect.activate(
      focalLength, 
      focalLengthInitialIndex < 0 ? 0 : focalLengthInitialIndex, 
      (v) => {this.command.run(`zoomto ${v};`)}
    );

    // lookat select
    let getConstellationListItem = (svg, label) => `<div style="position: relative;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    align-content: center;
    justify-content: center;
    align-items: center;
    overflow: hidden;">${svg}<span style="position:absolute;">${label}</span></div>`
    const constellationList = this.symbol.map(s => {return {label: `${getConstellationListItem(constants.symbols[s].svg, constants.symbols[s][this.options.lang == "en" ? "label_en" : "label"])}`, value: s, labelForSort: constants.symbols[s][this.options.lang == "en" ? "label_en" : "label"]}}).sort((a,b) => (this.toKatakana(a.labelForSort) <= this.toKatakana(b.labelForSort)) ? -1 : 1);
    const lookAtControl = UI.Component.horizontalscroll.get(constellationList);
    lookAtControl.style.fontFamily = "Klee One";
    navMenu.append(lookAtControl);
    UI.Component.horizontalscroll.activate(lookAtControl, ((ev,v) => {
      let focusConstellationLine = (target) => {
        let timeRemains = 5000;
        let iter = 0;
        let unfocusIter = 0;
        let unfocusInterval = undefined;
        let r = 0x00;
        let g = 0x55;
        const rDelta = 0xff / (timeRemains / 100);
        const gDelta = 0x99 / (timeRemains / 100);
        let focusInterval = this.options.showLine ? setInterval(() => {
          if (timeRemains - (iter++) * 100 < 0) {
            clearInterval(focusInterval);
            let unfocusInterval = setInterval(() => {
              r = (r - rDelta < 0) ? 0 : r - rDelta;
              g = (g -gDelta < 0) ? 0 : g - gDelta;
              //new THREE.LineBasicMaterial({color: 0x0055ff});
              this.constellationLineGroup[target].forEach(l => l.material = new THREE.LineBasicMaterial({color: parseInt(`0x${Math.ceil(r).toString(16)}${Math.ceil(g).toString(16)}ff`, 16)}))
              
              if (timeRemains - (unfocusIter++) * 100 < 0) {
                this.constellationLineGroup[target].forEach(l => l.material = new THREE.LineBasicMaterial({color: 0x0055ff}))
                clearInterval(unfocusInterval);
              }
            },100)
          } else {
            r = (0xff <= r + rDelta) ? 0xff : r + rDelta;
            g = (0xff <= g + gDelta) ? 0xff : g + rDelta;
            //new THREE.LineBasicMaterial({color: 0x0055ff});
            this.constellationLineGroup[target].forEach(l => l.material = new THREE.LineBasicMaterial({color: parseInt(`0x${Math.ceil(r).toString(16)}${Math.ceil(g).toString(16)}ff`, 16)}))
          }
        }, 100) : undefined;
      };

      switch (ev.target.name) {
        case "command": {
          if (ev.target.getAttribute("data-exec-callback") === "false") {
            //de-select list
            ev.target.closest("form").querySelector("input[name=list]:checked").checked = false;
            return
          }
        } break;
        case "list": {
          switch (v.get("command")) {
            case 'goto': {
              const prevStopOffset = `${this.command.options.stopoffset}`;
              const stopOffset = 20;
              this.command.run(`set stopoffset=${stopOffset}; set mode=async; targetto ${v.get("list")}; ${v.get("command")} ${v.get("list")}; set stopoffset=${prevStopOffset}`);
              focusConstellationLine(v.get("list"));
            } break;
            case 'lookat':{
              this.command.run(`${v.get("command")} ${v.get("list")}`);
              focusConstellationLine(v.get("list"));

            } break;
            default: {
              this.command.run(`${v.get("command")} ${v.get("list")}`);
              focusConstellationLine(v.get("list"));
            } break;;
          }
          ev.target.closest("form").setAttribute("data-previous-camera-lookat", v.get("list"));
/* ********************************************************/
          console.log(v.get("list"), this.data.stars.filter(s => s.symbol === v.get("list") && s.name !== ""));
          let starListHtml = this.data.stars.filter(s => s.symbol === v.get("list") && s.name !== "").map(s => `
              <label class="horizontalscroll-switch" style="cursor: pointer;">
                <input name="custom-command" type="checkbox" data-exec-callback="true" value="set stopoffset=5; set mode=async; ##_COMMAND_## (${s.coordinates.x},${s.coordinates.y},${s.coordinates.z}); targetto (${s.coordinates.x},${s.coordinates.y},${s.coordinates.z}); set mode=sync; set stopoffset=${this.command.options.stopoffset}" onclick="setTimeout(()=>{this.checked=false;},500)">${(this.options.lang == "en") ? `${s.name_en}${s.aka.en ? `<br>(${s.aka.en})`: ""}` : `${s.name}${s.aka.ja ? `<br>(${s.aka.ja})`: ""}`}
              </label>  
          `).join("")
          document.querySelector("#ui-component-star-lists").innerHTML = starListHtml;
/* *********************************************************/
          } break;
        case "custom-command":
          console.log(v.get("custom-command"), ev)
          switch (v.get("custom-command")) {
            case "back to earth": {
              if (this.isAwayFromEarth) {
                const prevLookAt = ev.target.closest("form").getAttribute("data-previous-camera-lookat");
                this.command.run(`set mode=async; goto Origin; targetto Origin; ${(prevLookAt !== null) ? `lookat ${prevLookAt};` : ""} set mode=sync;`);
              }
            } break;
            case "polar to north": {
              const prevEasing = this.command.options.easing;
              const prevDuration = this.command.options.duration;
              this.command.run(`set duration=1000; set easing=linear; polarto (0,1,0); set easing=${prevEasing}; set duration=${prevDuration}`);
            } break;
            default: {
              this.command.run(`${v.get("custom-command").replace(/##_COMMAND_##/g, v.get("command"))}`);
            } break;
          }
        default: {
        } break;
      }
    }));
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
      let coordinates = converters.getCoordinates(s["赤経"], s["赤緯"], distance, this.options.distance, this.options.distanceMultiplyScalar);

      if (coordinates == undefined || absoluteMagnitude == undefined || distance == undefined || size == undefined || color == undefined) {
        return undefined;
      }

      let starInfo = {
        name: s["名前"],
        name_en: "",
        symbol: symbol,
        bayer_designation: (s["バイエル符号"] || "").replace(/\[.*/g,""),
        flamsteed_designation: (s["フラムスティード番号"] || "").replace(/\[.*/g,""),
        aka: ((s.additional_info || {})["仮符号・別名"] || ""),
        coordinates: coordinates.coordinate,
        distance: coordinates.distance,
        render_distance: coordinates.render_distance,
        size: size,
        color: color,
        "スペクトル分類": spectralClassString, 
        absoluteMagnitude: absoluteMagnitude,
        magnitude: magnitude,
        id: hip,
        additional_info: s.additional_info
      }
      let aka = (starInfo.aka.split(",").map(a => a.replace(/\[.*/g, "").trim())) || []
      starInfo.aka = {
        ja: aka.filter(a => a.match(/^[ア-ン]/g))[0],
        en: aka.filter(a => a.match(/^[A-Za-z]/g))[0]
      }
      starInfo.name_en = (starInfo.bayer_designation != "") 
        ? `${starInfo.bayer_designation} ${data.info["属格形"].replace(/\[.*/g,"")}`
        : (starInfo.flamsteed_designation != "")
          ? `${starInfo.flamsteed_designation} ${data.info["属格形"].replace(/\[.*/g,"")}`
          : starInfo.name;

      return starInfo
    }).filter(s => s !== undefined);
    return {
      constellation: {
        label: constants.symbols[symbol][this.options.lang == "en" ? "label_en" : "label"],
        symbol: symbol,
        coordinates: this.getCenterCoordinate([starData.map(s => s.coordinates)])
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
      .map(l => l.map(hip => (stars.filter(s => s.id === hip).map(s => {s.isPartOfLine = true; return s;})[0] ?? {}).coordinates).filter(s => s !== undefined))
    this.predefinedLocations[symbol] = this.getCenterCoordinate(lines);
    return lines;
  };

  getCenterCoordinate = (points) => {
    return points.reduce((acc,curr) => acc.concat(curr)).reduce((acc, curr, i) => {return {
      x: (acc.x * i + curr.x)/(i + 1),
      y: (acc.y * i + curr.y)/(i + 1),
      z: (acc.z * i + curr.z)/(i + 1),
    }});
  }
  getCenterCoordinateWithFixedLength = (points, length) => {
    return this.getCenterCoordinate(points.map((point) => point.map((p) => {
      let coordinate = new THREE.Vector3(p.x, p.y, p.z);
      coordinate.setLength(length);
      return {x:coordinate.x, y:coordinate.y, z:coordinate.z};
    })));
  }
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
  logScale =  (x, minX, maxX, minY, maxY) => {
    if (x <= 0 || minX <= 0 || maxX <= 0 || minY <= 0 || maxY <= 0) {
      throw new Error("All values must be > 0 for logarithmic scaling.");
    }
  
    const a = (Math.log10(maxY) - Math.log10(minY)) / (Math.log10(maxX) - Math.log10(minX));
    const b = Math.log10(minY) - a * Math.log10(minX);
    return Math.pow(10, a * Math.log10(x) + b);
  }
  resetController = (target) => {
    this.trackballControls = new TrackballControls(this.perspectiveCamera, this.renderer.domElement);
    this.trackballControls.target = target
    this.trackballControls.noZoom = false;
    this.trackballControls.zoomSpeed = 2;
    this.trackballControls.noPan = false;
    this.trackballControls.panSpeed = 0.1;
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
    this.orbitControls.autoRotate = this.options.autoRotate;
    this.orbitControls.autoRotateSpeed = this.options.autoRotateSpeed || 1.0;
    this.orbitControls.update();
  };
  render = async (stars, linePaths, constellationInfo, renderElement) => {
    let options = this.options;
    let world = new THREE.Group();
    this.data = {stars: stars, constellations: constellationInfo, lines: linePaths}
    this.labels = [];

    // navigation
    if (options.nav) {
      document.querySelector("#navigation-menu-container").style.display = "block";
      this.initNavigation();
    }

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
    let linePositionInfo = getCoordinateInfo(linePaths.reduce((acc,curr) => acc.concat(curr)).reduce((acc,curr) => acc.concat(curr)));

    // シーンとカメラ
    const ASPECT = windowSize.width / windowSize.height;
    this.scene = new THREE.Scene();
    let scene = this.scene;
    this.perspectiveCamera = new THREE.PerspectiveCamera(
      options.focalLength ?? 45,
      ASPECT,
      0.001,
      Math.pow(10,20)
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
    renderer.domElement.setAttribute("id","three");
    renderElement.appendChild(renderer.domElement);

    // コントローラーの定義
    // Trackball Controls
    let target = (options.earthView || this.symbol.length >= 48) 
      ? new THREE.Vector3(0, 0, 0) 
      : new THREE.Vector3(linePositionInfo.center.x, linePositionInfo.center.y, linePositionInfo.center.z);
    
    this.resetController(target);

    // カメラ位置
    this.initialDirection =(options.earthView)
      ? new THREE.Vector3(0,1,0)
      : new THREE.Vector3(linePositionInfo.center.x, linePositionInfo.center.y, linePositionInfo.center.z);
    this.perspectiveCamera.setFocalLength(options.focalLength ?? 45);
    this.perspectiveCamera.position.set(0, 0, 0);
    this.perspectiveCamera.rotation.order = "XYZ";
    this.perspectiveCamera.lookAt(this.initialDirection);
    this.perspectiveCamera.up = new THREE.Vector3(options.rotateX * 100, options.rotateY * 100, options.rotateZ * 100);
    this.trackballControls.target = target;
    this.orbitControls.target = target;
    
    // グリッド
    if (options.grid == true) {
      let size = 100
      scene.add(new THREE.GridHelper( size * 100, size * 10, 0xfa0a0a, 0x333333))
      scene.add(new THREE.AxesHelper(size));
      //let label_x = this.createLabel ("x", {r: 255, g:100, b: 100}, 24, 1);
      //let label_y = this.createLabel ("y", {r: 100, g:255, b: 100}, 24, 1);
      //let label_z = this.createLabel ("z", {r: 100, g:100, b: 255}, 24, 1);
      let label_x = this.createTroikaText ("x", {r: 255, g:100, b: 100}, 24);
      let label_y = this.createTroikaText ("y", {r: 100, g:255, b: 100}, 24);
      let label_z = this.createTroikaText ("z", {r: 100, g:100, b: 255}, 24);
      label_x.position.set(size / 2, 0.5, 0.5);
      label_y.position.set(0.5, size / 2, 0.5);
      label_z.position.set(0.5, 0.5, size / 2);
      //world.add(label_x);
      //world.add(label_y);
      //world.add(label_z);
    }

    // 星座線の描画
    if (options.showLine) {
      const material = new THREE.LineBasicMaterial({color: 0x0055ff});
      this.constellationLineGroup = {defaultMaterial: material};
      linePaths.forEach((linePath, index) => {
        this.constellationLineGroup[constellationInfo[index].symbol] = [];
        linePath.forEach((points, i) => {
          let bufGeometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, p.y, p.z)));
          let line = new THREE.Line(bufGeometry, material);
          world.add(line);
          this.constellationLineGroup[constellationInfo[index].symbol].push(line);
        })
      })
    }

    //星座名の表示
    let constellatinNamePositionOffset = (options.distance) ? 5000000000 : 100;
    let constellatinNameScalorFactor = (options.distance) ? 2500000 : 1/25;
    let constellatinNameFontSize = 38;
    let constellatinNameOpacity = 1;
    if (options.showConstellationName) {
      constellationInfo.forEach(c => {
        let constellationName = `${c.label} (${c.symbol})`;
        //let label = this.createLabel(constellationName, {r:0, g:125, b:255}, constellatinNameFontSize, constellatinNameOpacity, constellatinNameScalorFactor)
        let label = this.createTroikaText(constellationName, {r:0, g:125, b:255}, constellatinNameFontSize * constellatinNameScalorFactor);
        let labelCoordinate = new THREE.Vector3(c.coordinates.x, c.coordinates.y, c.coordinates.z);
        labelCoordinate.setLength(constellatinNamePositionOffset);
        label.position.set(labelCoordinate.x, labelCoordinate.y, labelCoordinate.z);
        world.add(label);
      })
    }

    // 特殊星座の描画
    if (options.showGuideConstellations) {
      const guideMaterial = new THREE.LineBasicMaterial({color: 0xffaa00});
      const guideConstellationList = Object.keys(constants.additionalConstellations);
      guideConstellationList.forEach(async c => {
        if (!(constants.additionalConstellations[c].NearBy.map(n => this.symbol.includes(n)).reduce((a,c) => a || c))) return;
        let guideData = await this.loadGuideLineData(c);
        guideData.lines.forEach((points, i) => {
          if (guideData.LineStyle !== undefined) {
            // 星座線
            let bufGeometry = new THREE.BufferGeometry().setFromPoints(
              (guideData.LineStyle.type === "CatmullRomCurve")
              ? (new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p.x, p.y, p.z)))).getPoints( 60 )
              : points.map(p => new THREE.Vector3(p.x, p.y, p.z))
            );

            let material = (guideData.LineStyle.style === "dashed")
              ? new THREE.LineDashedMaterial({color: parseInt(guideData.LineStyle.color) ? parseInt(guideData.LineStyle.color) : 0xff5500, dashSize: 0.5, gapSize: 0.5})
              : new THREE.LineBasicMaterial({color: parseInt(guideData.LineStyle.color) ? parseInt(guideData.LineStyle.color) : 0xffaa00})
            let line = new THREE.Line( bufGeometry, material);
            line.computeLineDistances();
            world.add(line)
            // 星座名
            if (options.showConstellationName) {
              let centerCoordinate = points.filter((v,i) => i < points.length - 1).reduce((acc, curr, i) => {return {
                x: (((acc.center ?? {}).x ?? acc.x) * i + curr.x)/(i + 1),
                y: (((acc.center ?? {}).y ?? acc.y) * i + curr.y)/(i + 1),
                z: (((acc.center ?? {}).z ?? acc.z) * i + curr.z)/(i + 1),
              }});
              let labelCoordinate = new THREE.Vector3(centerCoordinate.x, centerCoordinate.y, centerCoordinate.z);
              labelCoordinate.setLength(constellatinNamePositionOffset);
              //let label = this.createLabel(constants.additionalConstellations[c][this.options.lang == "en" ? "label_en" : "label"], {r:0xff, g:0x55, b:0x00}, constellatinNameFontSize, constellatinNameOpacity, constellatinNameScalorFactor);
              let label = this.createTroikaText(constants.additionalConstellations[c][this.options.lang == "en" ? "label_en" : "label"], {r:0xff, g:0x55, b:0x00}, constellatinNameFontSize * constellatinNameScalorFactor)
              label.position.set(labelCoordinate.x, labelCoordinate.y, labelCoordinate.z);
              world.add(label);
            }
          } else {
            // 星座線
            let bufGeometry = new THREE.BufferGeometry();
            bufGeometry.setFromPoints(points.map(p => new THREE.Vector3(p.x, p.y, p.z)));
            let line = new THREE.Line(bufGeometry, guideMaterial);
            world.add(line);

            // 星座名
            if (options.showConstellationName) {
              let centerCoordinate = this.getCenterCoordinateWithFixedLength([Array.from(new Set(points))], constellatinNamePositionOffset);
              let labelCoordinate = new THREE.Vector3(centerCoordinate.x, centerCoordinate.y, centerCoordinate.z);
              labelCoordinate.setLength(constellatinNamePositionOffset);
              //let label = this.createLabel(constants.additionalConstellations[c][this.options.lang == "en" ? "label_en" : "label"], {r:0xff, g:0xaa, b:0x00}, constellatinNameFontSize, constellatinNameOpacity, constellatinNameScalorFactor);
              let label = this.createTroikaText(constants.additionalConstellations[c][this.options.lang == "en" ? "label_en" : "label"], {r:0xff, g:0xaa, b:0x00}, constellatinNameFontSize * constellatinNameScalorFactor);
              label.position.set(labelCoordinate.x, labelCoordinate.y, labelCoordinate.z);
              world.add(label);
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
    this.starMesh = starMesh;
    this.dummy = dummy;
    switch (options.renderMode) {
/*
      //using point light and lensflare
      case 'PointLight': {

        let isStarFormsConstellationLine = (s) => linePaths.reduce((acc,curr) => acc.concat(curr)).reduce((acc,curr) => acc.concat(curr)).filter(l => l.x === s.x && l.y === s.y && l.z === s.z).length > 0;
        const textureLoader = new THREE.TextureLoader();
        const textureFlare0 = textureLoader.load( "./src/img/textures/lensflare/lensflare0_mono.png" );
        console.log(isStarFormsConstellationLine, textureFlare0)
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
          world.add(light);
          console.log(i,s)
    
          //flare
          const lensflare = new Lensflare();
          lensflare.addElement( new LensflareElement( textureFlare0, 128, 0, color) );
          if (isStarFormsConstellationLine(s.coordinates)) light.add( lensflare );
          
          // 星名の表示
          if (options.showStarName) {
            let label = this.createLabel(s.name, s.color);
            label.position.copy(light.position);
            world.add(label);
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
        let tempX = 0;
        stars.forEach((s, i) => {
          let radius = 0;
          let magnitude = Math.pow(1/2.5, (s.magnitude));
          let r = ((s.size.defined_radius) ? s.size.defined_radius : s.size.radius)

          if (options.distance && options.distanceMultiplyScalar >= 0.1) {
            radius = 
              Math.min(magnitude, 0.5) * (s.render_distance / 100) //(r * (constants.SUN_DIAMETER / constants.LIGHT_YEAR / 2) + 0.01) * magnitude
              + 0.05;
          } else {
            radius = Math.min(magnitude, 0.5) + 0.05;
          }
          dummy.position.set(s.coordinates.x, s.coordinates.y, s.coordinates.z);
          dummy.scale.setScalar(radius);
          dummy.updateMatrix();
          starMesh.setMatrixAt(i, dummy.matrix);

          // 星名の表示
          if (options.showStarName && s.isPartOfLine) {
            //let label = this.createLabel(s.name, s.color, 38, 1, 0.001);
            let label = this.createTroikaText(s[this.options.lang == "en"? "name_en" : "name"], s.color, 0.15);
            label.position.set(dummy.position.x, dummy.position.y + radius * 5, dummy.position.z);
            world.add(label)
          }
    
          // Initial twinkle effect (if needed)
          const twinkleFactor = (options.twincle) ? Math.sin(Date.now() * 0.005 + i) * 0.8 + 2 : 2 ; // Initial twinkle effect
          s.color = `#${('0'+parseInt(s.color.r).toString(16)).slice(-2)}${('0'+parseInt(s.color.g).toString(16)).slice(-2)}${('0'+parseInt(s.color.b).toString(16)).slice(-2)}`;
          const twinkleColor = new THREE.Color(s.color).multiplyScalar(twinkleFactor);
    
          starMesh.setColorAt(i, twinkleColor);
        });
    
        world.add(starMesh);
      } break;
    }

    // 太陽系（地球）
    let planets = [];
    const minMultiplyScalar = 0.1;
    const maxMultiplyScalar = 1e10;
    const scalar = (options.distance) ? options.distanceMultiplyScalar : 2;
    const orbitScale = this.logScale(scalar, minMultiplyScalar, maxMultiplyScalar, 0.000075, 1);
    const baseRadius = 0.05;

    if (this.options.showEarth) {
      const solar = new Solar();
  
      /* let planetNum = 8; let planetPos = `(${planets[planetNum].position.x},${planets[planetNum].position.y},${planets[planetNum].position.z})`; constellations.command.run(`set stopoffset = 1; set mode=async; set duration = 3000; lookat ${planetPos};goto ${planetPos};targetto ${planetPos}`) */

      planets = [
        solar.getObjects(solar.planets.sun,     baseRadius, this.logScale(scalar, minMultiplyScalar, maxMultiplyScalar, 0.0025, 1)),
        solar.getObjects(solar.planets.mercury, baseRadius, this.logScale(scalar, minMultiplyScalar, maxMultiplyScalar, 0.25, 1)),
        solar.getObjects(solar.planets.venus,   baseRadius, this.logScale(scalar, minMultiplyScalar, maxMultiplyScalar, 0.2, 1)),
        solar.getObjects(solar.planets.earth,   baseRadius, this.logScale(scalar, minMultiplyScalar, maxMultiplyScalar, 0.2, 1)),
        solar.getObjects(solar.planets.mars,    baseRadius, this.logScale(scalar, minMultiplyScalar, maxMultiplyScalar, 0.2, 1)),
        solar.getObjects(solar.planets.jupiter, baseRadius, this.logScale(scalar, minMultiplyScalar, maxMultiplyScalar, 0.05, 1)),
        solar.getObjects(solar.planets.saturn,  baseRadius, this.logScale(scalar, minMultiplyScalar, maxMultiplyScalar, 0.05, 1)),
        solar.getObjects(solar.planets.uranus,  baseRadius, this.logScale(scalar, minMultiplyScalar, maxMultiplyScalar, 0.25, 1)),
        solar.getObjects(solar.planets.pluto,   baseRadius, this.logScale(scalar, minMultiplyScalar, maxMultiplyScalar, 1, 1)),
        solar.getObjects(solar.planets.neptune, baseRadius, this.logScale(scalar, minMultiplyScalar, maxMultiplyScalar, 0.25, 1)),
      ];
      window.planets = planets;
      planets.forEach(p => {
        p.updateOrbit(1, orbitScale);
        world.add(p);
        if (options.orbit) world.add(p.getOrbitLine(orbitScale));
      });
      const ambientLight = new THREE.AmbientLight(0xaaaaaa);
      world.add(ambientLight);
      
    }

    world.rotation.x = options.worldRotateX;
    world.rotation.y = options.worldRotateY;
    world.rotation.z = options.worldRotateZ;
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
    
    // animation loop
    window.callback = (pos) => {};
    renderer.setAnimationLoop((time) => {
      if (planets.length !== 0 && options.orbit === true) {
        //planets.forEach((p,i) => p.updateOrbit(time/100, orbitScale, (i === 3) ? callback : undefined))
      }
      
      if (options.twincle) {
        stars.forEach((s, i) => {
          // Update twinkle effect in each frame
          const twinkleFactor = Math.sin(Date.now() / 500 + i) * 0.75 + 2; // More pronounced and slower twinkle effect
          const randomFactor = 0.8; // Add some randomness
          const finalTwinkleFactor = twinkleFactor * randomFactor;
      
          const twinkleColor = new THREE.Color(s.color).multiplyScalar(finalTwinkleFactor);
      
          starMesh.setColorAt(i, twinkleColor);
        });
      
        starMesh.instanceMatrix.needsUpdate = true; // Ensure updates are reflected
        starMesh.instanceColor.needsUpdate = true; // Ensure color updates are reflected
      }

      // rotate direction (if pos is inside of constellation name (5~15) => set negative dir)
      const cameraDistanceFromOrigin = Math.sqrt(
        Math.pow(this.perspectiveCamera.position.x,2) + 
        Math.pow(this.perspectiveCamera.position.y,2) + 
        Math.pow(this.perspectiveCamera.position.z,2));
      this.isAwayFromEarth = 
        (options.showEarth && cameraDistanceFromOrigin > 0.05) ||
        (!options.showEarth && cameraDistanceFromOrigin > 10);
      this.trackballControls.rotateSpeed = (!this.isAwayFromEarth && this.symbol.length >= 48) ? -0.5 : 0.5;

      // labels to face to cameara
      this.labels.forEach(l => l.quaternion.copy(this.perspectiveCamera.quaternion));

      renderer.render(scene, this.perspectiveCamera);
      composer.render();
      bloomComposer.render();
      finalComposer.render();
      this.trackballControls.update();
      this.orbitControls.update();
    });

    //tmp
    starMesh.instanceMatrix.needsUpdate = true;
    this.updateScene = () => {
      renderer.render(scene, this.perspectiveCamera);
    }
    this.getNewMatrix = (x,y,z,q,s) => new THREE.Matrix4(new THREE.Vector3(x,y,z),q,s);

    // initial lookat and target
    if (options.earthView || this.symbol.length >= 48) {
      this.command.run(`set duration=100; lookat (${this.initialDirection.x},${this.initialDirection.y},${this.initialDirection.z}); set duration=${this.command.options.duration}`);
    } else {
      this.command.run(`set duration=100; targetto (${this.initialDirection.x},${this.initialDirection.y},${this.initialDirection.z}); set duration=${this.command.options.duration}`);
    }
  }
  
  createLabel = (text, color, size = 16, opacity = 0.4, scaleFactor = 1/25) => {
    const width = size * 30;
    const height = size * 5;
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

  createTroikaText = (text, color, size = 16) => {
    const textMesh = new Text();
    
    const fillColor = parseInt(
      `00${Math.floor((color.r + 0xff) / 2).toString(16)}`.slice(-2) + 
      `00${Math.floor((color.g + 0xff) / 2).toString(16)}`.slice(-2) + 
      `00${Math.floor((color.b + 0xff) / 2).toString(16)}`.slice(-2),16);
    const blurColor = parseInt(
      `00${color.r.toString(16)}`.slice(-2) + 
      `00${color.g.toString(16)}`.slice(-2) + 
      `00${color.b.toString(16)}`.slice(-2),16);
    textMesh.text = text;
    textMesh.anchorX = "center";
    textMesh.anchorY = "middle";
    textMesh.textAlign = "center";
    textMesh.fontSize = size;
    textMesh.font = (this.options.lang === "en") ? `./src/fonts/Barlow_Condensed/BarlowCondensed-Regular.ttf` : `./src/fonts/Klee_One/KleeOne-Regular.ttf`;
    textMesh.color = fillColor
    textMesh.fillOpacity = 1;
    
    //stroke
    //textMesh.strokeColor = 0xffffff
    //textMesh.strokeWidth = "1%";
    //textMesh.strokeOpacity = 1;

    // outline
    textMesh.outlineColor = blurColor;
    textMesh.outlineWidth = "0%";
    textMesh.outlineOpacity = 0.1;
    textMesh.outlineBlur = "50%";
    this.labels.push(textMesh);
    return textMesh;
  }
  reset =  () => {
    this.data = new Array();
    this.isInitialized = false;
  }

  loadData = async (symbol) => await this.loadJSON(`${this.path}/${symbol}.json`)
  loadJSON = async (path) => await fetch(path).then((res) => res.json())
}

export default Constellations;