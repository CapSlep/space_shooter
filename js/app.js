// import {bossMovementSpeed,bossProjectileSpeed,bossMoveChance,bossShootCooldown,bossThinkTime} from "./consts";

//===UI Settings===
let startButton = document.querySelector("#start__button-js");
//screens
let gameoverScreen;
let gameplayScreen;
let winScreen;
//ui elements
let actualBulletsAmount;
let startBulletsAmount;
let timer;

//===Game Settings===

//meteors
let meteorsAmount = 5;

//playerProjectiles 
const projectileStartAmount = 10;
let projectileAmount = projectileStartAmount;
const projectileSpeed = 10;

//player
const playerMovementSpeed = 25;

//boss
let bossHP = 4;
// const bossMovementSpeed = 50;
// const bossProjectileSpeed = 5;
// const bossMoveChance = 0.75;
// const bossShootCooldown = 2;
// const bossThinkTime = 1000;

//time
const timeForGame = 60;
let seconds = timeForGame;

//booleans
let timeOver = false;
let activeInput = false;
let firstLevel = true;

let timeoutID;

//===Key Bindings===
const leftMovementKey = 'ArrowLeft';
const rightMovementKey = 'ArrowRight';
const shoot = ' ';





//=== Game Settings Initialization ===
document.addEventListener('DOMContentLoaded', function () {
    let startButton = document.querySelector("#start__button-js");
    //screens
    gameplayScreen = document.querySelector("#gameplay-js");
    //ui elements
    actualBulletsAmount = document.querySelector(".bullets__actual");
    startBulletsAmount = document.querySelector(".bullets__start");
    timer = document.querySelector("#timer-js");

    startBulletsAmount.textContent = projectileStartAmount;
    actualBulletsAmount.textContent = projectileAmount;
    timer.textContent = seconds;



    startButton.addEventListener('click', function (event) {
        event.preventDefault();
        activeInput = true;
        updateTimer();
        gameplayScreen.classList.toggle('hide');
        startButton.classList.add('hide');
    });
});

//Timer

function updateTimer() {
    timer.textContent = seconds;
    if (seconds > 0) {
        seconds--;
        timeoutID = setTimeout(updateTimer, 1000); // Update the timer every second
    } else {
        timeOver = true;
    }
}

// === Pixi initialization ===

const ticker = PIXI.Ticker.shared;
// Set this to prevent starting this ticker when listeners are added.
// By default this is true only for the PIXI.Ticker.shared instance.
ticker.autoStart = false;

// FYI, call this to ensure the ticker is stopped. It should be stopped
// if you have not attempted to render anything yet.
ticker.stop();

// Call this when you are ready for a running shared ticker.
ticker.start();

const mainCanvas = document.getElementById('canvas__main');

const Application = PIXI.Application;

const app = new Application({
    width: 1280,
    height: 720,
    view: mainCanvas
});

document.body.appendChild(app.view);

//Pixi background
const bg = PIXI.Sprite.from('/assets/sprites/essentials/background.jpg');

app.stage.addChild(bg);



// ==== Player ===
const player = PIXI.Sprite.from('/assets/sprites/essentials/player.png');

// center the sprite's anchor point
player.anchor.set(0.5);

// move the sprite to the center of the screen
player.width = 75;
player.height = 125;
player.x = app.screen.width / 2;
player.y = app.screen.height - player.height / 2;

app.stage.addChild(player);



// === Meteors ===
const meteorTexture = PIXI.Texture.from('/assets/sprites/enemies/meteor.png');
let meteors = new Array();

for (let i = 0; i < meteorsAmount; i++) {
    const meteor = new PIXI.Sprite(meteorTexture);
    meteor.width = 125;
    meteor.height = 125;
    meteor.x = 100 + Math.random() * app.screen.width * .75;
    meteor.y = Math.random() * app.screen.height / 2;
    meteor.rotation = Math.random();
    meteors.push(meteor);
    app.stage.addChild(meteor);
}





// === Projectile functions ===

// Test For Hit
// A basic AABB check between two different squares
function testForHit(object1, object2) {
    if (object1 === object2) return;
    const bounds1 = object1.getBounds();
    const bounds2 = object2.getBounds();

    return bounds1.x < bounds2.x + bounds2.width
        && bounds1.x + bounds1.width > bounds2.x
        && bounds1.y < bounds2.y + bounds2.height
        && bounds1.y + bounds1.height > bounds2.y;
}


