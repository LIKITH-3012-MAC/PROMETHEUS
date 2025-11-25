
'use server';

import { improveText, type ImproveTextInput, type ImproveTextOutput } from '@/ai/flows/improve-text';
import { transcribeAudio, type TranscribeAudioInput, type TranscribeAudioOutput } from '@/ai/flows/transcribe-audio';
import { studentChatbot, type StudentChatbotInput, type StudentChatbotOutput } from '@/ai/flows/student-chatbot-flow';
import { aiExplainer, type AiExplainerInput, type AiExplainerOutput } from '@/ai/flows/ai-explainer';
import { summarizeText, type SummarizeTextInput, type SummarizeTextOutput } from '@/ai/flows/summarize-text';
import { imageToText, type ImageToTextInput, type ImageToTextOutput } from '@/ai/flows/image-to-text';
import { pdfToText, type PdfToTextInput, type PdfToTextOutput } from '@/ai/flows/pdf-to-text';
import { generateFunTalks, type GenerateFunTalksInput, type GenerateFunTalksOutput } from '@/ai/flows/generate-fun-talks';
import { generateResume, type GenerateResumeInput, type GenerateResumeOutput } from '@/ai/flows/generate-resume';
import { codeInterpreter, type CodeInterpreterInput, type CodeInterpreterOutput } from '@/ai/flows/code-interpreter';
import { generateStudyPlan, type GenerateStudyPlanInput, type GenerateStudyPlanOutput } from '@/ai/flows/generate-study-plan';
import { generateMockTest, type GenerateMockTestInput, type GenerateMockTestOutput } from '@/ai/flows/generate-mock-test';
import { generateQuiz, type GenerateQuizInput, type GenerateQuizOutput } from '@/ai/flows/generate-quiz';
import { resumeFilter, type ResumeFilterInput, type ResumeFilterOutput } from '@/ai/flows/resume-filter';
import { analyzeTestPerformance, type AnalyzeTestPerformanceInput, type AnalyzeTestPerformanceOutput } from '@/ai/flows/analyze-test-performance';
import { translateText, type TranslateTextInput, type TranslateTextOutput } from '@/ai/flows/translate-text';
import { generateCareerGuide, type GenerateCareerGuideInput, type GenerateCareerGuideOutput } from '@/ai/flows/generate-career-guide';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


type ActionError = { error: string };

type RatingInput = {
  featureName: string;
  rating: number;
  feedback?: string;
  name: string;
};

// Re-export specific types to be used in client components
export type { AiExplainerOutput, CodeInterpreterOutput, ResumeFilterOutput, StudentChatbotOutput, GenerateFunTalksOutput, GenerateCareerGuideOutput };


export async function submitRatingAction(input: RatingInput): Promise<{ success: boolean } | ActionError> {
  try {
    if (!input.featureName || typeof input.featureName !== 'string') {
      return { error: 'Invalid feature name.' };
    }
    if (input.rating < 1 || input.rating > 5) {
      return { error: 'Invalid rating value.' };
    }
     if (!input.name || !input.name.trim()) {
      return { error: 'Username is required to submit a rating.' };
    }

    const reviewDoc: any = {
      featureName: input.featureName,
      rating: input.rating,
      name: input.name,
      timestamp: serverTimestamp(),
    };

    if (input.feedback && input.feedback.trim()) {
      reviewDoc.review = input.feedback;
    }
    
    await addDoc(collection(db, 'reviews'), reviewDoc);

    return { success: true };
  } catch (e: any) {
    console.error('submitRatingAction error:', e);
    return { error: e.message || 'An unexpected error occurred while submitting feedback.' };
  }
}


export async function enhanceTextAction(
  input: ImproveTextInput
): Promise<ImproveTextOutput | ActionError> {
  try {
    if (!input.text || typeof input.text !== 'string' || input.text.trim().length < 10) {
      return { error: 'Please enter at least 10 characters to enhance.' };
    }
    const result = await improveText(input);
    if (!result || !result.improvedText) {
      return { error: 'The AI failed to generate an enhancement. Please try again with different text.' };
    }
    return result;
  } catch (e: any) {
    console.error('enhanceTextAction error:', e);
    return { error: e.message || 'An unexpected error occurred while enhancing text.' };
  }
}

export async function transcribeAudioAction(
  input: TranscribeAudioInput
): Promise<TranscribeAudioOutput | ActionError> {
  try {
    if (!input.audioDataUri || !input.audioDataUri.startsWith('data:audio/')) {
        return { error: 'Invalid or missing audio data.' };
    }
    const result = await transcribeAudio(input);
     if (!result || typeof result.transcription !== 'string') {
      return { error: 'The AI failed to transcribe the audio. Please try again.' };
    }
    return result;
  } catch (e: any) {
    console.error('transcribeAudioAction error:', e);
    return { error: e.message || 'An unexpected error occurred during transcription.' };
  }
}

