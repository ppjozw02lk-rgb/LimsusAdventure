// Main Game Engine: Menu System, World Map, Player Exploration, Mystic Shop & Interactive Points
import { sound } from './sound.js';
import { CombatEngine } from './combat.js';
import { ENEMIES, SKILL_DATA } from './enemies.js';

// ============================================
// RETRO 1-BIT STARFIELD SYSTEM
// ============================================
class Starfield {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.numStars = 150;
    this.animationId = null;
    this.active = true;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initStars();
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initStars() {
    this.stars = [];
    this.numStars = 220;
    const w = this.canvas.width || window.innerWidth;
    const h = this.canvas.height || window.innerHeight;
    for (let i = 0; i < this.numStars; i++) {
      const isCross = Math.random() < 0.14;
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: isCross ? 3 : Math.random() < 0.72 ? 1 : 2,
        isCross: isCross,
        speed: 0.08 + Math.random() * 0.32,
        twinklePhase: Math.random() * Math.PI * 2,
        baseAlpha: 0.45 + Math.random() * 0.55
      });
    }
  }

  animate() {
    if (!this.active || !this.canvas || !this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, w, h);

    const now = performance.now() * 0.002;
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      s.y += s.speed;
      if (s.y > h) {
        s.y = 0;
        s.x = Math.random() * w;
      }
      const alpha = Math.max(0.18, Math.min(1, s.baseAlpha * (0.65 + 0.35 * Math.sin(now * 3 + s.twinklePhase))));
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
      const px = Math.floor(s.x);
      const py = Math.floor(s.y);

      if (s.isCross) {
        // Draw 3x3 pixel cross (+)
        this.ctx.fillRect(px, py - 1, 1, 3);
        this.ctx.fillRect(px - 1, py, 3, 1);
      } else {
        this.ctx.fillRect(px, py, s.size, s.size);
      }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  resume() {
    this.stop();
    this.animate();
  }
}

// ============================================
// BGM CONTROLLER (Menu, Overworld, Battle Themes)
// ============================================
class BgmController {
  constructor() {
    this.musicVolume = 0.6;
    this.isMuted = false;

    // Load persisted mute preference
    try {
      if (localStorage.getItem('limsus_sound_muted') === '1') {
        this.isMuted = true;
      }
    } catch (e) {}

    // 1. Menu Theme: Gurren Lagann Eyecatch Collection.mp3
    this.menuBgm = new Audio('./Gurren Lagann Eyecatch Collection.mp3');
    this.menuBgm.loop = true;
    this.menuBgm.muted = this.isMuted;

    // 2. Overworld Exploration Theme: Chill Guy Theme (Hinoki Wood Chill Piano)
    this.overworldBgm = new Audio('./Chill Guy Theme (Gia Margaret - Hinoki Wood) CHILL PIANO VERSION.mp3');
    this.overworldBgm.loop = true;
    this.overworldBgm.muted = this.isMuted;

    // 3. Current active battle music
    this.battleBgm = null;
    this.currentTrack = null;

    sound.setMute(this.isMuted);
    setTimeout(() => this.updateMuteUI(), 50);
  }

  setVolume(vol) {
    this.musicVolume = vol;
    if (this.isMuted) return;
    if (this.menuBgm) this.menuBgm.volume = this.musicVolume * 0.5;
    if (this.overworldBgm) this.overworldBgm.volume = this.musicVolume * 0.55;
    if (this.battleBgm) this.battleBgm.volume = this.musicVolume * 0.55;
  }

  setMute(isMuted) {
    this.isMuted = isMuted;
    if (this.menuBgm) this.menuBgm.muted = isMuted;
    if (this.overworldBgm) this.overworldBgm.muted = isMuted;
    if (this.battleBgm) this.battleBgm.muted = isMuted;
    sound.setMute(isMuted);

    try {
      localStorage.setItem('limsus_sound_muted', isMuted ? '1' : '0');
    } catch (e) {}

    this.updateMuteUI();
  }

