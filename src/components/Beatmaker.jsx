import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiPlay, FiSquare, FiRefreshCcw } from "react-icons/fi";

const NUM_STEPS = 16;
const INSTRUMENTS = [
  { id: "synth-a4", name: "Synth A4", type: "synth", freq: 440.0 },
  { id: "synth-g4", name: "Synth G4", type: "synth", freq: 392.0 },
  { id: "synth-e4", name: "Synth E4", type: "synth", freq: 329.63 },
  { id: "synth-d4", name: "Synth D4", type: "synth", freq: 293.66 },
  { id: "synth-c4", name: "Synth C4", type: "synth", freq: 261.63 },
  { id: "hihat", name: "Hi-Hat", type: "drum" },
  { id: "snare", name: "Snare", type: "drum" },
  { id: "kick", name: "Kick", type: "drum" },
];

const INIT_GRID = INSTRUMENTS.map(() => Array(NUM_STEPS).fill(false));

export default function Beatmaker() {
  const [grid, setGrid] = useState(INIT_GRID);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);

  const audioCtxRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const timerIDRef = useRef(null);
  const lookahead = 25.0; // ms
  const scheduleAheadTime = 0.1; // s

  // Initialize Audio Context on first interaction
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const playKick = (time) => {
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.start(time);
    osc.stop(time + 0.5);
  };

  const playSnare = (time) => {
    const ctx = audioCtxRef.current;
    // Tone
    const osc = ctx.createOscillator();
    const toneGain = ctx.createGain();
    osc.type = "triangle";
    osc.connect(toneGain);
    toneGain.connect(ctx.destination);

    osc.frequency.setValueAtTime(250, time);
    toneGain.gain.setValueAtTime(0.5, time);
    toneGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    osc.start(time);
    osc.stop(time + 0.2);

    // Noise
    const bufferSize = ctx.sampleRate * 0.2; // 0.2 seconds
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

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.start(time);
  };

  const playHiHat = (time) => {
    const ctx = audioCtxRef.current;
    const bufferSize = ctx.sampleRate * 0.1; // 0.1 seconds
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
    gain.connect(ctx.destination);

    noise.start(time);
  };

  const playSynth = (time, freq) => {
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(500, time);
    filter.frequency.exponentialRampToValueAtTime(3000, time + 0.1);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.3);
  };

  const scheduleNote = (stepNumber, time) => {
    // Schedule sounds for the given step
    INSTRUMENTS.forEach((inst, index) => {
      if (grid[index][stepNumber]) {
        if (inst.id === "kick") playKick(time);
        else if (inst.id === "snare") playSnare(time);
        else if (inst.id === "hihat") playHiHat(time);
        else if (inst.type === "synth") playSynth(time, inst.freq);
      }
    });

    // Update UI playhead
    // We defer the state update using setTimeout so it triggers roughly when the note plays
    const delay = time - audioCtxRef.current.currentTime;
    setTimeout(() => {
      setCurrentStep(stepNumber);
    }, delay * 1000);
  };

  const scheduler = useCallback(() => {
    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
      scheduleNote(currentStepRef.current, nextNoteTimeRef.current);
      // Advance to next step
      const secondsPerBeat = 60.0 / bpm;
      // 16th notes = 0.25 of a beat
      nextNoteTimeRef.current += 0.25 * secondsPerBeat;
      currentStepRef.current = (currentStepRef.current + 1) % NUM_STEPS;
    }
    timerIDRef.current = setTimeout(scheduler, lookahead);
  }, [bpm, grid]);

  useEffect(() => {
    if (isPlaying) {
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      // Start scheduler
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
      if (timerIDRef.current) {
        clearTimeout(timerIDRef.current);
      }
    };
  }, [isPlaying, scheduler]);

  const toggleCell = (row, col) => {
    const newGrid = [...grid];
    newGrid[row] = [...newGrid[row]];
    newGrid[row][col] = !newGrid[row][col];
    setGrid(newGrid);

    // Play a preview of the sound if turning it ON
    if (newGrid[row][col]) {
      initAudio();
      const time = audioCtxRef.current.currentTime;
      const inst = INSTRUMENTS[row];
      if (inst.id === "kick") playKick(time);
      else if (inst.id === "snare") playSnare(time);
      else if (inst.id === "hihat") playHiHat(time);
      else if (inst.type === "synth") playSynth(time, inst.freq);
    }
  };

  const clearGrid = () => {
    setGrid(INIT_GRID);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    initAudio();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="beatmaker-container">
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

        <button className="beatmaker-btn clear-btn" onClick={clearGrid}>
          <FiRefreshCcw /> CLEAR
        </button>
      </div>

      <div className="beatmaker-grid-wrapper">
        <div className="beatmaker-labels">
          {INSTRUMENTS.map((inst) => (
            <div key={inst.id} className="beatmaker-label">
              {inst.name}
            </div>
          ))}
        </div>
        
        <div className="beatmaker-grid">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="beatmaker-row">
              {row.map((isActive, colIndex) => {
                const isCurrentStep = isPlaying && currentStep === colIndex;
                const isBeat = colIndex % 4 === 0;
                return (
                  <div
                    key={colIndex}
                    className={`beatmaker-cell 
                      ${isActive ? "active" : ""} 
                      ${isCurrentStep ? "current" : ""}
                      ${isBeat ? "beat-marker" : ""}
                    `}
                    onClick={() => toggleCell(rowIndex, colIndex)}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
