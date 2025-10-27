// ========================================
// 游戏主管理器（协调所有模块）
// ========================================

const GameManager = {
	// 初始化游戏
	init: function() {
		// 检查THREE是否加载
		if (typeof THREE === 'undefined') {
			setTimeout(() => this.init(), 50);
			return;
		}
		
		// 初始化各个系统
		SceneManager.init();
		InputManager.init();
		EffectsManager.init();
		
		// 初始化玩家
		Player.init(SceneManager.scene);
		
		// 初始化武器系统
		WeaponSystem.init(SceneManager.camera);
		
		// 更新HUD
		GameState.updateHUD();
		
		// 开始游戏循环
		this.animate();
	},
	
	// 重置游戏
	resetGame: function() {
		// 清理所有对象
		EnemyManager.clear(SceneManager.scene);
		WeaponSystem.clear(SceneManager.scene);
		EffectsManager.clear(SceneManager.scene);
		
		// 重置状态
		GameState.reset();
		Player.reset();
		
		// 隐藏游戏结束界面
		document.getElementById('gameOver').style.display = 'none';
		GameState.updateHUD();
	},
	
	// 游戏主循环
	animate: function() {
		requestAnimationFrame(() => this.animate());
		
		if (GameState.isGameOver) {
			SceneManager.render();
			return;
		}
		
		// 更新玩家
		Player.update();
		
		// 更新相机
		SceneManager.updateCamera(Player.mesh);
		
		// 更新场景动画
		SceneManager.update();
		
		// 敌人生成（降低生成频率）
		GameState.enemySpawnTimer++;
		if (GameState.enemySpawnTimer > 180) { // 3秒生成一个（原来1秒）
			EnemyManager.spawn(SceneManager.scene, Player.mesh.position);
			GameState.enemySpawnTimer = 0;
		}
		
		// 更新敌人
		EnemyManager.update(SceneManager.scene, Player.mesh);
		
		// 更新敌人子弹
		EnemyManager.updateEnemyShots(SceneManager.scene, Player.mesh);
		
		// 更新子弹
		WeaponSystem.update(SceneManager.scene, EnemyManager.enemies);
		
		// 更新粒子
		EffectsManager.update(SceneManager.scene);
		
		// 射击冷却
		if (GameState.shootCooldown > 0) {
			GameState.shootCooldown--;
		}
		
		// 处理射击
		if (InputManager.mouse.isPressed && GameState.shootCooldown === 0) {
			WeaponSystem.shoot(SceneManager.scene, Player.mesh);
			GameState.shootCooldown = 10;
		}
		
		// 渲染场景
		SceneManager.render();
	}
};

// 启动游戏
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => GameManager.init());
} else {
	GameManager.init();
}
