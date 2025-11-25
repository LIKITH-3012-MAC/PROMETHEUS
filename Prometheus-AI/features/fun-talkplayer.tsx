
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { generateFunTalksAction } from '@/lib/actions';
import { Loader2, Mic, Play, Info, BookText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Rating } from '../rating';


const episodes = [
  { id: 'meme_maestro', telugu: 'మేమ్ మాస్టరు', english: 'This week’s viral memes with funny commentary.' },
  { id: 'celebrity_roast', telugu: 'సెలెబ్రిటీ రోస్ట్', english: 'Funny and light-hearted roasts of actors and actresses.' },
  { id: 'gaming_fails', telugu: 'గేమింగ్ ఫెయిల్స్', english: 'Cringe-worthy and hilarious gaming fails.' },
  { id: 'tiktok_trends', telugu: 'టిక్‌టాక్ ఫన్నీ ట్రెండ్స్', english: 'Funny reviews of trending TikTok videos.' },
  { id: 'childhood_funnies', telugu: 'చైల్డ్‌హుడ్ ఫన్నీస్', english: 'Funny and embarrassing childhood memories.' },
  { id: 'ai_fails', telugu: 'AI పొరపాట్లు', english: 'Hilarious AI guesses, mistakes, and reactions.' },
  { id: 'likith_pun_hour', telugu: 'లికిత్ పన్ హవర్', english: 'Telugu puns, witty wordplay, and jokes.' },
  { id: 'movie_misquotes', telugu: 'మూవీ మిస్క్వోట్స్', english: 'Misheard movie dialogues and hilarious bloopers.' },
  { id: 'music_fails', telugu: 'మ్యూజిక్ ఫెయిల్స్', english: 'Funny music covers, auto-tune disasters, and viral songs.' },
  { id: 'internet_oddities', telugu: 'ఇంటర్నెట్ వింతలు', english: 'Weird online viral happenings explained humorously.' },
  { id: 'prank_recap', telugu: 'ప్రాంక్ రీక్యాప్', english: 'Funny narration of YouTube and social media pranks.' },
  { id: 'laugh_attack_quiz', telugu: 'లాఫ్ అటాక్ క్విజ్', english: 'Silly and funny pop culture trivia quiz.' },
  { id: 'animated_lols', telugu: 'యానిమేటెడ్ LOLs', english: 'Funny reviews of cartoons and animated shows.' },
  { id: 'pop_culture_fails', telugu: 'పాప్ కల్చర్ ఫెయిల్స్', english: 'Funny mistakes by celebrities or influencers.' },
  { id: 'fan_feedback_funnies', telugu: 'ఫ్యాన్ ఫీడ్‌బ్యాక్ ఫన్నీస్', english: 'Hilarious listener stories, fails, and comments.' },
];

export default function FunTalksPlayer() {
  const [selectedEpisodes, setSelectedEpisodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioDataUri, setAudioDataUri] = useState('');
  const [script, setScript] = useState('');
  const { toast } = useToast();

  const handleSelectionChange = (episodeId: string) => {
    setSelectedEpisodes(prev =>
      prev.includes(episodeId)
        ? prev.filter(id => id !== episodeId)
        : [...prev, episodeId]
    );
  };

  const handleGenerateAudio = async () => {
    if (selectedEpisodes.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No episodes selected',
        description: 'Please select at least one episode to play.',
      });
      return;
    }

    setIsLoading(true);
    setAudioDataUri('');
    setScript('');

    const selectedEpisodeObjects = episodes.filter(e => selectedEpisodes.includes(e.id))
      .map(({telugu, english}) => ({telugu, english}));

    const result = await generateFunTalksAction({ episodes: selectedEpisodeObjects });

    if (result && 'error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error generating audio',
        description: result.error,
      });
    } else if (result) {
      setAudioDataUri(result.audioDataUri);
      setScript(result.script);
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="w-full transform-gpu transition-all duration-300 ease-in-out hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
            <Mic className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">Fun Talks with Prometheus</CardTitle>
        </div>
        <CardDescription>Select comedy episodes, and our AI will generate a bilingual podcast for you.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label className="text-lg font-semibold">Choose Your Episodes</Label>
            <ScrollArea className="h-72 mt-2 rounded-md border p-4 bg-muted/50">
              <div className="space-y-4">
                {episodes.map(episode => (
                  <div key={episode.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={episode.id}
                      checked={selectedEpisodes.includes(episode.id)}
                      onCheckedChange={() => handleSelectionChange(episode.id)}
                    />
                    <label
                      htmlFor={episode.id}
                      className="flex flex-col text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <span>{episode.telugu}</span>
                      <span className="text-xs text-muted-foreground">{episode.english}</span>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <Alert className="border-primary/30 text-primary-foreground bg-primary/10">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-primary/90">
              For best results, please select 3-4 episodes at a time. Selecting too many may cause a server error.
            </AlertDescription>
          </Alert>

          <Button onClick={handleGenerateAudio} disabled={isLoading || selectedEpisodes.length === 0} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Podcast...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate Podcast
              </>
            )}
          </Button>
        </div>

        {(audioDataUri || script) && (
          <div className="mt-8 space-y-6 animate-in fade-in duration-500">
            {audioDataUri && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">Generated Podcast</h3>
                    </div>
                    <div className="rounded-md border bg-muted p-4">
                        <audio controls autoPlay src={audioDataUri} className="w-full">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                </div>
            )}
            
            {script && (
                 <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <BookText className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Generated Script</h3>
                    </div>
                    <ScrollArea className="h-48 rounded-md border bg-muted/50 p-4">
                         <p className="whitespace-pre-wrap break-words text-sm">{script}</p>
                    </ScrollArea>
                 </div>
            )}
            <Rating featureName="Fun Talks Player" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
