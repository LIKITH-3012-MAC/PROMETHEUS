
'use client';

import { useState, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wand2, Loader2, Sparkles, Clipboard, Check, Image as ImageIcon, Upload, Download } from 'lucide-react';
import Image from 'next/image';
import { FormattedContent } from '@/components/formatted-content';
import { Rating } from '@/components/rating';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { imageToTextAction } from '@/lib/actions';
import { downloadAsPdf } from '@/lib/utils';

const EXTRACTED_TEXT_BOX_ID = 'image-to-text-result';

export default function ImageToText() {
  const [isLoading, setIsLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(URL.createObjectURL(file));
        setImageDataUri(dataUri);
        setExtractedText('');
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit() {
    if (!imageDataUri) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please upload an image first.',
      });
      return;
    }

    setIsLoading(true);
    setExtractedText('');
    setIsCopied(false);

    const result = await imageToTextAction({ imageDataUri });

    if (result && 'error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else if (result) {
      setExtractedText(result.text);
    }
    
    setIsLoading(false);
  }

  const handleCopy = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText);
      toast({
        title: 'Copied!',
        description: 'The extracted text has been copied to your clipboard.',
      });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <Card className="w-full transform-gpu transition-all duration-300 ease-in-out hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold cosmic-gradient-text">Image to Text</CardTitle>
        </div>
        <CardDescription>Upload an image and our AI will extract the text from it.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div 
            className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer border-primary/30 bg-muted/50 hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
            />
            {imagePreview ? (
              <Image src={imagePreview} alt="Image preview" fill className="object-contain rounded-lg p-2" />
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-foreground/70">
                <Upload className="w-10 h-10 mb-2" />
                <p className="font-semibold">Click to upload or drag and drop</p>
                <p className="text-sm">PNG, JPG or WEBP</p>
              </div>
            )}
          </div>

          <Button onClick={onSubmit} disabled={isLoading || !imagePreview} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Extract Text
              </>
            )}
          </Button>
        </div>

        {extractedText && (
          <div className="mt-8 space-y-4 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-glow">Extracted Text</h3>
                </div>
                 <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handleCopy} className='h-8 w-8 text-foreground/50 hover:text-foreground'>
                    {isCopied ? <Check className="h-4 w-4 text-primary" /> : <Clipboard className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadAsPdf(EXTRACTED_TEXT_BOX_ID, 'extracted-text.pdf')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            <div id={EXTRACTED_TEXT_BOX_ID} className="rounded-md border bg-muted/50 p-4 max-h-[400px] overflow-y-auto">
              <FormattedContent content={extractedText} />
            </div>
            <Rating featureName="Image to Text" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
