import Solar from 'solar';

let solar = new Solar();
let init = () => {
  solar.render(
    solar.planets.earth,
    document.body
  );
}

document.addEventListener("DOMContentLoaded", init);