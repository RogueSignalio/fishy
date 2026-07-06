class FishingScene extends Phaser.Scene {
    constructor(cfg={}) {
        super({ key: 'FishingScene' });
        this.cfg = {
          image_path: './',
          ...cfg
        }
    }

    preload() {
        this.load.setPath(this.cfg.image_path);

        this.load.image('background', 'assets/backTest.jpg');
        this.load.image('foreground', 'assets/porthole.png');
        this.load.image('decor', 'assets/border01.png');
        this.load.image('fish01', 'assets/fish01.png');
        this.load.image('fish02', 'assets/fish02.png');
        this.load.image('fish03', 'assets/fish03.png');
        this.load.image('fish04', 'assets/fish04.png');
        this.load.image('shark01','assets/shark01.png');      
        this.load.image('jelly01', 'assets/jelly01.png');      
        this.load.image('seaweed01', 'assets/seaweed01.png');      
        // this.load.image('player', './assets/player.png');      
        this.load.image('spear', 'assets/spear.png');     
        this.load.image('flicker', 'assets/flicker.png');     
        this.load.spritesheet('player', 'assets/player_sheet.png', {
              frameWidth: 64,
              frameHeight: 139
        });
        // const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        this.lineGraphics = this.add.graphics();
    }

    create() {
        // // Scale to fit the container
        // this.scale.setMode(Phaser.Scale.FIT);

        // // Optional: Center the canvas within the parent
        // this.scale.setCenter(Phaser.Scale.CENTER_BOTH);
        this.reel_speed = 60
        this.score = 0;
        this.lastClickTime = 0
        this.space_gap = false
        this.gameState = 'READY'; // IDLE, AIMING, REELING
        this.reelClicksNeeded = 0;
        this.reelClicksMade = 0;
        this.width = this.sys.canvas.width
        this.height = this.sys.canvas.height
        this.TILE_SIZE = 32
        this.messages = {
          READY: 'Ready to Fire!!!',
          RELOADING: 'Reloading Harpoon...',
          REELING: 'Reel in your catch!!!',
          SLOGGING: 'Reel in to clear.',
        }

        this.background = this.add.image(0, 0, 'background')
        .setOrigin(0, 0).setTint(0x7799CC)
        .setDisplaySize(this.sys.canvas.width, this.sys.canvas.height)//.setTint(0xFFFFFF);

        this.decor = this.add.image(this.sys.canvas.width/2, this.height-38, 'decor')
        .setDisplaySize(this.sys.canvas.width, 50).setDepth(0)
        this.decor.preFX.addShadow(0, 0, 0.3, 1, 0x000000, 4, 1);
        this.decor2 = this.add.image(this.sys.canvas.width/2, this.height-18, 'decor')
        .setDisplaySize(this.sys.canvas.width, 50).setDepth(5).setFlip(true)
        this.decor2.preFX.addShadow(0, 0, 0.3, 1, 0x000000, 4, 1);

        this.foreground = this.add.image(0,0, 'foreground')
        .setOrigin(0, 0).setDepth(30) //.setTint(0x888888)
        .setDisplaySize(this.sys.canvas.width, this.sys.canvas.height)//.setTint(0xFFFFFF);
        this.flicker = this.add.image(90,15, 'flicker')
        .setOrigin(0.5, 0.5).setDepth(32).setTint(0xFFFFFF).setBlendMode(1).setAlpha(0)
        .setDisplaySize(this.width/1.5, this.height/1.5)//.setTint(0xFFFFFF);
        var tween = this.tweens.add({
            targets: this.flicker,
            alpha: 'random(0.3, 0.9)',
            ease: 'Cubic',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
            duration: 150,
            repeat: -1,            // -1: infinity
            yoyo: false,
        });
        this.led = this.add.image(215,this.height-10, 'flicker')
        .setOrigin(0.5, 0.5).setDepth(32).setTint(0x00FF00).setBlendMode(1).setAlpha(0.1)
        .setDisplaySize(this.width/4, this.height/4)//.setTint(0xFFFFFF);
        var tween = this.tweens.add({
            targets: this.led,
            alpha: 0.95,
            ease: 'Linear',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
            duration: 400,
            repeat: -1,            // -1: infinity
            yoyo: true,
        });
        this.scoreText = this.add.text(
          this.width/2, this.height - 15, 
          '0', { 
              fontSize: '24px', color: '#FFFF55', align: 'center', 
              padding:0, fontStyle: 'bold',
          }
        ).setOrigin(0.5).setDepth(31)
        this.instructionText = this.add.text(
            this.width/2+50, 20, "Ready to Fire!", { 
              fontSize: '24px', color: '#00FF00', align: 'center', 
              backgroundColor: '#000000', padding:10, fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(31)

        this.player = this.physics.add.sprite(this.width/2, this.height - 64, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.75); //this.player.displayWidth/2, this.player.displayHeight/2);
        this.player.preFX.addShadow(0, 0, 0.3, 1, 0x000000, 4, 1);
        this.player.setDepth(2)
        this.spears = this.physics.add.group();
        this.fishGroup = this.physics.add.group();
        this.sharkGroup = this.physics.add.group();
        this.jellyGroup = this.physics.add.group();
        this.seaweedGroup = this.physics.add.group();
        this.spawnShark()
        this.spawnJelly()
        this.spawnSeaweed()
        this.time.addEvent({ delay: 2500, callback: this.spawnJelly, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 2500, callback: this.spawnSeaweed, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 2500, callback: this.spawnShark, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 1500, callback: this.spawnFish, callbackScope: this, loop: true });

        // Input Setup
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.AKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.DKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        this.input.on('pointerup', (pointer) => {
            this.handleInputAction(pointer.x, pointer.y);
        });

        // Collisions
        this.physics.add.overlap(this.spears, this.fishGroup, this.hitFish, null, this);
        this.physics.add.overlap(this.spears, this.seaweedGroup, this.hitSeaweed, null, this);
        this.physics.add.overlap(this.spears, this.jellyGroup, this.hitJelly, null, this);
        this.physics.add.overlap(this.spears, this.sharkGroup, this.hitShark, null, this);
        this.player.target_x = this.player.x
    }

    update() {
        this.updateMobs(this.jellyGroup)
        this.updateMobs(this.seaweedGroup)
        this.updateMobs(this.sharkGroup)
        this.updateMobs(this.fishGroup, (mob) => {
          const ran = Phaser.Math.Between(1,10000)
          if (ran > 9900) { mob.mob_move() }          
        })

        var p_diff = Math.abs(this.player.target_x - this.player.x);
        if (p_diff > 0 && p_diff < 4) {  this.stopPlayer(); }
        else if (this.player.target_x > this.player.x) { this.moveRight(); }
        else if (this.player.target_x < this.player.x)  { this.moveLeft(); }

        if (this.gameState === 'READY' && this.spaceKey.isDown) { this.launchSpear(); }

        if (this.gameState === 'SLOGGING') {
          if (this.activeSpear && this.activeFish && this.activeFish.y > 10) {
            // Eventually turn this into a function, it is duplicated all around
            // (mob,target,max_dist,offsetY)
            const distance = Phaser.Math.Distance.Between(this.activeFish.x, this.activeFish.y, this.player.x, this.player.y);
            const clampedDistance = Math.min(distance, 1);
            const targetX = Phaser.Math.Linear(this.activeFish.x, this.player.x, clampedDistance / distance);
            const targetY = Phaser.Math.Linear(this.activeFish.y, this.player.y, clampedDistance / distance);
            this.activeFish.y = targetY; 
            this.activeFish.x = targetX; 
            this.activeSpear.setPosition(this.activeFish.x, this.activeFish.y + 40);
          } else {
            this.resetGame();
          }
        }

        if (this.gameState === 'REELING') {
          if (this.activeSpear && this.activeFish) {
            this.activeFish.y -= Math.floor(Math.random() * 5) + 1;
            this.activeSpear.setPosition(this.activeFish.x, this.activeFish.y + 40);
            if (this.activeFish.y < 10) { this.resetGame(); }
          }

          if (this.spaceKey.isDown) {
            if (!this.space_gap) {
              this.handleReelInput(this.reel_speed); 
              this.space_gap = true;
            }
          }
          else if (this.spaceKey.isUp) {
            this.space_gap = false; //this.lastClickTime = this.time.now;
          }

          if (this.activeSpear && this.activeShark && this.activeFish.score > 0) {
            var sp = this.activeSpear
            var sh = this.activeShark

            const distance = Phaser.Math.Distance.Between(sh.x, sh.y, sp.x, sp.y);
            if (sh.body) this.physics.moveTo(sh,sp.x,sp.y,Phaser.Math.Between(90,140))
          }
        }
        else if (this.gameState === 'AIMING' && this.activeSpear) {
            if (this.activeSpear.y < 1) { this.destroySpear(); this.resetGame(); }
        }
        if (this.activeSpear) {
            this.lineGraphics.clear()
            this.lineGraphics.setDepth(10);
            this.lineGraphics.lineStyle(3, 0x8888FF, 1);
            this.lineGraphics.lineBetween(
              this.player.x, this.player.y, // - this.player.displayHeight/2,
              this.activeSpear.x, this.activeSpear.y 
            );
        }

        if (this.cursors.left.isDown || this.AKey.isDown) { this.stopPlayer(); this.moveLeft(); this.resetPlayerX(); }
        else if (this.cursors.right.isDown || this.DKey.isDown) { this.stopPlayer(); this.moveRight(); this.resetPlayerX(); }

    }

    resetPlayerX() {
        this.player.target_x = this.player.x
    }

    stopPlayer() {
        this.player.target_x = this.player.x; 
        this.player.body.setVelocity(0); 
    }

    moveLeft(x=5) {
        this.player.x -= x;
    }

    moveRight(x=5) {
        this.player.x += x;
    }

    handleInputAction(x,y) {
        this.player.target_x = x

        if (this.gameState === 'READY') {
            const currentTime = this.time.now;
            const timeDifference = currentTime - this.lastClickTime;

            if (timeDifference < 350) {
                this.launchSpear(); 
            }
            
            this.lastClickTime = currentTime;
        } 
        else if (this.gameState === 'REELING') {
            this.player.target_x = x
            this.handleReelInput(this.reel_speed)
        }
    }

    launchSpear() {
        this.gameState = 'AIMING';
        const spear = this.spears.create(this.player.x, this.player.y - 20, 'spear');
        spear.setScale(0.75)
        spear.setOrigin(0.5, 1); 
        spear.body.setOffset(2, 0); 
        spear.setVelocityY(-600);
        this.player.setFrame(1);
        this.activeSpear = spear;
    }

    hitSeaweed(spear, object) {
        if (this.gameState !== 'AIMING') return;
        this.activeFish = object;

        spear.setVelocity(0, 0);
        object.setVelocity(0, 0);        
        object.setPosition(spear.x, spear.y);

        this.gameState = 'SLOGGING';
        
        this.instructionText.setText('Sigh ... Drag it in.');
        this.instructionText.setColor('#FF00FF');
    }

    hitJelly(spear, fish) {
        this.activeFish = fish;
        this.catchSuccess(fish)
    }

    hitShark(spear, shark) {
        this.catchSuccess(shark)
    }

    hitFish(spear, fish) {
        if (this.gameState !== 'AIMING') return;
        this.activeFish = fish;
        this.activeFish.timer.remove();
        this.activeFish.setCollideWorldBounds(false)

        spear.setVelocity(0, 0);
        fish.setVelocity(0, 0);        
        fish.setPosition(spear.x, spear.y);
        this.fishRun(fish)

        this.gameState = 'REELING';
        this.reelClicksMade = 0;
        
        this.instructionText.setText('REEL IT IN!!!!');
        this.instructionText.setColor('#FFFF00');
    }

    handleReelInput(inc=8) {
        if (this.gameState !== 'REELING') return;

        this.reelClicksMade++;

        const distance = Phaser.Math.Distance.Between(this.activeFish.x, this.activeFish.y, this.player.x, this.player.y);
        const clampedDistance = Math.min(distance, inc);

        const targetX = Phaser.Math.Linear(this.activeFish.x, this.player.x, clampedDistance / distance);
        const targetY = Phaser.Math.Linear(this.activeFish.y, this.player.y, clampedDistance / distance);

        this.activeFish.y = targetY; 
        this.activeFish.x = targetX; 
        this.activeSpear.setPosition(this.activeFish.x, this.activeFish.y + 40);

        if (this.reelClicksMade > 5) {
            this.fishRun(this.activeFish)
            this.reelClicksMade = 0
        }

        if (this.activeFish.y >= this.player.y) {
            this.catchSuccess(this.activeFish);
        }
    }

    catchSuccess(fish) {
        this.updateScore(fish)
        this.destroyFish(this.activeFish)
        this.activeFish = null
        this.destroySpear(this.activeSpear.destroy());
        this.resetGame();
    }

    updateScore(object) {
        this.score += object.score;
        this.scoreText.setText(this.score);
    }

    destroySpear() {
        if (this.activeSpear) {
            this.activeSpear.destroy()
            this.activeSpear = null;
        }
    }

    destroyFish(fish) {
        if (fish) {
            // console.log(`Destroy ${fish}`)
            if (fish.timer) fish.timer.remove();
            fish.destroy()
            fish = null;
        }
    }

    resetGame() {
        this.gameState = 'IDLE';
        this.lineGraphics.clear()
        this.destroySpear()
        if (this.activeShark) this.sharkResetMove(this.activeShark)
        this.destroyFish(this.activeFish)
        this.time.delayedCall(1500, () => {
            if (this.gameState === 'IDLE') {
                this.gameState = 'READY'
                this.instructionText.setText("Ready to Fire!");
                this.instructionText.setColor('#00FF00');
                this.player.setFrame(0);
            }
        });

        this.instructionText.setText('Reloading....');
        this.instructionText.setColor('#ff0000');
    }

    orientMobDirection(mob) {
        if (mob.body.velocity.x < 1) { mob.setFlip(true); }
        else { mob.setFlip(false) }
    }

    mobMove(mob,minSp,maxSp,dir=null) {
        dir = !dir ? Phaser.Math.Between(-1,1) > 0 ? 1 : -1 : dir
        mob.setVelocityX(dir * Phaser.Math.Between(minSp, maxSp));
        this.orientMobDirection(mob)
    }

    mobStart(mob,minY,maxY) {
        const x = Phaser.Math.Between(20, this.width - 20);
        const y = Phaser.Math.Between(minY, maxY);
        mob.x = x 
        mob.y = y
    }

    mobTimer(mob,min,max,callback) {
        if (mob.timer) mob.timer.remove()
    }

    updateMobs(group,callback=null) {
        if (group && group.children) {
            group.children.each(function(mob) {
                if (mob.x < -200 || mob.x > this.width + 200) { this.destroyFish(mob); }
                else if (mob.y < -200 || mob.y > this.height + 200) { this.destroyFish(mob); }
                else { 
                  if (callback) callback(mob)
                  this.orientMobDirection(mob);
                }
            }.bind(this))
        }
    }

    spawnJelly() {
        if (this.jellyGroup.children.entries.length > Phaser.Math.Between(1,4)) { return ; }

        const mob = this.jellyGroup.create(-200, -200, `jelly01`);
        mob.setScale(Phaser.Math.FloatBetween(0.25 ,0.45))
        mob.setOrigin(0.5, 0.5);
        // mob.setCollideWorldBounds(true);
        mob.setBounce(1, 0);
        mob.score = -10;
        this.mobStart(mob,220,this.height - 128);//,create)
        mob.mob_move = (create=false) =>  {
          this.mobMove(mob,15,35)
        }
        // this.mobTrigger(mob, () => { mob.mob_move() } )
        mob.mob_move()
    }

    spawnSeaweed() {
        if (this.seaweedGroup.children.entries.length > Phaser.Math.Between(2,5)) { return ; }

        const mob = this.seaweedGroup.create(-200, -200, `seaweed01`);
        mob.setScale(Phaser.Math.FloatBetween(0.75 ,0.9),Phaser.Math.FloatBetween(0.45 ,0.55))
        // mob.setScale(Phaser.Math.FloatBetween(0.65 ,0.85))
        mob.score = 0;
        mob.setOrigin(0.5, 0.5);
        this.mobStart(mob,this.height/2, this.height - 128)
        mob.mob_move = () => {
          this.mobMove(mob,2,12)
        }
        mob.mob_move() //.bind(this)
    }

    spawnShark() {
        if (this.sharkGroup.children.entries.length > 0) { return ; }

        const mob = this.sharkGroup.create(-200, -200, `shark01`);
        mob.body.setSize(mob.displayWidth*0.8, mob.displayHeight*0.6);
        mob.setScale(Phaser.Math.FloatBetween(0.65 ,0.65))
        mob.setOrigin(0.5, 0.5);
        mob.setCollideWorldBounds(true);
        mob.setBounce(1, 0);

        mob.score = -20;
        mob.attack = false
        this.mobStart(mob,80, this.height/3)
        mob.mob_move = () => {
          this.mobMove(mob,50,65)
        }
        mob.mob_move() //.bind(this)
        this.activeShark = mob
    }

    sharkResetMove(mob) {
        if (mob.timer) mob.timer.remove()
        if (mob.body) mob.setVelocityY(0);
        // this.mobStart(mob,20, this.height/3)
        this.mobMove(mob,50,65)
        mob.attack = false
        mob.timer = this.time.delayedCall(Phaser.Math.Between(10000,20000), () => {
            if (mob) this.fishRun(mob) 
        });
    }

    spawnFish() {
        if (this.fishGroup.children.entries.length > Phaser.Math.Between(3,5)) { return ; }

        const mob_roll = Phaser.Math.Between(1, 100) 
        var mob_id;
        var mob_sizes = {
            1: [0.6,0.65],
            2: [0.55,0.60],
            3: [0.5,0.55],
            4: [0.65,0.70],
        }
        if      (mob_roll > 90) { mob_id = 4 }
        else if (mob_roll > 70) { mob_id = 3 }
        else if (mob_roll > 40) { mob_id = 2 }
        else                    { mob_id = 1 }

        const mob = this.fishGroup.create(-200, -200, `fish0${mob_id}`);
        mob.setScale(Phaser.Math.FloatBetween(mob_sizes[mob_id][0] , mob_sizes[mob_id][1]))
        mob.setOrigin(0.5, 0.5);
        mob.setCollideWorldBounds(true);
        mob.setBounce(1, 0); // Bounce off walls
        mob.score = 5 * mob_id

        this.mobStart(mob,80, this.height/3)
        mob.mob_move = () => {
          this.mobMove(mob,25,125)
        }
        mob.mob_move() //.bind(this)

        if (mob.timer) mob.timer.remove()
        mob.timer = this.time.delayedCall(Phaser.Math.Between(10000,60000), () => {
            this.fishRun(mob)
        });
    }

    fishRun(fish) {
        // console.log(fish)
        if (fish) {
            if (fish.timer) fish.timer.remove()
            if (fish.body) fish.setCollideWorldBounds(false)
            let tx = Phaser.Math.Between(-1,1) > 0 ? this.width + 100: -100;
            let ty = Phaser.Math.Between(-100,-200)
            if (fish) this.physics.moveTo(fish, tx, ty, 100);
        }           
    }
}