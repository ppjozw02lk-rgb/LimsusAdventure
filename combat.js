// Combat Engine: Pokemon Battle Arena Layout + Limbus Company Coin Clash System
import { sound } from './sound.js';

export class CombatEngine {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('combat-overlay');
    this.inBattle = false;
    this.isClashing = false;
    this.currentEnemy = null;

    // Combatants state
    this.playerHP = 200;
    this.playerMaxHP = 200;
    this.enemyHP = 200;
    this.enemyMaxHP = 200;

    // Cache DOM elements
    this.dialogueBox = document.getElementById('combat-dialogue');
    this.actionPanel = document.getElementById('combat-actions');
    this.skillsPanel = document.getElementById('combat-skills-grid');
    
    this.playerSprite = document.getElementById('combat-player-sprite');
    this.enemySprite = document.getElementById('combat-enemy-sprite');

    this.playerHPBar = document.getElementById('player-hp-bar');
    this.playerHPElem = document.getElementById('player-hp-text');
    this.enemyHPBar = document.getElementById('enemy-hp-bar');
    this.enemyHPElem = document.getElementById('enemy-hp-text');
    this.enemyNameElem = document.getElementById('enemy-name-text');

    // Clash elements
    this.playerClashBanner = document.getElementById('player-clash-banner');
    this.enemyClashBanner = document.getElementById('enemy-clash-banner');
    this.playerCoinsContainer = document.getElementById('player-coins-container');
    this.enemyCoinsContainer = document.getElementById('enemy-coins-container');
    this.playerSkillName = document.getElementById('player-clash-skill-name');
    this.enemySkillName = document.getElementById('enemy-clash-skill-name');
    this.playerClashVal = document.getElementById('player-clash-val');
    this.enemyClashVal = document.getElementById('enemy-clash-val');

