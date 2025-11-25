
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WelcomeFormProps {
  onNameSubmit: (name: string) => void;
}

export function WelcomeForm({ onNameSubmit }: WelcomeFormProps) {
  const [nameInput, setNameInput] = useState('');
  const [isEntering, setIsEntering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || isEntering) return;
    setIsEntering(true);
    onNameSubmit(nameInput.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 my-8 max-w-2xl mx-auto text-center animate-in fade-in duration-500">
      <label htmlFor="name-input" className="text-md sm:text-lg text-foreground/90 block">👋 Enter your name to awaken the system:</label>
      <Input
        id="name-input"
        type="text"
        placeholder="➡️ Your Name…"
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
        className="py-6 text-base text-center bg-background/80 w-full max-w-sm mx-auto"
        required
        autoComplete="name"
      />
      <Button type="submit" className={cn("w-full max-w-sm mx-auto text-lg py-6")} disabled={isEntering || !nameInput.trim()}>
        {isEntering ? 'Accessing...' : 'Begin Journey'}
      </Button>
    </form>
  );
}
