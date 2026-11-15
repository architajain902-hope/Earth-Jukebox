import React, { useState } from 'react';
import type { AnomalyRecord } from '../data/types';
import { anomalyToFrequency, frequencyToNoteName } from '../audio/sonify';
import { audioEngine } from '../audio/engine';

interface ClassroomModalProps {
  data: AnomalyRecord[];
  onSetYear: (year: number) => void;
  onClose: () => void;
}

interface LessonStep {
  title: string;
  year?: number;
  explanation: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanationOnAnswer: string;
}

export default function ClassroomModal({
  data,
  onSetYear,
  onClose,
}: ClassroomModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [isPlayingStepAudio, setIsPlayingStepAudio] = useState<boolean>(false);

  const latestRecord = data[data.length - 1] ?? { year: 2025, anomaly: 1.19 };

  const LESSON_STEPS: LessonStep[] = [
    {
      title: 'Step 1: What is a Temperature Anomaly?',
      explanation:
        'Scientists at NASA do not measure absolute temperatures like 15.3 °C across the entire planet because weather stations vary by elevation and local climate. Instead, they measure ANOMALIES: how much warmer or cooler a year is compared to a long-term reference period. An anomaly of +1.0 °C means the planet was one full degree warmer than normal.',
      question: 'What does a temperature anomaly of −0.20 °C indicate?',
      options: [
        'The entire planet was exactly freezing (−0.2 °C)',
        'The planet was 0.20 °C cooler than the long-term baseline reference',
        'A measurement error occurred at the weather station',
      ],
      correctIndex: 1,
      explanationOnAnswer:
        'Correct! An anomaly measures the relative difference (departure) from the reference baseline, not the absolute thermometer reading.',
    },
    {
      title: 'Step 2: What is the 1951–1980 Baseline?',
      explanation:
        'NASA GISTEMP uses the 30-year period from 1951 to 1980 as its official climatological baseline. Thirty years is standard in atmospheric science because it averages out short-term fluctuations like El Niño or volcanic eruptions, establishing a reliable "zero point".',
      question: 'Why do climatologists use a 30-year baseline average?',
      options: [
        'To smooth out natural short-term variability and define a stable reference',
        'Because older thermometers did not work before 1951',
        'To make global warming appear slower than it is',
      ],
      correctIndex: 0,
      explanationOnAnswer:
        'Exactly! A 30-year normal period smooths out year-to-year noise while providing sufficient historical overlap across worldwide observation networks.',
    },
    {
      title: 'Step 3: Listen to 1880 (The Beginning of Modern Records)',
      year: 1880,
      explanation:
        'In 1880, modern thermometer coverage became dense enough for global analysis. The anomaly was negative (−0.18 °C). In our sonification engine, cooler temperatures produce deeper pitches. Listen to the 1880 tone: it is low on the musical scale (around 337 Hz, note E4).',
      question: 'In SONIX, what happens to musical pitch as global anomaly decreases below zero?',
      options: [
        'The sound gets louder',
        'The musical pitch becomes lower in frequency (Hz)',
        'The sound plays backward',
      ],
      correctIndex: 1,
      explanationOnAnswer:
        'Correct! Lower temperature anomalies map linearly to lower audio frequencies, down to 220 Hz at −0.50 °C.',
    },
    {
      title: 'Step 4: Listen to 1976 (The Inflection Point)',
      year: 1976,
      explanation:
        '1976 was one of the last years with a cooler-than-average global anomaly (−0.08 °C). After 1976, greenhouse gas emissions accelerated, and global temperatures began a rapid, uninterrupted climb. Notice how the tone begins shifting upward from the baseline.',
      question: 'What began happening to global annual temperatures after the late 1970s?',
      options: [
        'Temperatures started climbing continuously with almost every year above baseline',
        'Temperatures dropped dramatically into a new ice age',
        'Global temperatures completely stopped fluctuating',
      ],
      correctIndex: 0,
      explanationOnAnswer:
        'Spot on. Since 1977, every single year has been warmer than the 1951–1980 baseline, driving the synthesized pitch steadily higher.',
    },
    {
      title: `Step 5: Listen to ${latestRecord.year} (Record High Pitch)`,
      year: latestRecord.year,
      explanation:
        `Recent years have shattered global heat records, with anomalies exceeding +1.20 °C above the baseline. In our jukebox, this pushes the audio frequency toward 880 Hz (musical note A5). The pitch is dramatically higher than 1880, translating the physical accumulation of planetary thermal energy directly into sound.`,
      question: 'Why does SONIX use real mathematical mapping instead of randomized music?',
      options: [
        'Because randomized music is illegal in web browsers',
        'Scientific honesty: so every pitch change directly represents real NASA physical measurements',
        'To save computer memory and bandwidth',
      ],
      correctIndex: 1,
      explanationOnAnswer:
        'Brilliant! Scientific honesty is our core pillar: every frequency is calculated deterministically from verified NASA data, translating sight into sound.',
    },
  ];

  const current = LESSON_STEPS[currentStep];

  const playStepAudio = () => {
    if (current.year) {
      onSetYear(current.year);
      const rec = data.find((d) => d.year === current.year);
      if (rec) {
        setIsPlayingStepAudio(true);
        audioEngine.playTone(rec.anomaly, 1.8);
        setTimeout(() => setIsPlayingStepAudio(false), 1900);
      }
    }
  };

  const handleSelectOption = (idx: number) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);
  };

  const handleNextStep = () => {
    setSelectedOption(null);
    setHasAnswered(false);
    if (currentStep < LESSON_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onClose();
    }
  };

  const isCorrect = selectedOption === current.correctIndex;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 10, 20, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Classroom Guided Mode"
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: 620,
          padding: 26,
          maxHeight: '92vh',
          overflowY: 'auto',
          border: '1px solid rgba(0, 212, 255, 0.35)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🎓</span>
            <h2 style={{ fontSize: 18, color: '#FFFFFF', margin: 0 }}>
              Classroom & Guided Lesson
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Exit classroom mode"
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Progress Dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {LESSON_STEPS.map((s, idx) => (
            <div
              key={s.title}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background:
                  idx === currentStep
                    ? '#00D4FF'
                    : idx < currentStep
                    ? '#0B3D91'
                    : 'rgba(255, 255, 255, 0.1)',
                transition: 'background 0.2s ease',
              }}
            />
          ))}
        </div>

        {/* Step Title & Explanation */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, color: '#00D4FF', marginBottom: 8, margin: 0 }}>
            {current.title}
          </h3>
          <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, marginTop: 8 }}>
            {current.explanation}
          </p>

          {current.year && (
            <div style={{ marginTop: 10 }}>
              <button
                onClick={playStepAudio}
                disabled={isPlayingStepAudio}
                style={{
                  padding: '7px 16px',
                  background: isPlayingStepAudio ? 'rgba(0, 212, 255, 0.3)' : 'rgba(11, 61, 145, 0.6)',
                  border: '1px solid #00D4FF',
                  borderRadius: 6,
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  cursor: isPlayingStepAudio ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>🔊</span>
                <span>{isPlayingStepAudio ? 'Playing...' : `Listen to ${current.year} Tone`}</span>
              </button>
            </div>
          )}
        </div>

        {/* Interactive Quiz Question */}
        <div
          style={{
            background: 'rgba(11, 29, 58, 0.6)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>
            Quick Check:
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#FFFFFF', marginBottom: 12 }}>
            {current.question}
          </div>

          {/* Option buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {current.options.map((opt, idx) => {
              let bg = 'rgba(11, 29, 58, 0.5)';
              let borderColor = 'rgba(255, 255, 255, 0.12)';
              let color = '#CBD5E1';

              if (hasAnswered) {
                if (idx === current.correctIndex) {
                  bg = 'rgba(34, 197, 94, 0.25)';
                  borderColor = '#22C55E';
                  color = '#FFFFFF';
                } else if (idx === selectedOption) {
                  bg = 'rgba(239, 68, 68, 0.25)';
                  borderColor = '#EF4444';
                  color = '#FFFFFF';
                }
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(idx)}
                  disabled={hasAnswered}
                  style={{
                    padding: '9px 12px',
                    textAlign: 'left',
                    borderRadius: 6,
                    border: `1px solid ${borderColor}`,
                    background: bg,
                    color: color,
                    fontSize: 12.5,
                    cursor: hasAnswered ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontWeight: 600, marginRight: 6 }}>
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {hasAnswered && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                borderRadius: 6,
                background: isCorrect ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${isCorrect ? '#22C55E' : '#EF4444'}`,
                fontSize: 12,
                color: '#E0F2FE',
                lineHeight: 1.4,
              }}
            >
              <strong style={{ color: isCorrect ? '#22C55E' : '#EF4444' }}>
                {isCorrect ? '✓ Correct! ' : '✗ Incorrect. '}
              </strong>
              {current.explanationOnAnswer}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => {
              if (currentStep > 0) {
                setCurrentStep((s) => s - 1);
                setSelectedOption(null);
                setHasAnswered(false);
              }
            }}
            disabled={currentStep === 0}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 6,
              color: currentStep === 0 ? '#4A5568' : '#94A3B8',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              fontSize: 12,
            }}
          >
            ← Previous Step
          </button>

          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#64748B' }}>
            {currentStep + 1} of {LESSON_STEPS.length}
          </span>

          <button
            onClick={handleNextStep}
            style={{
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #0B3D91, #00D4FF)',
              border: 'none',
              borderRadius: 6,
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            {currentStep === LESSON_STEPS.length - 1 ? 'Finish Lesson ✓' : 'Next Step →'}
          </button>
        </div>
      </div>
    </div>
  );
}
