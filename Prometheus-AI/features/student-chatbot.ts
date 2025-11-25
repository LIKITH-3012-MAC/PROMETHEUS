
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BrainCircuit, Send, User, Loader2, Sparkles, Code, FileCode, Terminal, Download, Clipboard, Check, ChevronRight, FileText, Rocket, Lightbulb } from 'lucide-react';
import { FormattedContent } from '@/components/formatted-content';
import { Rating } from '@/components/rating';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { studentChatbotAction } from '@/lib/actions';
import { cn, downloadChatAsPdf } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { type StudentChatbotOutput } from '@/ai/flows/student-chatbot-flow';
import { Badge } from '../ui/badge';


const formSchema = z.object({
  message: z.string().min(1, {
    message: 'Message cannot be empty.',
  }),
});

type Explanation = NonNullable<StudentChatbotOutput['explanation']>;

export type Message = {
  role: 'user' | 'assistant';
  content: string | Explanation;
  isError?: boolean;
};

export type DisplayMessage = Message & {
    id: number;
    timestamp: string;
    showRating: boolean;
}

const initialPrompts = [
  { text: "What is C programming?", icon: <Code className="h-5 w-5 mr-2" /> },
  { text: "Explain Python in simple terms", icon: <FileCode className="h-5 w-5 mr-2" /> },
  { text: "What is Java used for?", icon: <Terminal className="h-5 w-5 mr-2" /> },
  { text: "What is the difference between Java and Javascript?", icon: <Code className="h-5 w-5 mr-2" /> },
];

const dynamicPrompts = [
    "Ask me to explain any topic...",
    "What concept is on your mind?",
    "Need help with your homework?",
    "Curious about a subject? Let's dive in.",
    "Ready to learn something new?",
];


function DynamicPrompt() {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentPromptIndex((prevIndex) => (prevIndex + 1) % dynamicPrompts.length);
        setIsFading(false);
      }, 500); // fade out duration
    }, 3000); // 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <p className={cn("text-base md:text-lg mb-6 transition-opacity duration-500", isFading ? "opacity-0" : "opacity-100")}>
      {dynamicPrompts[currentPromptIndex]}
    </p>
  );
}

let messageIdCounter = 0;

const StructuredExplanation = ({ explanation }: { explanation: Explanation }) => (
    <div className="space-y-4">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <h4 className="font-semibold text-primary flex items-center gap-2 mb-1"><Check className="w-4 h-4" />Direct Answer</h4>
            <p className="text-sm text-primary/90">{explanation.directAnswer}</p>
        </div>

        <div className="p-3 rounded-lg bg-card/50 border border-border">
            <h4 className="font-semibold flex items-center gap-2 mb-2 text-foreground/90"><FileText className="w-4 h-4 text-primary" />Detailed Explanation</h4>
            <p className="text-sm">{explanation.detailedExplanation}</p>
        </div>

        <div className="p-3 rounded-lg bg-card/50 border border-border">
            <h4 className="font-semibold flex items-center gap-2 mb-2 text-foreground/90"><ChevronRight className="w-4 h-4 text-primary" />Key Concepts</h4>
            <ul className="space-y-3 pl-2 border-l-2 border-primary/20 ml-2">
                {explanation.keyConcepts.map((concept, i) => (
                    <li key={i} className="flex flex-col pl-3">
                        <span className="font-semibold text-foreground/90">{concept.name}</span>
                        <span className="text-muted-foreground">{concept.description}</span>
                    </li>
                ))}
            </ul>
        </div>

        <div className="p-3 rounded-lg bg-card/50 border border-border">
            <h4 className="font-semibold flex items-center gap-2 mb-2 text-foreground/90"><Rocket className="w-4 h-4 text-primary" />Applications / Use Cases</h4>
            <div className="flex flex-wrap gap-2 pt-1">
                {explanation.applications.map((app, index) => <Badge key={index} variant="secondary">{app}</Badge>)}
            </div>
        </div>
        
        <div className="p-3 rounded-lg bg-card/50 border border-border">
            <h4 className="font-semibold flex items-center gap-2 mb-2 text-foreground/90"><Code className="w-4 h-4 text-primary" />Example</h4>
            <FormattedContent content={explanation.example} />
        </div>
        
        <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">{explanation.closingLine}</p>
        </div>
    </div>
);


