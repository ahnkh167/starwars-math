import { useState, useEffect, useCallback, useRef } from "react";

/* STAR WARS MATH ADVENTURE — Daniel Ahn */

// ── Audio Engine (safe, no class) ──
function makeAudio() {
  var ctx = null;
  var bgmG = null;
  var sfxG = null;
  var playing = false;
  var _bgm = true;
  var _sfx = true;
  var tids = [];
  var nodes = [];

  function init() {
    if (ctx) return true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      bgmG = ctx.createGain();
      bgmG.gain.value = 0.14;
      bgmG.connect(ctx.destination);
      sfxG = ctx.createGain();
      sfxG.gain.value = 0.3;
      sfxG.connect(ctx.destination);
      return true;
    } catch (e) { return false; }
  }

  function tone(freq, time, dur, type, vol, dest) {
    if (!ctx) return;
    try {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = type || "sine";
      o.frequency.value = freq;
      var t0 = time;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol || 0.14, t0 + 0.04);
      g.gain.linearRampToValueAtTime(0.001, t0 + dur - 0.02);
      o.connect(g);
      g.connect(dest || bgmG);
      o.start(t0);
      o.stop(t0 + dur);
      nodes.push(o);
    } catch (e) {}
  }

  function startBGM() {
    if (!init() || playing || !_bgm) return;
    playing = true;
    var bpm = 72;
    var bt = 60 / bpm;
    var br = bt * 4;
    var len = br * 8;

    var mel = [
      [392,0,bt*1.5],[523.3,bt*1.5,bt*.5],[622.3,bt*2,bt],[587.3,bt*3,bt*.5],[523.3,bt*3.5,bt*.5],
      [466.2,br,bt],[415.3,br+bt,bt*.5],[392,br+bt*1.5,bt*1.5],[349.2,br+bt*3,bt],
      [311.1,br*2,bt*1.5],[349.2,br*2+bt*1.5,bt*.5],[392,br*2+bt*2,bt*2],
      [415.3,br*3,bt],[392,br*3+bt,bt],[349.2,br*3+bt*2,bt],[311.1,br*3+bt*3,bt],
      [392,br*4,bt],[466.2,br*4+bt,bt*.5],[523.3,br*4+bt*1.5,bt*1.5],[587.3,br*4+bt*3,bt],
      [622.3,br*5,bt*1.5],[587.3,br*5+bt*1.5,bt*.5],[523.3,br*5+bt*2,bt],[466.2,br*5+bt*3,bt],
      [523.3,br*6,bt*2],[392,br*6+bt*2,bt*2],
      [415.3,br*7,bt],[392,br*7+bt,bt],[311.1,br*7+bt*2,bt],[261.6,br*7+bt*3,bt]
    ];
    var bass = [
      [130.8,0,br*2],[207.7,br*2,br],[233.1,br*3,br*.5],[196,br*3.5,br*.5],
      [130.8,br*4,br*2],[207.7,br*6,br],[196,br*7,br]
    ];
    var pads = [
      [[261.6,311.1,392],0,br*2],[[207.7,261.6,311.1],br*2,br],[[233.1,293.7,349.2],br*3,br],
      [[261.6,311.1,392],br*4,br*2],[[207.7,261.6,311.1],br*6,br],[[196,246.9,293.7],br*7,br]
    ];

    function loop() {
      if (!playing || !_bgm || !ctx) return;
      try {
        var now = ctx.currentTime + 0.1;
        var i, j;
        for (i = 0; i < mel.length; i++) {
          tone(mel[i][0], now + mel[i][1], mel[i][2], "sine", 0.16, bgmG);
          tone(mel[i][0], now + mel[i][1], mel[i][2], "triangle", 0.03, bgmG);
        }
        for (i = 0; i < bass.length; i++) {
          tone(bass[i][0], now + bass[i][1], bass[i][2], "sine", 0.18, bgmG);
        }
        for (i = 0; i < pads.length; i++) {
          var freqs = pads[i][0];
          for (j = 0; j < freqs.length; j++) {
            tone(freqs[j], now + pads[i][1], pads[i][2], "sine", 0.04, bgmG);
          }
        }
        for (i = 0; i < 8; i++) {
          var t = now + i * br;
          var o = ctx.createOscillator();
          var g = ctx.createGain();
          o.type = "sine";
          o.frequency.setValueAtTime(80, t);
          o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
          g.gain.setValueAtTime(0.08, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
          o.connect(g); g.connect(bgmG);
          o.start(t); o.stop(t + 0.2);
          nodes.push(o);
        }
        var tid = setTimeout(loop, (len - 0.5) * 1000);
        tids.push(tid);
      } catch (e) {}
    }
    loop();
  }

  function stopBGM() {
    playing = false;
    var i;
    for (i = 0; i < tids.length; i++) clearTimeout(tids[i]);
    tids = [];
    for (i = 0; i < nodes.length; i++) { try { nodes[i].stop(); nodes[i].disconnect(); } catch (e) {} }
    nodes = [];
  }

  function sfx(fn) { if (!_sfx || !init()) return; try { fn(); } catch (e) {} }

  return {
    init: init,
    startBGM: startBGM,
    stopBGM: stopBGM,
    toggleBGM: function() { _bgm = !_bgm; if (_bgm) startBGM(); else stopBGM(); return _bgm; },
    toggleSFX: function() { _sfx = !_sfx; return _sfx; },
    correct: function() { sfx(function() { var ff = [523,659,784,1047]; for (var i=0;i<ff.length;i++) tone(ff[i], ctx.currentTime+i*0.08, 0.3, "sine", 0.18, sfxG); }); },
    wrong: function() { sfx(function() { var o=ctx.createOscillator(),g=ctx.createGain(); o.type="triangle"; o.frequency.setValueAtTime(330,ctx.currentTime); o.frequency.linearRampToValueAtTime(110,ctx.currentTime+0.3); g.gain.setValueAtTime(0.14,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.35); o.connect(g);g.connect(sfxG);o.start(ctx.currentTime);o.stop(ctx.currentTime+0.4); }); },
    reward: function() { sfx(function() { var ff=[523,659,784,880,1047,1319,1568]; for(var i=0;i<ff.length;i++) tone(ff[i],ctx.currentTime+i*0.12,0.4,i<4?"sine":"triangle",0.16,sfxG); }); },
    saber: function() { sfx(function() { var o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter(); o.type="sawtooth"; o.frequency.setValueAtTime(90,ctx.currentTime); o.frequency.linearRampToValueAtTime(170,ctx.currentTime+0.2); f.type="bandpass";f.frequency.value=200;f.Q.value=3; g.gain.setValueAtTime(0.1,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4); o.connect(f);f.connect(g);g.connect(sfxG);o.start(ctx.currentTime);o.stop(ctx.currentTime+0.45); }); },
    blaster: function() { sfx(function() { var o=ctx.createOscillator(),g=ctx.createGain(); o.type="square"; o.frequency.setValueAtTime(900,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(150,ctx.currentTime+0.1); g.gain.setValueAtTime(0.1,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.12); o.connect(g);g.connect(sfxG);o.start(ctx.currentTime);o.stop(ctx.currentTime+0.13); }); },
    click: function() { sfx(function() { tone(660, ctx.currentTime, 0.05, "sine", 0.1, sfxG); }); },
    hyper: function() { sfx(function() { var o=ctx.createOscillator(),g=ctx.createGain(); o.type="sine"; o.frequency.setValueAtTime(200,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(1500,ctx.currentTime+0.5); g.gain.setValueAtTime(0.08,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.6); o.connect(g);g.connect(sfxG);o.start(ctx.currentTime);o.stop(ctx.currentTime+0.65); }); },
  };
}

// ── Save/Load ──
function loadSave() { try { return window.__swSave || null; } catch(e) { return null; } }
function writeSave(d) { try { window.__swSave = d; } catch(e) {} }

// ── Math ──
function mkProb() {
  if (Math.random() > 0.4) {
    var a = Math.floor(Math.random()*10)+1;
    var b = Math.floor(Math.random()*(20-a))+1;
    return {a:a, b:b, op:"+", ans:a+b};
  }
  var ans2 = Math.floor(Math.random()*10)+1;
  var b2 = Math.floor(Math.random()*10)+1;
  return {a:ans2+b2, b:b2, op:"-", ans:ans2};
}
function mkCh(ans) {
  var s = [ans];
  while(s.length < 4) {
    var w = ans + Math.floor(Math.random()*7) - 3;
    if (w < 0) w = Math.floor(Math.random()*5);
    if (w !== ans && s.indexOf(w) === -1) s.push(w);
  }
  return s.sort(function() { return Math.random() - 0.5; });
}

// ── Items ──
function genItems(prefix, count, getItem) {
  var arr = [];
  for (var i = 0; i < count; i++) arr.push(getItem(i, prefix + (i+1)));
  return arr;
}

var ITEMS = {
  head: [
    {id:"h01",n:"Phase I Clone Helmet",e:"⬜",c:"#f5f5f5"},
    {id:"h02",n:"Phase II Clone Helmet",e:"⬜",c:"#e8e8e8"},
    {id:"h03",n:"Stormtrooper Helmet",e:"⬜",c:"#ffffff"},
    {id:"h04",n:"First Order Trooper",e:"⬜",c:"#f0f0f0"},
    {id:"h05",n:"Darth Vader Helmet",e:"⬛",c:"#0a0a0a"},
    {id:"h06",n:"Kylo Ren Helmet",e:"⬛",c:"#1a1a2e"},
    {id:"h07",n:"Boba Fett Helmet",e:"🟢",c:"#2d5a27"},
    {id:"h08",n:"Jango Fett Helmet",e:"🔵",c:"#4169E1"},
    {id:"h09",n:"Mandalorian Helmet",e:"🔵",c:"#4682B4"},
    {id:"h10",n:"Sabine Wren Helmet",e:"🟠",c:"#E87511"},
    {id:"h11",n:"Bo-Katan Helmet",e:"🔵",c:"#1E90FF"},
    {id:"h12",n:"Captain Rex Helmet",e:"🔵",c:"#3366cc"},
    {id:"h13",n:"Commander Cody",e:"🟠",c:"#cc7700"},
    {id:"h14",n:"Scout Trooper",e:"🟤",c:"#5C4033"},
    {id:"h15",n:"Death Trooper",e:"⬛",c:"#0d0d0d"},
    {id:"h16",n:"TIE Pilot Helmet",e:"⬛",c:"#1a1a1a"},
    {id:"h17",n:"X-Wing Pilot Helmet",e:"🟠",c:"#ff6600"},
    {id:"h18",n:"Royal Guard Helmet",e:"🔴",c:"#8B0000"},
    {id:"h19",n:"Yoda",e:"🟢",c:"#6B8E23"},
    {id:"h20",n:"Ahsoka Tano",e:"🟠",c:"#E87511"},
    {id:"h21",n:"Chewbacca",e:"🟤",c:"#8B4513"},
    {id:"h22",n:"Luke Skywalker",e:"🟡",c:"#DAA520"},
    {id:"h23",n:"Princess Leia",e:"🟤",c:"#654321"},
    {id:"h24",n:"Han Solo",e:"🟤",c:"#5C4033"},
    {id:"h25",n:"Obi-Wan Kenobi",e:"🟤",c:"#B8860B"},
    {id:"h26",n:"Darth Maul Horns",e:"🔴",c:"#880000"},
    {id:"h27",n:"General Grievous",e:"⬜",c:"#C0C0C0"},
    {id:"h28",n:"Palpatine Hood",e:"⬛",c:"#1a0a0a"},
    {id:"h29",n:"Grogu",e:"🟢",c:"#7CCD7C"},
    {id:"h30",n:"Tusken Raider Mask",e:"🟤",c:"#8B7355"},
  ].concat(genItems("h",10,function(i,id){return{id:id,n:"Galaxy Helm "+(i+1),e:["🔵","🔴","🟢","🟡","🟠"][i%5],c:"hsl("+(i*36)+",60%,45%)"}})),

  face: [
    {id:"f01",n:"Sith Yellow Eyes",e:"👁️",c:"#ffcc00"},
    {id:"f02",n:"Darth Maul Paint",e:"😈",c:"#cc0000"},
    {id:"f03",n:"Obi-Wan Beard",e:"🧔",c:"#B8860B"},
    {id:"f04",n:"Anakin Scar",e:"⚡",c:"#cc3333"},
    {id:"f05",n:"Cyborg Eye",e:"🔴",c:"#ff3333"},
    {id:"f06",n:"Togruta Markings",e:"🎨",c:"#E87511"},
    {id:"f07",n:"Clone Jaig Eyes",e:"🎖️",c:"#DAA520"},
    {id:"f08",n:"Mandalorian Sigil",e:"⚔️",c:"#4682B4"},
    {id:"f09",n:"Rebel Pilot Visor",e:"🥽",c:"#ff6600"},
    {id:"f10",n:"Padme Royal Makeup",e:"💄",c:"#ff69b4"},
  ].concat(genItems("f",20,function(i,id){return{id:id,n:"Clan Sigil "+(i+1),e:"⚔️",c:"hsl("+(i*18)+",65%,50%)"}}))
   .concat(genItems("fx",10,function(i,id){return{id:id,n:"Alien Mark "+(i+1),e:"✨",c:"hsl("+(i*36)+",70%,55%)"}})),

  body: [
    {id:"b01",n:"Jedi Padawan Tunic",e:"🥋",c:"#C4A76C"},
    {id:"b02",n:"Jedi Knight Robe",e:"🥋",c:"#8B7355"},
    {id:"b03",n:"Jedi Master Robe",e:"🥋",c:"#6B5B45"},
    {id:"b04",n:"Sith Apprentice Robe",e:"🥋",c:"#1a0a0a"},
    {id:"b05",n:"Sith Lord Robe",e:"🥋",c:"#0d0000"},
    {id:"b06",n:"Darth Vader Suit",e:"🦺",c:"#0a0a0a"},
    {id:"b07",n:"Kylo Ren Tunic",e:"🧥",c:"#1a1a2e"},
    {id:"b08",n:"Stormtrooper Armor",e:"🦺",c:"#ffffff"},
    {id:"b09",n:"501st Legion Armor",e:"🦺",c:"#3366cc"},
    {id:"b10",n:"212th Battalion",e:"🦺",c:"#cc7700"},
    {id:"b11",n:"Coruscant Guard",e:"🦺",c:"#cc3333"},
    {id:"b12",n:"ARC Trooper Armor",e:"🦺",c:"#3344aa"},
    {id:"b13",n:"Mandalorian Beskar",e:"🦺",c:"#4682B4"},
    {id:"b14",n:"Boba Fett Armor",e:"🦺",c:"#2d5a27"},
    {id:"b15",n:"Jango Fett Armor",e:"🦺",c:"#4169E1"},
    {id:"b16",n:"Han Solo Vest",e:"🧥",c:"#2F4F4F"},
    {id:"b17",n:"Leia White Gown",e:"👗",c:"#ffffff"},
    {id:"b18",n:"Rebel Pilot Suit",e:"🧑‍🚀",c:"#ff6600"},
    {id:"b19",n:"Wookiee Bandolier",e:"🧥",c:"#8B4513"},
    {id:"b20",n:"C-3PO Plating",e:"🤖",c:"#FFD700"},
  ].concat(genItems("b",40,function(i,id){var t=["Jedi","Sith","Rebel","Imperial","Mando"];return{id:id,n:t[i%5]+" Suit "+(Math.floor(i/5)+1),e:"🦺",c:"hsl("+(i*9)+",50%,"+(38+(i%3)*8)+"%)"}})),

  legs: [
    {id:"l01",n:"Jedi Pants",e:"👖",c:"#8B7355"},
    {id:"l02",n:"Sith Pants",e:"👖",c:"#1a1a1a"},
    {id:"l03",n:"Trooper Greaves",e:"👖",c:"#ffffff"},
    {id:"l04",n:"501st Legs",e:"👖",c:"#3366cc"},
    {id:"l05",n:"Mando Leg Plates",e:"👖",c:"#4682B4"},
    {id:"l06",n:"Boba Fett Legs",e:"👖",c:"#2d5a27"},
    {id:"l07",n:"Vader Legs",e:"👖",c:"#0a0a0a"},
    {id:"l08",n:"Rebel Pilot Pants",e:"👖",c:"#ff6600"},
    {id:"l09",n:"Han Solo Bloodstripe",e:"👖",c:"#2F4F4F"},
    {id:"l10",n:"Endor Camo",e:"👖",c:"#556B2F"},
    {id:"l11",n:"Droid Legs",e:"🦿",c:"#FFD700"},
    {id:"l12",n:"Hoth Snow Pants",e:"👖",c:"#e8e8e8"},
  ].concat(genItems("l",38,function(i,id){return{id:id,n:"Battle Legs "+(i+1),e:"👖",c:"hsl("+(i*9.5)+",50%,42%)"}})),

  shoes: [
    {id:"s01",n:"Jedi Boots",e:"👢",c:"#8B7355"},
    {id:"s02",n:"Sith Boots",e:"👢",c:"#1a1a1a"},
    {id:"s03",n:"Trooper Boots",e:"👢",c:"#ffffff"},
    {id:"s04",n:"Mando Boots",e:"👢",c:"#4682B4"},
    {id:"s05",n:"Rebel Boots",e:"👢",c:"#cc5500"},
    {id:"s06",n:"Han Solo Boots",e:"👢",c:"#2F4F4F"},
    {id:"s07",n:"Vader Boots",e:"👢",c:"#0a0a0a"},
    {id:"s08",n:"Jetpack Boots",e:"🚀",c:"#C0C0C0"},
    {id:"s09",n:"Hover Boots",e:"✨",c:"#4488ff"},
    {id:"s10",n:"Sand Boots",e:"👢",c:"#F5DEB3"},
  ].concat(genItems("s",40,function(i,id){return{id:id,n:"Combat Boots "+(i+1),e:i%2===0?"👢":"👟",c:"hsl("+(i*9)+",55%,45%)"}})),

  weapons: [
    {id:"w01",n:"Blue Lightsaber",e:"⚔️",c:"#4488ff",t:"s"},
    {id:"w02",n:"Green Lightsaber",e:"⚔️",c:"#44ff44",t:"s"},
    {id:"w03",n:"Red Lightsaber",e:"⚔️",c:"#ff4444",t:"s"},
    {id:"w04",n:"Purple (Mace Windu)",e:"⚔️",c:"#9944ff",t:"s"},
    {id:"w05",n:"Yellow (Temple Guard)",e:"⚔️",c:"#ffdd44",t:"s"},
    {id:"w06",n:"White (Ahsoka)",e:"⚔️",c:"#ffffff",t:"s"},
    {id:"w07",n:"Kylo Crossguard",e:"⚔️",c:"#ff2222",t:"x"},
    {id:"w08",n:"Maul Double-Blade",e:"⚔️",c:"#ff0000",t:"d"},
    {id:"w09",n:"Darksaber",e:"⚔️",c:"#222",t:"k"},
    {id:"w10",n:"Han Solo DL-44",e:"🔫",c:"#555",t:"g"},
    {id:"w11",n:"E-11 Blaster",e:"🔫",c:"#444",t:"g"},
    {id:"w12",n:"Bowcaster",e:"🏹",c:"#8B4513",t:"g"},
    {id:"w13",n:"DC-15 Clone Rifle",e:"🔫",c:"#e8e8e8",t:"g"},
    {id:"w14",n:"Boba EE-3",e:"🔫",c:"#2d5a27",t:"g"},
    {id:"w15",n:"Electrostaff",e:"🔱",c:"#ffdd00",t:"m"},
    {id:"w16",n:"Beskar Spear",e:"🔱",c:"#C0C0C0",t:"m"},
    {id:"w17",n:"Vibroblade",e:"🗡️",c:"#C0C0C0",t:"m"},
    {id:"w18",n:"Force Pike",e:"🔱",c:"#8B0000",t:"m"},
  ].concat(genItems("w",20,function(i,id){return{id:id,n:"Custom Saber "+(i+1),e:"⚔️",c:"hsl("+(i*18)+",85%,58%)",t:"s"}}))
   .concat(genItems("wg",20,function(i,id){return{id:id,n:"Heavy Blaster "+(i+1),e:"🔫",c:"hsl("+(i*18)+",45%,42%)",t:"g"}}))
   .concat(genItems("wm",22,function(i,id){return{id:id,n:"Ancient Weapon "+(i+1),e:"🗡️",c:"hsl("+(i*16)+",55%,50%)",t:"m"}})),

  accessories: [
    {id:"a01",n:"Jedi Cloak",e:"🧣",c:"#8B7355"},
    {id:"a02",n:"Sith Cloak",e:"🧣",c:"#0a0a0a"},
    {id:"a03",n:"Lando Cape",e:"🧣",c:"#4169E1"},
    {id:"a04",n:"Royal Cape",e:"🧣",c:"#8B0000"},
    {id:"a05",n:"Jedi Belt",e:"📿",c:"#C4A76C"},
    {id:"a06",n:"Mando Jetpack",e:"🎒",c:"#556B2F"},
    {id:"a07",n:"Boba Jetpack",e:"🎒",c:"#2d5a27"},
    {id:"a08",n:"Wrist Flame",e:"🔥",c:"#ff4400"},
    {id:"a09",n:"Whistling Birds",e:"🦅",c:"#C0C0C0"},
    {id:"a10",n:"Comm Link",e:"📡",c:"#4488ff"},
    {id:"a11",n:"R2-D2 Buddy",e:"🤖",c:"#4488ff"},
    {id:"a12",n:"BB-8 Buddy",e:"🤖",c:"#ff6600"},
    {id:"a13",n:"BD-1 Droid",e:"🤖",c:"#e8e8e8"},
    {id:"a14",n:"Grogu in Pram",e:"👶",c:"#6B8E23"},
    {id:"a15",n:"Beskar Pauldron",e:"🛡️",c:"#4682B4"},
    {id:"a16",n:"Kyber Necklace",e:"💎",c:"#FFD700"},
    {id:"a17",n:"Rebel Armband",e:"💪",c:"#cc3333"},
    {id:"a18",n:"Energy Shield",e:"🛡️",c:"#4488ff"},
    {id:"a19",n:"Black Gloves",e:"🧤",c:"#111"},
    {id:"a20",n:"Vambrace",e:"🦾",c:"#C0C0C0"},
  ].concat(genItems("a",20,function(i,id){var em=["📿","🧣","🎒","🛡️","💎"];return{id:id,n:"Artifact "+(i+1),e:em[i%5],c:"hsl("+(i*18)+",52%,48%)"}}))
   .concat(genItems("at",20,function(i,id){var em=["⚙️","🔧","📡","💫","🌟"];return{id:id,n:"Tech Mod "+(i+1),e:em[i%5],c:"hsl("+(i*18)+",60%,52%)"}})),
};

var CATS = [
  {k:"head",l:"Head",i:"⛑️"},{k:"face",l:"Face",i:"😎"},{k:"body",l:"Body",i:"🦺"},
  {k:"legs",l:"Legs",i:"👖"},{k:"shoes",l:"Boots",i:"👢"},{k:"weapons",l:"Weapons",i:"⚔️"},
  {k:"accessories",l:"Gear",i:"📿"},
];

var TOT = 0;
var keys = Object.keys(ITEMS);
for (var ki = 0; ki < keys.length; ki++) TOT += ITEMS[keys[ki]].length;

// ── Stars ──
var starData = [];
for (var si = 0; si < 50; si++) starData.push({i:si,x:Math.random()*100,y:Math.random()*100,s:Math.random()*2+.5,d:Math.random()*3,r:Math.random()*2+1});

function Stars() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      {starData.map(function(s){return <div key={s.i} style={{position:"absolute",left:s.x+"%",top:s.y+"%",width:s.s,height:s.s,borderRadius:"50%",background:"#fff",animation:"tw "+s.r+"s "+s.d+"s infinite alternate",opacity:.6}} />})}
    </div>
  );
}

