class SelectiveGlow {
  constructor(scene, camera, renderer) {
    const renderScene = new THREE.RenderPass(scene, camera);

    const bloomPass1 = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      2.5,
      0,
      0
    );

    const bloomComposer1 = new THREE.EffectComposer(renderer);
    bloomComposer1.renderToScreen = false;
    bloomComposer1.addPass(renderScene);
    bloomComposer1.addPass(bloomPass1);

    const bloomPass2 = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5,
      0.2,
      0
    );

    const bloomComposer2 = new THREE.EffectComposer(renderer);
    bloomComposer2.renderToScreen = false;
    bloomComposer2.addPass(renderScene);
    bloomComposer2.addPass(bloomPass2);

    const finalPass = new THREE.ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture1: { value: bloomComposer1.renderTarget2.texture },
          bloomTexture2: { value: bloomComposer2.renderTarget2.texture }
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
          uniform sampler2D bloomTexture1;
          uniform sampler2D bloomTexture2;
    
          varying vec2 vUv;
    
          void main() {
            gl_FragColor = texture2D( baseTexture, vUv );
            gl_FragColor += vec4( 1.0 ) * texture2D( bloomTexture1, vUv );
            gl_FragColor += vec4( 1.0 ) * texture2D( bloomTexture2, vUv );
          }
          `,
        defines: {}
      }),
      "baseTexture"
    );
    finalPass.needsSwap = true;

    const finalComposer = new THREE.EffectComposer(renderer);
    finalComposer.addPass(renderScene);
    finalComposer.addPass(finalPass);

    this.bloomPass1 = bloomPass1;
    this.bloom1 = bloomComposer1;
    this.bloomPass2 = bloomPass2;
    this.bloom2 = bloomComposer2;
    this.final = finalComposer;
  }
}
