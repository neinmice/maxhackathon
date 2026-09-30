import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import type { StoryItem, StorySlide } from './StoriesBar';
import { triggerHaptic } from '../../lib/maxBridge';

interface StoryModalProps {
  story: StoryItem;
  onClose: () => void;
  onOpenMeasure: (measureId: string) => void;
  onOpenCatalog: () => void;
  onOpenQuiz: () => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({
  story,
  onClose,
  onOpenMeasure,
  onOpenCatalog,
  onOpenQuiz,
}) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const currentSlide: StorySlide = story.slides[slideIndex] || story.slides[0];
  const slideDuration = 6000; // 6 seconds per slide
  const stepInterval = 60; // ms

  useEffect(() => {
    if (isPaused) return;

    timerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + (stepInterval / slideDuration) * 100;
        if (next >= 100) {
          if (slideIndex < story.slides.length - 1) {
            setSlideIndex((s) => s + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return next;
      });
    }, stepInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slideIndex, isPaused, story.slides.length, onClose]);

  const handleNext = () => {
    triggerHaptic('light');
    if (slideIndex < story.slides.length - 1) {
      setSlideIndex((s) => s + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    triggerHaptic('light');
    if (slideIndex > 0) {
      setSlideIndex((s) => s - 1);
      setProgress(0);
    }
  };

  const handleCta = () => {
    triggerHaptic('medium');
    onClose();
    if (currentSlide.ctaAction === 'open_measure' && currentSlide.targetMeasureId) {
      onOpenMeasure(currentSlide.targetMeasureId);
    } else if (currentSlide.ctaAction === 'open_quiz') {
      onOpenQuiz();
    } else {
      onOpenCatalog();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 110,
      background: '#0a0514',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 'max(14px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom)) 16px',
    }}>
      {/* Top Header & Progress bars */}
      <div style={{ zIndex: 10 }}>
        {/* Progress indicators */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {story.slides.map((_, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: 3,
                background: 'rgba(255, 255, 255, 0.25)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: '#ffd21e',
                  width: idx === slideIndex ? `${progress}%` : idx < slideIndex ? '100%' : '0%',
                  transition: idx === slideIndex ? 'width 60ms linear' : 'none',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Title & Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-yellow">
              {currentSlide.tag}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2dcf3' }}>
              ZVERY · Навигатор
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#fff',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Slide Card (Liquid Glass with ambient backdrop) */}
      <div
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        style={{
          position: 'relative',
          flex: 1,
          margin: '20px 0',
          borderRadius: 24,
          background: currentSlide.bgGradient,
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Left/Right Tap Zones for Navigation */}
        <div
          onClick={handlePrev}
          style={{ position: 'absolute', top: 0, left: 0, width: '35%', bottom: 0, zIndex: 5 }}
        />
        <div
          onClick={handleNext}
          style={{ position: 'absolute', top: 0, right: 0, width: '65%', bottom: 0, zIndex: 5 }}
        />

        <div style={{ position: 'relative', zIndex: 6, pointerEvents: 'none' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#ffd21e', marginBottom: 6 }}>
            {currentSlide.title}
          </h2>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 16 }}>
            {currentSlide.subtitle}
          </h3>
          <p style={{ fontSize: 14, color: '#e2dcf3', marginBottom: 20, lineHeight: 1.5 }}>
            {currentSlide.description}
          </p>

          {currentSlide.points && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentSlide.points.map((pt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle2 size={16} color="#ffd21e" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: '#f5f2ff', fontWeight: 500 }}>
                    {pt}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA Button */}
      {currentSlide.ctaLabel && (
        <div style={{ zIndex: 10 }}>
          <button
            type="button"
            onClick={handleCta}
            className="btn-primary"
            style={{ width: '100%', fontSize: 15, padding: 14 }}
          >
            <span>{currentSlide.ctaLabel}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