  toggleMute() {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  updateMuteUI() {
    const soundIcon = document.getElementById('sound-icon');
    if (soundIcon) {
      soundIcon.innerHTML = this.isMuted ? '<i class="ico ico-sound-off"></i>' : '<i class="ico ico-sound-on"></i>';
    }
    const hudBtn = document.getElementById('btn-sound-toggle');
    if (hudBtn) {
      hudBtn.classList.toggle('muted-active', this.isMuted);
      hudBtn.title = this.isMuted ? 'Sound: Muted (Click to Unmute)' : 'Sound: Playing (Click to Mute)';
    }
    const optMuteBtn = document.getElementById('opt-mute-toggle');
    if (optMuteBtn) {
      optMuteBtn.textContent = this.isMuted ? 'ON' : 'OFF';
      optMuteBtn.classList.toggle('active', this.isMuted);
    }
  }

  playMenu() {
    this.stopOverworld();
    this.stopBattle(false);
    this.currentTrack = 'menu';
    this.menuBgm.muted = this.isMuted;
    this.menuBgm.volume = this.musicVolume * 0.5;
    this.menuBgm.play().catch(() => {});
  }

  stopMenu() {
    if (this.menuBgm) {
      this.menuBgm.pause();
      this.menuBgm.currentTime = 0;
    }
  }

  playOverworld() {
    this.stopMenu();
    this.stopBattle(false);
    this.currentTrack = 'overworld';
    this.overworldBgm.muted = this.isMuted;
    this.overworldBgm.volume = this.musicVolume * 0.55;
    this.overworldBgm.play().catch(() => {});
  }

  stopOverworld() {
    if (this.overworldBgm) {
      this.overworldBgm.pause();
    }
  }

  playBattle(npc) {
    this.stopOverworld();
    this.stopMenu();
    if (this.battleBgm) {
      this.battleBgm.pause();
      this.battleBgm = null;
    }

    const musicSrc = (npc && npc.themeMusic) ? npc.themeMusic : './Library of Ruina - Red Mist Cover - Skelraiser.mp3';
    this.battleBgm = new Audio(musicSrc);
    this.battleBgm.loop = true;
    this.battleBgm.muted = this.isMuted;
    this.battleBgm.volume = this.musicVolume * 0.55;
    this.currentTrack = 'battle';
    this.battleBgm.play().catch(() => {});
  }

  stopBattle(resumeOverworld = true) {
    // "พอสู้สำเร็จให้เพลงthemeดับ"
    if (this.battleBgm) {
      const audioToStop = this.battleBgm;
      this.battleBgm = null;
      let vol = audioToStop.volume;
      const fade = setInterval(() => {
        if (vol > 0.05) {
          vol -= 0.05;
          audioToStop.volume = vol;
        } else {
          audioToStop.pause();
          audioToStop.currentTime = 0;
          clearInterval(fade);
        }
      }, 30);
    }

    if (resumeOverworld) {
      this.playOverworld();
    }
  }
}

// ============================================
// DATA PERSISTENCE & LEADERBOARD SYSTEM
// ============================================
export const DEFAULT_LEADERBOARD = [
  { id: 'kali', name: 'The Red Mist (Kali)', level: 30, maxHp: 245, gold: 999, wins: 50 },
  { id: 'ignis', name: 'Brawler Ignis', level: 26, maxHp: 225, gold: 450, wins: 28 },
  { id: 'kai', name: 'Ronin Kai', level: 25, maxHp: 220, gold: 380, wins: 22 },
  { id: 'vergilius', name: 'Vergilius', level: 20, maxHp: 195, gold: 300, wins: 15 },
  { id: 'roland', name: 'Roland', level: 15, maxHp: 170, gold: 200, wins: 10 },
  { id: 'dante', name: 'Dante (Manager)', level: 5, maxHp: 120, gold: 100, wins: 3 }
];

export function getStoredPlayerData() {
  try {
    const raw = localStorage.getItem('limsus_player_data');
    if (raw) {
      const data = JSON.parse(raw);
      const level = Math.max(1, parseInt(data.level) || 1);
      const maxHp = 100 + (level - 1) * 5;
      return {
        name: (data.name && data.name.trim()) ? data.name.trim() : 'LL-01',
        level: level,
        hp: Math.min(maxHp, parseInt(data.hp) || maxHp),
        maxHp: maxHp,
        gold: typeof data.gold === 'number' ? data.gold : 50,
        potions: typeof data.potions === 'number' ? data.potions : 2,
        wins: parseInt(data.wins) || 0,
        skills: Array.isArray(data.skills) && data.skills.length ? data.skills : ['punch', 'kick'],
        isGoogleAuth: !!data.isGoogleAuth,
        googleEmail: data.googleEmail || '',
        googleName: data.googleName || ''
      };
    }
  } catch (e) {}

  return {
    name: 'LL-01',
    level: 1,
    hp: 100,
    maxHp: 100,
    gold: 50,
    potions: 2,
    wins: 0,
    skills: ['punch', 'kick'],
    isGoogleAuth: false,
    googleEmail: '',
    googleName: ''
  };
}

export function saveStoredPlayerData(data) {
  try {
    const level = Math.max(1, parseInt(data.level) || 1);
    data.maxHp = 100 + (level - 1) * 5;
    localStorage.setItem('limsus_player_data', JSON.stringify(data));
  } catch (e) {}
}

export function updateGoogleUI(playerData) {
  const data = playerData || getStoredPlayerData();
  const menuText = document.getElementById('menu-google-status-text');
  const menuBtn = document.getElementById('btn-menu-google');
  if (menuText) {
    if (data.isGoogleAuth && data.googleEmail) {
      menuText.innerHTML = `<span class="google-active-dot"></span> ${data.googleEmail}`;
      if (menuBtn) menuBtn.classList.add('connected');
    } else {
      menuText.textContent = 'Sign in with Google';
      if (menuBtn) menuBtn.classList.remove('connected');
    }
  }

  const profileStatus = document.getElementById('profile-google-status');
  const googleBtnAction = document.getElementById('btn-google-login-action');
  const signedBox = document.getElementById('google-signed-in-box');
  const googleEmailText = document.getElementById('google-account-email');

  if (profileStatus) {
    if (data.isGoogleAuth && data.googleEmail) {
      profileStatus.innerHTML = `<span class="status-dot online"></span> Google Connected: ${data.googleEmail}`;
      profileStatus.classList.add('online');
      if (signedBox) signedBox.classList.remove('hidden');
      if (googleEmailText) googleEmailText.textContent = data.googleEmail;
      if (googleBtnAction) googleBtnAction.classList.add('hidden');
    } else {
      profileStatus.innerHTML = `<span class="status-dot"></span> Guest Mode (Local Storage)`;
      profileStatus.classList.remove('online');
      if (signedBox) signedBox.classList.add('hidden');
      if (googleBtnAction) googleBtnAction.classList.remove('hidden');
    }
  }
}

export function performGoogleLogin(onSuccess) {
  const current = getStoredPlayerData();
  if (current.isGoogleAuth) {
    alert(`Already signed in with Google as: ${current.googleEmail}`);
    if (onSuccess) onSuccess(current);
    return;
  }

  const defaultEmail = 'naveeraphap@gmail.com';
  const emailInput = prompt('Enter your Google Account email to sync progress:', defaultEmail);
  if (!emailInput || !emailInput.trim()) return;

  const cleanEmail = emailInput.trim();
  const userName = cleanEmail.split('@')[0];

  current.isGoogleAuth = true;
  current.googleEmail = cleanEmail;
  current.googleName = userName;
  if (current.name === 'LL-01' || !current.name) {
    current.name = 'นาวีระภาพ';
  }

  saveStoredPlayerData(current);
  updateGoogleUI(current);
  updateMenuPlayerDisplay(current);
  updateAndRenderLeaderboard(current);
  sound.playShopBuy();

  if (window.game) {
    window.game.player.name = current.name;
    window.game.userProfile.isGoogleAuth = true;
    window.game.userProfile.googleEmail = cleanEmail;
    window.game.userProfile.googleName = userName;
    window.game.updateHUD();
    window.game.showToast(`Signed in as ${cleanEmail}! Progress saved.`, '#10b981');
  }

  if (onSuccess) onSuccess(current);
}

export function performGoogleSignOut(onSuccess) {
  const current = getStoredPlayerData();
  current.isGoogleAuth = false;
  current.googleEmail = '';
  current.googleName = '';
  saveStoredPlayerData(current);
  updateGoogleUI(current);
  updateMenuPlayerDisplay(current);

  if (window.game) {
    window.game.userProfile.isGoogleAuth = false;
    window.game.userProfile.googleEmail = '';
    window.game.userProfile.googleName = '';
    window.game.updateHUD();
    window.game.showToast('Disconnected Google account.', '#f59e0b');
  }

  if (onSuccess) onSuccess(current);
}

export function updateAndRenderLeaderboard(customPlayerStats = null) {
  const container = document.getElementById('leaderboard-list-container');
  const rankStatusEl = document.getElementById('leaderboard-player-rank-status');
  if (!container) return;

  const player = customPlayerStats || getStoredPlayerData();
  let baseRoster = [...DEFAULT_LEADERBOARD];

  try {
    const raw = localStorage.getItem('limsus_leaderboard');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        baseRoster = parsed.filter(item => !item.isCurrentPlayer && item.id !== 'player');
      }
    }
  } catch (e) {}

  const playerEntry = {
    id: 'player',
    isCurrentPlayer: true,
    name: player.name || 'LL-01',
    level: player.level || 1,
    maxHp: 100 + ((player.level || 1) - 1) * 5,
    gold: player.gold ?? 50,
    wins: player.wins || 0
  };

  const fullList = [...baseRoster, playerEntry];
  fullList.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.level !== a.level) return b.level - a.level;
    return b.gold - a.gold;
  });

  let playerRank = 1;
  fullList.forEach((item, idx) => {
    item.rank = idx + 1;
    if (item.isCurrentPlayer) {
      playerRank = item.rank;
    }
  });

  try {
    localStorage.setItem('limsus_leaderboard', JSON.stringify(fullList));
  } catch (e) {}

  container.innerHTML = fullList.map(item => {
    const rankClass = item.rank === 1 ? 'rank-1' : item.rank === 2 ? 'rank-2' : item.rank === 3 ? 'rank-3' : '';
    return `
      <div class="leaderboard-row ${item.isCurrentPlayer ? 'is-current-player' : ''}">
        <span class="col-rank ${rankClass}">#${item.rank}</span>
        <span class="col-name">${item.name} ${item.isCurrentPlayer ? '<span class="you-tag">YOU</span>' : ''}</span>
        <span class="col-level">Lv.${item.level}</span>
        <span class="col-hp">${item.maxHp} HP</span>
        <span class="col-gold">${item.gold}G</span>
        <span class="col-wins">${item.wins} Wins</span>
      </div>
    `;
  }).join('');

  if (rankStatusEl) {
    rankStatusEl.textContent = `Your Rank: #${playerRank} | ${player.name} (Lv.${player.level} • Max HP: ${player.maxHp})`;
  }
}

export function updateMenuPlayerDisplay(playerData) {
  const data = playerData || getStoredPlayerData();
  const display = document.getElementById('menu-player-name-display');
  if (display) {
    display.textContent = `Player: ${data.name || 'LL-01'} (Lv.${data.level || 1})`;
  }
}

export function openProfileModal() {
  sound.init();
  sound.playClick();
  const modal = document.getElementById('profile-modal');
  if (!modal) return;

  const data = getStoredPlayerData();
  const nameInput = document.getElementById('profile-name-input');
  if (nameInput) {
    nameInput.value = data.name || 'LL-01';
  }

  const statLevel = document.getElementById('prof-stat-level');
  if (statLevel) statLevel.textContent = `Lv. ${data.level || 1}`;

  const statHp = document.getElementById('prof-stat-hp');
  if (statHp) statHp.textContent = `${data.maxHp || 100}`;

  const statGold = document.getElementById('prof-stat-gold');
  if (statGold) statGold.textContent = `${data.gold ?? 50}G`;

  const statWins = document.getElementById('prof-stat-wins');
  if (statWins) statWins.textContent = `${data.wins || 0}`;

  updateGoogleUI(data);

  modal.classList.remove('hidden');

  if (nameInput) {
    setTimeout(() => {
      nameInput.focus();
      nameInput.select();
    }, 80);
  }
}

export function closeProfileModal() {
  sound.playBack();
  const modal = document.getElementById('profile-modal');
  if (modal) modal.classList.add('hidden');
}

export function savePlayerName(rawName) {
  if (!rawName || !rawName.trim()) {
    alert('Please enter a valid player name.');
    return;
  }
  const cleanName = rawName.trim().slice(0, 16);
  const data = getStoredPlayerData();
  data.name = cleanName;
  saveStoredPlayerData(data);

  updateMenuPlayerDisplay(data);
  updateAndRenderLeaderboard(data);

  if (window.game) {
    window.game.player.name = cleanName;
    window.game.updateHUD();
    window.game.showToast(`Player name set to "${cleanName}"!`, '#10b981');
  }

  const nameInput = document.getElementById('profile-name-input');
  if (nameInput) nameInput.value = cleanName;

  sound.playShopBuy();
  closeProfileModal();
}

