// 等待 DOM 和 Three.js 加载完成
function startGame() {
	if (typeof THREE === 'undefined') {
		setTimeout(startGame, 50);
		return;
	}
	
	// 场景、相机、渲染器
	let scene, camera, renderer;
	let playerMesh;
	let shots = [];
	let enemies = [];
	let particles = [];
	
	// 游戏状态
	const gameState = {
		health: 100,
		score: 0,
		kills: 0,
		isGameOver: false,
		enemySpawnTimer: 0,
		shootCooldown: 0
	};
	
	// 键盘控制
	const keys = {
		left: false,
		right: false,
		up: false,
		down: false,
		space: false
	};
	
	// 手柄支持
	function Gamepads() {
		this.gamepads = {};
	}
	
	Gamepads.prototype.poll = function() {
		this.gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
	};
	
	const gamepads = new Gamepads();
	
	// 预先创建复用的几何体和材质（性能优化）
	const shotGeometry = new THREE.BoxGeometry(20, 20, 100);
	const shotMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: false });
	const particleGeometry = new THREE.SphereGeometry(10, 8, 8);
	
	// 音效
	let sound;
	
	// 初始化场景
	function init() {
		// 创建场景
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x000000);
		
		// 创建相机
		camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			1,
			10000
		);
		camera.position.z = 1000;
		
		// 添加音频监听器
		const listener = new THREE.AudioListener();
		camera.add(listener);
		
		// 创建音频源
		sound = new THREE.Audio(listener);
		const audioLoader = new THREE.AudioLoader();
		
		// 加载音效
		audioLoader.load('sounds/laser_shot.wav', function(buffer) {
			sound.setBuffer(buffer);
			sound.setVolume(0.5);
			console.log('音效加载成功！');
		}, undefined, function(error) {
			console.log('音频加载失败：', error);
		});
		
		// 创建渲染器
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		document.body.appendChild(renderer.domElement);
		
		// 创建玩家飞船
		const playerGeometry = new THREE.BoxGeometry(200, 200, 200);
		const playerMaterial = new THREE.MeshBasicMaterial({ 
			color: 0x00ff00, 
			wireframe: true 
		});
		playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
		scene.add(playerMesh);
		
		// 创建星空背景
		const starsGeometry = new THREE.BufferGeometry();
		const starsCount = 1000;
		const positions = new Float32Array(starsCount * 3);
		
		for (let i = 0; i < starsCount * 3; i++) {
			positions[i] = (Math.random() - 0.5) * 10000;
		}
		
		starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		const starsMaterial = new THREE.PointsMaterial({ 
			color: 0xffffff, 
			size: 2 
		});
		const stars = new THREE.Points(starsGeometry, starsMaterial);
		scene.add(stars);
		
		// 初始化HUD
		updateHUD();
		
		// 窗口大小调整
		window.addEventListener('resize', onWindowResize);
	}
	
	// 窗口大小调整
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}
	
	// 生成敌人
	function spawnEnemy() {
		const enemyGeometry = new THREE.BoxGeometry(150, 150, 150);
		const enemyMaterial = new THREE.MeshBasicMaterial({ 
			color: Math.random() * 0xffffff, 
			wireframe: true 
		});
		const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
		
		enemy.position.set(
			(Math.random() - 0.5) * 2000,
			(Math.random() - 0.5) * 1000,
			-5000
		);
		enemy.userData.health = 3;
		enemy.userData.speed = 5 + Math.random() * 5;
		
		enemies.push(enemy);
		scene.add(enemy);
	}
	
	// 创建爆炸效果
	function createExplosion(position, color) {
		for (let i = 0; i < 15; i++) {
			const particleMaterial = new THREE.MeshBasicMaterial({ color: color });
			const particle = new THREE.Mesh(particleGeometry, particleMaterial);
			
			particle.position.copy(position);
			particle.userData.velocity = new THREE.Vector3(
				(Math.random() - 0.5) * 30,
				(Math.random() - 0.5) * 30,
				(Math.random() - 0.5) * 30
			);
			particle.userData.life = 30;
			
			particles.push(particle);
			scene.add(particle);
		}
	}
	
	// 碰撞检测
	function checkCollision(obj1, obj2, distance) {
		return obj1.position.distanceTo(obj2.position) < distance;
	}
	
	// 更新HUD
	function updateHUD() {
		document.getElementById('health').textContent = gameState.health;
		document.getElementById('score').textContent = gameState.score;
		document.getElementById('kills').textContent = gameState.kills;
	}
	
	// 游戏结束
	function gameOver() {
		gameState.isGameOver = true;
		document.getElementById('finalScore').textContent = gameState.score;
		document.getElementById('gameOver').style.display = 'block';
	}
	
	// 重置游戏
	function resetGame() {
		// 清理敌人
		enemies.forEach(enemy => scene.remove(enemy));
		enemies = [];
		
		// 清理子弹
		shots.forEach(shot => scene.remove(shot));
		shots = [];
		
		// 清理粒子
		particles.forEach(particle => scene.remove(particle));
		particles = [];
		
		// 重置状态
		gameState.health = 100;
		gameState.score = 0;
		gameState.kills = 0;
		gameState.isGameOver = false;
		gameState.enemySpawnTimer = 0;
		gameState.shootCooldown = 0;
		
		// 重置玩家位置
		playerMesh.position.set(0, 0, 0);
		
		document.getElementById('gameOver').style.display = 'none';
		updateHUD();
	}
	
	// 动画循环
	function animate() {
		requestAnimationFrame(animate);
		
		if (gameState.isGameOver) {
			renderer.render(scene, camera);
			return;
		}
		
		// 手柄控制
		gamepads.poll();
		if (gamepads.gamepads[0]) {
			playerMesh.position.x += 20 * gamepads.gamepads[0].axes[0];
			playerMesh.position.y -= 16 * gamepads.gamepads[0].axes[1];
		}
		
		// 键盘控制
		if (keys.left) playerMesh.position.x -= 20;
		if (keys.right) playerMesh.position.x += 20;
		if (keys.up) playerMesh.position.y += 16;
		if (keys.down) playerMesh.position.y -= 16;
		
		// 限制移动范围
		playerMesh.position.x = Math.max(-900, Math.min(900, playerMesh.position.x));
		playerMesh.position.y = Math.max(-500, Math.min(500, playerMesh.position.y));
		
		// 敌人生成
		gameState.enemySpawnTimer++;
		if (gameState.enemySpawnTimer > 60) {
			spawnEnemy();
			gameState.enemySpawnTimer = 0;
		}
		
		// 更新敌人
		for (let i = enemies.length - 1; i >= 0; i--) {
			const enemy = enemies[i];
			
			// 移动向玩家
			enemy.position.z += enemy.userData.speed;
			enemy.position.x += (playerMesh.position.x - enemy.position.x) / 30;
			enemy.position.y += (playerMesh.position.y - enemy.position.y) / 30;
			
			// 旋转效果
			enemy.rotation.x += 0.02;
			enemy.rotation.y += 0.02;
			
			// 检测与玩家碰撞
			if (checkCollision(enemy, playerMesh, 200)) {
				gameState.health -= 10;
				updateHUD();
				createExplosion(enemy.position, 0xff0000);
				scene.remove(enemy);
				enemies.splice(i, 1);
				
				if (gameState.health <= 0) {
					gameOver();
				}
				continue;
			}
			
			// 移除超出范围的敌人
			if (enemy.position.z > 2000) {
				scene.remove(enemy);
				enemies.splice(i, 1);
			}
		}
		
		// 更新子弹
		for (let i = shots.length - 1; i >= 0; i--) {
			const shot = shots[i];
			shot.position.z -= 50;
			
			// 检测与敌人碰撞
			let hitEnemy = false;
			for (let j = enemies.length - 1; j >= 0; j--) {
				const enemy = enemies[j];
				
				if (checkCollision(shot, enemy, 150)) {
					enemy.userData.health--;
					gameState.score += 10;
					
					if (enemy.userData.health <= 0) {
						gameState.score += 50;
						gameState.kills++;
						createExplosion(enemy.position, 0xffff00);
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
					
					updateHUD();
					hitEnemy = true;
					break;
				}
			}
			
			if (hitEnemy || shot.position.z < -5000) {
				scene.remove(shot);
				shots.splice(i, 1);
			}
		}
		
		// 更新粒子
		for (let i = particles.length - 1; i >= 0; i--) {
			const particle = particles[i];
			particle.position.add(particle.userData.velocity);
			particle.userData.velocity.multiplyScalar(0.95);
			particle.userData.life--;
			particle.material.opacity = particle.userData.life / 30;
			particle.material.transparent = true;
			
			if (particle.userData.life <= 0) {
				scene.remove(particle);
				particles.splice(i, 1);
			}
		}
		
		// 射击冷却
		if (gameState.shootCooldown > 0) {
			gameState.shootCooldown--;
		}
		
		// 处理射击
		const shouldShoot = (gamepads.gamepads[0] && gamepads.gamepads[0].buttons[0].pressed) || keys.space;
		if (shouldShoot && gameState.shootCooldown === 0) {
			const shot = new THREE.Mesh(shotGeometry, shotMaterial);
			
			shot.position.copy(playerMesh.position);
			shot.position.z -= 100;
			
			shots.push(shot);
			scene.add(shot);
			
			// 播放音效
			if (sound && sound.buffer) {
				if (sound.isPlaying) sound.stop();
				sound.play();
			}
			
			gameState.shootCooldown = 10;
		}
		
		renderer.render(scene, camera);
	}
	
	// 键盘事件
	window.addEventListener('keydown', (e) => {
		switch(e.key) {
			case 'ArrowLeft': case 'a': case 'A': keys.left = true; break;
			case 'ArrowRight': case 'd': case 'D': keys.right = true; break;
			case 'ArrowUp': case 'w': case 'W': keys.up = true; break;
			case 'ArrowDown': case 's': case 'S': keys.down = true; break;
			case ' ': keys.space = true; e.preventDefault(); break;
			case 'r': case 'R': 
				if (gameState.isGameOver) resetGame(); 
				break;
		}
	});
	
	window.addEventListener('keyup', (e) => {
		switch(e.key) {
			case 'ArrowLeft': case 'a': case 'A': keys.left = false; break;
			case 'ArrowRight': case 'd': case 'D': keys.right = false; break;
			case 'ArrowUp': case 'w': case 'W': keys.up = false; break;
			case 'ArrowDown': case 's': case 'S': keys.down = false; break;
			case ' ': keys.space = false; break;
		}
	});
	
	// 手柄事件
	window.addEventListener('gamepadconnected', (e) => {
		console.log('Gamepad connected:', e.gamepad.id);
	});
	
	window.addEventListener('gamepaddisconnected', (e) => {
		console.log('Gamepad disconnected:', e.gamepad.id);
	});
	
	// 启动游戏
	init();
	animate();
}

// 等待页面加载
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', startGame);
} else {
	startGame();
}