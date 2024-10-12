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
            overflow: hidden;
            border: none;
            position: relative;
            font-family: "Barlow Condensed", sans-serif;
            font-weight: 100;
            font-style: normal;
            cursor: pointer;
            user-select: none;
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
            console.log(`updateActive -> ${index}`);
            items.forEach((item, i) => {
              item.classList.toggle('active', i === index);
            });
            //const translateY = -((index - 4) * 30);  // Adjust the number to match item height
            const target = content.querySelector(".active");
            const translateY = target.offsetTop - container.offsetHeight / 2 + target.offsetHeight / 2
            content.style.transform = `translateY(-${translateY}px)`;
            callback(items.item(index));
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
      }
    }
  };