// ========================================
// 玩家飞船控制
// ========================================

const Player = {
	mesh: null,
	
	// 初始化玩家
	init: function(scene) {
		// 主体（绿色立方体）
		const geometry = new THREE.BoxGeometry(100, 50, 150);
		const material = new THREE.MeshBasicMaterial({ 
			color: 0x00ff00
		});
		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.position.z = 500;
		
		// === 添加机头标记（红色锥体） ===
		const noseGeometry = new THREE.ConeGeometry(30, 80, 4);
		const noseMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
		const nose = new THREE.Mesh(noseGeometry, noseMaterial);
		nose.rotation.x = Math.PI / 2; // 旋转使其指向前方
		nose.position.z = -120; // 放在飞船前方（-Z是前方）
		this.mesh.add(nose);
		
		// === 添加机翼标记（两侧的蓝色小方块） ===
		const wingGeometry = new THREE.BoxGeometry(20, 10, 60);
		const wingMaterial = new THREE.MeshBasicMaterial({ color: 0x0088ff });
		
		const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
		leftWing.position.set(-60, 0, 0);
		this.mesh.add(leftWing);
		
		const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
		rightWing.position.set(60, 0, 0);
		this.mesh.add(rightWing);
		
		// === 添加尾部标记（黄色小方块） ===
		const tailGeometry = new THREE.BoxGeometry(40, 30, 20);
		const tailMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
		const tail = new THREE.Mesh(tailGeometry, tailMaterial);
		tail.position.z = 85; // 放在后方（+Z是后方）
		this.mesh.add(tail);
		
		scene.add(this.mesh);
		console.log('飞船已创建 - 🔴红色锥体=机头（前） | 🟡黄色方块=尾部（后）');
	},
	
	// 更新玩家（每帧调用）
	update: function() {
		if (!this.mesh) return;
		
		const mouse = InputManager.mouse;
		const keys = InputManager.keys;
		
		// === 鼠标飞行控制（Freelancer风格：鼠标偏离中心=转向速度）===
		// 只有当鼠标偏离中心时才转向
		const turnSpeed = 0.02; // 基础转向速度
		const deadZone = 0.05; // 死区（避免微小抖动）
		
		// 根据鼠标位置产生转向（累加式，无限制）
		if (Math.abs(mouse.x) > deadZone) {
			this.mesh.rotation.y -= mouse.x * turnSpeed; // 左右转向
		}
		if (Math.abs(mouse.y) > deadZone) {
			this.mesh.rotation.x += mouse.y * turnSpeed * 0.8; // 上下俯仰（稍慢）
		}
		
		// Roll倾斜（转弯时的倾斜效果，自动回中）
		const targetRoll = -mouse.x * Math.PI / 6; // 根据左右转向产生倾斜
		this.mesh.rotation.z += (targetRoll - this.mesh.rotation.z) * 0.1;
		
		// === 自动水平校正（检测异常姿态并自动回正）===
		// 当鼠标在死区内时，激活自动校正
		if (Math.abs(mouse.x) < deadZone && Math.abs(mouse.y) < deadZone) {
			// 获取当前的世界坐标系上方向
			const currentUp = new THREE.Vector3(0, 1, 0);
			currentUp.applyQuaternion(this.mesh.quaternion);
			
			// 计算当前姿态与标准姿态的偏差
			const worldUp = new THREE.Vector3(0, 1, 0);
			const upDot = currentUp.dot(worldUp);
			
			// 如果上方向偏差过大（倒飞/侧飞），启动自动校正
			if (upDot < 0.8) { // 0.8 = cos(36°)，偏转超过36°就校正
				// Roll轴快速回正
				this.mesh.rotation.z *= 0.9;
				
				// Pitch轴缓慢回正（避免突然抬头/低头）
				const pitchCorrection = -this.mesh.rotation.x * 0.02;
				this.mesh.rotation.x += pitchCorrection;
			}
		}
		
		// === 速度控制 ===
		// 空格键：专职姿态校正（不加速）
		if (keys.space) {
			this.mesh.rotation.z *= 0.85; // Roll快速回正
			this.mesh.rotation.x *= 0.95; // Pitch缓慢回正
		}
		
		// F键：加速
		if (keys.f) {
			GameState.velocity += GameState.acceleration;
		}
		
		// Z键：减速
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