let playerProjectiles = [];
let bossProjectiles = [];
let playerProjectileTickers = []; // Array to hold player projectile tickers
let bossProjectileTickers = [];   // Array to hold boss projectile tickers

function CreateProjectile(playerCall) {
    if (projectileAmount <= 0) {
        return;
    }

    let projectileColor;
    let projectileXPos;
    let projectileYPos;


    const projectile = new PIXI.Graphics();
    let projectile_ticker;
    let bossProjectile_ticker;
    if (playerCall) {
        projectileColor = 0xfffff;
        projectileXPos = player.x;
        projectileYPos = player.y * .85;
        projectileAmount--;
        actualBulletsAmount.textContent = projectileAmount;
        playerProjectiles.push(projectile);
        projectile_ticker = new PIXI.Ticker;
        playerProjectileTickers.push(projectile_ticker);
    } else {
        projectileColor = 0xDE3249;
        projectileXPos = boss.x;
        projectileYPos = boss.y + boss.height * .5;
        bossProjectiles.push(projectile);
        bossProjectile_ticker = new PIXI.Ticker;
        bossProjectileTickers.push(bossProjectile_ticker);
    }
    projectile.beginFill(projectileColor);
    projectile.drawRect(projectileXPos, projectileYPos, 5, 30);
    projectile.endFill();
    app.stage.addChild(projectile);

    if (playerCall) {
        projectile_ticker.add((delta) => { moveProjectile(delta, projectile, projectile_ticker); });
        projectile_ticker.start();
    } else {
        bossProjectile_ticker.add((delta) => { moveBossProjectile(delta, projectile, bossProjectile_ticker); });
        bossProjectile_ticker.start();
    }
}


let hittedPlayerProjectile;
let playerProjectileHit = false;

let hittedBossProjectile;
let bossProjectileHit = false;

function moveProjectile(delta, projectile, projectile_ticker) {
    // move bullet
    projectile.y += (-projectileSpeed * delta);
    let projectileIndex;

    // delete bullet once out of bounds and remove its ticker
    if (projectile.y <= -app.screen.height || projectile.y >= app.screen.height) {
        app.stage.removeChild(projectile);
        // projectileIndex = playerCall ? playerProjectiles.indexOf(projectile) : bossProjectiles.indexOf(projectile);
        projectileIndex = playerProjectiles.indexOf(projectile);
        if (projectileIndex > -1) {
            // if (playerCall) {
            playerProjectiles.splice(projectileIndex, 1);
            const projectile_ticker_index = playerProjectiles.indexOf(projectile_ticker);
            if (projectile_ticker_index > -1) {
                playerProjectileTickers[projectile_ticker_index].destroy();
                playerProjectileTickers.splice(projectile_ticker_index, 1);
            }
            // } else {
            //     bossProjectiles.splice(projectileIndex, 1);
            //     const projectile_ticker_index = bossProjectiles.indexOf(projectile_ticker);
            //     if (projectile_ticker_index > -1) {
            //         bossProjectileTickers[projectile_ticker_index].destroy();
            //         bossProjectileTickers.splice(projectile_ticker_index, 1);
            //     }
            // }
        }
        projectile_ticker.destroy();
        return;
    }
    if (firstLevel) {
        meteors.forEach(meteor => {
            if (testForHit(projectile, meteor)) {
                app.stage.removeChild(projectile);
                app.stage.removeChild(meteor);
                const meteorIndex = meteors.indexOf(meteor);
                if (meteorIndex > -1) { // only splice array when item is found
                    meteors.splice(meteorIndex, 1); // 2nd parameter means remove one item only
                }
                projectileIndex = playerProjectiles.indexOf(projectile);
                if (projectileIndex > -1) { // only splice array when item is found
                    playerProjectiles.splice(projectileIndex, 1); // 2nd parameter means remove one item only
                }
                projectile_ticker.destroy();
                meteorsAmount--;
            }
        });
    }
    else {
        if (testForHit(projectile, boss)) {
            app.stage.removeChild(projectile);
            projectileIndex = playerProjectiles.indexOf(projectile);
            if (projectileIndex > -1) { // only splice array when item is found
                playerProjectiles.splice(projectileIndex, 1); // 2nd parameter means remove one item only
            }
            projectile_ticker.destroy();
            bossTakeDamage();
        }
        
        if(playerProjectileHit && hittedPlayerProjectile === projectile){
            app.stage.removeChild(projectile);
                projectileIndex = playerProjectiles.indexOf(projectile);
                if (projectileIndex > -1) { // only splice array when item is found
                    playerProjectiles.splice(projectileIndex, 1); // 2nd parameter means remove one item only
                }
                hittedPlayerProjectile = null;
                bossProjectileHit = false;
                projectile_ticker.destroy();
        }
        bossProjectiles.forEach(bossProjectile => {
            if (testForHit(projectile, bossProjectile)) {

                app.stage.removeChild(projectile);
                projectileIndex = playerProjectiles.indexOf(projectile);
                if (projectileIndex > -1) { // only splice array when item is found
                    playerProjectiles.splice(projectileIndex, 1); // 2nd parameter means remove one item only
                }
                hittedBossProjectile = bossProjectile;
                bossProjectileHit = true;
                projectile_ticker.destroy();
            }
        });
        
    }
}

