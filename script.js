// Updated code to add more balls and prepare for web integration

// Setting up scene, camera, and renderer
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('cradle-container').appendChild(renderer.domElement);

// Setting up the camera position
camera.position.set(0, 3, 10);  // Adjusted position to ensure good visibility of the balls and border

// Create a Cannon.js world
let world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Gravity pointing downwards
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 20; // Increase iterations for more accurate collisions

// Materials for physics
let ballMaterial = new CANNON.Material();
let groundMaterial = new CANNON.Material();
let wallMaterial = new CANNON.Material();

// Adding ambient light
let ambientLight = new THREE.AmbientLight(0xffffff, 1); // White light to illuminate the scene
scene.add(ambientLight);

// Create ground plane for Cannon.js
let groundBody = new CANNON.Body({
    mass: 0,
    material: groundMaterial
});
let groundShape = new CANNON.Plane();
groundBody.addShape(groundShape);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Creating geometry for the balls (representing skills)
let ballGeometry = new THREE.SphereGeometry(0.5, 82, 82);
let colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffa500]; // Seven different colors
let balls = [];
let ballBodies = [];

for (let i = 0; i < 7; i++) {
    // Create Three.js mesh
    let ballMeshMaterial = new THREE.MeshStandardMaterial({ color: colors[i] });
    let ball = new THREE.Mesh(ballGeometry, ballMeshMaterial);
    ball.position.set(i * 1.2 - 4.2, 3.0, 0); // Spread out the balls
    scene.add(ball);
    balls.push(ball);

    // Create Cannon.js body
    let ballShape = new CANNON.Sphere(0.5);
    let ballBody = new CANNON.Body({
        mass: 1,
        material: ballMaterial,
        position: new CANNON.Vec3(ball.position.x, ball.position.y, ball.position.z)
    });
    ballBody.addShape(ballShape);
    world.addBody(ballBody);
    ballBodies.push(ballBody);
}

// Add borders to contain balls
let borderMaterial = new CANNON.Material();
let borderThickness = 0.2;

function createBorder(x, y, z, width, height) {
    let borderBody = new CANNON.Body({
        mass: 0,
        material: borderMaterial
    });
    let borderShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, borderThickness / 2));
    borderBody.addShape(borderShape);
    borderBody.position.set(x, y, z);
    world.addBody(borderBody);
}

// Bottom border
createBorder(0, 0.2, 0, 10, 1);
// Left border
createBorder(-5, 1, 0, 1, 5);
// Right border
createBorder(5, 1, 0, 1, 5);

// Collision properties
let contactMaterial = new CANNON.ContactMaterial(ballMaterial, ballMaterial, {
    restitution: 0.9, // Elastic collisions
    friction: 0.05 // Minimal friction for smoother movement
});
world.addContactMaterial(contactMaterial);

// Event listeners for mouse actions (updated to handle physics)
let isDragging = false;
let dragBallIndex = null;

renderer.domElement.addEventListener('mousedown', (event) => {
    let rect = renderer.domElement.getBoundingClientRect();
    let mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObjects(balls);

    if (intersects.length > 0) {
        isDragging = true;
        dragBallIndex = balls.indexOf(intersects[0].object);
    }
});

renderer.domElement.addEventListener('mousemove', (event) => {
    if (isDragging && dragBallIndex !== null) {
        let rect = renderer.domElement.getBoundingClientRect();
        let mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;

        // Update Cannon.js body position for dragging
        ballBodies[dragBallIndex].position.x = mouseX * 5;
        ballBodies[dragBallIndex].velocity.set(0, 0, 0); // Set velocity to zero while dragging
    }
});

renderer.domElement.addEventListener('mouseup', () => {
    isDragging = false;
    dragBallIndex = null;
});

// Render function to animate the balls
function animate() {
    requestAnimationFrame(animate);

    // Step the physics world
    world.step(1 / 60);

    // Update Three.js meshes to match Cannon.js bodies
    for (let i = 0; i < balls.length; i++) {
        balls[i].position.copy(ballBodies[i].position);
    }

    renderer.render(scene, camera);
}
animate();
