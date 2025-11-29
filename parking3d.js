// ANTI-FLICKER 3D Parking Lot - All Fixes Applied
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof THREE === 'undefined') {
      console.error('Three.js not found.');
      return;
    }

    const canvas = document.getElementById('parking3d');
    if (!canvas) {
      console.error('Canvas element not found.');
      return;
    }

    // Renderer with logarithmic depth buffer (FIX #1)
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      antialias: true,
      alpha: false,
      logarithmicDepthBuffer: true  // ← ANTI-FLICKER FIX
    });
    renderer.setClearColor(0x0e0e10, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0e10);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(-90, 85, 90);
    camera.lookAt(0, 0, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(30, 50, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -120;
    directionalLight.shadow.camera.right = 120;
    directionalLight.shadow.camera.top = 120;
    directionalLight.shadow.camera.bottom = -120;
    directionalLight.shadow.bias = -0.003;  // ← ANTI-FLICKER FIX (FIX #2)
    scene.add(directionalLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    // Ground - EXPLICIT Y=0 (FIX #3)
    const groundGeometry = new THREE.PlaneGeometry(120, 85);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      roughness: 0.85,
      metalness: 0.15
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;  // ← EXPLICIT POSITION (FIX #3)
    ground.receiveShadow = true;
    scene.add(ground);

    // Base platform - LOWERED (FIX #4)
    const baseGeometry = new THREE.BoxGeometry(135, 3, 95);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3a3a3a,
      roughness: 0.7,
      metalness: 0.3
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -2.0;  // ← LOWERED FROM -1.5 (FIX #4)
    base.receiveShadow = true;
    base.castShadow = true;
    scene.add(base);

    // Parking lines - RAISED HIGH (FIX #5 - MOST IMPORTANT!)
    const spotMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFD700,
      roughness: 0.4,
      metalness: 0.2,
      emissive: 0xFFD700,
      emissiveIntensity: 0.4
    });

    const parkingSpots = [];
    const LINE_HEIGHT = 0.8;  // ← HIGH ABOVE GROUND (FIX #5)
    
    for (let i = 0; i < 3; i++) {
      const z = (i - 1) * 26;
      
      // Top line - RAISED
      const topLine = new THREE.Mesh(
        new THREE.BoxGeometry(36, 0.6, 1.2),  // Taller geometry
        spotMaterial
      );
      topLine.position.set(0, LINE_HEIGHT, z - 11);  // ← 0.8 instead of 0.2
      topLine.castShadow = true;
      scene.add(topLine);
      
      // Bottom line - RAISED
      const bottomLine = new THREE.Mesh(
        new THREE.BoxGeometry(36, 0.6, 1.2),
        spotMaterial
      );
      bottomLine.position.set(0, LINE_HEIGHT, z + 11);  // ← 0.8 instead of 0.2
      bottomLine.castShadow = true;
      scene.add(bottomLine);
      
      // Left line - RAISED
      const leftLine = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.6, 22),
        spotMaterial
      );
      leftLine.position.set(-17.5, LINE_HEIGHT, z);  // ← 0.8 instead of 0.2
      leftLine.castShadow = true;
      scene.add(leftLine);
      
      // Right line - RAISED
      const rightLine = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.6, 22),
        spotMaterial
      );
      rightLine.position.set(17.5, LINE_HEIGHT, z);  // ← 0.8 instead of 0.2
      rightLine.castShadow = true;
      scene.add(rightLine);
      
      parkingSpots.push({ x: 0, z: z });
    }

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4a4538,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(120, 14, 3), wallMaterial);
    backWall.position.set(0, 7, -42);
    backWall.castShadow = true;
    scene.add(backWall);
    
    const leftWall1 = new THREE.Mesh(new THREE.BoxGeometry(3, 14, 36), wallMaterial);
    leftWall1.position.set(-61, 7, -23);
    leftWall1.castShadow = true;
    scene.add(leftWall1);
    
    const leftWall2 = new THREE.Mesh(new THREE.BoxGeometry(3, 14, 32), wallMaterial);
    leftWall2.position.set(-61, 7, 26);
    leftWall2.castShadow = true;
    scene.add(leftWall2);
    
    const rightWall1 = new THREE.Mesh(new THREE.BoxGeometry(3, 14, 36), wallMaterial);
    rightWall1.position.set(61, 7, -23);
    rightWall1.castShadow = true;
    scene.add(rightWall1);
    
    const rightWall2 = new THREE.Mesh(new THREE.BoxGeometry(3, 14, 32), wallMaterial);
    rightWall2.position.set(61, 7, 26);
    rightWall2.castShadow = true;
    scene.add(rightWall2);
    
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(120, 9, 3), wallMaterial);
    frontWall.position.set(0, 4.5, 42);
    frontWall.castShadow = true;
    scene.add(frontWall);

    // Gates
    function createGate(x, z, rotation) {
      const gate = new THREE.Group();
      
      const postMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFD700,
        roughness: 0.25,
        metalness: 0.85,
        emissive: 0xFFD700,
        emissiveIntensity: 0.5
      });
      
      const post1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 13, 1.8), postMaterial);
      post1.position.set(-5.5, 6.5, 0);
      post1.castShadow = true;
      gate.add(post1);
      
      const post2 = post1.clone();
      post2.position.x = 5.5;
      gate.add(post2);
      
      const barMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFD700,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0xFFD700,
        emissiveIntensity: 0.6
      });
      
      const bar = new THREE.Mesh(new THREE.BoxGeometry(11, 0.6, 0.6), barMaterial);
      bar.position.set(0, 10, 0);
      bar.castShadow = true;
      gate.add(bar);
      
      const lightGeometry = new THREE.SphereGeometry(0.7, 16, 16);
      const lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFF00,
        emissive: 0xFFFF00,
        emissiveIntensity: 1.2
      });
      
      const light1 = new THREE.Mesh(lightGeometry, lightMaterial);
      light1.position.set(-5.5, 12.5, 0);
      gate.add(light1);
      
      const light2 = light1.clone();
      light2.position.x = 5.5;
      gate.add(light2);
      
      const pointLight1 = new THREE.PointLight(0xFFFF00, 1.5, 25);
      pointLight1.position.set(-5.5, 12.5, 0);
      gate.add(pointLight1);
      
      const pointLight2 = new THREE.PointLight(0xFFFF00, 1.5, 25);
      pointLight2.position.set(5.5, 12.5, 0);
      gate.add(pointLight2);
      
      gate.position.set(x, 0, z);
      gate.rotation.y = rotation;
      return gate;
    }
    
    scene.add(createGate(-61, 6, Math.PI / 2));
    scene.add(createGate(61, 6, Math.PI / 2));

    // Cars - properly positioned above ground
    function createCar(color, x, z, rotation = 0) {
      const car = new THREE.Group();
      
      const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.3,
        metalness: 0.7
      });
      
      const body = new THREE.Mesh(new THREE.BoxGeometry(7, 2.2, 15), bodyMaterial);
      body.position.y = 2.5;
      body.castShadow = true;
      car.add(body);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(5, 1.8, 9), bodyMaterial);
      roof.position.y = 3.8;
      roof.position.z = 1;
      roof.castShadow = true;
      car.add(roof);

      const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.5,
        metalness: 0.9,
        roughness: 0.05
      });

      const frontWindow = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.5, 0.2), windowMaterial);
      frontWindow.position.set(0, 3.5, -5.5);
      car.add(frontWindow);

      const leftWindow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 6), windowMaterial);
      leftWindow.position.set(-2.5, 3.5, 0);
      car.add(leftWindow);

      const rightWindow = leftWindow.clone();
      rightWindow.position.x = 2.5;
      car.add(rightWindow);

      const wheelGeometry = new THREE.CylinderGeometry(1.3, 1.3, 1, 24);
      const wheelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a,
        roughness: 0.4,
        metalness: 0.6
      });

      const wheelPositions = [
        { x: -2.5, y: 1.5, z: 4.5 },
        { x: 2.5, y: 1.5, z: 4.5 },
        { x: -2.5, y: 1.5, z: -4.5 },
        { x: 2.5, y: 1.5, z: -4.5 }
      ];

      wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x, pos.y, pos.z);
        wheel.castShadow = true;
        
        const rim = new THREE.Mesh(
          new THREE.CylinderGeometry(0.9, 0.9, 1.1, 16),
          new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 0.1, metalness: 0.95 })
        );
        rim.rotation.z = Math.PI / 2;
        wheel.add(rim);
        
        car.add(wheel);
      });

      car.position.set(x, 0, z);
      car.rotation.y = rotation;
      return car;
    }
    
    const car1 = createCar(0xCC3333, 0, -26, 0);
    const car2 = createCar(0xCC3333, 0, 0, 0);
    const car3 = createCar(0x44aa44, 0, 26, 0);
    const cars = [car1, car2, car3];
    
    scene.add(car1, car2, car3);
    
    // Mouse interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotation = { x: 0, y: 0 };
    let currentRotation = { x: 0, y: 0 };
    
    const initialCameraPosition = { x: -90, y: 85, z: 90 };
    const cameraDistance = Math.sqrt(
      initialCameraPosition.x ** 2 + 
      initialCameraPosition.y ** 2 + 
      initialCameraPosition.z ** 2
    );
    
    let zoom = 1;

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.offsetX, y: e.offsetY };
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mouseup', () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaX = e.offsetX - previousMousePosition.x;
        const deltaY = e.offsetY - previousMousePosition.y;
        
        targetRotation.y += deltaX * 0.005;
        targetRotation.x += deltaY * 0.005;
        targetRotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetRotation.x));
        
        previousMousePosition = { x: e.offsetX, y: e.offsetY };
      }
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoom += e.deltaY * -0.001;
      zoom = Math.max(0.5, Math.min(2, zoom));
    }, { passive: false });

    canvas.style.cursor = 'grab';
    
    function onWindowResize() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }
    
    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();
    
    let time = 0;
    function animate() {
      requestAnimationFrame(animate);
      
      time += 0.005;
      
      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.1;
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.1;
      
      const distance = cameraDistance / zoom;
      camera.position.x = Math.sin(currentRotation.y) * Math.cos(currentRotation.x) * distance;
      camera.position.y = Math.sin(currentRotation.x) * distance + 40;
      camera.position.z = Math.cos(currentRotation.y) * Math.cos(currentRotation.x) * distance;
      camera.lookAt(0, 0, 0);
      
      car1.rotation.y = Math.sin(time) * 0.03;
      car2.rotation.y = Math.sin(time + Math.PI) * 0.03;
      car3.rotation.y = Math.sin(time + Math.PI * 0.5) * 0.03;
      
      renderer.render(scene, camera);
    }
    
    animate();
    
    window.parking3d = {
      setPadOccupied: function(index, occupied) {
        if (index >= 0 && index < cars.length) {
          cars[index].visible = occupied;
        }
      },
      setAllOccupancy: function(occupancyArray) {
        occupancyArray.forEach((occupied, index) => {
          if (index < cars.length) {
            cars[index].visible = occupied;
          }
        });
      },
      resetView: function() {
        targetRotation = { x: 0, y: 0 };
        zoom = 1;
      }
    };
  });
})();