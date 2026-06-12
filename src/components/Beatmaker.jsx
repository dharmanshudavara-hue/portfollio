import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiPlay, FiSquare, FiRefreshCcw, FiSave, FiDownload, FiVolume2, FiVolumeX } from "react-icons/fi";

const NUM_STEPS = 16;
const INSTRUMENTS = [
  { id: "synth-a4", name: "Synth A4", type: "synth", freq: 440.0, color: "pink" },
  { id: "synth-g4", name: "Synth G4", type: "synth", freq: 392.0, color: "pink" },
  { id: "synth-e4", name: "Synth E4", type: "synth", freq: 329.63, color: "pink" },
  { id: "synth-d4", name: "Synth D4", type: "synth", freq: 293.66, color: "pink" },
  { id: "synth-c4", name: "Synth C4", type: "synth", freq: 261.63, color: "pink" },
  { id: "bass-g2", name: "Bass G2", type: "bass", freq: 98.00, color: "blue" },
  { id: "bass-c2", name: "Bass C2", type: "bass", freq: 65.41, color: "blue" },
  { id: "hihat", name: "Hi-Hat", type: "drum", color: "green" },
  { id: "snare", name: "Snare", type: "drum", color: "green" },
  { id: "kick", name: "Kick", type: "drum", color: "green" },
];

const INIT_GRID = INSTRUMENTS.map(() => Array(NUM_STEPS).fill(false));

const PRESETS = {
  "House": [
    [false,false,false,false, false,false,false,false, false,false,true,false, false,false,false,false], // Synth A4
    [false,false,false,false, false,false,false,false, true,false,false,false, false,false,false,false], // Synth G4
    [false,false,true,false, false,false,true,false, false,false,false,false, false,false,true,false], // Synth E4
    [false,false,false,false, false,false,false,false, false,false,false,false, false,false,false,false], // Synth D4
    [true,false,false,false, true,false,false,false, false,false,false,false, true,false,false,false], // Synth C4
    [false,false,true,false, false,false,false,false, false,false,true,false, false,false,false,false], // Bass G2
    [true,false,false,false, false,false,true,false, true,false,false,false, false,false,true,false], // Bass C2
    [false,false,true,false, false,false,true,false, false,false,true,false, false,false,true,false], // HiHat
    [false,false,false,false, true,false,false,false, false,false,false,false, true,false,false,false], // Snare
    [true,false,false,false, false,false,false,false, true,false,false,false, false,false,false,false], // Kick
  ],
  "Hip Hop": [
    [false,false,false,false, false,false,false,false, false,false,false,false, false,false,true,false], // Synth A4
    [false,false,false,false, false,false,false,false, false,false,false,false, false,false,false,false], // Synth G4
    [false,true,false,false, false,true,false,false, false,true,false,false, false,true,false,false], // Synth E4
    [false,false,false,false, false,false,false,false, false,false,false,false, false,false,false,false], // Synth D4
    [true,false,false,false, true,false,false,false, true,false,false,false, true,false,false,false], // Synth C4
    [false,false,false,false, false,false,false,false, false,false,false,true, false,false,false,false], // Bass G2
    [true,false,false,false, false,true,false,false, true,false,false,false, false,false,false,false], // Bass C2
    [true,true,true,false, true,true,true,false, true,true,true,false, true,true,true,true], // HiHat
    [false,false,false,false, true,false,false,false, false,false,false,false, true,false,false,false], // Snare
    [true,false,false,false, false,false,true,false, false,true,false,false, false,false,false,false], // Kick
  ]
};

