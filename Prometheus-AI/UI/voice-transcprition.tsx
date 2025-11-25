
'use client';

import { useState, useRef, type RefObject } from 'react';
import { Mic, Loader2, Type, Square, Clipboard, Check, Download } from 'lucide-react';
import { Rating } from '@/components/rating';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { transcribeAudioAction } from '@/lib/actions';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { downloadAsPdf } from '@/lib/utils';

type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

const TRANSCRIPTION_BOX_ID = 'transcription-box';

export default function VoiceTranscription() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcription, setTranscription] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [removeFillerWords, setRemoveFillerWords] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleStartRecording = async () => {
    setTranscription('');
    setIsCopied(false);
    setRecordingState('recording');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setRecordingState('processing');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          
          const result = await transcribeAudioAction({
            audioDataUri: base64Audio,
            removeFillerWords,
          });

          if (result && 'error' in result) {
            toast({
              variant: 'destructive',
              title: 'Transcription Error',
              description: result.error,
            });
            setRecordingState('error');
          } else if(result) {
            setTranscription(result.transcription);
            setRecordingState('idle');
          }
        };
      };

      mediaRecorderRef.current.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        variant: 'destructive',
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
      });
      setRecordingState('error');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleCopy = () => {
    if (transcription) {
      navigator.clipboard.writeText(transcription);
      toast({
        title: 'Copied!',
        description: 'The transcription has been copied to your clipboard.',
      });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';

  return (
    <Card className="w-full transform-gpu transition-all duration-300 ease-in-out hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
            <Mic className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">Voice Transcription</CardTitle>
        </div>
        <CardDescription>Record your voice and our AI will transcribe it into text for you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8 bg-muted rounded-lg">
          <Button
            onClick={handleStartRecording}
            disabled={isRecording || isProcessing}
            size="lg"
            className="w-full sm:w-48"
          >
            {isRecording ? (
              <>
                <span className="relative flex h-3 w-3 mr-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Recording...
              </>
            ) : (
               <>
                <Mic className="mr-2 h-5 w-5" />
                 Start Recording
               </>
            )}
          </Button>
          <Button
            onClick={handleStopRecording}
            disabled={!isRecording || isProcessing}
            variant="outline"
            size="lg"
            className="w-full sm:w-48"
          >
            <Square className="mr-2 h-5 w-5" />
            Stop Recording
          </Button>
        </div>

        <div className="flex items-center space-x-2">
            <Checkbox 
              id="remove-fillers"
              checked={removeFillerWords}
              onCheckedChange={(checked) => setRemoveFillerWords(!!checked)}
              disabled={isRecording || isProcessing}
            />
            <Label htmlFor="remove-fillers" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Remove filler words (e.g., 'um', 'uh')
            </Label>
        </div>

        {isProcessing && (
          <div className="flex items-center justify-center text-muted-foreground pt-4">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing audio... Please wait.
          </div>
        )}

        {transcription && (
          <div className="space-y-4 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Type className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Transcription</h3>
                </div>
                 <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handleCopy} className='h-8 w-8 text-foreground/50 hover:text-foreground'>
                    {isCopied ? <Check className="h-4 w-4 text-primary" /> : <Clipboard className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => downloadAsPdf(TRANSCRIPTION_BOX_ID, 'transcription.pdf')} className='h-8 w-8 text-foreground/50 hover:text-foreground'>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            <div id={TRANSCRIPTION_BOX_ID} className="rounded-md border bg-muted p-4">
              <p className="whitespace-pre-wrap break-words">{transcription}</p>
            </div>
            <Rating featureName="Voice Transcription" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