// ── Avatar ──
function Avatar(props) {
  var eq = props.eq;
  function g(cat) {
    if (!eq[cat]) return null;
    var arr = ITEMS[cat] || [];
    for (var i=0;i<arr.length;i++) if (arr[i].id===eq[cat]) return arr[i];
    return null;
  }
  var hi=g("head"),bi=g("body"),li=g("legs"),sho=g("shoes"),wi=g("weapons"),fi=g("face"),ai=g("accessories");
  var hc=hi?hi.c:"#666",bc=bi?bi.c:"#555",lc=li?li.c:"#444",sc=sho?sho.c:"#333";
  var wc=wi?wi.c:"none",ac=ai?ai.c:"none";
  var isS=wi&&"sxdk".indexOf(wi.t||"")!==-1;

  return (
    <svg viewBox="0 0 200 320" style={{width:"100%",maxWidth:200,height:"auto"}}>
      <defs><filter id="ds"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,.5)"/></filter></defs>
      <ellipse cx="100" cy="280" rx="65" ry="14" fill="rgba(68,136,255,.12)"/>
      {ai && <path d="M72 100Q62 175 57 248L143 248Q138 175 128 100Z" fill={ac} opacity=".5" filter="url(#ds)"/>}
      <g filter="url(#ds)"><ellipse cx="78" cy="286" rx="16" ry="7" fill={sc}/><ellipse cx="122" cy="286" rx="16" ry="7" fill={sc}/><rect x="67" y="272" width="22" height="16" rx="3" fill={sc}/><rect x="111" y="272" width="22" height="16" rx="3" fill={sc}/></g>
      <g filter="url(#ds)"><rect x="74" y="207" width="20" height="66" rx="7" fill={lc}/><rect x="106" y="207" width="20" height="66" rx="7" fill={lc}/></g>
      <g filter="url(#ds)"><path d="M77 102Q67 107 67 130L67 198Q67 212 80 212L120 212Q133 212 133 198L133 130Q133 107 123 102Z" fill={bc}/></g>
      <g filter="url(#ds)"><rect x="52" y="110" width="16" height="58" rx="8" fill={bc}/><rect x="132" y="110" width="16" height="58" rx="8" fill={bc}/></g>
      {wi && <g filter="url(#ds)">{isS
        ? <><rect x="143" y="72" width="5" height="26" rx="2" fill="#888"/><rect x="142" y="24" width="7" height="48" rx="2" fill={wc} opacity=".85"/><rect x="144" y="24" width="3" height="48" rx="1" fill="#fff" opacity=".3"/></>
        : <><rect x="140" y="94" width="7" height="44" rx="2" fill="#555"/><rect x="138" y="89" width="11" height="9" rx="2" fill="#777"/></>
      }</g>}
      <circle cx="60" cy="170" r="7" fill="#ccc" filter="url(#ds)"/><circle cx="140" cy="170" r="7" fill="#ccc" filter="url(#ds)"/>
      <g filter="url(#ds)"><ellipse cx="100" cy="76" rx="30" ry="34" fill={hc}/>{hi?<ellipse cx="100" cy="79" rx="20" ry="13" fill="rgba(0,0,0,.3)"/>:<><circle cx="91" cy="73" r="3.5" fill="#333"/><circle cx="109" cy="73" r="3.5" fill="#333"/><ellipse cx="100" cy="85" rx="7" ry="2.5" fill="#333"/></>}</g>
    </svg>
  );
}

