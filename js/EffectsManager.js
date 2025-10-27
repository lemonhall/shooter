// ========================================
// 特效管理（爆炸、粒子等）
// ========================================

const EffectsManager = {
	particles: [],
	particleGeometry: null,
	
	// 初始化
	init: function() {
		this.particleGeometry = new THREE.SphereGeometry(10, 8, 8);
	},
	
	// 创建爆炸效果
	createExplosion: function(position, color) {
		for (let i = 0; i < 15; i++) {
			const particleMaterial = new THREE.MeshBasicMaterial({ color: color });
			const particle = new THREE.Mesh(this.particleGeometry, particleMaterial);
			
			particle.position.copy(position);
			particle.userData.velocity = new THREE.Vector3(
				(Math.random() - 0.5) * 30,
				(Math.random() - 0.5) * 30,
				(Math.random() - 0.5) * 30
			);
			particle.userData.life = 30;
			
			this.particles.push(particle);
			SceneManager.scene.add(particle);
		}
	},
	
	// 更新所有粒子
	update: function(scene) {
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const particle = this.particles[i];
			particle.position.add(particle.userData.velocity);
			particle.userData.velocity.multiplyScalar(0.95);
			particle.userData.life--;
			particle.material.opacity = particle.userData.life / 30;
			particle.material.transparent = true;
			
			if (particle.userData.life <= 0) {
				scene.remove(particle);
				this.particles.splice(i, 1);
			}
		}
	},
	
	// 清理所有粒子
	clear: function(scene) {
		this.particles.forEach(particle => scene.remove(particle));
		this.particles = [];
	}
};
