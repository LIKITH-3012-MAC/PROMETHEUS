
'use client';

import { useState, useEffect } from 'react';
import { Star, Loader2, Cookie, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { submitRatingAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface RatingProps {
  featureName: string;
  messageId?: number; // Optional, for unique identification within a feature like chatbot
}

type RatingStep = 'consent' | 'name' | 'rating' | 'submitted';

export function Rating({ featureName, messageId }: RatingProps) {
  const [step, setStep] = useState<RatingStep>('rating');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const consent = localStorage.getItem('review_cookie_consent');
    const savedName = localStorage.getItem('review_user_name');
    
    if (consent !== 'true') {
      setStep('consent');
    } else if (savedName) {
      setName(savedName);
      setStep('rating');
    } else {
      setStep('name');
    }
  }, []);


  const handleConsent = () => {
    localStorage.setItem('review_cookie_consent', 'true');
    setStep('name');
  }
  
  const handleNameSubmit = () => {
     if (name.trim()) {
        localStorage.setItem('review_user_name', name.trim());
        setStep('rating');
     } else {
        toast({variant: 'destructive', title: 'Name is required'});
     }
  }

  const handleRatingClick = (rate: number) => {
    setRating(rate);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
       toast({
        variant: 'destructive',
        title: 'Please select a rating',
        description: 'You must select at least one star to submit your feedback.',
      });
      return;
    }
    
    setIsLoading(true);
    setStep('submitted'); // Optimistic UI update

    const result = await submitRatingAction({ featureName, rating, feedback, name });
    
    setIsLoading(false);

    if (result && 'error' in result) {
      toast({
        variant: 'destructive',
        title: '⚠️ Couldn’t save review.',
        description: `${result.error} Please try again.`,
      });
      setStep('rating'); // Revert UI if submission fails
    }
  };

  const renderContent = () => {
    switch(step) {
      case 'consent':
        return (
          <div className="text-center space-y-4 max-w-sm mx-auto">
            <Cookie className="h-8 w-8 text-primary mx-auto" />
            <p className="text-sm font-medium text-foreground/80">
                “We use cookies to enhance your experience and store your reviews permanently. By accepting, you agree that your feedback will be saved along with your name for future improvements.”
            </p>
            <Button onClick={handleConsent} size="sm">Accept & Continue</Button>
          </div>
        );

      case 'name':
         return (
          <div className="w-full max-w-sm space-y-4 text-center">
            <User className="h-8 w-8 text-primary mx-auto" />
            <Label htmlFor="name" className="font-medium">Please enter your name to leave a review</Label>
            <Input 
                id="name"
                placeholder="Your Name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                className='text-sm h-10'
            />
            <Button onClick={handleNameSubmit} size="sm" className="w-full">Continue</Button>
          </div>
        );

      case 'rating':
        return (
           <div className="w-full flex flex-col items-center gap-4">
             <p className="text-sm font-medium text-foreground/80">How was your experience with {featureName}, {name}?</p>
            {/* Stars */}
            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={isLoading}
                >
                    <Star
                    className={cn(
                        'w-6 h-6 transition-colors',
                        (hoverRating || rating) >= star
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-foreground/30'
                    )}
                    />
                </button>
                ))}
            </div>

            <div className='w-full max-w-sm space-y-4'>
                <div>
                    <Label htmlFor="feedback" className="text-xs text-foreground/80 mb-2">Feedback (Optional)</Label>
                    <Textarea 
                        id="feedback"
                        placeholder="Share your experience or suggestions..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className='text-sm'
                        disabled={isLoading}
                    />
                </div>
            </div>
            
            {/* Submit Button */}
            <Button onClick={handleSubmit} disabled={isLoading || rating === 0} size="sm">
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    'Submit Feedback'
                )}
            </Button>
           </div>
        );

      case 'submitted':
         return (
            <div className="flex items-center justify-center text-sm text-center text-foreground/80">
                <p>✅ Thank you, {name}! Your feedback has been submitted successfully.</p>
            </div>
        );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4 border-t border-primary/20 mt-6 min-h-[220px]">
        {renderContent()}
    </div>
  );
}
