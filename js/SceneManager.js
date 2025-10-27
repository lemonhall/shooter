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
		// === 远处的小星星 ===
		const starsGeometry = new THREE.BufferGeometry();
		const starsCount = 2000;
		const positions = new Float32Array(starsCount * 3);
		
		for (let i = 0; i < starsCount * 3; i++) {
			positions[i] = (Math.random() - 0.5) * 15000;
		}
		
		starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		const starsMaterial = new THREE.PointsMaterial({ 
			color: 0xffffff, 
			size: 2 
		});
		const stars = new THREE.Points(starsGeometry, starsMaterial);
		this.scene.add(stars);
		
		// === 近处的大参照物（方块小行星）===
		this.asteroids = [];
		for (let i = 0; i < 50; i++) {
			const size = 50 + Math.random() * 150;
			const geometry = new THREE.BoxGeometry(size, size, size);
			const material = new THREE.MeshBasicMaterial({ 
				color: 0x444444, 
				wireframe: true 
			});
			const asteroid = new THREE.Mesh(geometry, material);
			
			// 随机分布在玩家周围
			asteroid.position.set(
				(Math.random() - 0.5) * 5000,
				(Math.random() - 0.5) * 5000,
				(Math.random() - 0.5) * 5000
			);
			
			// 随机旋转速度
			asteroid.userData.rotationSpeed = {
				x: (Math.random() - 0.5) * 0.01,
				y: (Math.random() - 0.5) * 0.01,
				z: (Math.random() - 0.5) * 0.01
			};
			
			this.asteroids.push(asteroid);
			this.scene.add(asteroid);
		}
		
		// === 网格参照线（太空网格）===
		const gridSize = 10000;
		const gridDivisions = 20;
		const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x003366, 0x001133);
		this.scene.add(gridHelper);
		
		// 再加一个垂直的网格
		const gridHelper2 = new THREE.GridHelper(gridSize, gridDivisions, 0x003366, 0x001133);
		gridHelper2.rotation.x = Math.PI / 2;
		this.scene.add(gridHelper2);
	},
	
	// 更新相机（紧跟飞船后方 - Freelancer风格）
	updateCamera: function(playerMesh) {
		if (!playerMesh) return;
		
		// 相机紧跟在飞船后方固定距离
		const cameraDistance = 400; // 距离飞船的距离
		const cameraHeight = 80;    // 略高于飞船
		
		// 计算飞船后方的向量
		const backward = new THREE.Vector3(0, 0, 1); // 后方
		backward.applyQuaternion(playerMesh.quaternion);
		
		// 计算飞船上方的向量
		const up = new THREE.Vector3(0, 1, 0);
		up.applyQuaternion(playerMesh.quaternion);
		
		// 目标相机位置 = 飞船位置 + 后方向量 + 上方偏移
		const targetCameraPos = playerMesh.position.clone()
			.add(backward.multiplyScalar(cameraDistance))
			.add(up.multiplyScalar(cameraHeight));
		
		// 平滑跟随
		this.camera.position.lerp(targetCameraPos, 0.1);
		
		// 相机看向飞船前方（不是飞船本身）
		const forward = new THREE.Vector3(0, 0, -1);
		forward.applyQuaternion(playerMesh.quaternion);
		const lookAtPoint = playerMesh.position.clone().add(forward.multiplyScalar(500));
		
		this.camera.lookAt(lookAtPoint);
	},
	
	// 更新场景动画
	update: function() {
		// 旋转小行星（增加运动感）
		if (this.asteroids) {
			this.asteroids.forEach(asteroid => {
				asteroid.rotation.x += asteroid.userData.rotationSpeed.x;
				asteroid.rotation.y += asteroid.userData.rotationSpeed.y;
				asteroid.rotation.z += asteroid.userData.rotationSpeed.z;
			});
		}
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