const MessageItem = ({ message, username }: { message: DisplayMessage, username: string }) => {
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();
    const contentId = `message-content-${message.id}`;
    
    const isStructured = typeof message.content === 'object';
    
    let textToCopy = '';
    if (isStructured) {
      const exp = message.content as Explanation;
      textToCopy = `Direct Answer: ${exp.directAnswer}\n\nExplanation: ${exp.detailedExplanation}\n\nKey Concepts:\n${exp.keyConcepts.map(c => `- ${c.name}: ${c.description}`).join('\n')}\n\nApplications: ${exp.applications.join(', ')}\n\nExample:\n${exp.example}\n\nClosing: ${exp.closingLine}`;
    } else {
      textToCopy = message.content as string;
    }


    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        toast({
            title: 'Copied!',
            description: 'The message has been copied to your clipboard.',
        });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className={cn('flex items-start gap-2 sm:gap-3 group relative', message.role === 'user' ? 'justify-end' : 'justify-start')}>
            {message.role === 'assistant' && (
                <Avatar className='h-8 w-8 border-2 border-primary/50'>
                    <AvatarFallback className='bg-primary text-primary-foreground'>
                        <BrainCircuit className="h-5 w-5" />
                    </AvatarFallback>
                </Avatar>
            )}
            <div className={cn('max-w-[85%] rounded-xl shadow-lg flex flex-col break-words', message.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card rounded-bl-none border border-primary/20')}>
                <div className='p-3 sm:p-4 text-sm md:text-base'>
                    {isStructured ? (
                        <StructuredExplanation explanation={message.content as Explanation} />
                    ) : (
                        <FormattedContent id={contentId} content={message.content as string} />
                    )}
                </div>
                {message.showRating && message.role === 'assistant' && !message.isError && (
                    <Rating featureName="Student Chatbot" messageId={message.id} />
                )}
                <div className={cn("text-xs px-3 pb-2 text-right", message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                    {message.timestamp}
                </div>
            </div>
             <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={message.role === 'user' ? {left: 'auto', right: 'calc(100% + 0.5rem)'} : {right: 'auto', left: 'calc(100% + 0.5rem)'}}>
                <Button variant='ghost' size='icon' className='h-7 w-7 text-foreground/80 bg-background/50 hover:bg-background' onClick={handleCopy}>
                    {isCopied ? <Check className='h-4 w-4 text-primary' /> : <Clipboard className='h-4 w-4' />}
                </Button>
            </div>
            {message.role === 'user' && (
                <Avatar className='h-8 w-8'>
                    <AvatarFallback>
                        <User className="h-5 w-5" />
                    </AvatarFallback>
                </Avatar>
            )}
        </div>
    );
};

export default function StudentChatbot({ username }: { username: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  const { setValue } = form;

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
  const getDisplayMessages = (rawMessages: Message[]): DisplayMessage[] => {
     return rawMessages.map((msg, index) => ({
        ...msg,
        id: ++messageIdCounter,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        showRating: msg.role === 'assistant' && !msg.isError && (index === rawMessages.length - 1 || rawMessages[index + 1]?.role === 'user'),
    }));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userMessageContent = values.message;
    if (!userMessageContent || isLoading) return;
    
    setIsLoading(true);
    form.reset();
    
    const newUserMessage: Message = { role: 'user', content: userMessageContent };
    const currentMessages: Message[] = messages.map(m => ({role: m.role, content: m.content, isError: m.isError}));
    setMessages(getDisplayMessages([...currentMessages, newUserMessage]));

    const result = await studentChatbotAction({ message: userMessageContent, username });

    if (result && 'error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
      const assistantErrorMessage: Message = { role: 'assistant', content: `Sorry, I encountered an error: ${result.error}`, isError: true };
      setMessages(getDisplayMessages([...currentMessages, newUserMessage, assistantErrorMessage]));
    } else if (result) {
      const responseContent: string | Explanation = result.explanation ? result.explanation : result.response || "I'm not sure how to respond to that. Could you ask in a different way?";
      const assistantMessage: Message = { role: 'assistant', content: responseContent };
      setMessages(getDisplayMessages([...currentMessages, newUserMessage, assistantMessage]));
    }
    
    setIsLoading(false);
  }

  const handlePromptClick = (prompt: string) => {
    setValue('message', prompt);
    onSubmit({ message: prompt });
  };


  return (
    <Card className="w-full bg-card/50 border-primary/20 backdrop-blur-sm flex flex-col h-[80vh]">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-3 mb-2 animate-in fade-in-0 slide-in-from-top-4 duration-500">
            <BrainCircuit className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl md:text-4xl font-bold">Student Assistant</CardTitle>
        </div>
        <CardDescription className="text-md md:text-lg text-foreground/80 animate-in fade-in-0 slide-in-from-top-4 delay-100 duration-500">Your personal AI tutor. Ask questions, get explanations, and practice problems.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 overflow-hidden p-2 sm:p-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4 sm:p-8 animate-in fade-in duration-700">
                <Sparkles className="h-12 w-12 md:h-16 md:w-16 mb-4 text-primary animate-pulse" />
                <p className="text-xl md:text-2xl font-medium mb-2">Welcome, {username}!</p>
                <DynamicPrompt />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4 w-full max-w-xl">
                  {initialPrompts.map(({text, icon}, index) => (
                    <button
                      key={text}
                      className={cn(
                        "flex items-center justify-center text-left h-auto p-3 md:p-4 rounded-lg transition-all transform hover:scale-105 hover:bg-primary/10 border border-primary/30 bg-card/30 disabled:pointer-events-none disabled:opacity-50 text-sm md:text-base",
                        "animate-in fade-in-0 zoom-in-95",
                      )}
                      style={{ animationDelay: `${200 + index * 100}ms` }}
                      onClick={() => handlePromptClick(text)}
                      disabled={isLoading}
                    >
                      {icon}
                      <span className="flex-1">{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 p-2 sm:p-4">
                {messages.map((message) => (
                  <MessageItem key={message.id} message={message} username={username} />
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-3">
                       <Avatar className='h-8 w-8 border-2 border-primary/50'>
                        <AvatarFallback className='bg-primary text-primary-foreground'>
                          <BrainCircuit className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="max-w-[85%] rounded-xl p-3 sm:p-4 bg-card shadow-lg border border-primary/20">
                         <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                )}
              </div>
            )}
          </ScrollArea>
          <div className="mt-auto pt-2 px-2 sm:px-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2 sm:gap-3">
                 {messages.length > 0 && (
                    <Button variant="outline" size="icon" className='h-12 w-12 rounded-full flex-shrink-0' onClick={() => downloadChatAsPdf(messages, username)} type='button'>
                        <Download className='h-5 w-5' />
                        <span className="sr-only">Download Conversation</span>
                    </Button>
                )}
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="Ask about anything you're studying..."
                          autoComplete="off"
                          {...field}
                          disabled={isLoading}
                          className="py-6 text-base bg-card rounded-full px-4 sm:px-6"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading || !form.formState.isValid} size="icon" className='h-12 w-12 rounded-full flex-shrink-0'>
                  <Send className="h-5 w-5" />
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </Form>
          </div>
      </CardContent>
    </Card>
  );
}

    

    