function moveBossProjectile(delta, projectile, projectile_ticker) {

    projectile.y += (bossProjectileSpeed * delta);

    let projectileIndex;
    if (projectile.y <= -app.screen.height || projectile.y >= app.screen.height) {
        app.stage.removeChild(projectile);
        projectileIndex = bossProjectiles.indexOf(projectile);
        if (projectileIndex > -1) {
            bossProjectiles.splice(projectileIndex, 1);
            const projectile_ticker_index = bossProjectiles.indexOf(projectile_ticker);
            if (projectile_ticker_index > -1) {
                bossProjectileTickers[projectile_ticker_index].destroy();
                bossProjectileTickers.splice(projectile_ticker_index, 1);
            }
        }
        projectile_ticker.destroy();
        return;
    }

    if (testForHit(projectile, player)) {
        projectile_ticker.destroy();
        app.stage.removeChild(projectile);
        projectileIndex = bossProjectiles.indexOf(projectile);
        if (projectileIndex > -1) { // only splice array when item is found
            bossProjectiles.splice(projectileIndex, 1); // 2nd parameter means remove one item only
        }

        app.stage.removeChild(player);
        endGame(false);
    }

    if(bossProjectileHit && hittedBossProjectile === projectile){
        app.stage.removeChild(projectile);
            projectileIndex = bossProjectiles.indexOf(projectile);
            if (projectileIndex > -1) { // only splice array when item is found
                bossProjectiles.splice(projectileIndex, 1); // 2nd parameter means remove one item only
            }
            hittedBossProjectile = null;
            bossProjectileHit = false;
            projectile_ticker.destroy();
    }
    // Handle collisions between player projectiles and boss projectiles
    playerProjectiles.forEach(playerProjectile => {
        if (testForHit(projectile, playerProjectile)) {

            app.stage.removeChild(projectile);
            projectileIndex = bossProjectiles.indexOf(projectile);
            if (projectileIndex > -1) { // only splice array when item is found
                bossProjectiles.splice(projectileIndex, 1); // 2nd parameter means remove one item only
            }
            hittedPlayerProjectile = playerProjectile;
            playerProjectileHit = true;
            projectile_ticker.destroy();
        }
    });
}



// === Controlls ===

function movePlayer(movingLeft) {
    let playerStartPos = player.x;
    if (movingLeft) {
        player.x -= playerMovementSpeed;
        if (player.x < (player.width / 2)) {
            player.x = playerStartPos;
        }
    } else {
        player.x += playerMovementSpeed;
        if (player.x > (app.screen.width - player.width / 2)) {
            player.x = playerStartPos;
        }
    }
}

document.addEventListener('keydown', function (e) {
    if (!activeInput) return;
    switch (e.key) {
        case leftMovementKey:
            movePlayer(true);
            break;
        case rightMovementKey:
            movePlayer(false);
            break;
        case shoot:
            CreateProjectile(true);
            break;
        default:
            console.log("Unbinded key! Key that was pressed: " + e.key);
            break;
    }
});





// === Game Manager ===
const gameTicker = new PIXI.Ticker;
let gameEnded = false;

gameTicker.add(() => {
    if ((projectileAmount <= 0 && !playerProjectiles.length && (meteors.length || !firstLevel)) || timeOver) {
        endGame(false);
    }
    if (meteorsAmount <= 0 && firstLevel) {
        firstLevel = false;
        runSecondLevel();
    }
});
gameTicker.start();

