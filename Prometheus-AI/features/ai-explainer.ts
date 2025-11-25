
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wand2, Loader2, Sparkles, HelpCircle, Download, FileText, Code, Rocket, Lightbulb, Check } from 'lucide-react';
import { FormattedContent } from '@/components/formatted-content';
import { Rating } from '@/components/rating';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { aiExplainerAction, type AiExplainerOutput } from '@/lib/actions';
import { downloadAsPdf } from '@/lib/utils';
import { Badge } from '../ui/badge';

const formSchema = z.object({
  question: z.string().min(10, {
    message: 'Please enter at least 10 characters.',
  }),
});

const ANSWER_BOX_ID = "ai-explainer-answer";

export default function AiExplainer() {
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<AiExplainerOutput | null>(null);
  const { toast } = useToast();
  const answerBoxRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
    },
  });

  useEffect(() => {
    if (explanation && answerBoxRef.current) {
      answerBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [explanation]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setExplanation(null);

    const result = await aiExplainerAction(values);

    if (result && 'error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else if (result) {
      setExplanation(result);
    }
    
    setIsLoading(false);
  }

  return (
    <Card className="w-full transform-gpu transition-all duration-300 ease-in-out hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold cosmic-gradient-text">AI Explainer</CardTitle>
        </div>
        <CardDescription>Ask any question and get a clear, structured explanation from our advanced AI.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Question</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Explain quantum computing in simple terms."
                      className="min-h-[100px] resize-none"
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
                  Thinking...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Get Explanation
                </>
              )}
            </Button>
          </form>
        </Form>
        
        {explanation && (
          <div ref={answerBoxRef} className="mt-8 space-y-6 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-glow">AI-Generated Explanation</h3>
                </div>
                 <Button variant="outline" size="sm" onClick={() => downloadAsPdf(ANSWER_BOX_ID, 'ai-explanation.pdf')}>
                   <Download className="h-4 w-4 mr-2" />
                   Download
                </Button>
              </div>

            <div id={ANSWER_BOX_ID} className="rounded-md border bg-muted/50 p-6 space-y-6">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <h4 className="font-semibold flex items-center gap-2 text-primary mb-1"><Check className="w-4 h-4"/>Direct Answer</h4>
                    <p className='text-sm text-primary/90'>{explanation.directAnswer}</p>
                </div>
                
                <div className="p-3 rounded-lg bg-card/50 border border-border">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground/90 mb-2"><FileText className="w-4 h-4 text-primary"/>Detailed Explanation</h4>
                    <p className='text-sm'>{explanation.detailedExplanation}</p>
                </div>

                <div className="p-3 rounded-lg bg-card/50 border border-border">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground/90 mb-2"><Rocket className="w-4 h-4 text-primary"/>Applications / Use Cases</h4>
                    <div className="flex flex-wrap gap-2 pt-1">
                        {explanation.applications.map((app, index) => <Badge key={index} variant="secondary">{app}</Badge>)}
                    </div>
                </div>

                <div className="p-3 rounded-lg bg-card/50 border border-border">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground/90 mb-2"><Code className="w-4 h-4 text-primary"/>Example</h4>
                    <FormattedContent content={explanation.example} />
                </div>

                <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <p className='text-sm text-amber-700 dark:text-amber-300 font-medium'>{explanation.closingLine}</p>
                </div>
            </div>
            <Rating featureName="AI Explainer" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