export async function studentChatbotAction(
  input: StudentChatbotInput
): Promise<StudentChatbotOutput | ActionError> {
  try {
    if (!input.message || typeof input.message !== 'string' || !input.message.trim()) {
      return { error: 'Message cannot be empty.' };
    }
    const result = await studentChatbot(input);
    if (!result || (!result.response && !result.explanation)) {
      return { error: 'The AI failed to generate a response. Please try again.' };
    }
    return result;
  } catch (e: any) {
    console.error('studentChatbotAction error:', e);
    return { error: e.message || 'An unexpected error occurred with the chatbot.' };
  }
}


export async function aiExplainerAction(
  input: AiExplainerInput
): Promise<AiExplainerOutput | ActionError> {
  try {
    if (!input.question || typeof input.question !== 'string' || !input.question.trim()) {
      return { error: 'Question cannot be empty.' };
    }
    const result = await aiExplainer(input);
    if (!result || !result.directAnswer) {
      return { error: 'The AI failed to generate an answer. Please try rephrasing your question.' };
    }
    return result;
  } catch (e: any) {
    console.error('aiExplainerAction error:', e);
    return { error: e.message || 'An unexpected error occurred with the AI explainer.' };
  }
}

export async function summarizeTextAction(
  input: SummarizeTextInput
): Promise<SummarizeTextOutput | ActionError> {
  try {
    if (!input.text || typeof input.text !== 'string' || input.text.trim().length < 50) {
      return { error: 'Please enter at least 50 characters to summarize.' };
    }
    const result = await summarizeText(input);
    if (!result || !result.summary) {
        return { error: 'The AI failed to generate a summary. Please try again with different text.' };
    }
    return result;
  } catch (e: any) {
    console.error('summarizeTextAction error:', e);
    return { error: e.message || 'An unexpected error occurred while summarizing text.' };
  }
}

export async function imageToTextAction(
  input: ImageToTextInput
): Promise<ImageToTextOutput | ActionError> {
  try {
    if (!input.imageDataUri || !input.imageDataUri.startsWith('data:image/')) {
      return { error: 'Invalid or missing image data.' };
    }
    const result = await imageToText(input);
    if (!result || typeof result.text !== 'string') {
      return { error: 'The AI failed to extract text from the image. Please try a clearer image.' };
    }
    return result;
  } catch (e: any)
{
    console.error('imageToTextAction error:', e);
    return { error: e.message || 'An unexpected error occurred while extracting text from the image.' };
  }
}

export async function pdfToTextAction(
  input: PdfToTextInput
): Promise<PdfToTextOutput | ActionError> {
  try {
    if (!input.pdfDataUri || !input.pdfDataUri.startsWith('data:application/pdf')) {
      return { error: 'Invalid or missing PDF data.' };
    }
    const result = await pdfToText(input);
     if (!result || typeof result.text !== 'string') {
      return { error: 'Could not extract text from the PDF. Please ensure the PDF contains selectable text and is not just an image.' };
    }
    return result;
  } catch (e: any) {
    console.error('pdfToTextAction error:', e);
    return { error: e.message || 'An unexpected error occurred while extracting text from the PDF.' };
  }
}

export async function generateFunTalksAction(
    input: GenerateFunTalksInput
): Promise<GenerateFunTalksOutput | ActionError> {
    try {
        if (!input.episodes || !Array.isArray(input.episodes) || input.episodes.length === 0) {
            return { error: 'No episodes selected.' };
        }
        const result = await generateFunTalks(input);
        if (!result || !result.audioDataUri) {
          return { error: 'The AI failed to generate audio. Please try again.' };
        }
        return result;
    } catch (e: any) {
        console.error('generateFunTalksAction error:', e);
        return { error: e.message || 'An unexpected error occurred. Please try selecting fewer episodes.' };
    }
}

export async function generateResumeAction(
  input: GenerateResumeInput
): Promise<GenerateResumeOutput | ActionError> {
  try {
    // Basic validation to catch empty inputs before they hit the AI flow.
    if (!input.fullName || !input.email || !input.jobDescription || !input.skills || !Array.isArray(input.experiences) || input.experiences.length === 0 || !Array.isArray(input.education) || input.education.length === 0) {
      return { error: 'Please fill out all required fields to generate a resume.' };
    }

    const result = await generateResume(input);
    
    // Stricter check to ensure the 'resume' field exists and is not empty.
    if (!result || !result.resume) {
        return { error: 'The AI failed to generate a resume. This can happen with complex job descriptions. Please try simplifying your input or try again.' };
    }
    return result;
  } catch (e: any) {
    console.error('generateResumeAction error:', e);
    // Provide a more specific error message to the user if the AI response is malformed.
    if (e.message && (e.message.includes('Zod') || e.message.includes('unexpected response') || e.message.includes('malformed'))) {
       return { error: 'The AI returned data in an unexpected format. Please try rephrasing your input or try again.' };
    }
    return { error: e.message || 'An unexpected error occurred while generating the resume. Please try again.' };
  }
}

