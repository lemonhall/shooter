// ========================================
// 输入控制管理（鼠标、键盘、手柄）
// ========================================

const InputManager = {
	// 鼠标状态
	mouse: {
		x: 0,
		y: 0,
		isPressed: false
	},
	
	// 键盘状态
	keys: {
		space: false,  // 加速
		z: false       // 减速
	},
	
	// 手柄支持
	gamepads: {
		poll: function() {
			this.devices = navigator.getGamepads ? navigator.getGamepads() : [];
		},
		devices: []
	},
	
	// 初始化
	init: function() {
		this.setupMouseEvents();
		this.setupKeyboardEvents();
		this.setupGamepadEvents();
	},
	
	// 鼠标事件
	setupMouseEvents: function() {
		window.addEventListener('mousemove', (event) => {
			// 归一化鼠标坐标 (-1 到 +1)
			this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
		});
		
		window.addEventListener('mousedown', (event) => {
			if (event.button === 0) { // 左键
				this.mouse.isPressed = true;
			}
		});
		
		window.addEventListener('mouseup', (event) => {
			if (event.button === 0) {
				this.mouse.isPressed = false;
			}
		});
	},
	
	// 键盘事件
	setupKeyboardEvents: function() {
		window.addEventListener('keydown', (e) => {
			switch(e.key) {
				case ' ': 
					this.keys.space = true; 
					e.preventDefault(); 
					break;
				case 'z': case 'Z': 
					this.keys.z = true; 
					break;
				case 'r': case 'R': 
					if (GameState.isGameOver) {
						GameManager.resetGame();
					}
					break;
			}
		});
		
		window.addEventListener('keyup', (e) => {
			switch(e.key) {
				case ' ': this.keys.space = false; break;
				case 'z': case 'Z': this.keys.z = false; break;
			}
		});
	},
	
	// 手柄事件
	setupGamepadEvents: function() {
		window.addEventListener('gamepadconnected', (e) => {
			console.log('Gamepad connected:', e.gamepad.id);
		});
		
		window.addEventListener('gamepaddisconnected', (e) => {
			console.log('Gamepad disconnected:', e.gamepad.id);
		});
	}
};