    this.setupListeners();
  }

  setupListeners() {
    document.getElementById('btn-attack-menu').addEventListener('click', () => {
      sound.playClick();
      this.showSkillsMenu();
    });

    document.getElementById('btn-use-potion').addEventListener('click', () => {
      sound.playClick();
      this.usePotionInBattle();
    });

    document.getElementById('btn-run').addEventListener('click', () => {
      sound.playClick();
      this.runAway();
    });

    document.getElementById('btn-back-to-actions').addEventListener('click', () => {
      sound.playClick();
      this.showActionMenu();
    });
  }

  startBattle(npc) {
    this.inBattle = true;
    this.currentEnemy = npc;
    this.playerHP = this.game.player.hp;
    this.playerMaxHP = this.game.player.maxHp;
    this.enemyHP = npc.hp || 200;
    this.enemyMaxHP = npc.maxHp || 200;

    sound.playBattleIntro();
    if (this.game.bgmController) {
      this.game.bgmController.playBattle(npc);
    }

    // Set dynamic arena theme
    this.container.setAttribute('data-theme', npc.spriteType || 'brawler');

    // Set enemy status plate details
    this.enemyNameElem.textContent = npc.name;
    document.getElementById('enemy-level-text').textContent = `Lv. ${npc.level || 20}`;
    
    const enemyAvatar = document.getElementById('enemy-plate-avatar');
    if (enemyAvatar) {
      enemyAvatar.src = npc.modelImage || './assets/brawler.jfif';
    }
    const enemyTitle = document.getElementById('enemy-title-badge');
    if (enemyTitle) {
      enemyTitle.textContent = npc.title || 'CHAMPION';
    }
    const enemyGender = document.getElementById('enemy-gender-icon');
    if (enemyGender) {
      enemyGender.textContent = npc.spriteType === 'redmist' ? '♀' : npc.spriteType === 'ronin' ? '⚔️' : '👊';
    }
    
    // Clean frameless enemy character sprite standing naturally on battle pedestal
    this.enemySprite.className = `combat-sprite enemy-pose ${npc.spriteType || 'brawler'}`;
    this.enemySprite.style.transform = 'scale(1)';
    this.enemySprite.style.opacity = '1';
    this.enemySprite.innerHTML = `
      <div class="enemy-clean-figure" style="--char-color: ${npc.color || '#f97316'}">
        <img src="${npc.modelImage || './assets/brawler.jfif'}" alt="${npc.name}" class="enemy-clean-sprite-img" />
        <div class="enemy-battle-glow"></div>
      </div>
    `;

    // Ensure player combat sprite uses mainfight.png
    const playerImg = document.getElementById('combat-player-img');
    if (playerImg) {
      playerImg.src = './assets/mainfight.png';
    }

    const playerNameEl = document.getElementById('player-combat-name');
    if (playerNameEl) {
      playerNameEl.textContent = this.game.player.name || 'LL-01';
    }
    const playerLevelEl = document.getElementById('player-combat-level');
    if (playerLevelEl) {
      playerLevelEl.textContent = `Lv. ${this.game.player.level || 1}`;
    }

    this.updateHUD();
    this.hideClashUI();

    // Open combat screen
    this.container.classList.remove('hidden');
    this.container.classList.add('battle-entering');
    setTimeout(() => {
      this.container.classList.remove('battle-entering');
    }, 600);

    this.setDialogue(`Challenger ${npc.name} wants to battle! Choose your move!`);
    this.renderSkills();
    this.showActionMenu();
  }

  updateHUD() {
    const pPct = Math.max(0, (this.playerHP / this.playerMaxHP) * 100);
    const ePct = Math.max(0, (this.enemyHP / this.enemyMaxHP) * 100);

    this.playerHPBar.style.width = `${pPct}%`;
    this.playerHPElem.textContent = `${Math.ceil(this.playerHP)}/${this.playerMaxHP}`;

    this.enemyHPBar.style.width = `${ePct}%`;
    this.enemyHPElem.textContent = `${Math.ceil(this.enemyHP)}/${this.enemyMaxHP}`;

    // Color shifting for health bars
    this.updateBarColor(this.playerHPBar, pPct);
    this.updateBarColor(this.enemyHPBar, ePct);

    // Sync with game player object
    this.game.player.hp = Math.max(0, this.playerHP);
    this.game.updateHUD();
  }

  updateBarColor(barElem, pct) {
    if (pct > 50) {
      barElem.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
    } else if (pct > 25) {
      barElem.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    } else {
      barElem.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
    }
  }

  renderSkills() {
    this.skillsPanel.innerHTML = '';
    const ownedSkills = this.game.player.skills;

    ownedSkills.forEach(skillId => {
      const skill = this.game.skillData[skillId];
      if (!skill) return;

      const card = document.createElement('button');
      card.className = `skill-btn skill-${skillId}`;
      card.style.setProperty('--skill-color', skill.color || '#38bdf8');
      card.innerHTML = `
        <div class="skill-btn-header">
          <span class="skill-name">${skill.icon || '⚔️'} ${skill.name}</span>
          <span class="skill-dmg">DMG <b>${skill.dmg}</b></span>
        </div>
        <div class="skill-btn-meta">
          <span class="coin-badge"><i class="ico ico-coin"></i> ${skill.coins} Coins</span>
          <span class="skill-tag">${skill.tag || 'Physical'}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        if (this.isClashing) return;
        sound.playClick();
        this.executeClashTurn(skill);
      });

      this.skillsPanel.appendChild(card);
    });
  }

  showActionMenu() {
    this.actionPanel.classList.remove('hidden');
    this.skillsPanel.classList.add('hidden');
    document.getElementById('btn-back-to-actions').classList.add('hidden');

    const potionBtn = document.getElementById('btn-use-potion');
    if (potionBtn) {
      potionBtn.innerHTML = `
        <span class="action-icon"><i class="ico ico-potion"></i></span>
        <span class="action-label">RESTORE HP (${this.game.player.potions})</span>
      `;
    }
  }

  showSkillsMenu() {
    this.actionPanel.classList.add('hidden');
    this.skillsPanel.classList.remove('hidden');
    document.getElementById('btn-back-to-actions').classList.remove('hidden');
    this.setDialogue('Select a skill to initiate clash coin toss!');
  }

  setDialogue(text) {
    this.dialogueBox.innerHTML = `<span>${text}</span>`;
  }

  usePotionInBattle() {
    if (this.game.player.potions <= 0) {
      this.setDialogue('You have no healing potions left! Visit the Mystic Pond!');
      return;
    }

    if (this.playerHP >= this.playerMaxHP) {
      this.setDialogue('Your HP is already at maximum!');
      return;
    }

    this.game.player.potions--;
    this.playerHP = Math.min(this.playerMaxHP, this.playerHP + 100);
    sound.playHeal();
    this.updateHUD();
    this.spawnFloatingNumber(this.playerSprite, '+100 HP', '#10b981');
    this.setDialogue(`Used Vitality Potion! Restored 100 HP. (${this.game.player.potions} left)`);
  }

  runAway() {
    this.setDialogue('Safely fled from the battle!');
    if (this.game.bgmController) {
      this.game.bgmController.stopBattle(true);
    }
    setTimeout(() => {
      this.endBattle(false);
    }, 700);
  }

  // --- CLASH MECHANIC (Limbus Company Style) ---
  async executeClashTurn(playerSkill) {
    this.isClashing = true;
    this.actionPanel.classList.add('hidden');
    this.skillsPanel.classList.add('hidden');
    document.getElementById('btn-back-to-actions').classList.add('hidden');

    // Enemy AI randomly picks from their assigned skills
    const enemySkillKeys = (this.currentEnemy && this.currentEnemy.skills && this.currentEnemy.skills.length > 0)
      ? this.currentEnemy.skills
      : ['punch', 'kick'];
    const chosenKey = enemySkillKeys[Math.floor(Math.random() * enemySkillKeys.length)];
    const enemySkill = this.game.skillData[chosenKey] || this.game.skillData['punch'] || {
      name: 'Strike', coins: 5, dmg: 10, basePower: 2
    };

    this.setDialogue(`CLASH! ${playerSkill.name} (🪙${playerSkill.coins}) VS ${enemySkill.name} (🪙${enemySkill.coins})!`);

    // Prepare clash banners
    this.showClashUI(playerSkill, enemySkill);

    // Setup coin slots
    this.setupCoins(this.playerCoinsContainer, playerSkill.coins);
    this.setupCoins(this.enemyCoinsContainer, enemySkill.coins);

    // Initial base power: Base 2 for punch, 3 for kick, 4 for charge, 5 for slay
    let playerPower = playerSkill.basePower || 2;
    let enemyPower = enemySkill.basePower || 2;

    this.playerClashVal.textContent = `${playerPower}`;
    this.enemyClashVal.textContent = `${enemyPower}`;

    await this.sleep(400);

    // Flip Coins sequentially or in rapid burst
    const maxCoins = Math.max(playerSkill.coins, enemySkill.coins);
    let playerHeadsCount = 0;
    let enemyHeadsCount = 0;

    const pCoinElements = this.playerCoinsContainer.querySelectorAll('.clash-coin');
    const eCoinElements = this.enemyCoinsContainer.querySelectorAll('.clash-coin');

    for (let i = 0; i < maxCoins; i++) {
      let flippedAny = false;

      // Player coin flip
      if (i < playerSkill.coins) {
        flippedAny = true;
        const isHeads = Math.random() < 0.55; // 55% heads chance for player
        if (isHeads) {
          playerHeadsCount++;
          playerPower += 1;
        }
        this.animateCoin(pCoinElements[i], isHeads);
        this.playerClashVal.textContent = `${playerPower}`;
      }

      // Enemy coin flip
      if (i < enemySkill.coins) {
        flippedAny = true;
        const isHeads = Math.random() < 0.50; // 50% heads for enemy
        if (isHeads) {
          enemyHeadsCount++;
          enemyPower += 1;
        }
        this.animateCoin(eCoinElements[i], isHeads);
        this.enemyClashVal.textContent = `${enemyPower}`;
      }

      if (flippedAny) {
        sound.playCoinFlip(1 + (i * 0.05));
        await this.sleep(120);
      }
    }

    await this.sleep(500);

    // Clash Resolution: Winner leaps and deals DMG
    if (playerPower > enemyPower) {
      // Player Clash Win!
      sound.playClashWin();
      this.playerClashBanner.classList.add('clash-win-highlight');
      this.enemyClashBanner.classList.add('clash-lose-highlight');
      this.setDialogue(`CLASH WIN! (${playerPower} vs ${enemyPower}) LL-01 executes ${playerSkill.name}!`);

      await this.sleep(600);
      this.hideClashUI();

      // Player jumps into enemy to deal DMG
      await this.performAttack(
        this.playerSprite,
        this.enemySprite,
        playerSkill,
        true // isPlayer
      );

      const finalDmg = playerSkill.dmg;
      this.enemyHP = Math.max(0, this.enemyHP - finalDmg);
      this.updateHUD();
      this.spawnFloatingNumber(this.enemySprite, `-${finalDmg}`, '#ef4444');
      this.shakeScreen();

      if (this.enemyHP <= 0) {
        await this.handleVictory();
        return;
      }

    } else if (enemyPower > playerPower) {
      // Enemy Clash Win!
      sound.playClashWin();
      this.enemyClashBanner.classList.add('clash-win-highlight');
      this.playerClashBanner.classList.add('clash-lose-highlight');
      this.setDialogue(`CLASH LOSE... (${playerPower} vs ${enemyPower}) Challenger hits with ${enemySkill.name}!`);

      await this.sleep(600);
      this.hideClashUI();

      // Enemy jumps into player to deal DMG
      await this.performAttack(
        this.enemySprite,
        this.playerSprite,
        enemySkill,
        false // isEnemy
      );

      const finalDmg = enemySkill.dmg;
      this.playerHP = Math.max(0, this.playerHP - finalDmg);
      this.updateHUD();
      this.spawnFloatingNumber(this.playerSprite, `-${finalDmg}`, '#ff3366');
      this.shakeScreen();

      if (this.playerHP <= 0) {
        await this.handleDefeat();
        return;
      }

    } else {
      // Clash Draw / Tie!
      sound.playClashDraw();
      this.setDialogue(`CLASH DRAW (${playerPower} vs ${enemyPower})! Both attacks parried!`);
      this.playerClashBanner.classList.add('clash-draw-highlight');
      this.enemyClashBanner.classList.add('clash-draw-highlight');

      await this.sleep(800);
      this.hideClashUI();
    }

    // Turn concludes, show menu for next turn
    this.isClashing = false;
    this.showActionMenu();
    this.setDialogue('What will LL-01 do next?');
  }

  showClashUI(playerSkill, enemySkill) {
    this.playerSkillName.textContent = playerSkill.name;
    this.enemySkillName.textContent = enemySkill.name;

    this.playerClashBanner.className = 'clash-ui-overlay player-clash';
    this.enemyClashBanner.className = 'clash-ui-overlay enemy-clash';

    this.playerClashBanner.classList.remove('hidden');
    this.enemyClashBanner.classList.remove('hidden');
  }

  hideClashUI() {
    this.playerClashBanner.classList.add('hidden');
    this.enemyClashBanner.classList.add('hidden');
  }

  setupCoins(container, count) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const coin = document.createElement('div');
      coin.className = 'clash-coin spinning';
      coin.innerHTML = `<div class="coin-inner"><div class="coin-front">★</div><div class="coin-back">●</div></div>`;
      container.appendChild(coin);
    }
  }

  animateCoin(coinElem, isHeads) {
    if (!coinElem) return;
    coinElem.classList.remove('spinning');
    if (isHeads) {
      coinElem.classList.add('heads');
    } else {
      coinElem.classList.add('tails');
    }
  }

  // Jumping & Leaping Attack Animation
  async performAttack(attacker, defender, skill, isPlayer) {
    sound.playHit(skill.id);

    // Dash / Jump forward
    attacker.classList.add('attacking-dash');
    if (isPlayer) {
      attacker.style.transform = 'translate(180px, -110px) scale(1.15)';
    } else {
      attacker.style.transform = 'translate(-180px, 110px) scale(1.15)';
    }

    await this.sleep(250);

    // Defender recoils with hurt effect
    defender.classList.add('hurt-flash');
    this.createAttackVFX(defender, skill.id);

    await this.sleep(300);

    // Return to original stance
    attacker.style.transform = '';
    attacker.classList.remove('attacking-dash');
    defender.classList.remove('hurt-flash');
  }

  createAttackVFX(target, skillId) {
    const vfx = document.createElement('div');
    vfx.className = `combat-vfx vfx-${skillId}`;
    
    if (skillId === 'coffin_throw') {
      vfx.innerHTML = `<div class="coffin-throw-vfx">⚰️</div><div class="heavy-coffin-shockwave"></div>`;
    } else if (skillId === 'flame_burst') {
      vfx.innerHTML = `<div class="flame-burst-pillar">🔥</div><div class="flame-ring"></div>`;
    } else if (skillId === 'sword_swing' || skillId === 'slash' || skillId === 'rush_slash') {
      vfx.innerHTML = `<div class="sword-slice-arc"></div>`;
    } else if (skillId === 'level_slash') {
      vfx.innerHTML = `<div class="level-slash-wave"></div>`;
    } else if (skillId === 'rushing') {
      vfx.innerHTML = `<div class="rush-streak-vfx"></div>`;
    } else if (skillId === 'slay') {
      vfx.innerHTML = `<div class="slay-slash-line"></div>`;
    } else if (skillId === 'charge') {
      vfx.innerHTML = `<div class="charge-laser-burst"></div>`;
    } else if (skillId === 'kick') {
      vfx.innerHTML = `<div class="kick-shockwave"></div>`;
    } else {
      vfx.innerHTML = `<div class="punch-impact-sparks"></div>`;
    }

    target.appendChild(vfx);
    setTimeout(() => {
      vfx.remove();
    }, 600);
  }

  spawnFloatingNumber(parent, text, color = '#ffffff') {
    const floatElem = document.createElement('div');
    floatElem.className = 'floating-dmg';
    floatElem.style.color = color;
    floatElem.textContent = text;
    parent.appendChild(floatElem);

    setTimeout(() => {
      floatElem.remove();
    }, 900);
  }

  shakeScreen() {
    this.container.classList.add('screen-shake');
    setTimeout(() => {
      this.container.classList.remove('screen-shake');
    }, 350);
  }

  async handleVictory() {
    this.isClashing = true;
    // Battle theme dies upon victory
    if (this.game.bgmController) {
      this.game.bgmController.stopBattle(false);
    }
    sound.playVictory();

    const goldReward = 50;
    this.game.player.gold += goldReward;
    this.game.player.wins = (this.game.player.wins || 0) + 1;

    // Level up mechanic: +1 Level, +5 Max HP per level, and full HP restoration
    const currentLvl = this.game.player.level || 1;
    this.game.player.level = currentLvl + 1;
    this.game.player.maxHp = 100 + (this.game.player.level - 1) * 5;
    this.game.player.hp = this.game.player.maxHp;

    // Update HUD & sync save data
    this.game.updateHUD();
    if (this.game.savePlayerData) this.game.savePlayerData();
    if (this.game.updateLeaderboardWithPlayer) this.game.updateLeaderboardWithPlayer();

    this.enemySprite.style.opacity = '0.3';
    this.enemySprite.style.transform = 'scale(0.8) rotate(-15deg)';

    this.setDialogue(`VICTORY! Defeated ${this.currentEnemy.name}! Gained +${goldReward} Gold & Leveled Up to Lv.${this.game.player.level}! (Max HP: ${this.game.player.maxHp})`);

    await this.sleep(1800);
    this.showVictoryModal(goldReward, this.game.player.level, this.game.player.maxHp);
  }

  showVictoryModal(goldReward, newLevel, newMaxHp) {
    const modal = document.getElementById('victory-modal');
    document.getElementById('victory-gold-text').textContent = `+${goldReward} Gold`;
    
    const lvlBox = document.getElementById('victory-level-up-box');
    if (lvlBox) {
      lvlBox.textContent = `★ LEVEL UP! Lv. ${newLevel || this.game.player.level} (+5 Max HP: ${newMaxHp || this.game.player.maxHp}) ★`;
    }
    modal.classList.remove('hidden');

    const closeBtn = document.getElementById('btn-victory-claim');
    const handler = () => {
      closeBtn.removeEventListener('click', handler);
      modal.classList.add('hidden');
      this.endBattle(true);
      // Resume peaceful overworld background music
      if (this.game.bgmController) {
        this.game.bgmController.playOverworld();
      }
    };
    closeBtn.addEventListener('click', handler);
  }

  async handleDefeat() {
    this.isClashing = true;
    // Battle theme stops
    if (this.game.bgmController) {
      this.game.bgmController.stopBattle(false);
    }
    sound.playDefeat();

    this.playerSprite.style.opacity = '0.3';
    this.setDialogue('LL-01 was defeated... Teleporting back to Red Checkpoint!');

    await this.sleep(1800);
    this.showDefeatModal();
  }

  showDefeatModal() {
    const modal = document.getElementById('defeat-modal');
    modal.classList.remove('hidden');

    const respawnBtn = document.getElementById('btn-respawn');
    const handler = () => {
      respawnBtn.removeEventListener('click', handler);
      modal.classList.add('hidden');
      
      // Respawn at Flame Rift (Red Point: 1322, 374) with full HP!
      this.game.player.hp = this.game.player.maxHp;
      this.game.player.x = this.game.SPAWN_POINT.x;
      this.game.player.y = this.game.SPAWN_POINT.y;
      this.game.targetX = this.game.SPAWN_POINT.x;
      this.game.targetY = this.game.SPAWN_POINT.y;
      this.game.updateHUD();

      this.endBattle(false);
      // Resume overworld exploration music
      if (this.game.bgmController) {
        this.game.bgmController.playOverworld();
      }
    };
    respawnBtn.addEventListener('click', handler);
  }

  endBattle(won) {
    this.inBattle = false;
    this.isClashing = false;
    this.container.classList.add('hidden');
    this.playerSprite.style.opacity = '1';
    this.enemySprite.style.opacity = '1';
    this.enemySprite.style.transform = 'scale(1)';

    if (won && this.currentEnemy) {
      this.currentEnemy.defeated = true;
      // Mark as defeated on map or grant bonus
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