export function initProfileModal() {
  const btnClose = document.getElementById('btn-close-profile');
  if (btnClose) {
    btnClose.onclick = () => closeProfileModal();
  }

  const modal = document.getElementById('profile-modal');
  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) closeProfileModal();
    };
  }

  const btnSave = document.getElementById('btn-save-name');
  const nameInput = document.getElementById('profile-name-input');
  if (btnSave && nameInput) {
    btnSave.onclick = () => savePlayerName(nameInput.value);
    nameInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        savePlayerName(nameInput.value);
      }
    };
  }

  const btnMenuEdit = document.getElementById('btn-menu-edit-name');
  if (btnMenuEdit) {
    btnMenuEdit.onclick = () => openProfileModal();
  }

  const googleLoginBtn = document.getElementById('btn-google-login-action');
  if (googleLoginBtn) {
    googleLoginBtn.onclick = () => {
      sound.playClick();
      performGoogleLogin((data) => {
        if (window.game) {
          window.game.loadPlayerData();
          window.game.updateHUD();
          window.game.updateLeaderboardWithPlayer();
        }
      });
    };
  }

  const googleSignoutBtn = document.getElementById('btn-google-signout');
  if (googleSignoutBtn) {
    googleSignoutBtn.onclick = () => {
      sound.playBack();
      performGoogleSignOut((data) => {
        if (window.game) {
          window.game.loadPlayerData();
          window.game.updateHUD();
        }
      });
    };
  }
}

// ============================================
// MENU SYSTEM
// ============================================
class MenuSystem {
  constructor(onPlay, bgmController) {
    this.onPlay = onPlay;
    this.bgmController = bgmController;
    this.menuEl = document.getElementById('main-menu');
    this.optionsEl = document.getElementById('options-screen');
    this.creditsEl = document.getElementById('credits-screen');
    this.instructionsEl = document.getElementById('instructions-screen');
    this.leaderboardEl = document.getElementById('leaderboard-screen');
    this.gameWorldEl = document.getElementById('game-world');

    // Settings
    this.musicVolume = 0.6;
    this.sfxVolume = 0.8;
    this.screenShake = true;
    this.starsEnabled = true;
    this.crtMode = false;

    // Navigation buttons (Play, Leaderboard, Options, Instructions, Credits)
    this.menuButtons = [
      document.getElementById('btn-menu-play'),
      document.getElementById('btn-menu-leaderboard'),
      document.getElementById('btn-menu-options'),
      document.getElementById('btn-menu-instructions'),
      document.getElementById('btn-menu-credits')
    ].filter(Boolean);
    this.selectedIndex = 0;

    // Starfield Background
    this.starfield = new Starfield('menu-stars-canvas');

    this.setupMenuListeners();
    this.setupOptionsControls();
    this.startBGM();

    // Initialize UI
    const saved = getStoredPlayerData();
    updateGoogleUI(saved);
    updateAndRenderLeaderboard(saved);
  }

  startBGM() {
    if (this.bgmController) {
      this.bgmController.playMenu();
    }

    const firstInteract = () => {
      if (this.bgmController && this.bgmController.currentTrack === 'menu') {
        this.bgmController.playMenu();
      }
      document.removeEventListener('click', firstInteract);
      document.removeEventListener('keydown', firstInteract);
    };
    document.addEventListener('click', firstInteract);
    document.addEventListener('keydown', firstInteract);
  }

  updateSelection(newIndex, playSfx = true) {
    if (!this.menuButtons.length) return;
    this.selectedIndex = (newIndex + this.menuButtons.length) % this.menuButtons.length;
    this.menuButtons.forEach((btn, idx) => {
      const isSelected = idx === this.selectedIndex;
      btn.classList.toggle('selected', isSelected);
      const dots = btn.querySelectorAll('.btn-dot');
      dots.forEach(d => d.style.opacity = isSelected ? '1' : '0');
    });
    if (playSfx) sound.playHover();
  }

  setupMenuListeners() {
    // Mouse hover updates selection
    this.menuButtons.forEach((btn, idx) => {
      btn.addEventListener('mouseenter', () => {
        if (this.selectedIndex !== idx) {
          this.updateSelection(idx, true);
        }
      });
    });

    // PLAY button
    const playBtn = document.getElementById('btn-menu-play');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        sound.init();
        sound.playStartGame();
        this.transitionToGame();
      });
    }

    // LEADERBOARD button
    const leaderboardBtn = document.getElementById('btn-menu-leaderboard');
    if (leaderboardBtn) {
      leaderboardBtn.addEventListener('click', () => {
        sound.init();
        sound.playClick();
        updateAndRenderLeaderboard();
        if (this.leaderboardEl) this.leaderboardEl.classList.remove('hidden');
      });
    }

    const leaderboardBackBtn = document.getElementById('btn-leaderboard-back');
    if (leaderboardBackBtn) {
      leaderboardBackBtn.addEventListener('click', () => {
        sound.playBack();
        if (this.leaderboardEl) this.leaderboardEl.classList.add('hidden');
      });
    }

    const resetStatsBtn = document.getElementById('btn-reset-leaderboard');
    if (resetStatsBtn) {
      resetStatsBtn.addEventListener('click', () => {
        if (confirm('Reset player stats and leaderboard to default?')) {
          localStorage.removeItem('limsus_player_data');
          localStorage.removeItem('limsus_leaderboard');
          const fresh = getStoredPlayerData();
          updateGoogleUI(fresh);
          updateMenuPlayerDisplay(fresh);
          updateAndRenderLeaderboard(fresh);
          if (window.game) {
            window.game.loadPlayerData();
            window.game.updateHUD();
          }
          sound.playShopBuy();
        }
      });
    }

    // GOOGLE Login button on menu
    const menuGoogleBtn = document.getElementById('btn-menu-google');
    if (menuGoogleBtn) {
      menuGoogleBtn.addEventListener('click', () => {
        sound.playClick();
        performGoogleLogin();
      });
    }

    // OPTIONS button
    const optionsBtn = document.getElementById('btn-menu-options');
    if (optionsBtn) {
      optionsBtn.addEventListener('click', () => {
        sound.init();
        sound.playClick();
        this.optionsEl.classList.remove('hidden');
      });
    }

    const optionsBackBtn = document.getElementById('btn-options-back');
    if (optionsBackBtn) {
      optionsBackBtn.addEventListener('click', () => {
        sound.playBack();
        this.optionsEl.classList.add('hidden');
      });
    }

    // INSTRUCTIONS button
    const instructionsBtn = document.getElementById('btn-menu-instructions');
    if (instructionsBtn) {
      instructionsBtn.addEventListener('click', () => {
        sound.init();
        sound.playClick();
        if (this.instructionsEl) this.instructionsEl.classList.remove('hidden');
      });
    }

    const instructionsBackBtn = document.getElementById('btn-instructions-back');
    if (instructionsBackBtn) {
      instructionsBackBtn.addEventListener('click', () => {
        sound.playBack();
        if (this.instructionsEl) this.instructionsEl.classList.add('hidden');
      });
    }

    // CREDITS button
    const creditsBtn = document.getElementById('btn-menu-credits');
    if (creditsBtn) {
      creditsBtn.addEventListener('click', () => {
        sound.init();
        sound.playClick();
        this.creditsEl.classList.remove('hidden');
      });
    }

    const creditsBackBtn = document.getElementById('btn-credits-back');
    if (creditsBackBtn) {
      creditsBackBtn.addEventListener('click', () => {
        sound.playBack();
        this.creditsEl.classList.add('hidden');
      });
    }

    // Keyboard navigation (Arrow keys, W/S, Enter, Space, Escape)
    window.addEventListener('keydown', (e) => {
      if (!this.menuEl || this.menuEl.classList.contains('hidden')) return;

      const anySubmenuOpen = 
        (this.optionsEl && !this.optionsEl.classList.contains('hidden')) ||
        (this.creditsEl && !this.creditsEl.classList.contains('hidden')) ||
        (this.instructionsEl && !this.instructionsEl.classList.contains('hidden')) ||
        (this.leaderboardEl && !this.leaderboardEl.classList.contains('hidden'));

      if (anySubmenuOpen) {
        if (e.key === 'Escape') {
          if (this.optionsEl) this.optionsEl.classList.add('hidden');
          if (this.creditsEl) this.creditsEl.classList.add('hidden');
          if (this.instructionsEl) this.instructionsEl.classList.add('hidden');
          if (this.leaderboardEl) this.leaderboardEl.classList.add('hidden');
          sound.playBack();
        }
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        sound.init();
        this.updateSelection(this.selectedIndex - 1, true);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        sound.init();
        this.updateSelection(this.selectedIndex + 1, true);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sound.init();
        const activeBtn = this.menuButtons[this.selectedIndex];
        if (activeBtn) activeBtn.click();
      }
    });

    this.updateSelection(0, false);
  }

  setupOptionsControls() {
    // Music Volume slider
    const musicSlider = document.getElementById('opt-music-vol');
    const musicVal = document.getElementById('opt-music-vol-val');
    if (musicSlider && musicVal) {
      musicSlider.addEventListener('input', (e) => {
        this.musicVolume = parseInt(e.target.value) / 100;
        musicVal.textContent = `${e.target.value}%`;
        if (this.bgmController) {
          this.bgmController.setVolume(this.musicVolume);
        }
      });
    }

    // SFX Volume slider
    const sfxSlider = document.getElementById('opt-sfx-vol');
    const sfxVal = document.getElementById('opt-sfx-vol-val');
    if (sfxSlider && sfxVal) {
      sfxSlider.addEventListener('input', (e) => {
        this.sfxVolume = parseInt(e.target.value) / 100;
        sfxVal.textContent = `${e.target.value}%`;
        sound.setSFXVolume(this.sfxVolume);
      });
    }

    // Mute Toggle (Unified master toggle)
    const muteBtn = document.getElementById('opt-mute-toggle');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (this.bgmController) {
          this.bgmController.toggleMute();
        }
        sound.playClick();
      });
    }

    // CRT Scanlines Toggle
    const crtBtn = document.getElementById('opt-crt-toggle');
    const gameApp = document.getElementById('game-app');
    if (crtBtn) {
      crtBtn.addEventListener('click', () => {
        this.crtMode = !this.crtMode;
        crtBtn.textContent = this.crtMode ? 'ON' : 'OFF';
        crtBtn.classList.toggle('active', this.crtMode);
        if (gameApp) gameApp.classList.toggle('crt-mode', this.crtMode);
        sound.playClick();
      });
    }

    // Screen Shake
    const shakeBtn = document.getElementById('opt-shake-toggle');
    if (shakeBtn) {
      shakeBtn.addEventListener('click', () => {
        this.screenShake = !this.screenShake;
        shakeBtn.textContent = this.screenShake ? 'ON' : 'OFF';
        shakeBtn.classList.toggle('active', this.screenShake);
        sound.playClick();
      });
    }

    // Pixel Stars Animation Toggle
    const particlesBtn = document.getElementById('opt-particles-toggle');
    if (particlesBtn) {
      particlesBtn.addEventListener('click', () => {
        this.starsEnabled = !this.starsEnabled;
        particlesBtn.textContent = this.starsEnabled ? 'ON' : 'OFF';
        particlesBtn.classList.toggle('active', this.starsEnabled);
        if (this.starfield) {
          this.starfield.active = this.starsEnabled;
          if (this.starsEnabled) {
            this.starfield.resume();
          } else {
            this.starfield.stop();
            if (this.starfield.ctx) {
              this.starfield.ctx.fillStyle = '#000000';
              this.starfield.ctx.fillRect(0, 0, this.starfield.canvas.width, this.starfield.canvas.height);
            }
          }
        }
        sound.playClick();
      });
    }
  }

  transitionToGame() {
    this.menuEl.classList.add('menu-fade-out');

    setTimeout(() => {
      this.menuEl.classList.add('hidden');
      this.gameWorldEl.classList.remove('hidden');
      this.gameWorldEl.classList.add('game-world-entering');

      // Start peaceful Overworld exploration music (Chill Guy Theme)
      if (this.bgmController) {
        this.bgmController.playOverworld();
      }

      setTimeout(() => {
        this.gameWorldEl.classList.remove('game-world-entering');
      }, 700);

      // Start the game engine
      if (this.onPlay) this.onPlay();
    }, 500);
  }

  // Return to menu
  returnToMenu() {
    this.gameWorldEl.classList.add('hidden');
    this.menuEl.classList.remove('hidden', 'menu-fade-out');
    if (this.bgmController) {
      this.bgmController.playMenu();
    }
    if (this.starfield && this.starsEnabled) {
      this.starfield.resume();
    }
  }
}


