// ========================================
// 敌人AI系统
// ========================================

const EnemyManager = {
	enemies: [],
	
	// 生成敌人
	spawn: function(scene) {
		const geometry = new THREE.BoxGeometry(150, 150, 150);
		const material = new THREE.MeshBasicMaterial({ 
			color: Math.random() * 0xffffff, 
			wireframe: true 
		});
		const enemy = new THREE.Mesh(geometry, material);
		
		enemy.position.set(
			(Math.random() - 0.5) * 2000,
			(Math.random() - 0.5) * 1000,
			-5000
		);
		enemy.userData.health = 3;
		enemy.userData.speed = 5 + Math.random() * 5;
		
		this.enemies.push(enemy);
		scene.add(enemy);
	},
	
	// 更新所有敌人
	update: function(scene, playerMesh) {
		for (let i = this.enemies.length - 1; i >= 0; i--) {
			const enemy = this.enemies[i];
			
			// 移动向玩家
			enemy.position.z += enemy.userData.speed;
			enemy.position.x += (playerMesh.position.x - enemy.position.x) / 30;
			enemy.position.y += (playerMesh.position.y - enemy.position.y) / 30;
			
			// 旋转效果
			enemy.rotation.x += 0.02;
			enemy.rotation.y += 0.02;
			
			// 检测与玩家碰撞
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
			
			// 移除超出范围的敌人
			if (enemy.position.z > 2000) {
				scene.remove(enemy);
				this.enemies.splice(i, 1);
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
	}
};
