
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wand2, Loader2, FileQuestion, ArrowLeft, Download, CheckCircle2, XCircle, BarChart, RotateCcw, Lightbulb, Gamepad } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { FormattedContent } from '@/components/formatted-content';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { generateQuizAction } from '@/lib/actions';
import { PrometheusHeader } from '@/components/prometheus-header';
import { Rating } from '@/components/rating';
import { Progress } from '@/components/ui/progress';

type Question = {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
};

type QuizState = 'configuring' | 'taking' | 'results';

const formSchema = z.object({
  topic: z.string().min(3, "Please be more specific about the topic."),
  numQuestions: z.coerce.number().int().min(1, "You need at least 1 question.").max(10, "You can generate a maximum of 10 questions."),
});

type FormValues = z.infer<typeof formSchema>;

export default function AiQuiz() {
  const [isLoading, setIsLoading] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>('configuring');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: 'Python Basics',
      numQuestions: 5,
    },
  });

  const startNewQuiz = () => {
    setQuizState('configuring');
    setQuestions([]);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    form.reset();
  }

  async function onGenerateQuiz(values: FormValues) {
    setIsLoading(true);
    const result = await generateQuizAction(values);
    setIsLoading(false);

    if (result && 'error' in result) {
      toast({ variant: 'destructive', title: 'Error Generating Quiz', description: result.error });
    } else if (result && result.questions.length > 0) {
      setQuestions(result.questions);
      setQuizState('taking');
      setUserAnswers({});
      setCurrentQuestionIndex(0);
    }
  }
  
  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const handleNextQuestion = () => {
    if (userAnswers[currentQuestionIndex] === undefined) {
      toast({ variant: 'destructive', description: "Please select an answer before proceeding." });
      return;
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizState('results');
    }
  };

  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      return userAnswers[index] === question.correctAnswerIndex ? score + 1 : score;
    }, 0);
  };
  
  const score = quizState === 'results' ? calculateScore() : 0;
  const scorePercentage = questions.length > 0 ? (score / questions.length) * 100 : 0;

  const renderContent = () => {
    switch (quizState) {
      case 'configuring':
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onGenerateQuiz)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="topic" render={({ field }) => (
                  <FormItem><FormLabel>Quiz Topic</FormLabel><FormControl><Input placeholder="e.g., JavaScript Arrays" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="numQuestions" render={({ field }) => (
                  <FormItem><FormLabel>Number of Questions</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Quiz...</> : <><Wand2 className="mr-2 h-4 w-4" />Start Quiz</>}
              </Button>
            </form>
          </Form>
        );

      case 'taking':
        const currentQuestion = questions[currentQuestionIndex];
        return (
           <div className="animate-in fade-in duration-500">
             <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="mb-4" />
             <p className="text-sm text-muted-foreground mb-2">Question {currentQuestionIndex + 1} of {questions.length}</p>
             <h3 className="font-semibold text-lg mb-4">{currentQuestion.questionText}</h3>
             <RadioGroup onValueChange={(value) => handleAnswerSelect(currentQuestionIndex, parseInt(value))} value={userAnswers[currentQuestionIndex]?.toString()}>
               {currentQuestion.options.map((option, index) => (
                 <div key={index} className="flex items-center space-x-3 space-y-0 border p-4 rounded-lg hover:bg-muted/50 has-[[data-state=checked]]:bg-primary/10 has-[[data-state=checked]]:border-primary">
                    <RadioGroupItem value={index.toString()} id={`q${currentQuestionIndex}-opt${index}`} />
                   <label htmlFor={`q${currentQuestionIndex}-opt${index}`} className="font-normal flex-1 cursor-pointer">{option}</label>
                 </div>
               ))}
             </RadioGroup>
             <Button onClick={handleNextQuestion} className="mt-6 w-full sm:w-auto">
               {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish & See Results'}
             </Button>
           </div>
        );
        
      case 'results':
        return (
          <div className="animate-in fade-in duration-500 space-y-8">
            <Card className="bg-muted/50">
              <CardHeader className="text-center">
                 <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
                 <CardDescription>You scored</CardDescription>
                 <p className="text-5xl font-bold text-primary">{score} / {questions.length}</p>
                 <Progress value={scorePercentage} className="w-3/4 mx-auto mt-2" />
              </CardHeader>
              <CardContent className="flex items-center justify-center gap-4">
                 <Button onClick={startNewQuiz}><RotateCcw className="mr-2 h-4 w-4" />Try Another Quiz</Button>
              </CardContent>
            </Card>

            <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><BarChart className='w-5 h-5 text-primary' />Detailed Results</h3>
                <div className="space-y-6">
                {questions.map((q, i) => {
                    const userAnswer = userAnswers[i];
                    const isCorrect = userAnswer === q.correctAnswerIndex;
                    return (
                    <div key={i} className={cn("p-4 rounded-lg border", isCorrect ? "border-green-500/50 bg-green-500/5" : "border-destructive/50 bg-destructive/5")}>
                        <p className="font-semibold mb-2">Q{i+1}: {q.questionText}</p>
                        <div className="space-y-2 text-sm">
                            {q.options.map((opt, optIndex) => {
                                const isUserChoice = userAnswer === optIndex;
                                const isCorrectChoice = q.correctAnswerIndex === optIndex;
                                return (
                                <div key={optIndex} className={cn("flex items-center gap-2 p-2 rounded",
                                    isCorrectChoice && "bg-green-500/10 text-green-800 font-medium",
                                    isUserChoice && !isCorrectChoice && "bg-destructive/10 text-destructive-800 font-medium"
                                )}>
                                    {isCorrectChoice ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> : 
                                    (isUserChoice ? <XCircle className="w-4 h-4 text-destructive flex-shrink-0" /> : <div className="w-4 h-4" />)}
                                    <span>{opt}</span>
                                </div>
                                );
                            })}
                        </div>
                        <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                            <h4 className="font-semibold text-primary flex items-center gap-2 mb-1"><Lightbulb className="w-4 h-4" />Explanation</h4>
                            <FormattedContent content={q.explanation} />
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
            <Rating featureName="AI Quiz" />
          </div>
        );
    }
  };

  return (
    <Card className="w-full transform-gpu transition-all duration-300 ease-in-out hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
            <Gamepad className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">AI-Powered Quiz</CardTitle>
        </div>
        <CardDescription>Challenge yourself with a quick, AI-generated quiz on any topic.</CardDescription>
      </CardHeader>
      <CardContent>
          {renderContent()}
      </CardContent>
    </Card>
  );
}