// ============================================
// GAME ENGINE
// ============================================
class Game {
  constructor(menuSystem) {
    this.menu = menuSystem;
    this.bgmController = (menuSystem && menuSystem.bgmController) ? menuSystem.bgmController : window.bgmController;
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // World map dimensions (from world.jfif)
    this.MAP_WIDTH = 1372;
    this.MAP_HEIGHT = 784;

    // Spawn & Interactive Coordinates
    this.SPAWN_POINT = { x: 1322, y: 374, name: 'Flame Rift (Spawn)' };
    this.SHOP_POINT = { x: 687, y: 705, radius: 65, name: 'Mystic Pond Shop' };

    // 3 Yellow NPC Challengers (Ronin Kai, Brawler Ignis, The Red Mist)
    this.npcs = ENEMIES;

    // Skills Database
    this.skillData = SKILL_DATA;

    // Preload NPC and Shopkeeper models
    this.modelImages = {
      'ronin': new Image(),
      'brawler': new Image(),
      'redmist': new Image(),
      'shopkeeper': new Image()
    };
    this.modelImages['ronin'].src = './assets/fcbfb356-878c-4e42-8d25-935fdc930e82.jfif';
    this.modelImages['brawler'].src = './assets/brawler.jfif';
    this.modelImages['redmist'].src = './assets/redmist.jfif';
    this.modelImages['shopkeeper'].src = './assets/shopkeeper.png';

    // User Profile
    this.userProfile = {
      isGoogleAuth: false,
      googleEmail: '',
      googleName: ''
    };

    // Player State (Starts at Level 1, 100 HP, +5 Max HP per level)
    this.player = {
      x: this.SPAWN_POINT.x,
      y: this.SPAWN_POINT.y,
      vx: 0,
      vy: 0,
      speed: 3.8,
      name: 'LL-01',
      level: 1,
      hp: 100,
      maxHp: 100,
      gold: 50,
      potions: 2,
      wins: 0,
      skills: ['punch', 'kick'],
      facing: 'left',
      isMoving: false,
      stepTimer: 0
    };

    this.loadPlayerData();

    // Target position for click-to-move
    this.targetX = this.player.x;
    this.targetY = this.player.y;
    this.hasTarget = false;

    // Camera
    this.camera = {
      x: this.player.x,
      y: this.player.y,
      scale: 1.0
    };

    // Input
    this.keys = {};
    this.activePrompt = null; // Current nearby interactable

    // Images
    this.mapImg = new Image();
    this.mapImg.src = './assets/world.jfif';
    this.mapImg.onerror = () => {
      this.mapImg.src = './assets/world.jpg';
    };

    this.playerImg = new Image();
    this.playerImg.src = './assets/LL.png';

    // Combat Subsystem
    this.combat = new CombatEngine(this);

    // Particles on map (healing, dust, water ripples)
    this.particles = [];

    // Collision Detection & Solid Obstacle System
    window.game = this;
    this.showCollisionDebug = false;
    this.initColliders();

    this.init();
  }