// ── CSS ──
var CSS = "@keyframes tw{from{opacity:.2}to{opacity:1}}@keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes gl{0%,100%{text-shadow:0 0 15px #4488ff,0 0 30px #4488ff}50%{text-shadow:0 0 25px #66aaff,0 0 50px #66aaff}}@keyframes su{from{opacity:0;transform:translateY(25px)}to{opacity:1;transform:translateY(0)}}@keyframes pu{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}@keyframes ws{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}@keyframes cp{0%{box-shadow:0 0 0 0 rgba(68,255,68,.5)}100%{box-shadow:0 0 0 16px rgba(68,255,68,0)}}@keyframes po{0%{transform:scale(.85);opacity:0}100%{transform:scale(1);opacity:1}}@keyframes cf{0%{transform:translateY(-10px) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}@keyframes ce{0%{transform:scale(0) rotate(0);opacity:0}50%{transform:scale(1.2) rotate(180deg);opacity:1}100%{transform:scale(1) rotate(360deg);opacity:1}}";

var AP = {minHeight:"100vh",background:"linear-gradient(180deg,#0a0a1a,#0d1b2a 40%,#1b2838)",fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#e0e0e0",position:"relative",overflow:"hidden"};
var BX = {maxWidth:460,margin:"0 auto",padding:16,position:"relative",zIndex:1,minHeight:"100vh"};

// ═══ MAIN ═══
export default function StarWarsMath() {
  var audioRef = useRef(null);
  function au() { if (!audioRef.current) audioRef.current = makeAudio(); return audioRef.current; }

  var _s = useState; // shorthand
  var [scr,setScr]=_s("title"), [cc,setCc]=_s(0), [ta,setTa]=_s(0);
  var [prob,setProb]=_s(null), [ch,setCh]=_s([]), [fb,setFb]=_s(null), [sel,setSel]=_s(null);
  var [unlocked,setUnlocked]=_s([]);
  var [eq,setEq]=_s({head:null,face:null,body:null,legs:null,shoes:null,weapons:null,accessories:null});
  var [cat,setCat]=_s("head"), [streak,setStreak]=_s(0), [reward,setReward]=_s(null);
  var [rounds,setRounds]=_s(0), [showSave,setShowSave]=_s(false), [msg,setMsg]=_s("");
  var [bgmOn,setBgmOn]=_s(true), [sfxOn,setSfxOn]=_s(true);
  var fileRef = useRef(null);

  useEffect(function(){var s=loadSave();if(s){if(s.unlocked)setUnlocked(s.unlocked);if(s.eq)setEq(s.eq);if(s.rounds)setRounds(s.rounds);}},[]);
  useEffect(function(){writeSave({unlocked:unlocked,eq:eq,rounds:rounds});},[unlocked,eq,rounds]);
  useEffect(function(){var a=au();if((scr==="game"||scr==="customize")&&bgmOn){a.startBGM();}else{a.stopBGM();}return function(){a.stopBGM();};},[scr,bgmOn]);

  var next = useCallback(function(){var p=mkProb();setProb(p);setCh(mkCh(p.ans));setFb(null);setSel(null);},[]);
  useEffect(function(){if(scr==="game"&&!prob)next();},[scr,prob,next]);

  function pick(v) {
    if(fb)return; var a=au(); setSel(v); setTa(function(p){return p+1;});
    if(v===prob.ans){
      setFb("ok"); a.correct(); var n=cc+1; setCc(n); setStreak(function(p){return p+1;});
      if(n>=10){setTimeout(function(){
        var all=[],ks2=Object.keys(ITEMS);
        for(var i=0;i<ks2.length;i++){var arr=ITEMS[ks2[i]];for(var j=0;j<arr.length;j++)all.push({id:arr[j].id,n:arr[j].n,e:arr[j].e,c:arr[j].c,t:arr[j].t,cat:ks2[i]});}
        var av=all.filter(function(x){return unlocked.indexOf(x.id)===-1;});
        if(av.length>0){var r=av[Math.floor(Math.random()*av.length)];setReward(r);setUnlocked(function(p){return p.concat([r.id]);});}
        setRounds(function(p){return p+1;}); a.stopBGM(); a.reward(); setScr("reward");
      },800);}else setTimeout(next,1000);
    }else{setFb("no");a.wrong();setStreak(0);setTimeout(next,1500);}
  }

  function play(){setCc(0);setTa(0);setProb(null);setStreak(0);au().hyper();setScr("game");}

  function eqItem(c,id){
    var a=au(); var arr=ITEMS[c]||[]; var it=null;
    for(var i=0;i<arr.length;i++)if(arr[i].id===id){it=arr[i];break;}
    if(it&&"sxdk".indexOf(it.t||"")!==-1)a.saber();else if(it&&it.t==="g")a.blaster();else a.click();
    setEq(function(p){var ne={};for(var k in p)ne[k]=p[k];ne[c]=p[c]===id?null:id;return ne;});
  }

  function flash(m){setMsg(m);setTimeout(function(){setMsg("");},3000);}

  function doExport(){
    var d=JSON.stringify({unlocked:unlocked,eq:eq,rounds:rounds,date:new Date().toISOString()});
    var b=new Blob([d],{type:"application/json"}); var u=URL.createObjectURL(b);
    var a=document.createElement("a"); a.href=u; a.download="daniel-sw-"+Date.now()+".json";
    a.click(); URL.revokeObjectURL(u); flash("✅ Saved!");
  }
  function doImport(e){
    var f=e.target.files&&e.target.files[0]; if(!f)return;
    var r=new FileReader(); r.onload=function(ev){
      try{var d=JSON.parse(ev.target.result);if(d.unlocked)setUnlocked(d.unlocked);if(d.eq)setEq(d.eq);if(d.rounds)setRounds(d.rounds);writeSave(d);flash("✅ Loaded!");}catch(err){flash("❌ Bad file!");}
    }; r.readAsText(f); if(e.target)e.target.value="";
  }
  function doReset(){if(window.confirm("Reset ALL?")){setUnlocked([]);setEq({head:null,face:null,body:null,legs:null,shoes:null,weapons:null,accessories:null});setRounds(0);writeSave(null);flash("Done!");}}

  function AudioBar(){return(
    <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:6}}>
      <button onClick={function(){setBgmOn(au().toggleBGM());}} style={{background:"none",border:"1px solid rgba(255,255,255,.12)",borderRadius:16,padding:"3px 10px",fontSize:11,color:bgmOn?"#88bbff":"#555",cursor:"pointer"}}>{bgmOn?"🎵 Music":"🔇 Music"}</button>
      <button onClick={function(){setSfxOn(au().toggleSFX());}} style={{background:"none",border:"1px solid rgba(255,255,255,.12)",borderRadius:16,padding:"3px 10px",fontSize:11,color:sfxOn?"#88bbff":"#555",cursor:"pointer"}}>{sfxOn?"🔊 SFX":"🔈 SFX"}</button>
    </div>);}

  function SaveModal(){return(
    <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={function(){setShowSave(false);}}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:"#0d1b2a",borderRadius:18,padding:24,maxWidth:320,width:"90%",border:"1px solid rgba(68,136,255,.3)"}}>
        <h3 style={{margin:"0 0 14px",color:"#FFD700",textAlign:"center",fontSize:18}}>💾 Save/Load</h3>
        <div style={{marginBottom:12,padding:10,background:"rgba(255,255,255,.03)",borderRadius:10,fontSize:12,color:"#aaa",textAlign:"center"}}>🏆 <b style={{color:"#FFD700"}}>{rounds}</b> rounds · 📦 <b style={{color:"#88bbff"}}>{unlocked.length}</b>/{TOT}</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={doExport} style={{padding:10,fontSize:13,fontWeight:600,background:"rgba(68,136,255,.2)",color:"#88bbff",border:"1px solid rgba(68,136,255,.4)",borderRadius:10,cursor:"pointer"}}>📥 Download</button>
          <button onClick={function(){fileRef.current&&fileRef.current.click();}} style={{padding:10,fontSize:13,fontWeight:600,background:"rgba(68,255,68,.1)",color:"#88ff88",border:"1px solid rgba(68,255,68,.3)",borderRadius:10,cursor:"pointer"}}>📤 Load</button>
          <input ref={fileRef} type="file" accept=".json" onChange={doImport} style={{display:"none"}}/>
          <button onClick={doReset} style={{padding:10,fontSize:13,fontWeight:600,background:"rgba(255,68,68,.1)",color:"#ff8888",border:"1px solid rgba(255,68,68,.3)",borderRadius:10,cursor:"pointer"}}>🗑️ Reset</button>
          <button onClick={function(){setShowSave(false);}} style={{padding:8,fontSize:12,background:"rgba(255,255,255,.05)",color:"#888",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,cursor:"pointer"}}>Close</button>
        </div>
        {msg&&<div style={{marginTop:8,textAlign:"center",fontSize:12,color:"#FFD700"}}>{msg}</div>}
      </div>
    </div>);}

  // ═══ TITLE ═══
  if(scr==="title") return(
    <div style={AP}><Stars/><style>{CSS}</style>{showSave&&<SaveModal/>}
    <div style={BX}><div style={{textAlign:"center",paddingTop:"10vh"}}>
      <div style={{fontSize:11,letterSpacing:4,color:"#4488ff",textTransform:"uppercase"}}>⭐ A Long Time Ago in a Galaxy Far, Far Away... ⭐</div>
      <h1 style={{fontSize:"clamp(26px,7vw,44px)",fontWeight:900,color:"#FFD700",margin:"16px 0 6px",letterSpacing:2,animation:"gl 3s infinite",lineHeight:1.2}}>STAR WARS<br/>MATH ADVENTURE</h1>
      <p style={{fontSize:"clamp(12px,3vw,15px)",color:"#88bbff",fontWeight:600,margin:0}}>Addition & Subtraction Quest</p>
      <p style={{marginTop:16,fontSize:18}}>🚀 <span style={{color:"#FFD700",fontWeight:700}}>Daniel Ahn</span>{"'s Adventure 🚀"}</p>
      <div style={{margin:"20px auto",padding:14,background:"rgba(68,136,255,.08)",borderRadius:14,border:"1px solid rgba(68,136,255,.2)",maxWidth:300,fontSize:13,lineHeight:1.9,color:"#aabbcc"}}>
        ✅ Solve math problems<br/>🎯 Get <b style={{color:"#FFD700"}}>all 10 correct</b><br/>⚔️ Earn Star Wars rewards<br/>🎨 Build your character<br/>📦 Collect <b style={{color:"#88bbff"}}>{TOT}</b> items<br/>🎵 Epic space music!
      </div>
      {unlocked.length>0&&<p style={{fontSize:12,color:"#88bbff"}}>🏆 {rounds} rounds · 📦 {unlocked.length} items</p>}
      <button onClick={function(){au().init();au().hyper();play();}} style={{marginTop:8,padding:"14px 40px",fontSize:18,fontWeight:800,background:"linear-gradient(135deg,#FFD700,#ff8c00)",color:"#1a1a2e",border:"none",borderRadius:50,cursor:"pointer",letterSpacing:2,animation:"pu 2s infinite",boxShadow:"0 4px 16px rgba(255,215,0,.4)"}}>🚀 START!</button>
      <div style={{display:"flex",gap:14,justifyContent:"center",marginTop:12}}>
        <span onClick={function(){au().init();setScr("customize");}} style={{color:"#88bbff",cursor:"pointer",fontSize:13}}>🎨 Customize</span>
        <span onClick={function(){setShowSave(true);}} style={{color:"#88bbff",cursor:"pointer",fontSize:13}}>💾 Save/Load</span>
      </div>
      <AudioBar/>
    </div></div></div>
  );

  // ═══ GAME ═══
  if(scr==="game"&&prob){
    var pct=cc/10*100;
    return(
      <div style={AP}><Stars/><style>{CSS}</style>
      <div style={BX}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button onClick={function(){au().stopBGM();setScr("title");}} style={{background:"rgba(255,255,255,.1)",border:"none",color:"#88bbff",padding:"5px 10px",borderRadius:8,cursor:"pointer",fontSize:12}}>← Home</button>
          <AudioBar/>
          <span style={{fontSize:12,color:"#aaa"}}>⚡{streak}</span>
        </div>
        <div style={{background:"rgba(255,255,255,.05)",borderRadius:16,height:24,overflow:"hidden",position:"relative",border:"1px solid rgba(255,255,255,.1)",marginBottom:6}}>
          <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,#4488ff,#44ffaa)",borderRadius:16,transition:"width .5s"}}/>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:12,fontWeight:700,color:"#fff"}}>⭐ {cc}/10</div>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:4,margin:"8px 0 14px"}}>
          {Array.from({length:10},function(_,i){return <span key={i} style={{fontSize:14,opacity:i<cc?1:.2,filter:i<cc?"drop-shadow(0 0 3px #FFD700)":"none"}}>⭐</span>;})}
        </div>
        <div style={{background:"rgba(255,255,255,.03)",borderRadius:20,padding:"24px 14px",textAlign:"center",border:"2px solid "+(fb==="ok"?"#44ff44":fb==="no"?"#ff4444":"rgba(68,136,255,.2)"),animation:fb==="no"?"ws .5s":fb==="ok"?"cp .5s":"po .4s",marginBottom:18}}>
          <div style={{fontSize:12,color:"#888"}}>Question #{ta+1}</div>
          <div style={{fontSize:"clamp(36px,10vw,54px)",fontWeight:900,letterSpacing:6,color:"#fff",margin:"10px 0",fontFamily:"monospace"}}>{prob.a} {prob.op} {prob.b} = ?</div>
          {fb&&<div style={{fontSize:18,fontWeight:700,color:fb==="ok"?"#44ff44":"#ff6666",animation:"po .3s"}}>{fb==="ok"?"✅ Correct! 🎉":"❌ Answer: "+prob.ans}</div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {ch.map(function(v,i){var iA=fb&&v===prob.ans;var iW=fb==="no"&&sel===v;return(
            <button key={i} onClick={function(){au().click();pick(v);}} disabled={!!fb} style={{padding:"16px 10px",fontSize:"clamp(22px,5.5vw,28px)",fontWeight:800,fontFamily:"monospace",background:iA?"linear-gradient(135deg,#2a4,#4f6)":iW?"linear-gradient(135deg,#a22,#f44)":"rgba(255,255,255,.05)",color:iA||iW?"#fff":"#ddd",border:"2px solid "+(iA?"#44ff44":iW?"#ff4444":"rgba(255,255,255,.1)"),borderRadius:14,cursor:fb?"default":"pointer",transition:"all .2s"}}>{v}</button>);})}
        </div>
      </div></div>);
  }

  // ═══ REWARD ═══
  if(scr==="reward"){
    var confetti=[];for(var ci2=0;ci2<25;ci2++)confetti.push(ci2);
    return(
      <div style={AP}><Stars/><style>{CSS}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:2}}>
        {confetti.map(function(i){return <div key={i} style={{position:"absolute",left:Math.random()*100+"%",top:-10,width:7,height:7,background:["#FFD700","#ff4444","#44ff44","#4488ff","#ff44ff"][i%5],borderRadius:i%2?"50%":"2px",animation:"cf "+(2+Math.random()*3)+"s "+(Math.random()*2)+"s linear infinite"}}/>;})}
      </div>
      <div style={BX}><div style={{textAlign:"center",paddingTop:"10vh"}}>
        <div style={{fontSize:56,animation:"ce 1s"}}>🏆</div>
        <h2 style={{fontSize:"clamp(22px,6vw,32px)",fontWeight:900,color:"#FFD700",animation:"gl 2s infinite",margin:"12px 0 6px"}}>CONGRATULATIONS!</h2>
        <p style={{fontSize:16,color:"#88bbff",margin:0}}>Daniel got all 10 correct! 🎉</p>
        <p style={{fontSize:12,color:"#888",marginTop:6}}>{ta} attempts · {ta>0?Math.round(10/ta*100):100}%</p>
        {reward&&<div style={{margin:"24px auto",padding:18,background:"rgba(255,215,0,.08)",borderRadius:18,border:"2px solid rgba(255,215,0,.3)",maxWidth:260}}>
          <div style={{fontSize:11,color:"#FFD700",letterSpacing:2}}>✨ NEW ITEM! ✨</div>
          <div style={{fontSize:40,animation:"fl 2s infinite",margin:"6px 0"}}>{reward.e}</div>
          <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>{reward.n}</div>
          <span style={{display:"inline-block",padding:"2px 8px",borderRadius:16,background:"rgba(68,136,255,.2)",fontSize:11,color:"#88bbff",marginTop:4}}>{(function(){for(var i2=0;i2<CATS.length;i2++)if(CATS[i2].k===reward.cat)return CATS[i2].l;return "";})()}</span>
        </div>}
        <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:18,flexWrap:"wrap"}}>
          <button onClick={function(){au().hyper();play();}} style={{padding:"12px 26px",fontSize:14,fontWeight:700,background:"linear-gradient(135deg,#FFD700,#ff8c00)",color:"#1a1a2e",border:"none",borderRadius:50,cursor:"pointer",animation:"pu 2s infinite"}}>🚀 Play Again!</button>
          <button onClick={function(){setScr("customize");}} style={{padding:"12px 26px",fontSize:14,fontWeight:700,background:"rgba(68,136,255,.2)",color:"#88bbff",border:"1px solid rgba(68,136,255,.4)",borderRadius:50,cursor:"pointer"}}>🎨 Customize</button>
        </div>
      </div></div></div>);
  }

  // ═══ CUSTOMIZE ═══
  if(scr==="customize"){
    var ci3=ITEMS[cat]||[];
    var ui=ci3.filter(function(x){return unlocked.indexOf(x.id)!==-1;});
    var li2=ci3.filter(function(x){return unlocked.indexOf(x.id)===-1;});
    return(
      <div style={AP}><Stars/><style>{CSS}</style>{showSave&&<SaveModal/>}
      <div style={{maxWidth:560,margin:"0 auto",padding:16,position:"relative",zIndex:1,minHeight:"100vh",paddingBottom:30}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button onClick={function(){au().stopBGM();setScr("title");}} style={{background:"rgba(255,255,255,.1)",border:"none",color:"#88bbff",padding:"5px 10px",borderRadius:8,cursor:"pointer",fontSize:12}}>← Home</button>
          <h2 style={{fontSize:15,fontWeight:700,color:"#FFD700",margin:0}}>🎨 Character</h2>
          <span onClick={function(){setShowSave(true);}} style={{fontSize:18,cursor:"pointer"}}>💾</span>
        </div>
        <AudioBar/>
        <div style={{background:"rgba(0,0,0,.3)",borderRadius:16,padding:12,margin:"8px 0",display:"flex",justifyContent:"center",border:"1px solid rgba(68,136,255,.1)"}}><Avatar eq={eq}/></div>
        <div style={{display:"flex",gap:3,overflowX:"auto",paddingBottom:6,marginBottom:6}}>
          {CATS.map(function(c2){
            var n2=(ITEMS[c2.k]||[]).filter(function(x){return unlocked.indexOf(x.id)!==-1;}).length;
            var t2=(ITEMS[c2.k]||[]).length;
            return <button key={c2.k} onClick={function(){au().click();setCat(c2.k);}} style={{padding:"5px 8px",fontSize:10,fontWeight:cat===c2.k?700:400,background:cat===c2.k?"rgba(68,136,255,.3)":"rgba(255,255,255,.05)",color:cat===c2.k?"#88bbff":"#888",border:"1px solid "+(cat===c2.k?"rgba(68,136,255,.5)":"rgba(255,255,255,.1)"),borderRadius:16,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{c2.i+" "+c2.l+" "}<span style={{fontSize:8,opacity:.6}}>{n2}/{t2}</span></button>;
          })}
        </div>
        {eq[cat]&&<button onClick={function(){au().click();setEq(function(p){var ne={};for(var k in p)ne[k]=p[k];ne[cat]=null;return ne;});}} style={{width:"100%",padding:5,marginBottom:6,background:"rgba(255,68,68,.1)",border:"1px solid rgba(255,68,68,.3)",borderRadius:8,color:"#ff8888",fontSize:11,cursor:"pointer"}}>❌ Unequip</button>}
        {ui.length>0&&<div>
          <div style={{fontSize:10,color:"#88bbff",marginBottom:4,fontWeight:600}}>✨ Unlocked ({ui.length})</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(82px,1fr))",gap:5,marginBottom:10}}>
            {ui.map(function(it){var on=eq[cat]===it.id;return(
              <button key={it.id} onClick={function(){eqItem(cat,it.id);}} style={{padding:"7px 3px",background:on?"rgba(68,136,255,.25)":"rgba(255,255,255,.05)",border:"2px solid "+(on?"#4488ff":"rgba(255,255,255,.08)"),borderRadius:10,cursor:"pointer",textAlign:"center",color:"#ddd",position:"relative"}}>
                <div style={{fontSize:18}}>{it.e}</div>
                <div style={{width:13,height:13,borderRadius:"50%",background:it.c,margin:"2px auto",border:"1px solid rgba(255,255,255,.2)"}}/>
                <div style={{fontSize:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.n}</div>
                {on&&<div style={{position:"absolute",top:2,right:2,fontSize:7,background:"#4488ff",borderRadius:"50%",width:11,height:11,lineHeight:"11px",color:"#fff"}}>✓</div>}
              </button>);})}
          </div>
        </div>}
        {li2.length>0&&<div>
          <div style={{fontSize:10,color:"#666",marginBottom:4,fontWeight:600}}>🔒 Locked ({li2.length})</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(82px,1fr))",gap:5}}>
            {li2.slice(0,14).map(function(it){return(
              <div key={it.id} style={{padding:"7px 3px",background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.04)",borderRadius:10,textAlign:"center",opacity:.3}}>
                <div style={{fontSize:18}}>🔒</div><div style={{width:13,height:13,borderRadius:"50%",background:"#333",margin:"2px auto"}}/><div style={{fontSize:8,color:"#666"}}>???</div>
              </div>);})}
            {li2.length>14&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",color:"#555",fontSize:10}}>+{li2.length-14}</div>}
          </div>
        </div>}
        {ui.length===0&&<div style={{textAlign:"center",padding:"20px 12px",color:"#666"}}>
          <div style={{fontSize:32}}>🔒</div><p style={{fontSize:12,margin:"8px 0"}}>No items yet!</p>
          <button onClick={play} style={{padding:"8px 20px",fontSize:12,fontWeight:700,background:"linear-gradient(135deg,#FFD700,#ff8c00)",color:"#1a1a2e",border:"none",borderRadius:50,cursor:"pointer"}}>🚀 Solve Math!</button>
        </div>}
      </div></div>);
  }

  return null;
}
