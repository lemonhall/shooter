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
	velocity: 5,          // 当前速度
	maxVelocity: 15,      // 最大速度
	minVelocity: 3,       // 最小速度
	acceleration: 0.2,    // 加速度
	drag: 0.98,           // 阻尼系数
	
	// 重置游戏状态
	reset: function() {
		this.health = 100;
		this.score = 0;
		this.kills = 0;
		this.isGameOver = false;
		this.enemySpawnTimer = 0;
		this.shootCooldown = 0;
		this.velocity = 5;
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
