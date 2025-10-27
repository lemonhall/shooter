// ========================================
// 场景管理（Three.js场景、相机、渲染器）
// ========================================

const SceneManager = {
	scene: null,
	camera: null,
	renderer: null,
	
	// 初始化场景
	init: function() {
		// 创建场景
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x000000);
		
		// 创建相机
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			1,
			10000
		);
		this.camera.position.set(0, 200, 800);
		
		// 创建渲染器
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		document.body.appendChild(this.renderer.domElement);
		
		// 创建星空背景
		this.createStarfield();
		
		// 窗口调整事件
		window.addEventListener('resize', () => this.onWindowResize());
	},
	
	// 创建星空
	createStarfield: function() {
		const geometry = new THREE.BufferGeometry();
		const starsCount = 1000;
		const positions = new Float32Array(starsCount * 3);
		
		for (let i = 0; i < starsCount * 3; i++) {
			positions[i] = (Math.random() - 0.5) * 10000;
		}
		
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		const material = new THREE.PointsMaterial({ 
			color: 0xffffff, 
			size: 2 
		});
		const stars = new THREE.Points(geometry, material);
		this.scene.add(stars);
	},
	
	// 更新相机（跟随玩家）
	updateCamera: function(playerMesh) {
		if (!playerMesh) return;
		
		const cameraOffset = new THREE.Vector3(0, 200, 600);
		const targetCameraPos = playerMesh.position.clone().add(cameraOffset);
		this.camera.position.lerp(targetCameraPos, 0.1);
		this.camera.lookAt(playerMesh.position);
	},
	
	// 渲染场景
	render: function() {
		this.renderer.render(this.scene, this.camera);
	},
	
	// 窗口调整
	onWindowResize: function() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}
};
