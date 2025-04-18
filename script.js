document.addEventListener('DOMContentLoaded', function() {
    // Interactive family scene
    setupFamilyInteractions();
    
    // WiFi monitoring visualization
    setupMatrixVisualization();
  });
  
  // ====== Family Scene Interactions ======
  function setupFamilyInteractions() {
    const familyMembers = document.querySelectorAll('.family-member');
    const routerSignals = document.getElementById('router-signals');
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    document.body.appendChild(tooltip);
    
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
    
    familyMembers.forEach(member => {
      // Show name on hover
      member.addEventListener('mouseenter', (e) => {
        const name = member.getAttribute('data-name');
        tooltip.textContent = name;
        
        // Position tooltip near the member
        const rect = member.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width/2 - tooltip.offsetWidth/2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
        tooltip.style.opacity = '1';
      });
      
      member.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
      });
      
      // Handle click - smile and show router signals
      member.addEventListener('click', () => {
        // Get the member's mouth element
        const mouthId = member.querySelector('path[id$="-mouth"]').id;
        const mouth = document.getElementById(mouthId);
        
        // Smile effect by changing the path's d attribute
        const memberName = member.getAttribute('data-name');
        
        // Make mouth smile
        if (mouthId === 'elderly-mouth') {
          mouth.setAttribute('d', 'M 340 315 Q 350 325, 360 315');
        } else if (mouthId === 'adult1-mouth') {
          mouth.setAttribute('d', 'M 440 315 Q 450 325, 460 315');
        } else if (mouthId === 'adult2-mouth') {
          mouth.setAttribute('d', 'M 540 315 Q 550 325, 560 315');
        } else if (mouthId === 'toddler-mouth') {
          mouth.setAttribute('d', 'M 645 320 Q 650 330, 655 320');
        }
        
        // Show router signals
        routerSignals.style.opacity = '1';
        routerSignals.style.animation = 'pulse 1.5s infinite';
        
        // Show toast notification
        toast.textContent = `Movement detected: ${memberName} is active`;
        toast.classList.remove('hide');
        toast.classList.add('show');
        
        // Reset after a few seconds
        setTimeout(() => {
          // Reset mouth
          if (mouthId === 'elderly-mouth') {
            mouth.setAttribute('d', 'M 340 320 Q 350 320, 360 320');
          } else if (mouthId === 'adult1-mouth') {
            mouth.setAttribute('d', 'M 440 320 Q 450 320, 460 320');
          } else if (mouthId === 'adult2-mouth') {
            mouth.setAttribute('d', 'M 540 320 Q 550 320, 560 320');
          } else if (mouthId === 'toddler-mouth') {
            mouth.setAttribute('d', 'M 645 325 Q 650 325, 655 325');
          }
          
          // Hide router signals
          routerSignals.style.opacity = '0';
          routerSignals.style.animation = 'none';
          
          // Hide toast
          toast.classList.remove('show');
          toast.classList.add('hide');
        }, 3000);
      });
    });
  }
  
  // ====== WiFi Matrix Visualization ======
  function setupMatrixVisualization() {
    const matrix = document.getElementById('matrix');
    
    // If matrix doesn't exist on the page, skip this function
    if (!matrix) return;
    
    const matrixRect = matrix.getBoundingClientRect();
    const matrixWidth = matrixRect.width;
    const matrixHeight = matrixRect.height;
    const dotSpacing = 12; // Denser grid
    const dots = [];
    const waves = [];
  
    // Pulse control variables
    let lastPulseTime = 0;
    const pulseCooldown = 700; // Reduced from 800ms to create waves more frequently
    let cursorInField = false;
    let cursorX = 0;
    let cursorY = 0;
    
    // Edge buffer to prevent boundary reflection issues
    const edgeBuffer = 15;
    
    // Wave thickness - 16px for thicker waves
    const waveThickness = 16;
    
    // Wave speed - slowed down to make waves last longer
    const waveSpeed = 3.0; // Reduced from 4.5 to make waves expand more slowly
    
    // Wave maximum size - increased to make waves last longer
    const waveMaxSizeFactor = 1.2; // Increased from 0.8 to let waves grow larger
    
    // Maximum wave limit - increased to allow more concurrent waves
    const maxWaves = 20; // Increased from 14 to allow more overlapping waves
  
    // Human figure coordinates (rotated 90 degrees clockwise and centered)
    const humanShape = [
      // Head (now on the left side)
      {x: matrixWidth * 0.45, y: matrixHeight * 0.5, r: 15},
      {x: matrixWidth * 0.46, y: matrixHeight * 0.475, r: 12},
      {x: matrixWidth * 0.46, y: matrixHeight * 0.525, r: 12},
      // Body (now horizontal)
      {x: matrixWidth * 0.48, y: matrixHeight * 0.5, r: 12},
      {x: matrixWidth * 0.52, y: matrixHeight * 0.5, r: 12},
      {x: matrixWidth * 0.55, y: matrixHeight * 0.5, r: 12},
      {x: matrixWidth * 0.58, y: matrixHeight * 0.5, r: 12},
      // Arms (now vertical)
      {x: matrixWidth * 0.52, y: matrixHeight * 0.45, r: 10},
      {x: matrixWidth * 0.52, y: matrixHeight * 0.55, r: 10},
      {x: matrixWidth * 0.53, y: matrixHeight * 0.43, r: 8},
      {x: matrixWidth * 0.53, y: matrixHeight * 0.57, r: 8},
      // Legs (now on the right side)
      {x: matrixWidth * 0.62, y: matrixHeight * 0.475, r: 10},
      {x: matrixWidth * 0.62, y: matrixHeight * 0.525, r: 10},
      {x: matrixWidth * 0.65, y: matrixHeight * 0.46, r: 8},
      {x: matrixWidth * 0.65, y: matrixHeight * 0.54, r: 8},
    ];
  
    // Create dots in a grid and store references to avoid DOM manipulation during animation
    const dotElements = document.createDocumentFragment();
    for (let x = 0; x <= matrixWidth; x += dotSpacing) {
      for (let y = 0; y <= matrixHeight; y += dotSpacing) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
  
        // Check if this dot is part of the human figure
        let isPerson = false;
        let personRadius = 0;
  
        for (const point of humanShape) {
          const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
          if (distance <= point.r) {
            isPerson = true;
            personRadius = point.r;
            break;
          }
        }
  
        if (isPerson) {
          dot.classList.add('person-dot');
          dot.style.opacity = '0.5';
        } else {
          dot.style.opacity = '0.5';
        }
  
        dotElements.appendChild(dot);
        dots.push({
          element: dot,
          x,
          y,
          originalSize: 3,
          originalOpacity: 0.5,
          isPerson,
          personSize: isPerson ? personRadius / 3 : 0,
          active: false
        });
      }
    }
  
    // Append all dots at once to minimize reflows
    matrix.appendChild(dotElements);
  
    // Mouse enter/leave detection for the matrix
    matrix.addEventListener('mouseenter', () => {
      cursorInField = true;
    });
    
    matrix.addEventListener('mouseleave', () => {
      cursorInField = false;
    });
  
    // Handle cursor movement
    document.addEventListener('mousemove', (e) => {
      const rect = matrix.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Update cursor position
      if (mouseX >= 0 && mouseX <= matrixWidth && mouseY >= 0 && mouseY <= matrixHeight) {
        cursorInField = true;
        cursorX = mouseX;
        cursorY = mouseY;
      } else {
        cursorInField = false;
      }
    });
  
    // Generate a unique ID for each wave to track them
    let waveIdCounter = 0;
  
    function createWave(x, y, isReflected = false, parentId = null, isSecondPulse = false) {
      // Ensure wave position is within valid boundaries
      x = Math.max(edgeBuffer, Math.min(matrixWidth - edgeBuffer, x));
      y = Math.max(edgeBuffer, Math.min(matrixHeight - edgeBuffer, y));
      
      const waveId = waveIdCounter++;
      
      // Create a wave at the specified position
      const wave = {
        id: waveId,
        parentId: parentId,
        x,
        y,
        size: isReflected ? 5 : 0, // Start slightly larger for reflected waves
        growing: true,
        maxSize: Math.max(matrixWidth, matrixHeight) * waveMaxSizeFactor, 
        speed: waveSpeed,
        isReflected: isReflected,
        isSecondPulse: isSecondPulse, // Track if this is a second pulse
        reflectionCount: isReflected ? 1 : 0,
        maxReflections: 1, // Keep at 1 to prevent cascade
        reflectionThreshold: 25, // Minimum size before reflections can occur
        boundaries: {
          top: false,
          bottom: false,
          left: false,
          right: false
        },
        // Adding "persistence" to make dots stay activated longer
        persistence: 3 // Dots will stay activated for a few frames after wave passes
      };
  
      waves.push(wave);
  
      // Limit number of waves for performance
      if (waves.length > maxWaves) {
        waves.shift();
      }
      
      return waveId;
    }
    
    // Create a second pulse after a small delay
    function createDelayedSecondPulse(x, y) {
      setTimeout(() => {
        createWave(x, y, false, null, true); // Mark this as a second pulse
      }, 200); // 200ms delay for second pulse
    }
  
    // Initial wave to show activity when page loads
    createWave(matrixWidth * 0.3, matrixHeight * 0.3);
    createDelayedSecondPulse(matrixWidth * 0.3, matrixHeight * 0.3);
    
    // Create periodic waves even without mouse movement
    setInterval(() => {
      if (!cursorInField) {
        const randomX = Math.random() * matrixWidth;
        const randomY = Math.random() * matrixHeight;
        createWave(randomX, randomY);
        createDelayedSecondPulse(randomX, randomY);
      }
    }, 3000);
  
    function updateWaves() {
      const currentTime = Date.now();
  
      // Create pulses on a timer if cursor is in field
      if (cursorInField && currentTime - lastPulseTime > pulseCooldown) {
        createWave(cursorX, cursorY);
        createDelayedSecondPulse(cursorX, cursorY); // Add a second pulse
        lastPulseTime = currentTime;
      }
  
      // Reset all active dots first to avoid unnecessary DOM updates
      // Using a more complex structure to store activation data:
      // Map key = dot index, value = { level: number, opacity: number, isSecondPulse: boolean }
      const activeDots = new Map(); 
      
      // Store new reflections to create after loop to prevent modification during iteration
      const newReflections = [];
  
      // Update wave positions
      for (let waveIndex = waves.length - 1; waveIndex >= 0; waveIndex--) {
        const wave = waves[waveIndex];
  
        if (wave.growing) {
          wave.size += wave.speed;
  
          // Calculate the wave's inner and outer radius
          const innerRadius = wave.size - waveThickness/2;
          const outerRadius = wave.size + waveThickness/2;
          const innerRadiusSq = innerRadius * innerRadius;
          const outerRadiusSq = outerRadius * outerRadius;
  
          // Affect dots with the wave - use more efficient distance calculations
          for (let i = 0; i < dots.length; i++) {
            const dot = dots[i];
  
            // Calculate distance using squared values to avoid square root (faster)
            const dx = dot.x - wave.x;
            const dy = dot.y - wave.y;
            const distSquared = dx*dx + dy*dy;
  
            // If the dot is within the wave's ring
            if (distSquared >= innerRadiusSq && distSquared <= outerRadiusSq) {
              // If this is a second pulse wave, mark dots with half opacity
              const opacity = wave.isSecondPulse ? 0.5 : 1.0;
              
              if (!activeDots.has(i)) {
                // First activation for this dot
                activeDots.set(i, { 
                  level: wave.persistence, 
                  opacity: opacity,
                  isSecondPulse: wave.isSecondPulse 
                });
              } else {
                // Dot already activated by another wave
                const currentDot = activeDots.get(i);
                
                // Keep the highest activation level and priority
                // Primary waves (not second pulses) take precedence
                if (!currentDot.isSecondPulse || wave.isSecondPulse) {
                  if (currentDot.level < wave.persistence) {
                    currentDot.level = wave.persistence;
                  }
                  
                  // Primary waves overwrite second pulse opacity
                  if (!wave.isSecondPulse) {
                    currentDot.opacity = 1.0;
                    currentDot.isSecondPulse = false;
                  }
                }
              }
            }
          }
          
          // Check for boundary reflections - but only after a minimum size
          // and only if we haven't exceeded maximum reflections
          if (wave.reflectionCount < wave.maxReflections && wave.size > wave.reflectionThreshold) {
            // Calculate wave boundary distances
            const distToTop = wave.y - wave.size;
            const distToBottom = matrixHeight - (wave.y + wave.size);
            const distToLeft = wave.x - wave.size;
            const distToRight = matrixWidth - (wave.x + wave.size);
            
            // Top boundary reflection
            if (distToTop <= 0 && !wave.boundaries.top) {
              wave.boundaries.top = true;
              
              // Calculate correct reflection position using proper mirror formula
              // Add extra buffer based on wave thickness to prevent cascading reflections
              const reflectionX = wave.x; 
              const reflectionY = 2 * edgeBuffer - distToTop + waveThickness;
              
              newReflections.push({
                x: reflectionX,
                y: reflectionY,
                parentId: wave.id,
                isSecondPulse: wave.isSecondPulse
              });
            }
            
            // Bottom boundary reflection
            if (distToBottom <= 0 && !wave.boundaries.bottom) {
              wave.boundaries.bottom = true;
              
              const reflectionX = wave.x;
              const reflectionY = matrixHeight - 2 * edgeBuffer + distToBottom - waveThickness;
              
              newReflections.push({
                x: reflectionX,
                y: reflectionY,
                parentId: wave.id,
                isSecondPulse: wave.isSecondPulse
              });
            }
            
            // Left boundary reflection
            if (distToLeft <= 0 && !wave.boundaries.left) {
              wave.boundaries.left = true;
              
              const reflectionX = 2 * edgeBuffer - distToLeft + waveThickness;
              const reflectionY = wave.y;
              
              newReflections.push({
                x: reflectionX,
                y: reflectionY,
                parentId: wave.id,
                isSecondPulse: wave.isSecondPulse
              });
            }
            
            // Right boundary reflection
            if (distToRight <= 0 && !wave.boundaries.right) {
              wave.boundaries.right = true;
              
              const reflectionX = matrixWidth - 2 * edgeBuffer + distToRight - waveThickness;
              const reflectionY = wave.y;
              
              newReflections.push({
                x: reflectionX,
                y: reflectionY,
                parentId: wave.id,
                isSecondPulse: wave.isSecondPulse
              });
            }
          }
  
          // Remove wave when it's too big
          if (wave.size > wave.maxSize) {
            waves.splice(waveIndex, 1);
          }
        }
      }
      
      // Create new reflections outside the main loop to prevent mutation issues
      for (const reflection of newReflections) {
        createWave(reflection.x, reflection.y, true, reflection.parentId, reflection.isSecondPulse);
      }
  
      // Decrease persistence counter for activated dots
      const activeDotsSet = new Set();
      const activationData = new Map();
      
      activeDots.forEach((data, key) => {
        const newLevel = data.level - 1;
        if (newLevel > 0) {
          activeDotsSet.add(key);
          activationData.set(key, {
            opacity: data.opacity,
            isSecondPulse: data.isSecondPulse
          });
        }
      });
  
      // Apply visual changes to dots (batched operations)
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
  
        if (activeDotsSet.has(i)) {
          // Get activation data for this dot
          const data = activationData.get(i);
          const activeOpacity = data.opacity;
          
          // Active dot
          if (dot.isPerson) {
            // Person dots grow larger when detected
            dot.element.style.width = `${dot.personSize * 2.5}px`;
            dot.element.style.height = `${dot.personSize * 2.5}px`;
            dot.element.style.opacity = `${activeOpacity}`;
            dot.element.style.backgroundColor = '#e63946'; // Red when detected
          } else {
            // Regular dot effect
            dot.element.style.width = '7px';
            dot.element.style.height = '7px';
            dot.element.style.opacity = `${activeOpacity}`;
          }
        } else {
          // Inactive dot - reset to original state
          dot.element.style.width = `${dot.originalSize}px`;
          dot.element.style.height = `${dot.originalSize}px`;
          dot.element.style.opacity = `${dot.originalOpacity}`;
          if (dot.isPerson) {
            dot.element.style.backgroundColor = '#3a86ff';
          }
        }
      }
  
      requestAnimationFrame(updateWaves);
    }
  
    // Start animation
    updateWaves();
  }