  initColliders() {
    this.colliders = [
      // ==========================================
      // 1. CASTLE & NORTH KEEP
      // ==========================================
      { type: 'rect', x: 605, y: 0, w: 140, h: 92, label: 'Castle Keep' },

      // ==========================================
      // 2. ANCIENT OAKS (Trunk Bases)
      // ==========================================
      { type: 'circle', x: 535, y: 175, r: 30, label: 'Tree Ancient Oak 1' },
      { type: 'circle', x: 792, y: 200, r: 32, label: 'Tree Ancient Oak 2' },

      // ==========================================
      // 3. GREEN TREES (Trunk / Base Colliders)
      // ==========================================
      // North / Top
      { type: 'circle', x: 375, y: 72, r: 24, label: 'Tree' },
      { type: 'circle', x: 505, y: 50, r: 24, label: 'Tree' },
      { type: 'circle', x: 840, y: 48, r: 24, label: 'Tree' },
      { type: 'circle', x: 1040, y: 68, r: 25, label: 'Tree' },
      { type: 'circle', x: 1115, y: 125, r: 20, label: 'Tree' },
      { type: 'circle', x: 1195, y: 65, r: 25, label: 'Tree' },

      // Mid-Left (above Shinobi Ren path)
      { type: 'circle', x: 290, y: 495, r: 25, label: 'Tree' },
      { type: 'circle', x: 410, y: 395, r: 22, label: 'Tree' },
      { type: 'circle', x: 475, y: 530, r: 22, label: 'Tree' },
      { type: 'circle', x: 365, y: 605, r: 20, label: 'Tree' },

      // Center Grass Island (between split paths)
      { type: 'circle', x: 675, y: 475, r: 24, label: 'Tree' },
      { type: 'circle', x: 585, y: 520, r: 24, label: 'Tree' },
      { type: 'circle', x: 675, y: 565, r: 24, label: 'Tree' },

      // Mid-Right (east of center)
      { type: 'circle', x: 875, y: 275, r: 24, label: 'Tree' },
      { type: 'circle', x: 965, y: 460, r: 24, label: 'Tree' },
      { type: 'circle', x: 1045, y: 485, r: 24, label: 'Tree' },

      // South-Left & Shinobi area
      { type: 'circle', x: 250, y: 745, r: 35, label: 'Tree Big BL' },
      { type: 'circle', x: 170, y: 740, r: 30, label: 'Tree BL' },
      { type: 'circle', x: 420, y: 610, r: 24, label: 'Tree' },
      { type: 'circle', x: 470, y: 720, r: 24, label: 'Tree' },

      // South-Center (around Mystic Pond)
      { type: 'circle', x: 535, y: 575, r: 24, label: 'Tree' },
      { type: 'circle', x: 600, y: 660, r: 22, label: 'Tree' },
      { type: 'circle', x: 630, y: 590, r: 24, label: 'Tree' },
      { type: 'circle', x: 680, y: 645, r: 22, label: 'Tree' },

      // South-Right (Forest Cluster near Ignis)
      { type: 'circle', x: 1090, y: 730, r: 30, label: 'Tree' },
      { type: 'circle', x: 1180, y: 735, r: 30, label: 'Tree' },
      { type: 'circle', x: 1250, y: 720, r: 28, label: 'Tree' },
      { type: 'circle', x: 1290, y: 740, r: 28, label: 'Tree' },
      { type: 'circle', x: 1200, y: 645, r: 24, label: 'Tree' },
      { type: 'circle', x: 1260, y: 660, r: 24, label: 'Tree' },
      { type: 'circle', x: 1320, y: 665, r: 24, label: 'Tree' },
      { type: 'circle', x: 1345, y: 735, r: 26, label: 'Tree' },

      // ==========================================
      // 4. DARK SWAMP / RUINS TREES & ARCHES (West)
      // ==========================================
      { type: 'circle', x: 35, y: 90, r: 28, label: 'Tree Dark' },
      { type: 'circle', x: 95, y: 130, r: 28, label: 'Arch Ruins TL' },
      { type: 'circle', x: 105, y: 60, r: 26, label: 'Tree Dark' },
      { type: 'circle', x: 170, y: 70, r: 26, label: 'Tree Dark' },
      { type: 'circle', x: 220, y: 160, r: 28, label: 'Tree Dark' },
      { type: 'circle', x: 35, y: 340, r: 28, label: 'Arch Ruins W' },
      { type: 'circle', x: 50, y: 560, r: 30, label: 'Tree Dark Dead' },
      { type: 'circle', x: 140, y: 440, r: 26, label: 'Tree Dead Vines' },
      { type: 'circle', x: 150, y: 700, r: 28, label: 'Tree Dark BL' },
      { type: 'circle', x: 80, y: 720, r: 30, label: 'Tree Dark BL' },
      { type: 'circle', x: 35, y: 750, r: 32, label: 'Tree Dark BL' },

      // ==========================================
      // 5. ROCKS & BOULDERS (Solid Ground Obstacles)
      // ==========================================
      // Top-Left & West
      { type: 'circle', x: 466, y: 63, r: 15, label: 'Rock' },
      { type: 'circle', x: 340, y: 250, r: 22, label: 'Rock' },
      { type: 'circle', x: 385, y: 403, r: 12, label: 'Rock' },
      { type: 'circle', x: 280, y: 475, r: 26, label: 'Rock Big SW' },
      { type: 'circle', x: 141, y: 655, r: 16, label: 'Rock' },
      { type: 'circle', x: 299, y: 270, r: 16, label: 'Rock' },
      { type: 'circle', x: 169, y: 314, r: 14, label: 'Rock' },

      // Center Rocks
      { type: 'circle', x: 630, y: 344, r: 16, label: 'Rock' },
      { type: 'circle', x: 760, y: 445, r: 12, label: 'Rock' },
      { type: 'circle', x: 637, y: 540, r: 14, label: 'Rock' },
      { type: 'circle', x: 760, y: 518, r: 14, label: 'Rock' },
      { type: 'circle', x: 667, y: 563, r: 12, label: 'Rock' },

      // River & East Rocks
      { type: 'circle', x: 816, y: 254, r: 14, label: 'Rock' },
      { type: 'circle', x: 936, y: 246, r: 14, label: 'Rock' },
      { type: 'circle', x: 975, y: 325, r: 13, label: 'Rock' },
      { type: 'circle', x: 1055, y: 286, r: 16, label: 'Rock' },
      { type: 'circle', x: 1024, y: 439, r: 16, label: 'Rock' },
      { type: 'circle', x: 1085, y: 535, r: 15, label: 'Rock' },
      { type: 'circle', x: 980, y: 715, r: 14, label: 'Rock' },
      { type: 'circle', x: 1055, y: 660, r: 14, label: 'Rock' },

      // Volcano & Mountain Rocks (Right)
      { type: 'circle', x: 1222, y: 133, r: 26, label: 'Rock Volcano' },
      { type: 'circle', x: 1213, y: 303, r: 22, label: 'Rock Volcano' },
      { type: 'circle', x: 1270, y: 320, r: 20, label: 'Rock Volcano' },
      { type: 'circle', x: 1250, y: 440, r: 20, label: 'Rock Volcano' },
      { type: 'circle', x: 1270, y: 470, r: 22, label: 'Rock Volcano' },
      { type: 'circle', x: 1175, y: 540, r: 18, label: 'Rock Crag' },
      { type: 'circle', x: 1201, y: 630, r: 18, label: 'Rock' },
      { type: 'circle', x: 1240, y: 696, r: 20, label: 'Rock' },

      // Pond & South Rocks
      { type: 'circle', x: 408, y: 669, r: 22, label: 'Rock Pond Left' },
      { type: 'circle', x: 618, y: 706, r: 15, label: 'Rock Pond Shroom' },
      { type: 'circle', x: 907, y: 725, r: 22, label: 'Rock Pond Right' },

      // ==========================================
      // 6. WATER & NATURAL HAZARDS
      // ==========================================
      // River North of Bridge (Bridge at y: 88..135, x: 800..999)
      { type: 'circle', x: 915, y: 35, r: 30, label: 'River North' },
      { type: 'circle', x: 940, y: 60, r: 24, label: 'River North' },
      // River South of Bridge
      { type: 'circle', x: 920, y: 178, r: 28, label: 'River South' },
      { type: 'circle', x: 965, y: 195, r: 32, label: 'River South' },
      { type: 'circle', x: 1025, y: 235, r: 35, label: 'River South' },

      // Pond Water Banks (Leaves the Mystic Shop platform at 687, 705 accessible)
      { type: 'circle', x: 490, y: 730, r: 50, label: 'Pond Water' },
      { type: 'circle', x: 565, y: 745, r: 40, label: 'Pond Water' },
      { type: 'circle', x: 805, y: 735, r: 48, label: 'Pond Water' },
      { type: 'circle', x: 865, y: 750, r: 36, label: 'Pond Water' },

      // Volcano Peak
      { type: 'circle', x: 1300, y: 70, r: 75, label: 'Volcano Peak' },
      { type: 'circle', x: 1335, y: 130, r: 55, label: 'Volcano Crater' }
    ];
  }

  canMoveTo(newX, newY) {
    // Map bounds check
    if (newX < 25 || newX > this.MAP_WIDTH - 25) return false;
    if (newY < 25 || newY > this.MAP_HEIGHT - 25) return false;

    // Player collision circle at feet
    const feetX = newX;
    const feetY = newY + 16;
    const pr = 12;

    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      if (c.type === 'circle') {
        const dx = feetX - c.x;
        const dy = feetY - c.y;
        const minDist = pr + c.r;
        if (dx * dx + dy * dy < minDist * minDist) {
          return false;
        }
      } else if (c.type === 'rect') {
        const cx = Math.max(c.x, Math.min(feetX, c.x + c.w));
        const cy = Math.max(c.y, Math.min(feetY, c.y + c.h));
        const dx = feetX - cx;
        const dy = feetY - cy;
        if (dx * dx + dy * dy < pr * pr) {
          return false;
        }
      }
    }
    return true;
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.setupInputs();
    this.setupModals();
    this.updateHUD();

    // Start Game Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupInputs() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      // Interaction key [E] or Space
      if ((e.key.toLowerCase() === 'e' || e.key === ' ') && !this.combat.inBattle) {
        this.triggerInteraction();
      }

      // Collision Debug Overlay Toggle [Shift + C]
      if (e.shiftKey && e.key.toLowerCase() === 'c') {
        this.showCollisionDebug = !this.showCollisionDebug;
        this.showToast(this.showCollisionDebug ? 'Collision Hitboxes: ON' : 'Collision Hitboxes: OFF');
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Mouse / Touch click-to-move on map
    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.combat.inBattle) return;
      sound.init();

      // Convert screen coords to world coords
      const rect = this.canvas.getBoundingClientRect();
      const clickScreenX = e.clientX - rect.left;
      const clickScreenY = e.clientY - rect.top;

      const worldX = (clickScreenX - this.canvas.width / 2) / this.camera.scale + this.camera.x;
      const worldY = (clickScreenY - this.canvas.height / 2) / this.camera.scale + this.camera.y;

      this.targetX = Math.max(30, Math.min(this.MAP_WIDTH - 30, worldX));
      this.targetY = Math.max(30, Math.min(this.MAP_HEIGHT - 30, worldY));
      this.hasTarget = true;

      // Spawn click ripple
      this.createClickVFX(this.targetX, this.targetY);

