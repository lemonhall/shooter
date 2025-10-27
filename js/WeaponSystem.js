// ========================================
// 武器系统
// ========================================

const WeaponSystem = {
	// 预创建的几何体和材质（性能优化）
	shotGeometry: null,
	shotMaterial: null,
	
	// 子弹数组
	shots: [],
	
	// 音效
	sound: null,
	
	// 初始化
	init: function(camera) {
		// 创建复用的几何体
		this.shotGeometry = new THREE.BoxGeometry(20, 20, 100);
		this.shotMaterial = new THREE.MeshBasicMaterial({ 
			color: 0x00ffff, 
			wireframe: false 
		});
		
		// 加载音效
		const listener = new THREE.AudioListener();
		camera.add(listener);
		
		this.sound = new THREE.Audio(listener);
		const audioLoader = new THREE.AudioLoader();
		
		audioLoader.load('sounds/laser_shot.wav', (buffer) => {
			this.sound.setBuffer(buffer);
			this.sound.setVolume(0.5);
			console.log('音效加载成功！');
		}, undefined, (error) => {
			console.log('音频加载失败：', error);
		});
	},
	
	// 射击
	shoot: function(scene, playerMesh) {
		const shot = new THREE.Mesh(this.shotGeometry, this.shotMaterial);
		
		// 从玩家位置发射
		shot.position.copy(playerMesh.position);
		
		// 计算飞船朝向（前方向量）
		const forward = new THREE.Vector3(0, 0, -1);
		forward.applyQuaternion(playerMesh.quaternion);
		
		// 子弹初始位置向前偏移（避免打到自己）
		shot.position.add(forward.clone().multiplyScalar(150));
		
		// 子弹速度方向 = 飞船朝向
		shot.userData.velocity = forward.multiplyScalar(50);
		
		this.shots.push(shot);
		scene.add(shot);
		
		// 播放音效
		if (this.sound && this.sound.buffer) {
			if (this.sound.isPlaying) this.sound.stop();
			this.sound.play();
		}
	},
	
	// 更新所有子弹
	update: function(scene, enemies) {
		for (let i = this.shots.length - 1; i >= 0; i--) {
			const shot = this.shots[i];
			
			// 根据速度向量移动子弹
			shot.position.add(shot.userData.velocity);
			
			// 检测与敌人碰撞
			let hitEnemy = false;
			for (let j = enemies.length - 1; j >= 0; j--) {
				const enemy = enemies[j];
				
				if (this.checkCollision(shot, enemy, 150)) {
					enemy.userData.health--;
					GameState.score += 10;
					
					if (enemy.userData.health <= 0) {
						GameState.score += 50;
						GameState.kills++;
						EffectsManager.createExplosion(enemy.position, 0xffff00);
						scene.remove(enemy);
						enemies.splice(j, 1);
					} else {
						// 被击中闪烁
						enemy.material.color.setHex(0xff0000);
						setTimeout(() => {
							if (enemy.material) {
								enemy.material.color.setHex(Math.random() * 0xffffff);
							}
						}, 100);
					}
					
					GameState.updateHUD();
					hitEnemy = true;
					break;
				}
			}
			
			// 移除子弹
			if (hitEnemy || shot.position.z < -5000) {
				scene.remove(shot);
				this.shots.splice(i, 1);
			}
		}
	},
	
	// 碰撞检测
	checkCollision: function(obj1, obj2, distance) {
		return obj1.position.distanceTo(obj2.position) < distance;
	},
	
	// 清理所有子弹
	clear: function(scene) {
		this.shots.forEach(shot => scene.remove(shot));
		this.shots = [];
	}
};
