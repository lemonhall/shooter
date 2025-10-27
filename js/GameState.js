// ========================================
// 游戏状态管理
// ========================================

const GameState = {
	// 玩家状态
	health: 100,
	score: 0,
	kills: 0,
	isGameOver: false,
	
	// 生成计时器
	enemySpawnTimer: 0,
	shootCooldown: 0,
	
	// 飞行物理
	velocity: 8,          // 当前速度（提升基础速度）
	maxVelocity: 20,      // 最大速度（提升上限）
	minVelocity: 5,       // 最小速度
	acceleration: 0.3,    // 加速度（更快响应）
	drag: 0.99,           // 阻尼系数（减少阻力，更流畅）
	
	// 重置游戏状态
	reset: function() {
		this.health = 100;
		this.score = 0;
		this.kills = 0;
		this.isGameOver = false;
		this.enemySpawnTimer = 0;
		this.shootCooldown = 0;
		this.velocity = 8;
	},
	
	// 更新HUD
	updateHUD: function() {
		document.getElementById('health').textContent = this.health;
		document.getElementById('score').textContent = this.score;
		document.getElementById('kills').textContent = this.kills;
	},
	
	// 游戏结束
	gameOver: function() {
		this.isGameOver = true;
		document.getElementById('finalScore').textContent = this.score;
		document.getElementById('gameOver').style.display = 'block';
	}
};
