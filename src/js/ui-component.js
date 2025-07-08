let UI = {
    Component: {
      scrollselect: {
        get: (lists, title, options) => {
          //lists = [{label:"", value:""}]
  
          //ui
          let style = document.createElement('style');
          let container = document.createElement("div");
          let titleLabel = document.createElement("div");
          let content = document.createElement("div");
          let items = lists.map((l) => {
            let item = document.createElement("span");
            item.setAttribute("data-value", l.value);
            item.innerHTML = l.label;
            return item;
          });
          let css = document.createTextNode(`
          .scrollselect-container {
            width: 150px;
            height: 500px;
            top: calc(50% - 500px / 2);
            position: fixed;
            right: 30px;
            overflow: hidden;
            border: none;
            font-family: "Barlow Condensed", sans-serif;
            font-weight: 100;
            font-style: normal;
            cursor: pointer;
            user-select: none;
            backdrop-filter: blur(2px);
            background: repeating-linear-gradient(-45deg, #ffffff05 0px, #ffffff05 5px, #ffffff10 5px, #ffffff10 10px);
          }

          .scrollselect-content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 500px 0px;
            transition: transform 0.3s ease-in-out;
          }
  
          .scrollselect-content span {
            font-size: 20px;
            color: #fff5;
            margin: 15px 0;
            height: 40px;
            -webkit-transition: all 0.3s ease-in-out;
            -moz-transition: all 0.3s ease-in-out;
            -ms-transition: all 0.3s ease-in-out;
            -o-transition: all 0.3s ease-in-out;
            transition: all 0.3s ease-in-out;
          }
          .scrollselect-content span:has(+ .active) {
            font-size: 28px;
            color: #fffa;
            margin: 15px 0;
            -webkit-transition: all 0.3s ease-in-out;
            -moz-transition: all 0.3s ease-in-out;
            -ms-transition: all 0.3s ease-in-out;
            -o-transition: all 0.3s ease-in-out;
            transition: all 0.3s ease-in-out;
          }
          .scrollselect-content span.active {
            font-size: 36px;
            color: #fff;
            -webkit-transition: all 0.3s ease-in-out;
            -moz-transition: all 0.3s ease-in-out;
            -ms-transition: all 0.3s ease-in-out;
            -o-transition: all 0.3s ease-in-out;
            transition: all 0.3s ease-in-out;
          }
          .scrollselect-content span.active + span {
            font-size: 28px;
            color: #999;
            -webkit-transition: all 0.3s ease-in-out;
            -moz-transition: all 0.3s ease-in-out;
            -ms-transition: all 0.3s ease-in-out;
            -o-transition: all 0.3s ease-in-out;
            transition: all 0.3s ease-in-out;
          }
  
          .scrollselect-container:after {
            content: "";
            position: absolute;
            left: 0px;
            right: 130px;
            height: 100px;
            top: calc(100% / 2 - 50px);
            background-color: transparent;
            border-top: 1px solid white;
            border-bottom: 1px solid white;
            border-left: 1px solid white;
            z-index: 100;
          }
          .scrollselect-container:before {
            content: "";
            position: absolute;
            left: 130px;
            right: 0px;
            height: 100px;
            top: calc(100% / 2 - 50px);
            background-color: transparent;
            border-top: 1px solid white;
            border-bottom: 1px solid white;
            border-right: 1px solid white;
            z-index: 100;
          }
          .scrollselect-container .title {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            text-align: center;
            display: block;
            background: #fff1;
            backdrop-filter: blur(2px);
            padding: 10px 0px;
            width: 100%;
            font-size: 20px;
          }
          `);
          titleLabel.innerText = title;
          style.appendChild(css);
          container.append(style);
          container.className = "scrollselect-container";
          content.className = "scrollselect-content";
          titleLabel.className = "title";
          items.forEach(i => content.append(i));
          container.append(content);
          container.append(titleLabel);
          //return
          return container;
        },
        activate: (container, activeIndex, callback, options) => {
          options = options || {};
          let content = container.querySelector(".scrollselect-content");
          let items = content.querySelectorAll("span");
            
          //event
          let isScrolling = false;  // To prevent multiple rapid scrolls
          let startY = 0;
          let endY = 0;
          let updateActive = (index) => {
            items.forEach((item, i) => {
              item.classList.toggle('active', i === index);
            });
            //const translateY = -((index - 4) * 30);  // Adjust the number to match item height
            const target = content.querySelector(".active");
            const translateY = target.offsetTop - container.offsetHeight / 2 + target.offsetHeight / 2
            content.style.transform = `translateY(-${translateY}px)`;
            callback(items.item(index).getAttribute("data-value"));
          }
          // init selection
          activeIndex = (activeIndex < 0) ? 0 : activeIndex;
          updateActive(activeIndex);
  
          container.addEventListener('wheel', (event) => {
            if (!container.checkVisibility({checkOpacity: true, checkVisibilityCSS: true})) return;
            if (isScrolling) return;  // Ignore if already scrolling
  
            isScrolling = true;
  
            // Check scroll direction
            if (event.deltaY > 0 && activeIndex < items.length - 1) {
              activeIndex++;
            } else if (event.deltaY < 0 && activeIndex > 0) {
              activeIndex--;
            }
  
            updateActive(activeIndex);
  
            // Allow scrolling after a short delay to prevent multiple scrolls at once
            setTimeout(() => {
              isScrolling = false;
            }, 200);  // Adjust the delay (in ms) to control the scroll speed
  
            event.preventDefault();  // Prevent default scroll behavior
          });
  
          // Handle touch events for swipe detection
          container.addEventListener('touchstart', (event) => {
            if (!container.checkVisibility({checkOpacity: true, checkVisibilityCSS: true})) return;
            startY = event.touches[0].clientY;  // Record where the touch started
            console.log(event.touches[0])
          });
  
          container.addEventListener('touchmove', (event) => {
            if (!container.checkVisibility({checkOpacity: true, checkVisibilityCSS: true})) return;
            endY = event.touches[0].clientY;  // Track the movement
          });

          container.addEventListener("mousedown", (event) => {
            if (!container.checkVisibility({checkOpacity: true, checkVisibilityCSS: true})) return;
            const isUpDirection = (event.clientY - container.offsetTop) < container.clientHeight / 2;
            if (isUpDirection && 0 < activeIndex) {
              activeIndex--;
              updateActive(activeIndex);
              console.log("up")
            } else if (!isUpDirection && activeIndex < items.length - 1) {
              activeIndex++;
              updateActive(activeIndex);
              console.log("down")
            }
          })
  
          container.addEventListener('touchend', () => {
            if (!container.checkVisibility({checkOpacity: true, checkVisibilityCSS: true})) return;
            const swipeDistance = startY - endY;
            const isUpDirection = (startY - container.offsetTop) < container.clientHeight / 2
            console.log(`(${startY} - ${container.offsetTop}) < ${container.clientHeight} / 2`, isUpDirection, startY, endY)
  
            if (50 < Math.abs(swipeDistance) && endY != 0) {  // Check if swipe is large enough
              if (0 < swipeDistance && activeIndex < items.length - 1) {
                activeIndex++;  // Swipe up to move to the next item
              } else if (swipeDistance < 0  && 0 < activeIndex) {
                activeIndex--;  // Swipe down to move to the previous item
              }
              updateActive(activeIndex);
              console.log("scroll", swipeDistance)
            } else if (isUpDirection && 0 < activeIndex) {
              activeIndex--;
              updateActive(activeIndex);
              console.log("up")
            } else if (!isUpDirection && activeIndex < items.length - 1) {
              activeIndex++;
              updateActive(activeIndex);
              console.log("down")
            }
  
            startY = 0;
            endY = 0;
          });
        }
      },
      horizontalscroll: {
        get: (lists, options) => {
          //lists = [{label:"", value:""}]
          options = options || {};
  
          //ui
          let style = document.createElement('style');
          let wrapper = document.createElement("form");
          let container = document.createElement("div");
          let toggle = document.createElement("div");
          //let titleLabel = document.createElement("div");
          let items = lists.map((l) => {
            let item = document.createElement("label");
            item.classList = "horizontalscroll-item-container";
            item.innerHTML = `<input name="list" type="radio" value="${l.value}"><div class="horizontalscroll-item">${l.label}</div>`;
            return item;
          });
          let subitemConteiner = document.createElement("div");
          let maxHeight = 150;
          let css = document.createTextNode(`
          .horizontalscroll-warpper {
            width: 95%;
            height: ${maxHeight + 65}px;
            overflow: auto;
            display: flex;
            align-items: flex-start;
            place-content: center;
            flex-flow: column;
            position: fixed;
            left: 30px;
            bottom: 60px;
          }
          .horizontalscroll-warpper::-webkit-scrollbar {
            width: 16px;
            display:none;
          }
        
          .horizontalscroll-warpper::-webkit-scrollbar-track {
            background: transparent;
            display:none;
          }
        
          .horizontalscroll-warpper::-webkit-scrollbar-thumb {
            background-image: repeating-linear-gradient(-45deg, #ffffff15 0px, #ffffff15 5px, #ffffff30 5px, #ffffff30 10px);
            box-shadow: inset 0 0 5px #000a;
            border-radius: 0px;
            border: 2px solid #000;
            display:none;
          }
          .horizontalscroll-switch-container {
            position: fixed;
            display: flex;
            flex-direction: column;
            flex-wrap: nowrap;
            align-content: center;
            justify-content: center;
            align-items: flex-start;
            font-family: "Barlow Condensed", sans-serif;
            top: calc(50% - 500px / 2);
            height: 500px;
          }
          .horizontalscroll-switch {
            display: block;
            width: 120px;
            height: 50px;
            padding: 0px 15px;
            filter: brightness(0.8);
            font-size: 18px;
            line-height: 50px;
            background: repeating-linear-gradient(-45deg, #ffffff05 0px, #ffffff05 5px, #ffffff15 5px, #ffffff15 10px);
            backdrop-filter: blur(5px);
            -webkit-transition: all 0.1s ease-in-out;
            -moz-transition: all 0.1s ease-in-out;
            -ms-transition: all 0.1s ease-in-out;
            -o-transition: all 0.1s ease-in-out;
            transition: all 0.1s ease-in-out;
          }
          .horizontalscroll-switch:has(input:checked) {
            filter: brightness(2);
            background: repeating-linear-gradient(45deg, #ffffff05 0px, #ffffff05 5px, #ffffff15 5px, #ffffff15 10px);
            0 0 50px #000000, inset 0 0 20px #ffffff17;
            pading 0px 15px;
            box-shadow: inset 0 0 200px #ffffff22;
            border-left: 3px solid #005bff;
            border-right: 3px solid #005bff;
            margin-left: -6px;
            -webkit-transition: all 0.1s ease-in-out;
            -moz-transition: all 0.1s ease-in-out;
            -ms-transition: all 0.1s ease-in-out;
            -o-transition: all 0.1s ease-in-out;
            transition: all 0.1s ease-in-out;
          }
          .horizontalscroll-switch input {
            display: none;
            visibility: hidden;
          }

          .horizontalscroll-container {
            display:flex;
            flex-direction: row;
            flex-wrap: nowrap;
            justify-content: flex-start;
            align-items: center;
            height: ${maxHeight}px;
            margin: 0 165px;
          }
          .horizontalscroll-container .horizontalscroll-item-container{
            background: repeating-linear-gradient(-45deg, #ffffff05 0px, #ffffff05 5px, #ffffff10 5px, #ffffff10 10px);
            /*filter: brightness(0.7);*/
            backdrop-filter: blur(2px);
              -webkit-transition: all 0.1s ease-in-out;
              -moz-transition: all 0.1s ease-in-out;
              -ms-transition: all 0.1s ease-in-out;
              -o-transition: all 0.1s ease-in-out;
              transition: all 0.1s ease-in-out;
          }
          .horizontalscroll-container .horizontalscroll-item-container:has(input:checked) {
            background: repeating-linear-gradient(45deg, #ffffff05 0px, #ffffff05 5px, #ffffff10 5px, #ffffff10 10px);
            filter: brightness(2);
            /*box-shadow: 0 0 50px #000;*/
            background-color: rgb(0 0 0 / 0%);
            backdrop-filter: blur(5px);
            border-radius: 10px !important;
              -webkit-transition: all 0.1s ease-in-out;
              -moz-transition: all 0.1s ease-in-out;
              -ms-transition: all 0.1s ease-in-out;
              -o-transition: all 0.1s ease-in-out;
              transition: all 0.1s ease-in-out;
          }
          .horizontalscroll-container .horizontalscroll-item-container .horizontalscroll-item{
            height:75px;
            width: 150px;
            overflow: hidden;
            cursor: pointer;
            white-space: pre-wrap;
            display: flex;
            align-content: center;
            justify-content: center;
            align-items: center;
            flex-direction: row;
            flex-wrap: nowrap;
            text-align: center;
              -webkit-transition: all 0.1s ease-in-out;
              -moz-transition: all 0.1s ease-in-out;
              -ms-transition: all 0.1s ease-in-out;
              -o-transition: all 0.1s ease-in-out;
              transition: all 0.1s ease-in-out;
          }
          .horizontalscroll-container .horizontalscroll-item-container:has(input:checked) .horizontalscroll-item,
          .horizontalscroll-container .horizontalscroll-item-container:has(input[type=checkbox]) .horizontalscroll-item{
            height:${maxHeight}px;
            width: ${maxHeight}px;
            cursor: pointer;
            white-space: pre-wrap;
            display: flex;
            align-content: center;
            justify-content: center;
            align-items: center;
            flex-direction: row;
            flex-wrap: nowrap;
            text-align: center; 
            font-size: 14px;
            color: #fff;
            text-shadow: 0 0 3px #000, 0 0 10px #000;
              -webkit-transition: all 0.1s ease-in-out;
              -moz-transition: all 0.1s ease-in-out;
              -ms-transition: all 0.1s ease-in-out;
              -o-transition: all 0.1s ease-in-out;
              transition: all 0.1s ease-in-out;
          }
          .horizontalscroll-container .horizontalscroll-item-container input[type=radio],
          .horizontalscroll-container .horizontalscroll-item-container input[type=checkbox] {
            visibility: hidden;
            display: none;
          }
          #ui-component-star-lists {
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            justify-content: flex-start;
            align-items: center;
            overflow-x: auto;
            overflow-y: hidden;
            position: fixed;
            max-width: calc(100vw - 30px);
            bottom: calc(50px - 20px);
            left: calc(30px);
            scrollbar-width: none;
          }
          #ui-component-star-lists label {
            margin: 2px;
            white-space: nowrap;
            background:repeating-linear-gradient(-45deg, #ffffff05 0px, #ffffff05 5px, #ffffff10 5px, #ffffff10 10px);
            filter: brightness(2);
            font-size: 14px;
            text-align: center;
            margin: 0 1px;
            width: inherit;
            line-height:23px;
            display: flex;
            flex-direction: column;
            flex-wrap: nowrap;
            align-content: center;
            justify-content: center;
            align-items: center;
          }
          #ui-component-star-lists label:first-child {
            border-radius: 0px 0px 0px 0px;
          }
          #ui-component-star-lists label:last-child {
            border-radius: 0px 0px 0px 0px;
          }
          `);
          let compassSVG = `<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5333.3335 5333.3335" height="45px" width="45px" xml:space="preserve" id="svg2" version="1.1"><metadata id="metadata8"><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/></cc:Work></rdf:RDF></metadata><defs id="defs6"/><g transform="matrix(1.3333333,0,0,-1.3333333,0,5333.3333)" id="g10"><g transform="scale(0.1)" id="g12"><g transform="scale(2.00552)" id="g18"><path id="path20" style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 13367.3,8985.04 -1929.9,4473.66 c 1277.3,-492.4 2183.9,-1730.8 2183.9,-3181.8 0,-457.31 -90.7,-893.31 -254,-1291.86 z m -3155.6,1035.46 v 5209 l 3291.2,-7804.45 z m 0,-3153.11 c -796.94,0 -1529.37,274.14 -2109.92,732.28 l 2109.92,1423.07 2109.9,-1423.07 c -580.5,-458.14 -1313,-732.28 -2109.9,-732.28 z M 7056.12,8985.04 c -163.35,398.55 -254.05,834.55 -254.05,1291.86 0,1451 906.65,2689.5 2183.97,3181.8 z m 7448.38,561.75 1692.7,730.11 -1692.7,730.3 c -306.4,1813.9 -1733.7,3245.8 -3545.1,3559.4 L 10211.7,16300 9463.92,14566.6 C 7652.52,14253 6225.31,12821.1 5918.91,11007.2 L 4226.18,10276.9 5918.86,9546.79 C 6021.73,8937.92 6250.45,8372.09 6578.14,7877 l -793.96,-1840.47 1503,1013.71 c 601.99,-545.95 1357.8,-924.7 2194.29,-1066.01 l 730.23,-1692.78 730.2,1692.78 c 836.5,141.31 1592.3,520.06 2194.3,1066.06 l 1503.1,-1013.76 -794,1840.52 c 327.6,495.04 556.4,1060.87 659.2,1669.74"/></g></g></g></svg>`;
          let earthSVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#ffffffaa" version="1.1" id="Capa_1" width="27px" height="27px" viewBox="0 0 48.625 48.625" xml:space="preserve"><g><g><polygon points="35.432,10.815 35.479,11.176 34.938,11.288 34.866,12.057 35.514,12.057 36.376,11.974 36.821,11.445     36.348,11.261 36.089,10.963 35.7,10.333 35.514,9.442 34.783,9.591 34.578,9.905 34.578,10.259 34.93,10.5   "/><polygon points="34.809,11.111 34.848,10.629 34.419,10.444 33.819,10.583 33.374,11.297 33.374,11.76 33.893,11.76   "/><path d="M22.459,13.158l-0.132,0.34h-0.639v0.33h0.152c0,0,0.009,0.07,0.022,0.162l0.392-0.033l0.245-0.152l0.064-0.307    l0.317-0.027l0.125-0.258l-0.291-0.06L22.459,13.158z"/><polygon points="20.812,13.757 20.787,14.08 21.25,14.041 21.298,13.717 21.02,13.498   "/><path d="M48.619,24.061c-0.007-0.711-0.043-1.417-0.11-2.112c-0.225-2.317-0.779-4.538-1.609-6.62    c-0.062-0.155-0.119-0.312-0.185-0.465c-1.106-2.613-2.659-4.992-4.56-7.045c-0.125-0.134-0.252-0.266-0.379-0.396    c-0.359-0.373-0.728-0.737-1.11-1.086C36.344,2.402,30.604,0,24.312,0C17.967,0,12.186,2.445,7.852,6.44    C6.842,7.371,5.914,8.387,5.072,9.475C1.896,13.583,0,18.729,0,24.312c0,13.407,10.907,24.313,24.313,24.313    c9.43,0,17.617-5.4,21.647-13.268c0.862-1.682,1.533-3.475,1.985-5.354c0.115-0.477,0.214-0.956,0.3-1.441    c0.245-1.381,0.379-2.801,0.379-4.25C48.625,24.228,48.62,24.145,48.619,24.061z M44.043,14.344l0.141-0.158    c0.185,0.359,0.358,0.724,0.523,1.094l-0.23-0.009l-0.434,0.06V14.344z M40.53,10.102l0.004-1.086    c0.382,0.405,0.75,0.822,1.102,1.254l-0.438,0.652l-1.531-0.014l-0.096-0.319L40.53,10.102z M11.202,7.403V7.362h0.487    l0.042-0.167h0.797v0.348l-0.229,0.306h-1.098L11.202,7.403L11.202,7.403z M11.98,8.488c0,0,0.487-0.083,0.529-0.083    s0,0.486,0,0.486L11.411,8.96l-0.209-0.25L11.98,8.488z M45.592,18.139h-1.779l-1.084-0.807l-1.141,0.111v0.696h-0.361    l-0.39-0.278l-1.976-0.501v-1.28l-2.504,0.195l-0.776,0.417h-0.994L34.1,16.643l-1.207,0.67v1.261l-2.467,1.78l0.205,0.76h0.5    L31,21.838l-0.352,0.129l-0.019,1.892l2.132,2.428h0.928l0.056-0.148h1.668l0.481-0.445h0.946l0.519,0.52l1.41,0.146l-0.187,1.875    l1.565,2.763l-0.824,1.575l0.056,0.742l0.649,0.647v1.784l0.852,1.146v1.482h0.736c-4.096,5.029-10.33,8.25-17.305,8.25    C12.009,46.625,2,36.615,2,24.312c0-3.097,0.636-6.049,1.781-8.732v-0.696l0.798-0.969c0.277-0.523,0.574-1.033,0.891-1.53    l0.036,0.405l-0.926,1.125c-0.287,0.542-0.555,1.096-0.798,1.665v1.27l0.927,0.446v1.765l0.889,1.517l0.723,0.111l0.093-0.52    l-0.853-1.316l-0.167-1.279h0.5l0.211,1.316l1.233,1.799L7.02,21.27l0.784,1.199l1.947,0.482v-0.315l0.779,0.111l-0.074,0.556    l0.612,0.112l0.945,0.258l1.335,1.521l1.705,0.129l0.167,1.391l-1.167,0.816l-0.055,1.242l-0.167,0.76l1.688,2.113l0.129,0.724    c0,0,0.612,0.166,0.687,0.166c0.074,0,1.372,0.983,1.372,0.983v3.819l0.463,0.13l-0.315,1.762l0.779,1.039l-0.144,1.746    l1.029,1.809l1.321,1.154l1.328,0.024l0.13-0.427l-0.976-0.822l0.056-0.408l0.175-0.5l0.037-0.51l-0.66-0.02l-0.333-0.418    l0.548-0.527l0.074-0.398l-0.612-0.175l0.036-0.37l0.872-0.132l1.326-0.637l0.445-0.816l1.391-1.78l-0.316-1.392l0.427-0.741    l1.279,0.039l0.861-0.682l0.278-2.686l0.955-1.213l0.167-0.779l-0.871-0.279l-0.575-0.943l-1.965-0.02l-1.558-0.594l-0.074-1.111    l-0.52-0.909l-1.409-0.021l-0.814-1.278l-0.723-0.353l-0.037,0.39l-1.316,0.078l-0.482-0.671l-1.373-0.279l-1.131,1.307    l-1.78-0.302l-0.129-2.006l-1.299-0.222l0.521-0.984l-0.149-0.565l-1.707,1.141l-1.074-0.131L9.48,21.016l0.234-0.865l0.592-1.091    l1.363-0.69l2.632-0.001l-0.007,0.803l0.946,0.44l-0.075-1.372l0.682-0.686l1.376-0.904l0.094-0.636l1.372-1.428l1.459-0.808    l-0.129-0.106l0.988-0.93l0.362,0.096l0.166,0.208l0.375-0.416l0.092-0.041l-0.411-0.058l-0.417-0.139v-0.4l0.221-0.181h0.487    l0.223,0.098l0.193,0.39l0.236-0.036v-0.034l0.068,0.023l0.684-0.105l0.097-0.334l0.39,0.098v0.362l-0.362,0.249h0.001    l0.053,0.397l1.239,0.382c0,0,0.001,0.005,0.003,0.015l0.285-0.024l0.019-0.537l-0.982-0.447l-0.056-0.258l0.815-0.278l0.036-0.78    l-0.852-0.519l-0.056-1.315l-1.168,0.574h-0.426l0.112-1.001l-1.59-0.375l-0.658,0.497v1.516l-1.183,0.375l-0.474,0.988    l-0.514,0.083v-1.264l-1.112-0.154l-0.556-0.362l-0.224-0.819l1.989-1.164l0.973-0.296l0.098,0.654l0.542-0.028l0.042-0.329    l0.567-0.081l0.01-0.115l-0.244-0.101l-0.056-0.348l0.697-0.059l0.421-0.438l0.023-0.032l0.005,0.002l0.128-0.132l1.465-0.185    l0.648,0.55l-1.699,0.905l2.162,0.51l0.28-0.723h0.945l0.334-0.63l-0.668-0.167V6.212L22.69,5.284l-1.446,0.167l-0.816,0.427    l0.056,1.038l-0.853-0.13L19.5,6.212l0.817-0.742l-1.483-0.074l-0.426,0.129l-0.185,0.5l0.556,0.094l-0.111,0.556l-0.945,0.056    l-0.148,0.37l-1.371,0.038c0,0-0.038-0.778-0.093-0.778c-0.055,0,1.075-0.019,1.075-0.019l0.817-0.798l-0.446-0.223l-0.593,0.576    l-0.984-0.056l-0.593-0.816h-1.261L12.81,6.008h1.206l0.11,0.353l-0.313,0.291l1.335,0.037l0.204,0.482l-1.503-0.056l-0.073-0.371    L12.831,6.54L12.33,6.262l-1.125,0.009C14.888,3.588,19.417,2,24.312,2c5.642,0,10.797,2.109,14.73,5.574l-0.265,0.474    l-1.029,0.403l-0.434,0.471l0.1,0.549l0.531,0.074l0.32,0.8l0.916-0.369l0.151,1.07h-0.276l-0.752-0.111l-0.834,0.14l-0.807,1.14    l-1.154,0.181l-0.167,0.988l0.487,0.115l-0.141,0.635l-1.146-0.23l-1.051,0.23l-0.223,0.585l0.182,1.228l0.617,0.289l1.035-0.006    l0.699-0.063l0.213-0.556l1.092-1.419l0.719,0.147l0.708-0.64l0.132,0.5l1.742,1.175l-0.213,0.286l-0.785-0.042l0.302,0.428    l0.483,0.106l0.566-0.236l-0.012-0.682l0.251-0.126l-0.202-0.214l-1.162-0.648l-0.306-0.861h0.966l0.309,0.306l0.832,0.717    l0.035,0.867l0.862,0.918l0.321-1.258l0.597-0.326l0.112,1.029l0.583,0.64l1.163-0.02c0.225,0.579,0.427,1.168,0.604,1.769    L45.592,18.139z M13.261,11.046l0.584-0.278l0.528,0.126l-0.182,0.709l-0.57,0.181L13.261,11.046z M16.36,12.715v0.459h-1.334    l-0.5-0.139l0.125-0.32l0.641-0.265h0.876v0.265H16.36z M16.974,13.355V13.8l-0.334,0.215l-0.416,0.077c0,0,0-0.667,0-0.737    H16.974z M16.598,13.174v-0.529l0.459,0.418L16.598,13.174z M16.807,14.244v0.433l-0.319,0.32h-0.709l0.111-0.486l0.335-0.029    l0.069-0.167L16.807,14.244z M15.041,13.355h0.737l-0.945,1.321l-0.39-0.209l0.084-0.556L15.041,13.355z M18.059,14.092v0.432    H17.35l-0.194-0.28v-0.402h0.056L18.059,14.092z M17.404,13.498l0.202-0.212l0.341,0.212l-0.273,0.225L17.404,13.498z     M45.954,19.265l0.07-0.082c0.029,0.126,0.06,0.252,0.088,0.38L45.954,19.265z"/><path d="M3.782,14.884v0.696c0.243-0.568,0.511-1.122,0.798-1.665L3.782,14.884z"/></g></g></svg>`;

          toggle.innerHTML = `
            <div style="position: fixed; bottom: 93px;">
              <label class="horizontalscroll-switch" style="border-radius: 0px 0px 0px 0px; cursor: pointer;"><input name="command" type="radio" data-exec-callback="false" value="lookat" checked>Look At</label>
              <label class="horizontalscroll-switch" style="border-radius: 0px 0px 0px 0px; cursor: pointer;"><input name="command" type="radio" data-exec-callback="false" value="goto">Go To</label>
              <label class="horizontalscroll-switch" style="border-radius: 0px 0px 0px 0px; cursor: pointer;"><input name="command" type="radio" data-exec-callback="false" value="targetto">Orbit Around</label>
            </div>
            <div style="margin-top:50px">
              <label class="horizontalscroll-switch" style="display: flex;flex-direction: row;flex-wrap: nowrap;align-content: center;justify-content: flex-end;align-items: center;background:repeating-linear-gradient(-45deg, #ffffff05 0px, #ffffff05 5px, #ffffff10 5px, #ffffff10 10px); filter: brightness(2); border-radius: 0 0 0 0; cursor: pointer;">
                <input name="custom-command" type="checkbox" data-exec-callback="true" value="polar to north" onclick="setTimeout(()=>{this.checked=false;},500)">
                <div style="position: absolute;left: 0; height:45px; width:45px;">${compassSVG}</div>
                Polar to North
              </label>
              <label class="horizontalscroll-switch" style="display: flex;flex-direction: row;flex-wrap: nowrap;align-content: center;justify-content: flex-end;align-items: center;background:repeating-linear-gradient(-45deg, #ffffff05 0px, #ffffff05 5px, #ffffff10 5px, #ffffff10 10px); filter: brightness(2); border-radius: 0 0 0 0; cursor: pointer;">
                <input name="custom-command" type="checkbox" data-exec-callback="true" value="back to earth" onclick="setTimeout(()=>{this.checked=false;},500)">
                <div style="position: absolute;left: 0;height:45px;width:45px;display: flex;flex-direction: column;flex-wrap: nowrap;align-content: center;justify-content: center;align-items: center;">${earthSVG}</div>
                Back to Earth
              </label>
              <label class="horizontalscroll-switch" style="display: flex;flex-direction: row;flex-wrap: nowrap;align-content: center;justify-content: flex-end;align-items: center;background:repeating-linear-gradient(-45deg, #ffffff05 0px, #ffffff05 5px, #ffffff10 5px, #ffffff10 10px); filter: brightness(2); border-radius: 0 0 0 0; cursor: pointer;"><input name="snippet" type="checkbox" data-exec-callback="true" value="fullscreen" onclick="(function(){document.querySelector('body').requestFullscreen();})();">
                <div style="position: absolute;left: 0;height:45px;width:45px;display: flex;flex-direction: column;flex-wrap: nowrap;align-content: center;justify-content: center;align-items: center;">
                  <svg width="800px" height="800px" viewBox="0 0 32 32" id="i-fullscreen" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" style="margin: 8px;">
                    <path d="M4 12 L4 4 12 4 M20 4 L28 4 28 12 M4 20 L4 28 12 28 M28 20 L28 28 20 28"></path>
                  </svg>
                </div>
                Full Screen
              </label>
            </div>
          `;
          style.appendChild(css);
          wrapper.append(style);
          wrapper.className = "horizontalscroll-warpper";
          container.className = "horizontalscroll-container";
          toggle.className = "horizontalscroll-switch-container";
          subitemConteiner.id = "ui-component-star-lists";
          //titleLabel.className = "title";
          items.forEach(i => container.append(i));
          container.append(subitemConteiner);
          wrapper.append(container);
          wrapper.append(toggle);
          //return
          return wrapper;
        },
        activate: (container, callback, options) => {
          options = options || {};
          let content = container.querySelectorAll(".horizontalscroll-item-container input");

          //update
          let updateActive = (index) => {
            content.forEach((item, i) => {
              item.checked = (i === index);
            });
            //const translateY = -((index - 4) * 30);  // Adjust the number to match item height
            const target = container.querySelector(".horizontalscroll-item-container input:checked");
            const translateY = target.offsetTop - container.offsetHeight / 2 + target.offsetHeight / 2
            //content.style.transform = `translateY(-${translateY}px)`;
          }
          
          container.addEventListener("change", (ev) => {
            callback(ev, new FormData(container));
          })
        }
      }
    }
  };