      // Check if user clicked directly on an NPC or Shop
      this.checkDirectClick(worldX, worldY);
    });

    // Touch D-Pad buttons
    const dpadButtons = document.querySelectorAll('.dpad-btn');
    dpadButtons.forEach(btn => {
      const dir = btn.dataset.dir;
      const setKey = (val) => {
        if (dir === 'up') this.keys['w'] = val;
        if (dir === 'down') this.keys['s'] = val;
        if (dir === 'left') this.keys['a'] = val;
        if (dir === 'right') this.keys['d'] = val;
      };
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); setKey(true); });
      btn.addEventListener('pointerup', () => setKey(false));
      btn.addEventListener('pointerleave', () => setKey(false));
    });

    // Action button on HUD
    document.getElementById('mobile-interact-btn').addEventListener('click', () => {
      this.triggerInteraction();
    });

    // Sound toggle (Unified BGM + SFX mute toggle)
    const soundToggleBtn = document.getElementById('btn-sound-toggle');
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        if (this.bgmController) {
          this.bgmController.toggleMute();
        }
      });
    }

    // Profile Modal Toggle & Avatar click
    const hudProfileBtn = document.getElementById('btn-hud-profile');
    if (hudProfileBtn) hudProfileBtn.addEventListener('click', () => openProfileModal());

    const hudAvatarBox = document.getElementById('hud-avatar-box');
    if (hudAvatarBox) hudAvatarBox.addEventListener('click', () => openProfileModal());

    const hudPlayerName = document.getElementById('hud-player-name');
    if (hudPlayerName) {
      hudPlayerName.style.cursor = 'pointer';
      hudPlayerName.title = 'Click to change name';
      hudPlayerName.addEventListener('click', () => openProfileModal());
    }

    // Name change edit button on HUD
    const editNameBtn = document.getElementById('btn-edit-name');
    if (editNameBtn) {
      editNameBtn.addEventListener('click', () => openProfileModal());
    }

    // Leaderboard HUD Button
    const hudLeaderboardBtn = document.getElementById('btn-hud-leaderboard');
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    if (hudLeaderboardBtn && leaderboardScreen) {
      hudLeaderboardBtn.addEventListener('click', () => {
        sound.playClick();
        this.updateLeaderboardWithPlayer();
        leaderboardScreen.classList.remove('hidden');
      });
    }

    // Help modal toggle
    document.getElementById('btn-help-toggle').addEventListener('click', () => {
      sound.playClick();
      document.getElementById('help-modal').classList.remove('hidden');
    });

    document.getElementById('btn-close-help').addEventListener('click', () => {
      sound.playClick();
      document.getElementById('help-modal').classList.add('hidden');
    });

    // Back to menu button
    document.getElementById('btn-back-to-menu').addEventListener('click', () => {
      sound.playClick();
      if (this.menu) {
        this.menu.returnToMenu();
      }
    });
  }

  loadPlayerData() {
    const data = getStoredPlayerData();
    this.player.name = data.name || 'LL-01';
    this.player.level = Math.max(1, parseInt(data.level) || 1);
    this.player.maxHp = 100 + (this.player.level - 1) * 5;
    this.player.hp = Math.min(this.player.maxHp, parseInt(data.hp) || this.player.maxHp);
    this.player.gold = typeof data.gold === 'number' ? data.gold : 50;
    this.player.potions = typeof data.potions === 'number' ? data.potions : 2;
    this.player.wins = parseInt(data.wins) || 0;
    if (Array.isArray(data.skills) && data.skills.length > 0) {
      this.player.skills = data.skills;
    }
    this.userProfile.isGoogleAuth = !!data.isGoogleAuth;
    this.userProfile.googleEmail = data.googleEmail || '';
    this.userProfile.googleName = data.googleName || '';
  }

  savePlayerData() {
    this.player.maxHp = 100 + ((this.player.level || 1) - 1) * 5;
    const saveObj = {
      name: this.player.name || 'LL-01',
      level: this.player.level || 1,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      gold: this.player.gold,
      potions: this.player.potions,
      wins: this.player.wins || 0,
      skills: this.player.skills,
      isGoogleAuth: this.userProfile.isGoogleAuth,
      googleEmail: this.userProfile.googleEmail,
      googleName: this.userProfile.googleName
    };
    saveStoredPlayerData(saveObj);
  }

  updateLeaderboardWithPlayer() {
    updateAndRenderLeaderboard({
      name: this.player.name,
      level: this.player.level,
      maxHp: this.player.maxHp,
      gold: this.player.gold,
      wins: this.player.wins
    });
  }

  changePlayerName(newName) {
    savePlayerName(newName);
  }

  setupModals() {
    // Mystic Pond Shop Modal
    document.getElementById('btn-close-shop').addEventListener('click', () => {
      sound.playClick();
      document.getElementById('shop-modal').classList.add('hidden');
    });

    // Buy Skills from shop
    const skillShopButtons = [
      { id: 'btn-buy-charge', skill: 'charge' },
      { id: 'btn-buy-flame', skill: 'flame_burst' },
      { id: 'btn-buy-coffin', skill: 'coffin_throw' },
      { id: 'btn-buy-sword', skill: 'sword_swing' },
      { id: 'btn-buy-slay', skill: 'slay' }
    ];

    skillShopButtons.forEach(item => {
      const btn = document.getElementById(item.id);
      if (btn) {
        btn.addEventListener('click', () => {
          this.buySkill(item.skill);
        });
      }
    });

    // Buy Potion (10g)
    document.getElementById('btn-buy-potion').addEventListener('click', () => {
      this.buyPotion();
    });

    // Free Pond Healing
    document.getElementById('btn-pond-rest').addEventListener('click', () => {
      this.pondRest();
    });

    // NPC Challenge Dialogue Modal
    document.getElementById('btn-challenge-fight').addEventListener('click', () => {
      sound.playClick();
      const modal = document.getElementById('challenge-modal');
      const npcId = modal.dataset.npcId;
      modal.classList.add('hidden');
      const targetNPC = this.npcs.find(n => n.id === npcId);
      if (targetNPC) {
        // Play specific character battle music
        if (this.bgmController) {
          this.bgmController.playBattle(targetNPC);
        }
        this.combat.startBattle(targetNPC);
      }
    });

    document.getElementById('btn-challenge-cancel').addEventListener('click', () => {
      sound.playClick();
      document.getElementById('challenge-modal').classList.add('hidden');
    });
  }

  buySkill(skillId) {
    const skill = this.skillData[skillId];
    if (!skill) return;

    if (this.player.skills.includes(skillId)) {
      this.showToast(`Already learned ${skill.name}!`, '#f59e0b');
      return;
    }

    if (this.player.gold < skill.price) {
      sound.playCoinTails();
      this.showToast(`Not enough gold! Need ${skill.price}G`, '#ef4444');
      return;
    }

    this.player.gold -= skill.price;
    this.player.skills.push(skillId);
    sound.playShopBuy();
    this.updateHUD();
    this.updateShopButtons();
    this.showToast(`Unlocked Skill: ${skill.name}! (🪙 ${skill.coins} Coins, 💥 ${skill.dmg} DMG)`, '#10b981');
  }

  buyPotion() {
    const cost = 10;
    if (this.player.gold < cost) {
      sound.playCoinTails();
      this.showToast(`Not enough gold for Potion! Need ${cost}G`, '#ef4444');
      return;
    }
    this.player.gold -= cost;
    this.player.potions++;
    sound.playShopBuy();
    this.updateHUD();
    this.showToast(`Purchased Vitality Potion! (Total: ${this.player.potions})`, '#10b981');
  }

  pondRest() {
    this.player.hp = this.player.maxHp;
    sound.playHeal();
    this.updateHUD();
    this.showToast('Purified in the Mystic Spring! HP fully restored!', '#06b6d4');
  }

  updateShopButtons() {
    const skillBtnMap = {
      'charge': { id: 'btn-buy-charge', price: 20 },
      'flame_burst': { id: 'btn-buy-flame', price: 35 },
      'coffin_throw': { id: 'btn-buy-coffin', price: 35 },
      'sword_swing': { id: 'btn-buy-sword', price: 30 },
      'slay': { id: 'btn-buy-slay', price: 50 }
    };

    Object.entries(skillBtnMap).forEach(([sId, cfg]) => {
      const btn = document.getElementById(cfg.id);
      if (!btn) return;
      if (this.player.skills.includes(sId)) {
        btn.textContent = 'ACQUIRED ✓';
        btn.disabled = true;
        btn.classList.add('btn-owned');
      } else {
        btn.textContent = `BUY (${cfg.price}G)`;
        btn.disabled = false;
        btn.classList.remove('btn-owned');
      }
    });
  }

  openShop() {
    sound.playClick();
    this.updateShopButtons();
    document.getElementById('shop-gold-amount').textContent = `${this.player.gold}G`;
    document.getElementById('shop-modal').classList.remove('hidden');
  }

  openChallengePrompt(npc) {
    sound.playClick();
    const modal = document.getElementById('challenge-modal');
    modal.dataset.npcId = npc.id;
    document.getElementById('challenge-npc-name').textContent = npc.name;
    document.getElementById('challenge-npc-title').textContent = npc.title;
    document.getElementById('challenge-npc-dialogue').textContent = `"${npc.dialogue}"`;

    const avatarImg = document.getElementById('challenge-npc-avatar');
    if (avatarImg) {
      avatarImg.src = npc.modelImage;
    }

    const themeEl = document.getElementById('challenge-npc-theme');
    if (themeEl) {
      themeEl.textContent = npc.themeTitle || 'Arena Theme';
    }

    const skillList = (npc.skills || []).map(sId => {
      const s = this.skillData[sId];
      return s ? `${s.name} (🪙${s.coins}c)` : sId;
    }).join(', ');

    document.getElementById('challenge-npc-stats').textContent = `HP: ${npc.hp} | Skills: ${skillList}`;
    modal.classList.remove('hidden');
  }

  triggerInteraction() {
    if (!this.activePrompt) return;
    if (this.activePrompt.type === 'shop') {
      this.openShop();
    } else if (this.activePrompt.type === 'npc') {
      this.openChallengePrompt(this.activePrompt.target);
    } else if (this.activePrompt.type === 'spawn') {
      this.player.hp = this.player.maxHp;
      sound.playHeal();
      this.updateHUD();
      this.showToast('Flame Rift Checkpoint: Fully recovered!', '#f97316');
    }
  }

  checkDirectClick(wx, wy) {
    // Check shop pond click
    const dShop = Math.hypot(wx - this.SHOP_POINT.x, wy - this.SHOP_POINT.y);
    if (dShop <= this.SHOP_POINT.radius + 20) {
      if (Math.hypot(this.player.x - this.SHOP_POINT.x, this.player.y - this.SHOP_POINT.y) < 90) {
        this.openShop();
      }
      return;
    }

    // Check NPC clicks
    for (const npc of this.npcs) {
      const dNPC = Math.hypot(wx - npc.x, wy - npc.y);
      if (dNPC <= npc.radius + 15) {
        if (Math.hypot(this.player.x - npc.x, this.player.y - npc.y) < 90) {
          this.openChallengePrompt(npc);
        }
        return;
      }
    }
  }

  updateHUD() {
    // Top bar player stats
    const pct = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
    document.getElementById('hud-player-hp-bar').style.width = `${pct}%`;
    document.getElementById('hud-player-hp-text').textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
    document.getElementById('hud-player-gold').textContent = `${this.player.gold}G`;
    document.getElementById('hud-potions-count').textContent = `🧪 ${this.player.potions}`;

    // Player name & level badge
    const nameEl = document.getElementById('hud-player-name');
    if (nameEl) nameEl.textContent = this.player.name || 'LL-01';
    const levelEl = document.getElementById('hud-player-level');
    if (levelEl) levelEl.textContent = `Lv.${this.player.level || 1}`;

    // Profile Stats Panel
    const profLevel = document.getElementById('prof-stat-level');
    if (profLevel) profLevel.textContent = `Lv. ${this.player.level || 1}`;
    const profHp = document.getElementById('prof-stat-hp');
    if (profHp) profHp.textContent = `${this.player.maxHp}`;
    const profGold = document.getElementById('prof-stat-gold');
    if (profGold) profGold.textContent = `${this.player.gold}G`;
    const profWins = document.getElementById('prof-stat-wins');
    if (profWins) profWins.textContent = `${this.player.wins || 0}`;

    const shopGold = document.getElementById('shop-gold-amount');
    if (shopGold) shopGold.textContent = `${this.player.gold}G`;
  }

  showToast(msg, color = '#00f0ff') {
    const toast = document.getElementById('game-toast');
    toast.textContent = msg;
    toast.style.borderColor = color;
    toast.classList.remove('hidden');
    toast.classList.add('toast-active');

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('toast-active');
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, 2400);
  }

  createClickVFX(x, y) {
    this.particles.push({
      x,
      y,
      radius: 5,
      maxRadius: 28,
      alpha: 1,
      color: '#00f0ff',
      type: 'click-ring'
    });
  }

  // --- Main Update Loop ---
  update(delta) {
    if (this.combat.inBattle) return;

    let moveX = 0;
    let moveY = 0;

    // Keyboard movement
    if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    if (moveX !== 0 || moveY !== 0) {
      // Normalize
      const len = Math.hypot(moveX, moveY);
      moveX /= len;
      moveY /= len;

      const stepX = moveX * this.player.speed;
      const stepY = moveY * this.player.speed;

      // 1. Try full diagonal move
      if (this.canMoveTo(this.player.x + stepX, this.player.y + stepY)) {
        this.player.x += stepX;
        this.player.y += stepY;
      } else {
        // 2. Try horizontal sliding
        const slideX = this.canMoveTo(this.player.x + stepX, this.player.y);
        // 3. Try vertical sliding
        const slideY = this.canMoveTo(this.player.x, this.player.y + stepY);

        if (slideX) {
          this.player.x += stepX;
        }
        if (slideY) {
          this.player.y += stepY;
        }
      }

      this.hasTarget = false; // Keyboard overrides click target

      if (moveX < 0) this.player.facing = 'left';
      if (moveX > 0) this.player.facing = 'right';

      this.player.isMoving = true;
    } else if (this.hasTarget) {
      // Move towards clicked target
      const dx = this.targetX - this.player.x;
      const dy = this.targetY - this.player.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        const step = Math.min(dist, this.player.speed);
        const stepX = (dx / dist) * step;
        const stepY = (dy / dist) * step;

        const prevX = this.player.x;
        const prevY = this.player.y;

        if (this.canMoveTo(this.player.x + stepX, this.player.y + stepY)) {
          this.player.x += stepX;
          this.player.y += stepY;
        } else {
          // Slide along X or Y if diagonal blocked
          if (this.canMoveTo(this.player.x + stepX, this.player.y)) {
            this.player.x += stepX;
          }
          if (this.canMoveTo(this.player.x, this.player.y + stepY)) {
            this.player.y += stepY;
          }
        }

        // If completely blocked against obstacle, cancel target
        if (Math.hypot(this.player.x - prevX, this.player.y - prevY) < 0.2) {
          this.hasTarget = false;
        }

        if (dx < 0) this.player.facing = 'left';
        if (dx > 0) this.player.facing = 'right';
        this.player.isMoving = true;
      } else {
        this.hasTarget = false;
        this.player.isMoving = false;
      }
    } else {
      this.player.isMoving = false;
    }

    // Clamp map boundaries
    this.player.x = Math.max(25, Math.min(this.MAP_WIDTH - 25, this.player.x));
    this.player.y = Math.max(25, Math.min(this.MAP_HEIGHT - 25, this.player.y));

    // Smooth Camera Follow
    const lerp = 0.08;
    this.camera.x += (this.player.x - this.camera.x) * lerp;
    this.camera.y += (this.player.y - this.camera.y) * lerp;

    // Dynamic Zoom based on window size
    const minScale = Math.max(this.canvas.width / this.MAP_WIDTH, this.canvas.height / this.MAP_HEIGHT);
    this.camera.scale = Math.max(1.1, Math.min(1.7, minScale * 1.25));

    // Camera clamping so we don't look past map edges excessively
    const halfViewW = (this.canvas.width / 2) / this.camera.scale;
    const halfViewH = (this.canvas.height / 2) / this.camera.scale;

    if (halfViewW * 2 < this.MAP_WIDTH) {
      this.camera.x = Math.max(halfViewW, Math.min(this.MAP_WIDTH - halfViewW, this.camera.x));
    } else {
      this.camera.x = this.MAP_WIDTH / 2;
    }

    if (halfViewH * 2 < this.MAP_HEIGHT) {
      this.camera.y = Math.max(halfViewH, Math.min(this.MAP_HEIGHT - halfViewH, this.camera.y));
    } else {
      this.camera.y = this.MAP_HEIGHT / 2;
    }

    // Footstep particles
    if (this.player.isMoving && Math.random() < 0.25) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 10,
        y: this.player.y + 16,
        radius: 3 + Math.random() * 2,
        alpha: 0.6,
        color: 'rgba(210, 180, 140, 0.7)',
        type: 'dust'
      });
    }

    // Check Nearby Interactivity
    this.checkInteractivity();

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.type === 'click-ring') {
        p.radius += 1.2;
        p.alpha -= 0.04;
      } else if (p.type === 'dust') {
        p.y -= 0.3;
        p.alpha -= 0.03;
      }
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  checkInteractivity() {
    const promptElem = document.getElementById('interaction-prompt');
    const mobileBtn = document.getElementById('mobile-interact-btn');
    let found = null;

    // Check Spawn / Red Point
    const dSpawn = Math.hypot(this.player.x - this.SPAWN_POINT.x, this.player.y - this.SPAWN_POINT.y);
    if (dSpawn < 50) {
      found = {
        type: 'spawn',
        title: 'Flame Rift Checkpoint',
        action: 'Press [E] or Tap to Rest (Full Heal)'
      };
    }

    // Check Magic Pond Shop
    const dShop = Math.hypot(this.player.x - this.SHOP_POINT.x, this.player.y - this.SHOP_POINT.y);
    if (dShop < this.SHOP_POINT.radius + 15) {
      found = {
        type: 'shop',
        title: 'Mystic Pond Shop',
        action: 'Press [E] or Tap to Enter Shop'
      };
    }

    // Check 3 Yellow NPCs
    for (const npc of this.npcs) {
      const dNPC = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
      if (dNPC < npc.radius + 15) {
        found = {
          type: 'npc',
          target: npc,
          title: `Challenger: ${npc.name}`,
          action: 'Press [E] or Tap to Challenge Fight!'
        };
        break;
      }
    }

    this.activePrompt = found;

    if (found) {
      promptElem.innerHTML = `<strong>${found.title}</strong><span>${found.action}</span>`;
      promptElem.classList.remove('hidden');
      mobileBtn.classList.remove('hidden');
    } else {
      promptElem.classList.add('hidden');
      mobileBtn.classList.add('hidden');
    }
  }

  // --- Rendering ---
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    // Center camera
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(this.camera.scale, this.camera.scale);
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Draw World Map
    if (this.mapImg.complete && this.mapImg.naturalWidth > 0) {
      this.ctx.drawImage(this.mapImg, 0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);
    } else {
      this.ctx.fillStyle = '#2d4a22';
      this.ctx.fillRect(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);
    }

    // 2. Draw Interactive Location Visuals & Markers
    this.renderMapWaypoints();

    // 3. Draw Particles (Dust, Click Rings)
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      if (p.type === 'click-ring') {
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.stroke();
      } else {
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    // 4. Draw NPCs
    this.renderNPCs();

    // 5. Draw Player Character (LL.png)
    this.renderPlayer();

    // 6. Optional Collision Debug Overlay (Toggle with Shift + C)
    if (this.showCollisionDebug) {
      this.renderCollisionDebug();
    }

    this.ctx.restore();
  }

  renderCollisionDebug() {
    this.ctx.save();
    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      if (c.type === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        this.ctx.fillStyle = c.label.startsWith('Rock') ? 'rgba(249, 115, 22, 0.4)' : 
                             c.label.startsWith('Tree') || c.label.startsWith('Arch') ? 'rgba(34, 197, 94, 0.4)' :
                             c.label.startsWith('River') || c.label.startsWith('Pond') ? 'rgba(59, 130, 246, 0.4)' :
                             'rgba(239, 68, 68, 0.4)';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.2;
        this.ctx.stroke();
      } else if (c.type === 'rect') {
        this.ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        this.ctx.fillRect(c.x, c.y, c.w, c.h);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.2;
        this.ctx.strokeRect(c.x, c.y, c.w, c.h);
      }
    }

    // Player collision circle (feet)
    const pFeetX = this.player.x;
    const pFeetY = this.player.y + 16;
    this.ctx.beginPath();
    this.ctx.arc(pFeetX, pFeetY, 12, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
    this.ctx.fill();
    this.ctx.strokeStyle = '#00ffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.restore();
  }

  renderMapWaypoints() {
    const time = performance.now() * 0.003;

    // Red Spawn Point Ring Aura
    this.ctx.save();
    const pulseRed = Math.sin(time * 2) * 4;
    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(this.SPAWN_POINT.x, this.SPAWN_POINT.y, 28 + pulseRed, 0, Math.PI * 2);
    this.ctx.stroke();
    // Spawn Beacon text
    this.ctx.font = 'bold 11px Outfit, sans-serif';
    this.ctx.fillStyle = '#fca5a5';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🔴 SPAWN / REST', this.SPAWN_POINT.x, this.SPAWN_POINT.y - 36);
    this.ctx.restore();

    // Magic Circle Pond Shop Aura
    this.ctx.save();
    const pulseBlue = Math.sin(time * 2.5) * 5;
    this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(this.SHOP_POINT.x, this.SHOP_POINT.y, 52 + pulseBlue, 0, Math.PI * 2);
    this.ctx.stroke();

    // Draw Shopkeeper Avatar Sprite at Pond
    const shopImg = this.modelImages ? this.modelImages['shopkeeper'] : null;
    if (shopImg && shopImg.complete && shopImg.naturalWidth > 0) {
      const bob = Math.sin(time * 2) * 2;
      this.ctx.save();
      this.ctx.translate(this.SHOP_POINT.x, this.SHOP_POINT.y - 12 + bob);

      // Shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 24, 20, 8, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Circular clipped portrait
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 24, 0, Math.PI * 2);
      this.ctx.clip();
      this.ctx.drawImage(shopImg, -24, -24, 48, 48);
      this.ctx.restore();

      // Glowing cyan frame
      this.ctx.strokeStyle = '#22d3ee';
      this.ctx.lineWidth = 2.5;
      this.ctx.shadowColor = '#06b6d4';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 24, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.restore();
    }

    this.ctx.font = 'bold 12px Outfit, sans-serif';
    this.ctx.fillStyle = '#67e8f9';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText('✨ MYSTIC SHOP [E]', this.SHOP_POINT.x, this.SHOP_POINT.y - 52);
    this.ctx.restore();
  }

  renderNPCs() {
    const time = performance.now() * 0.004;

    for (const npc of this.npcs) {
      this.ctx.save();
      this.ctx.translate(npc.x, npc.y);

      // Shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 22, 22, 9, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Colored Ring Pulse
      const ringPulse = Math.sin(time + npc.x) * 3;
      this.ctx.strokeStyle = npc.color || 'rgba(234, 179, 8, 0.85)';
      this.ctx.lineWidth = 2.5;
      this.ctx.shadowColor = npc.color || '#ea580c';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 26 + ringPulse, 0, Math.PI * 2);
      this.ctx.stroke();

      // Animated NPC Character Chibi Bob
      const bob = Math.sin(time * 2.5 + npc.y) * 2;
      this.ctx.translate(0, bob);

      // Draw real character model avatar token
      const img = this.modelImages ? this.modelImages[npc.spriteType] : null;
      if (img && img.complete && img.naturalWidth > 0) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 22, 0, Math.PI * 2);
        this.ctx.clip();
        this.ctx.drawImage(img, -22, -22, 44, 44);
        this.ctx.restore();

        // White border ring
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 22, 0, Math.PI * 2);
        this.ctx.stroke();
      } else {
        this.ctx.fillStyle = npc.color || '#f97316';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 22, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Overhead Floating '!' Swords Badge
      const exclBob = Math.sin(time * 3 + npc.x) * 3;
      this.ctx.shadowBlur = 0;
      this.ctx.font = 'bold 15px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('⚔️', 0, -32 + exclBob);

      // NPC Name Tag
      this.ctx.font = 'bold 11px Outfit, sans-serif';
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.shadowColor = 'rgba(0,0,0,0.9)';
      this.ctx.shadowBlur = 5;
      this.ctx.fillText(npc.name, 0, 36);

      this.ctx.restore();
    }
  }

  renderPlayer() {
    this.ctx.save();
    this.ctx.translate(this.player.x, this.player.y);

    // Character Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 22, 18, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Walking / Idle animation bob
    const walkBob = this.player.isMoving ? Math.sin(performance.now() * 0.015) * 3 : Math.sin(performance.now() * 0.003) * 1.5;

    // Save context for flipped sprite drawing
    this.ctx.save();
    if (this.player.facing === 'right') {
      this.ctx.scale(-1, 1);
    }

    // Draw LL.png sprite (scaled to chibi game size ~44x64)
    if (this.playerImg.complete && this.playerImg.naturalWidth > 0) {
      const sw = 44;
      const sh = 64;
      this.ctx.drawImage(
        this.playerImg,
        -sw / 2,
        -sh + 20 + walkBob,
        sw,
        sh
      );
    } else {
      // Fallback cyber mech sprite
      this.ctx.fillStyle = '#06b6d4';
      this.ctx.fillRect(-12, -30 + walkBob, 24, 36);
    }

    // Glowing Neon Visor / Chest Aura
    this.ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.arc(0, -18 + walkBob, 3.5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore(); // Restore un-flipped context

    // Player Overhead Tag (Never mirrored!)
    this.ctx.font = 'bold 11px Outfit, sans-serif';
    this.ctx.fillStyle = '#67e8f9';
    this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
    this.ctx.shadowBlur = 4;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.player.name || 'LL-01', 0, -52);

    this.ctx.restore();
  }

  loop(timestamp) {
    this.update();
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }
}

// ============================================
// INITIALIZATION
// ============================================
window.addEventListener('DOMContentLoaded', () => {
  let gameInstance = null;
  const bgmController = new BgmController();

  updateMenuPlayerDisplay();
  updateGoogleUI();
  updateAndRenderLeaderboard();
  initProfileModal();

  const menu = new MenuSystem(() => {
    // Called when PLAY is pressed
    if (!gameInstance) {
      gameInstance = new Game(menu);
      window.game = gameInstance;
    }
  }, bgmController);

  window.menuSystem = menu;
  window.bgmController = bgmController;
});
