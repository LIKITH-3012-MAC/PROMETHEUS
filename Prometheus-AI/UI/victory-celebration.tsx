'use client';

import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Award } from 'lucide-react';

interface VictoryCelebrationProps {
  winnerName: string;
}

export function VictoryCelebration({ winnerName }: VictoryCelebrationProps) {
  const { width, height } = useWindowSize();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 7000); // Celebration lasts for 7 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!show) {
    return null;
  }

  return (
    <>
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={400}
        gravity={0.15}
        initialVelocityY={20}
        tweenDuration={8000}
      />
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10 flex items-center justify-center animate-in fade-in-0 duration-500">
        <div className="text-center text-white p-8 rounded-xl bg-primary/50 border-2 border-primary/80 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
            <Award className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
            <h2 className="text-4xl md:text-5xl font-bold text-glow">Congratulations!</h2>
            <p className="text-2xl md:text-3xl mt-2 font-semibold cosmic-gradient-text">{winnerName} Won!</p>
        </div>
      </div>
    </>
  );
}