export default function Beatmaker() {
  const [grid, setGrid] = useState(INIT_GRID);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [mutes, setMutes] = useState(Array(INSTRUMENTS.length).fill(false));
  const [delayEnabled, setDelayEnabled] = useState(false);

  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const delayNodeRef = useRef(null);
  const delayFeedbackRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);

  const nextNoteTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const timerIDRef = useRef(null);
  const lookahead = 25.0; // ms
  const scheduleAheadTime = 0.1; // s

  // Initialize Audio Context and Master Effects
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      masterGainRef.current = ctx.createGain();
      masterGainRef.current.gain.value = 0.7;

      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 256;

      delayNodeRef.current = ctx.createDelay();
      delayNodeRef.current.delayTime.value = 0.375; // 3/8 note roughly at 120bpm
      
      delayFeedbackRef.current = ctx.createGain();
      delayFeedbackRef.current.gain.value = 0.3; // Echo decay

      // Delay routing: delay -> feedback -> delay
      delayNodeRef.current.connect(delayFeedbackRef.current);
      delayFeedbackRef.current.connect(delayNodeRef.current);
      delayNodeRef.current.connect(masterGainRef.current);

      masterGainRef.current.connect(analyserRef.current);
      analyserRef.current.connect(ctx.destination);
      
      drawVisualizer();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  useEffect(() => {
    // Update delay time if BPM changes
    if (delayNodeRef.current) {
      const secondsPerBeat = 60.0 / bpm;
      delayNodeRef.current.delayTime.value = secondsPerBeat * 0.75; // Dotted 8th note delay
    }
  }, [bpm]);

  const connectToMaster = (node, useDelay = false) => {
    node.connect(masterGainRef.current);
    if (useDelay && delayEnabled) {
      node.connect(delayNodeRef.current);
    }
  };

  const playKick = (time) => {
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.connect(gain);
    connectToMaster(gain, false);

    osc.start(time);
    osc.stop(time + 0.5);
  };

  const playSnare = (time) => {
    const ctx = audioCtxRef.current;
    // Tone
    const osc = ctx.createOscillator();
    const toneGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(250, time);
    toneGain.gain.setValueAtTime(0.5, time);
    toneGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    osc.connect(toneGain);
    connectToMaster(toneGain, false);

    osc.start(time);
    osc.stop(time + 0.2);

    // Noise
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 1000;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    connectToMaster(noiseGain, false);

    noise.start(time);
  };

  const playHiHat = (time) => {
    const ctx = audioCtxRef.current;
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 10000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    noise.connect(bandpass);
    bandpass.connect(gain);
    connectToMaster(gain, false);

    noise.start(time);
  };

  const playBass = (time, freq) => {
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, time);

    // Adding harmonics for thicker sub bass
    const subOsc = ctx.createOscillator();
    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(freq, time);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, time);
    filter.frequency.exponentialRampToValueAtTime(50, time + 0.4);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.8, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    connectToMaster(gain, false);

    osc.start(time);
    subOsc.start(time);
    osc.stop(time + 0.5);
    subOsc.stop(time + 0.5);
  };

  const playSynth = (time, freq) => {
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(3000, time + 0.1);
    filter.frequency.exponentialRampToValueAtTime(500, time + 0.3);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    connectToMaster(gain, true); // Synth uses Delay FX

    osc.start(time);
    osc.stop(time + 0.4);
  };

  const scheduleNote = (stepNumber, time) => {
    INSTRUMENTS.forEach((inst, index) => {
      if (grid[index][stepNumber] && !mutes[index]) {
        if (inst.id === "kick") playKick(time);
        else if (inst.id === "snare") playSnare(time);
        else if (inst.id === "hihat") playHiHat(time);
        else if (inst.type === "bass") playBass(time, inst.freq);
        else if (inst.type === "synth") playSynth(time, inst.freq);
      }
    });

    const delay = time - audioCtxRef.current.currentTime;
    setTimeout(() => {
      setCurrentStep(stepNumber);
    }, delay * 1000);
  };

  const scheduler = useCallback(() => {
    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
      scheduleNote(currentStepRef.current, nextNoteTimeRef.current);
      const secondsPerBeat = 60.0 / bpm;
      nextNoteTimeRef.current += 0.25 * secondsPerBeat;
      currentStepRef.current = (currentStepRef.current + 1) % NUM_STEPS;
    }
    timerIDRef.current = setTimeout(scheduler, lookahead);
  }, [bpm, grid, mutes, delayEnabled]);

  useEffect(() => {
    if (isPlaying) {
      initAudio();
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
      scheduler();
    } else {
      if (timerIDRef.current) {
        clearTimeout(timerIDRef.current);
      }
      setCurrentStep(0);
      currentStepRef.current = 0;
    }

    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
    };
  }, [isPlaying, scheduler]);

  // Audio Visualizer
  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = "#0f0f13";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        // Dynamic gradient based on frequency
        const r = barHeight + (25 * (i / bufferLength));
        const g = 250 * (i / bufferLength);
        const b = 50;
        
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    draw();
  };

  const toggleCell = (row, col) => {
    const newGrid = [...grid];
    newGrid[row] = [...newGrid[row]];
    newGrid[row][col] = !newGrid[row][col];
    setGrid(newGrid);

    if (newGrid[row][col]) {
      initAudio();
      const time = audioCtxRef.current.currentTime;
      const inst = INSTRUMENTS[row];
      if (inst.id === "kick") playKick(time);
      else if (inst.id === "snare") playSnare(time);
      else if (inst.id === "hihat") playHiHat(time);
      else if (inst.type === "bass") playBass(time, inst.freq);
      else if (inst.type === "synth") playSynth(time, inst.freq);
    }
  };

  const toggleMute = (rowIndex) => {
    const newMutes = [...mutes];
    newMutes[rowIndex] = !newMutes[rowIndex];
    setMutes(newMutes);
  };

  const clearGrid = () => {
    setGrid(INIT_GRID);
    setIsPlaying(false);
  };

  const loadPreset = (presetName) => {
    if (PRESETS[presetName]) {
      setGrid(PRESETS[presetName]);
    }
  };

  const saveLocal = () => {
    localStorage.setItem("beatmaker-pattern", JSON.stringify(grid));
    alert("Pattern saved to local storage!");
  };

  const loadLocal = () => {
    const saved = localStorage.getItem("beatmaker-pattern");
    if (saved) {
      setGrid(JSON.parse(saved));
    } else {
      alert("No saved pattern found.");
    }
  };

  const togglePlay = () => {
    initAudio();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="beatmaker-container">
      <canvas ref={canvasRef} className="beatmaker-visualizer" width="800" height="60" />

      <div className="beatmaker-controls">
        <button className="beatmaker-btn play-btn" onClick={togglePlay}>
          {isPlaying ? <><FiSquare /> STOP</> : <><FiPlay /> PLAY</>}
        </button>
        
        <div className="bpm-control">
          <label>BPM: {bpm}</label>
          <input 
            type="range" 
            min="60" max="200" 
            value={bpm} 
            onChange={(e) => setBpm(Number(e.target.value))}
          />
        </div>

        <div className="preset-controls">
          <select onChange={(e) => { if(e.target.value) loadPreset(e.target.value) }} className="preset-select">
            <option value="">Presets...</option>
            <option value="House">House Beat</option>
            <option value="Hip Hop">Hip Hop</option>
          </select>
          <button className="beatmaker-btn icon-btn" onClick={saveLocal} title="Save Pattern"><FiSave /></button>
          <button className="beatmaker-btn icon-btn" onClick={loadLocal} title="Load Pattern"><FiDownload /></button>
        </div>

        <button 
          className={`beatmaker-btn fx-btn ${delayEnabled ? 'fx-on' : ''}`} 
          onClick={() => { initAudio(); setDelayEnabled(!delayEnabled); }}
        >
          ECHO: {delayEnabled ? "ON" : "OFF"}
        </button>

        <button className="beatmaker-btn clear-btn" onClick={clearGrid}>
          <FiRefreshCcw /> CLEAR
        </button>
      </div>

      <div className="beatmaker-grid-wrapper">
        <div className="beatmaker-labels">
          {INSTRUMENTS.map((inst, idx) => (
            <div key={inst.id} className="beatmaker-label">
              <span className="mute-icon" onClick={() => toggleMute(idx)}>
                {mutes[idx] ? <FiVolumeX style={{color: '#ff4444'}}/> : <FiVolume2 />}
              </span>
              {inst.name}
            </div>
          ))}
        </div>
        
        <div className="beatmaker-grid">
          {grid.map((row, rowIndex) => {
            const instColor = INSTRUMENTS[rowIndex].color;
            return (
              <div key={rowIndex} className="beatmaker-row">
                {row.map((isActive, colIndex) => {
                  const isCurrentStep = isPlaying && currentStep === colIndex;
                  const isBeat = colIndex % 4 === 0;
                  return (
                    <div
                      key={colIndex}
                      className={`beatmaker-cell color-${instColor}
                        ${isActive ? "active" : ""} 
                        ${isCurrentStep ? "current" : ""}
                        ${isBeat ? "beat-marker" : ""}
                        ${mutes[rowIndex] ? "muted" : ""}
                      `}
                      onClick={() => toggleCell(rowIndex, colIndex)}
                    ></div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