export async function codeInterpreterAction(
  input: CodeInterpreterInput
): Promise<CodeInterpreterOutput | ActionError> {
  try {
    if (!input.code || !input.code.trim()) {
      return { error: 'Code cannot be empty.' };
    }
    if (!input.language) {
      return { error: 'Please select a language.' };
    }
    
    const result = await codeInterpreter(input);
    
    if (!result) {
        return { error: 'The AI failed to analyze the code. Please try again.' };
    }
    return result;
  } catch (e: any) {
    console.error('codeInterpreterAction error:', e);
    return { error: e.message || 'An unexpected error occurred while analyzing the code.' };
  }
}

export async function generateStudyPlanAction(
  input: GenerateStudyPlanInput,
): Promise<GenerateStudyPlanOutput | ActionError> {
  try {
    if (!input.goal || !input.subjects || !input.duration || !input.hoursPerDay) {
      return { error: 'Please fill out all fields to generate a study plan.' };
    }
    const result = await generateStudyPlan(input);
    if (!result || !result.plan) {
      return { error: 'The AI failed to generate a study plan. Please try again with a different goal.' };
    }
    return result;
  } catch (e: any) {
    console.error('generateStudyPlanAction error:', e);
    return { error: e.message || 'An unexpected error occurred while generating the plan.' };
  }
}

export async function generateMockTestAction(
  input: GenerateMockTestInput
): Promise<GenerateMockTestOutput | ActionError> {
  try {
    if (!input.topics || !input.numQuestions) {
      return { error: 'Please provide topics and the number of questions.' };
    }
    const result = await generateMockTest(input);
    if (!result || !result.questions || result.questions.length === 0) {
      return { error: 'The AI failed to generate a mock test. Please try again with different topics.' };
    }
    return result;
  } catch (e: any) {
    console.error('generateMockTestAction error:', e);
    return { error: e.message || 'An unexpected error occurred while generating the mock test.' };
  }
}

export async function generateQuizAction(
  input: GenerateQuizInput
): Promise<GenerateQuizOutput | ActionError> {
  try {
    if (!input.topic || !input.numQuestions) {
      return { error: 'Please provide a topic and the number of questions.' };
    }
    const result = await generateQuiz(input);
    if (!result || !result.questions || result.questions.length === 0) {
      return { error: 'The AI failed to generate a quiz. Please try again with a different topic.' };
    }
    return result;
  } catch (e: any) {
    console.error('generateQuizAction error:', e);
    return { error: e.message || 'An unexpected error occurred while generating the quiz.' };
  }
}

export async function resumeFilterAction(
    input: ResumeFilterInput
): Promise<ResumeFilterOutput | ActionError> {
    try {
        if (!input.resumeDataUri || !input.resumeDataUri.startsWith('data:application/pdf')) {
            return { error: 'Invalid or missing PDF resume data.' };
        }
        if (!input.jobRoles || !input.jobRoles.trim()) {
            return { error: 'Please provide at least one job role.' };
        }
        
        const result = await resumeFilter(input);
        
        if (!result || !result.candidateName || !result.suggestedRoles) {
            return { error: 'The AI failed to analyze the resume. Please ensure it is a valid text-based PDF.' };
        }
        return result;
    } catch(e: any) {
        console.error('resumeFilterAction error:', e);
        return { error: e.message || 'An unexpected error occurred while filtering the resume.' };
    }
}

export async function analyzeTestPerformanceAction(
  input: AnalyzeTestPerformanceInput
): Promise<AnalyzeTestPerformanceOutput | ActionError> {
  try {
    if (!input.questions || input.questions.length === 0) {
      return { error: 'Test data is missing or empty.' };
    }
    const result = await analyzeTestPerformance(input);
    if (!result || !result.feedbackReport) {
      return { error: 'The AI failed to generate a feedback report.' };
    }
    return result;
  } catch (e: any) {
    console.error('analyzeTestPerformanceAction error:', e);
    return { error: e.message || 'An unexpected error occurred while analyzing performance.' };
  }
}

export async function translateTextAction(
  input: TranslateTextInput
): Promise<TranslateTextOutput | ActionError> {
  try {
    if (!input.text || !input.sourceLanguage || !input.targetLanguage) {
      return { error: 'Please fill out all fields for translation.' };
    }
    const result = await translateText(input);
    if (!result || !result.translatedText) {
      return { error: 'The AI failed to generate a translation. Please try again.' };
    }
    return result;
  } catch (e: any) {
    console.error('translateTextAction error:', e);
    return { error: e.message || 'An unexpected error occurred while translating.' };
  }
}

export async function generateCareerGuideAction(
  input: GenerateCareerGuideInput
): Promise<GenerateCareerGuideOutput | ActionError> {
  try {
    if (!input.userInput || !input.userInput.trim()) {
      return { error: 'Please enter a topic to get a career guide.' };
    }
    const result = await generateCareerGuide(input);
    if (!result || !result.guide) {
      return { error: 'The AI failed to generate a career guide. Please try again.' };
    }
    return result;
  } catch (e: any) {
    console.error('generateCareerGuideAction error:', e);
    return { error: e.message || 'An unexpected error occurred while generating the guide.' };
  }
}
