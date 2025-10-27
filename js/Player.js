// ========================================
// 玩家飞船控制
// ========================================

const Player = {
	mesh: null,
	
	// 初始化玩家
	init: function(scene) {
		const geometry = new THREE.BoxGeometry(200, 200, 200);
		const material = new THREE.MeshBasicMaterial({ 
			color: 0x00ff00, 
			wireframe: true 
		});
		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.position.z = 500;
		scene.add(this.mesh);
	},
	
	// 更新玩家（每帧调用）
	update: function() {
		if (!this.mesh) return;
		
		const mouse = InputManager.mouse;
		const keys = InputManager.keys;
		
		// === 鼠标飞行控制（增强响应）===
		const targetRotationY = -mouse.x * Math.PI / 3;  // 左右 ±60°
		const targetRotationX = mouse.y * Math.PI / 4;   // 上下 ±45°
		const targetRotationZ = -mouse.x * Math.PI / 4;  // Roll倾斜 ±45°
		
		// 更快的响应速度
		const lerpFactor = 0.15; // 从0.1提升到0.15
		this.mesh.rotation.y += (targetRotationY - this.mesh.rotation.y) * lerpFactor;
		this.mesh.rotation.x += (targetRotationX - this.mesh.rotation.x) * lerpFactor;
		this.mesh.rotation.z += (targetRotationZ - this.mesh.rotation.z) * lerpFactor;
		
		// === 速度控制 ===
		if (keys.space) {
			GameState.velocity += GameState.acceleration;
		}
		if (keys.z) {
			GameState.velocity -= GameState.acceleration * 1.5;
		}
		
		// 速度限制
		GameState.velocity = Math.max(
			GameState.minVelocity, 
			Math.min(GameState.maxVelocity, GameState.velocity)
		);
		// 阻尼
		GameState.velocity *= GameState.drag;
		
		// === 移动飞船 ===
		const forward = new THREE.Vector3(0, 0, -1);
		forward.applyQuaternion(this.mesh.quaternion);
		this.mesh.position.add(forward.multiplyScalar(GameState.velocity));
		
		// 限制移动范围
		this.mesh.position.x = Math.max(-2000, Math.min(2000, this.mesh.position.x));
		this.mesh.position.y = Math.max(-1500, Math.min(1500, this.mesh.position.y));
		this.mesh.position.z = Math.max(-3000, Math.min(3000, this.mesh.position.z));
	},
	
	// 重置位置
	reset: function() {
		if (this.mesh) {
			this.mesh.position.set(0, 0, 500);
			this.mesh.rotation.set(0, 0, 0);
		}
	}
};
