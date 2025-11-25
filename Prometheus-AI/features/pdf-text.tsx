
'use client';

import { useState, useRef, useEffect } from 'react';
import { Wand2, Loader2, Sparkles, Clipboard, Check, File, Upload, Download } from 'lucide-react';
import { Rating } from '@/components/rating';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { pdfToTextAction } from '@/lib/actions';
import { downloadAsPdf } from '@/lib/utils';
import { FormattedContent } from '@/components/formatted-content';

const EXTRACTED_TEXT_BOX_ID = 'pdf-to-text-result';

export default function PdfToText() {
  const [isLoading, setIsLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const answerBoxRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (extractedText && answerBoxRef.current) {
      answerBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [extractedText]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setFileName(file.name);
        setPdfDataUri(dataUri);
        setExtractedText('');
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: 'Please upload a valid PDF file.',
      });
    }
  };

  async function onSubmit() {
    if (!pdfDataUri) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please upload a PDF file first.',
      });
      return;
    }

    setIsLoading(true);
    setExtractedText('');
    setIsCopied(false);

    const result = await pdfToTextAction({ pdfDataUri });

    if (result && 'error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else if (result && result.text) {
      setExtractedText(result.text);
    } else {
      setExtractedText("Could not extract text from the PDF. Please ensure the PDF contains selectable text and is not just an image.");
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
            <File className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold cosmic-gradient-text">PDF Text Extractor</CardTitle>
        </div>
        <CardDescription>Upload a PDF and our AI will extract the text from it.</CardDescription>
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
              onChange={handleFileChange}
              className="hidden"
              accept="application/pdf"
            />
            {fileName ? (
              <div className="flex flex-col items-center justify-center text-center text-foreground">
                <File className="w-12 h-12 mb-3 text-primary" />
                <p className="font-semibold">{fileName}</p>
                 <p className="text-sm text-foreground/70 mt-2">Click to change file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-foreground/70">
                <Upload className="w-10 h-10 mb-2" />
                <p className="font-semibold">Click to upload a PDF</p>
                <p className="text-sm">Max file size: 20MB</p>
              </div>
            )}
          </div>

          <Button onClick={onSubmit} disabled={isLoading || !pdfDataUri} className="w-full sm:w-auto">
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
          <div ref={answerBoxRef} className="mt-8 space-y-4 animate-in fade-in duration-500">
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
            <Rating featureName="PDF to Text" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
