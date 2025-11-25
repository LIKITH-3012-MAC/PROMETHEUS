
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wand2, Loader2, Sparkles, Clipboard, Check, Download, Languages, ArrowRightLeft } from 'lucide-react';
import { FormattedContent } from '@/components/formatted-content';
import { Rating } from '@/components/rating';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { translateTextAction } from '@/lib/actions';
import { downloadAsPdf } from '@/lib/utils';
import languagesData from '@/lib/languages.json';
import { Combobox } from '@/components/ui/combobox';

const formSchema = z.object({
  text: z.string().min(1, 'Please enter text to translate.'),
  sourceLanguage: z.string().min(1, 'Please select a source language.'),
  targetLanguage: z.string().min(1, 'Please select a target language.'),
});

type FormValues = z.infer<typeof formSchema>;
const TRANSLATED_TEXT_BOX_ID = 'translated-text';

const languageOptions = languagesData.map(lang => ({
    value: lang.name,
    label: lang.name,
}));

export default function LanguageTranslator() {
  const [isLoading, setIsLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: '',
      sourceLanguage: 'English',
      targetLanguage: 'French',
    },
  });

  const { watch, setValue, control } = form;
  const sourceLang = watch('sourceLanguage');
  const targetLang = watch('targetLanguage');

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setTranslatedText('');
    setIsCopied(false);

    const result = await translateTextAction(values);

    if (result && 'error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error Translating',
        description: result.error,
      });
    } else if (result) {
      setTranslatedText(result.translatedText);
    }
    
    setIsLoading(false);
  }

  const handleCopy = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
      toast({ title: 'Copied translation to clipboard!' });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSwapLanguages = () => {
    const currentSource = sourceLang;
    const currentTarget = targetLang;
    setValue('sourceLanguage', currentTarget);
    setValue('targetLanguage', currentSource);
  };

  return (
    <Card className="w-full transform-gpu transition-all duration-300 ease-in-out hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
            <Languages className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold cosmic-gradient-text">Language Translator</CardTitle>
        </div>
        <CardDescription>Translate text between a vast selection of languages with AI precision.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                <div className="md:col-span-5">
                    <FormField
                        control={control}
                        name="sourceLanguage"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>From</FormLabel>
                                <Combobox
                                    options={languageOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Search language..."
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex justify-center items-end h-full">
                    <Button type="button" variant="ghost" size="icon" onClick={handleSwapLanguages} className="mt-6">
                        <ArrowRightLeft className="h-5 w-5 text-primary" />
                    </Button>
                </div>
                 <div className="md:col-span-5">
                    <FormField
                        control={control}
                        name="targetLanguage"
                        render={({ field }) => (
                             <FormItem className="flex flex-col">
                                <FormLabel>To</FormLabel>
                                <Combobox
                                    options={languageOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Search language..."
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text to Translate</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter text here..." className="min-h-[150px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Translating...</> ) : ( <><Wand2 className="mr-2 h-4 w-4" />Translate</> )}
            </Button>
          </form>
        </Form>
        
        {translatedText && (
          <div className="mt-8 space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-glow">Translated Text</h3>
                </div>
                 <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handleCopy} className='h-8 w-8'>
                    {isCopied ? <Check className="h-4 w-4 text-primary" /> : <Clipboard className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadAsPdf(TRANSLATED_TEXT_BOX_ID, 'translation.pdf')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
            </div>
            <div id={TRANSLATED_TEXT_BOX_ID} className="rounded-md border bg-muted/50 p-4 min-h-[150px]">
              <FormattedContent content={translatedText} />
            </div>
            <Rating featureName="Language Translator" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
