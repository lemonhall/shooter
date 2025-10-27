// ========================================
// 敌人AI系统（Freelancer风格环绕攻击）
// ========================================

const EnemyManager = {
	enemies: [],
	
	// 生成敌人
	spawn: function(scene, playerPosition) {
		const geometry = new THREE.BoxGeometry(150, 150, 150);
		const material = new THREE.MeshBasicMaterial({ 
			color: Math.random() * 0xffffff, 
			wireframe: true 
		});
		const enemy = new THREE.Mesh(geometry, material);
		
		// 在玩家周围生成（较远距离）
		const spawnDistance = 3000 + Math.random() * 1000;
		const spawnAngle = Math.random() * Math.PI * 2;
		
		enemy.position.set(
			playerPosition.x + Math.cos(spawnAngle) * spawnDistance,
			playerPosition.y + (Math.random() - 0.5) * 500,
			playerPosition.z + Math.sin(spawnAngle) * spawnDistance
		);
		
		// AI数据
		enemy.userData = {
			health: 3,
			maxHealth: 3,
			
			// 环绕参数
			orbitRadius: 600 + Math.random() * 600,  // 环绕半径 600-1200
			orbitSpeed: (Math.random() - 0.5) * 0.03, // 环绕速度（正负控制方向）
			orbitAngle: Math.atan2(
				enemy.position.z - playerPosition.z,
				enemy.position.x - playerPosition.x
			), // 当前角度
			
			// 行为状态
			state: 'approach',  // approach / orbit / retreat
			approachSpeed: 8,
			retreatSpeed: 12,
			
			// 射击参数
			shootCooldown: 0,
			shootInterval: 60 + Math.random() * 60  // 1-2秒射击一次
		};
		
		this.enemies.push(enemy);
		scene.add(enemy);
	},
	
	// 更新所有敌人
	update: function(scene, playerMesh) {
		for (let i = this.enemies.length - 1; i >= 0; i--) {
			const enemy = this.enemies[i];
			const data = enemy.userData;
			
			const playerPos = playerMesh.position;
			const distance = enemy.position.distanceTo(playerPos);
			
			// === AI状态机 ===
			// 生命值低于30%时撤退
			if (data.health / data.maxHealth < 0.3) {
				data.state = 'retreat';
			}
			// 距离太远时接近
			else if (distance > data.orbitRadius + 500) {
				data.state = 'approach';
			}
			// 在合适距离时环绕
			else if (distance > data.orbitRadius - 200) {
				data.state = 'orbit';
			}
			// 距离太近时后退
			else {
				data.state = 'approach'; // 继续接近直到达到环绕距离
			}
			
			// === 根据状态移动 ===
			if (data.state === 'approach') {
				// 接近玩家
				const direction = new THREE.Vector3()
					.subVectors(playerPos, enemy.position)
					.normalize();
				enemy.position.add(direction.multiplyScalar(data.approachSpeed));
				
			} else if (data.state === 'orbit') {
				// 环绕攻击（Freelancer核心机制）
				data.orbitAngle += data.orbitSpeed;
				
				// 计算环绕位置（水平面环绕）
				const targetX = playerPos.x + Math.cos(data.orbitAngle) * data.orbitRadius;
				const targetZ = playerPos.z + Math.sin(data.orbitAngle) * data.orbitRadius;
				const targetY = playerPos.y + (Math.random() - 0.5) * 100; // 轻微上下浮动
				
				// 平滑移动到目标位置
				enemy.position.x += (targetX - enemy.position.x) * 0.05;
				enemy.position.y += (targetY - enemy.position.y) * 0.05;
				enemy.position.z += (targetZ - enemy.position.z) * 0.05;
				
			} else if (data.state === 'retreat') {
				// 撤退
				const direction = new THREE.Vector3()
					.subVectors(enemy.position, playerPos)
					.normalize();
				enemy.position.add(direction.multiplyScalar(data.retreatSpeed));
			}
			
			// === 面向玩家（降低追踪速度，需要玩家主动瞄准）===
			// 不是立即面向，而是缓慢转向
			const lookDirection = new THREE.Vector3()
				.subVectors(playerPos, enemy.position)
				.normalize();
			
			const targetQuaternion = new THREE.Quaternion();
			const up = new THREE.Vector3(0, 1, 0);
			const matrix = new THREE.Matrix4();
			matrix.lookAt(enemy.position, playerPos, up);
			targetQuaternion.setFromRotationMatrix(matrix);
			
			// 缓慢转向玩家（0.03 = 很慢）
			enemy.quaternion.slerp(targetQuaternion, 0.03);
			
			// === 旋转效果（减少，更真实）===
			enemy.rotation.z += 0.01;
			
			// === 射击逻辑 ===
			if (data.shootCooldown > 0) {
				data.shootCooldown--;
			}
			
			// 在环绕状态且在射程内时射击
			if (data.state === 'orbit' && distance < 1500 && data.shootCooldown === 0) {
				this.enemyShoot(scene, enemy, playerPos);
				data.shootCooldown = data.shootInterval;
			}
			
			// === 碰撞检测 ===
			if (this.checkCollision(enemy, playerMesh, 200)) {
				GameState.health -= 10;
				GameState.updateHUD();
				EffectsManager.createExplosion(enemy.position, 0xff0000);
				scene.remove(enemy);
				this.enemies.splice(i, 1);
				
				if (GameState.health <= 0) {
					GameState.gameOver();
				}
				continue;
			}
			
			// 移除超远的敌人（撤退太远）
			if (distance > 8000) {
				scene.remove(enemy);
				this.enemies.splice(i, 1);
			}
		}
	},
	
	// 敌人射击
	enemyShoot: function(scene, enemy, targetPos) {
		const shotGeometry = new THREE.BoxGeometry(15, 15, 60);
		const shotMaterial = new THREE.MeshBasicMaterial({ 
			color: 0xff0000, 
			wireframe: false 
		});
		const shot = new THREE.Mesh(shotGeometry, shotMaterial);
		
		// 从敌人位置发射
		shot.position.copy(enemy.position);
		
		// 计算射击方向（向玩家）
		const direction = new THREE.Vector3()
			.subVectors(targetPos, enemy.position)
			.normalize();
		
		shot.userData.velocity = direction.multiplyScalar(30); // 子弹速度
		shot.userData.isEnemyShot = true; // 标记为敌人子弹
		
		// 添加到场景（需要在WeaponSystem中处理）
		if (!this.enemyShots) this.enemyShots = [];
		this.enemyShots.push(shot);
		scene.add(shot);
	},
	
	// 更新敌人子弹
	updateEnemyShots: function(scene, playerMesh) {
		if (!this.enemyShots) return;
		
		for (let i = this.enemyShots.length - 1; i >= 0; i--) {
			const shot = this.enemyShots[i];
			
			// 移动子弹
			shot.position.add(shot.userData.velocity);
			
			// 检测与玩家碰撞
			if (this.checkCollision(shot, playerMesh, 150)) {
				GameState.health -= 5; // 敌人子弹伤害
				GameState.updateHUD();
				EffectsManager.createExplosion(shot.position, 0xff0000);
				scene.remove(shot);
				this.enemyShots.splice(i, 1);
				
				if (GameState.health <= 0) {
					GameState.gameOver();
				}
				continue;
			}
			
			// 移除超远的子弹
			const distance = shot.position.distanceTo(playerMesh.position);
			if (distance > 5000) {
				scene.remove(shot);
				this.enemyShots.splice(i, 1);
			}
		}
	},
	
	// 碰撞检测
	checkCollision: function(obj1, obj2, distance) {
		return obj1.position.distanceTo(obj2.position) < distance;
	},
	
	// 清理所有敌人
	clear: function(scene) {
		this.enemies.forEach(enemy => scene.remove(enemy));
		this.enemies = [];
		
		// 清理敌人子弹
		if (this.enemyShots) {
			this.enemyShots.forEach(shot => scene.remove(shot));
			this.enemyShots = [];
		}
	}
};