function endGame(playerWon) {
    if(gameEnded) return;
    if (playerWon) {
        showMessage(playerWon);
        // winScreen.classList.remove('hide');
    } else {
        showMessage(playerWon);
        // gameoverScreen.classList.remove('hide');
    }
    gameplayScreen.classList.add('hide');
    clearTimeout(timeoutID);
    activeInput = false;
    gameEnded = true;
    gameTicker.stop();
}

function showMessage(playerWon) {
    let richText;
    const style = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 36,
        fontStyle: 'italic',
        fontWeight: 'bold',
        stroke: '#4a1850',
        strokeThickness: 5,
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 6,
        wordWrap: true,
        wordWrapWidth: 440,
        lineJoin: 'round',
    });
    if(playerWon){
        style.fill = '#007c00';
        richText = new PIXI.Text('YOU WIN!', style);
    }
    else{
        style.fill = '#ff0000';
        richText = new PIXI.Text('YOU LOSE!', style);
    }
    richText.x = app.screen.width / 2 - richText.width / 2;
    richText.y = app.screen.height / 2;
    app.stage.addChild(richText);
}

function runSecondLevel() {
    projectileAmount = projectileStartAmount;
    actualBulletsAmount.textContent = projectileAmount;
    seconds = timeForGame;
    timer.textContent = seconds;

    spawnBoss();
}





// === Boss ===

let boss;

function spawnBoss() {
    const bossSprite = PIXI.Sprite.from('/assets/sprites/enemies/boss.png');
    // center the sprite's anchor point
    bossSprite.anchor.set(0.5);
    bossSprite.width = 250;
    bossSprite.height = 150;
    bossSprite.x = app.screen.width / 2;
    bossSprite.y = bossSprite.height / 2 + 100;
    app.stage.addChild(bossSprite);
    boss = bossSprite;

    showBossHP();
    runBossBehavior();
}

// Create a container to hold the rectangles
const hpContainer = new PIXI.Container();
app.stage.addChild(hpContainer);

function showBossHP() {

    // Calculate spacing and starting position based on screen width and number of rectangles
    const screenWidth = app.renderer.width;
    const rectWidth = 75;
    const rectHeight = 20;

    const maxSpacing = 40; // Maximum spacing between rectangles
    const totalSpacing = Math.min((screenWidth - bossHP * rectWidth) / (bossHP + 1), maxSpacing);
    const totalWidth = bossHP * rectWidth + (bossHP - 1) * totalSpacing;
    const startX = (screenWidth - totalWidth) / 2;
    const startY = 20;

    // Create and add the rectangles to the container
    for (let i = 0; i < bossHP; i++) {
        const rect = new PIXI.Graphics();
        rect.beginFill(0xFF0000);
        rect.drawRect(startX + i * (rectWidth + totalSpacing), startY, rectWidth, rectHeight);
        rect.endFill();
        hpContainer.addChild(rect);
    }
}

// Function to remove the rectangles one by one
function bossTakeDamage() {
    if (hpContainer.children.length > 0) {
        const numChildren = hpContainer.children.length;
        if (numChildren > 0) {
            bossHP--;
            const rectToRemove = hpContainer.children[numChildren - 1];
            hpContainer.removeChild(rectToRemove);
        }
    }
    if (bossHP <= 0) {
        app.stage.removeChild(boss);
        endGame(true);
    }
}

//Boss intelligence
let shootTimePassed = 0;
function runBossBehavior() {
    if (!activeInput) return;
    let moveBoss = Math.random() < bossMoveChance;
    if (moveBoss)
        bossMovement();

        shootTimePassed += bossThinkTime / 1000;
    let bossCanShoot = Math.abs(shootTimePassed) >= bossShootCooldown;
    if (bossCanShoot){
        bossShoot();
        shootTimePassed = 0;
    }

    setTimeout(runBossBehavior, bossThinkTime);
}

function bossMovement() {
    let bossStartPos = boss.x;
    if (Math.random() < 0.5) {
        boss.x -= bossMovementSpeed;
        if (boss.x < (boss.width / 2)) {
            boss.x = bossStartPos;
        }
    } else {
        boss.x += bossMovementSpeed;
        if (boss.x > (app.screen.width - boss.width / 2)) {
            boss.x = bossStartPos;
        }
    }
}

function bossShoot() {
    CreateProjectile(false);
}