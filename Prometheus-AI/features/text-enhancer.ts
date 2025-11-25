
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wand2, Loader2, Sparkles, Clipboard, Check, Download } from 'lucide-react';
import { FormattedContent } from '@/components/formatted-content';
import { Rating } from '@/components/rating';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { enhanceTextAction } from '@/lib/actions';
import { downloadAsPdf } from '@/lib/utils';

const formSchema = z.object({
  text: z.string().min(10, {
    message: 'Please enter at least 10 characters to enhance.',
  }),
});

const IMPROVED_TEXT_BOX_ID = "improved-text";


export default function TextEnhancer() {
  const [isLoading, setIsLoading] = useState(false);
  const [improvedText, setImprovedText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const answerBoxRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: '',
    },
  });

  useEffect(() => {
    if (improvedText && answerBoxRef.current) {
      answerBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [improvedText]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setImprovedText('');
    setIsCopied(false);

    const result = await enhanceTextAction(values);

    if (result && 'error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else if (result && result.improvedText) {
      setImprovedText(result.improvedText);
    } else {
      setImprovedText("Could not enhance the text. Please try again with different content.");
    }
    
    setIsLoading(false);
  }

  const handleCopy = () => {
    if (improvedText) {
      navigator.clipboard.writeText(improvedText);
      toast({
        title: 'Copied!',
        description: 'The improved text has been copied to your clipboard.',
      });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <Card className="w-full transform-gpu transition-all duration-300 ease-in-out hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
            <Wand2 className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold cosmic-gradient-text">AI Text Enhancer</CardTitle>
        </div>
        <CardDescription>Enter your text below and let our AI improve its clarity, tone, and style.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., I think we should probably consider maybe looking into new markets sometime soon."
                      className="min-h-[150px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Enhance Text
                </>
              )}
            </Button>
          </form>
        </Form>
        {improvedText && (
          <div ref={answerBoxRef} className="mt-8 space-y-4 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-glow">Improved Text</h3>
                </div>
                 <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handleCopy} className='h-8 w-8 text-foreground/50 hover:text-foreground'>
                    {isCopied ? <Check className="h-4 w-4 text-primary" /> : <Clipboard className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadAsPdf(IMPROVED_TEXT_BOX_ID, 'enhanced-text.pdf')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            <div className="rounded-md border bg-muted/50 p-4 max-h-[500px] overflow-y-auto">
              <FormattedContent id={IMPROVED_TEXT_BOX_ID} content={improvedText} />
            </div>
            <Rating featureName="Text Enhancer" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
