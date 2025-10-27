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
		// === 远处的小星星（背景） ===
		const starsGeometry = new THREE.BufferGeometry();
		const starsCount = 1000;
		const positions = new Float32Array(starsCount * 3);
		
		for (let i = 0; i < starsCount * 3; i++) {
			positions[i] = (Math.random() - 0.5) * 20000;
		}
		
		starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		const starsMaterial = new THREE.PointsMaterial({ 
			color: 0xffffff, 
			size: 2 
		});
		const stars = new THREE.Points(starsGeometry, starsMaterial);
		this.scene.add(stars);
		
		// === 战斗竞技场边缘的大型参照物（星云/星系效果） ===
		const arenaRadius = 10000; // 竞技场半径
		const bigStarsGeometry = new THREE.BufferGeometry();
		const bigStarsCount = 5000; // 大型参照物数量
		const bigPositions = new Float32Array(bigStarsCount * 3);
		const bigColors = new Float32Array(bigStarsCount * 3);
		
		for (let i = 0; i < bigStarsCount; i++) {
			// 在球面上均匀分布（竞技场边缘）
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			
			// 在竞技场边缘 ± 一定范围内
			const distance = arenaRadius + (Math.random() - 0.5) * 500;
			
			bigPositions[i * 3] = distance * Math.sin(phi) * Math.cos(theta);
			bigPositions[i * 3 + 1] = distance * Math.sin(phi) * Math.sin(theta);
			bigPositions[i * 3 + 2] = distance * Math.cos(phi);
			
			// 随机颜色（模拟不同类型的星云）
			const colorType = Math.random();
			if (colorType < 0.4) {
				// 蓝色星云
				bigColors[i * 3] = 0.3 + Math.random() * 0.3;
				bigColors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
				bigColors[i * 3 + 2] = 1.0;
			} else if (colorType < 0.7) {
				// 橙黄色星云
				bigColors[i * 3] = 1.0;
				bigColors[i * 3 + 1] = 0.6 + Math.random() * 0.3;
				bigColors[i * 3 + 2] = 0.2;
			} else {
				// 紫色星云
				bigColors[i * 3] = 0.8;
				bigColors[i * 3 + 1] = 0.3;
				bigColors[i * 3 + 2] = 0.9;
			}
		}
		
		bigStarsGeometry.setAttribute('position', new THREE.BufferAttribute(bigPositions, 3));
		bigStarsGeometry.setAttribute('color', new THREE.BufferAttribute(bigColors, 3));
		
		const bigStarsMaterial = new THREE.PointsMaterial({
			size: 35,
			vertexColors: true,
			transparent: true,
			opacity: 0.8,
			sizeAttenuation: true // 远近大小变化
		});
		
		const bigStars = new THREE.Points(bigStarsGeometry, bigStarsMaterial);
		this.scene.add(bigStars);
		
		// === 添加一些大型发光球体（模拟远方恒星/星系核心） ===
		this.glowingSpheres = [];
		for (let i = 0; i < 15; i++) {
			const geometry = new THREE.SphereGeometry(80, 16, 16);
			const color = new THREE.Color();
			color.setHSL(Math.random(), 0.7, 0.6);
			
			const material = new THREE.MeshBasicMaterial({ 
				color: color,
				transparent: true,
				opacity: 0.6
			});
			
			const sphere = new THREE.Mesh(geometry, material);
			
			// 在竞技场边缘随机位置
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			const distance = arenaRadius + (Math.random() - 0.5) * 800;
			
			sphere.position.set(
				distance * Math.sin(phi) * Math.cos(theta),
				distance * Math.sin(phi) * Math.sin(theta),
				distance * Math.cos(phi)
			);
			
			// 缓慢旋转
			sphere.userData.rotationSpeed = {
				x: (Math.random() - 0.5) * 0.005,
				y: (Math.random() - 0.5) * 0.005
			};
			
			this.glowingSpheres.push(sphere);
			this.scene.add(sphere);
		}
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
		// 旋转发光球体（增加运动感）
		if (this.glowingSpheres) {
			this.glowingSpheres.forEach(sphere => {
				sphere.rotation.x += sphere.userData.rotationSpeed.x;
				sphere.rotation.y += sphere.userData.rotationSpeed.y;
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
