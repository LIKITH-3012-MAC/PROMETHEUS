
'use client';

import { useToast } from '@/hooks/use-toast';
import { Check, Clipboard, Download } from 'lucide-react';
import React,
{ useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './ui/button';
import Image from 'next/image';
import { downloadTxtFile } from '@/lib/utils';


const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'code';
  const code = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'The code snippet has been copied to your clipboard.',
    });
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadTxtFile(code, `code-snippet.${language}`);
  }

  return !inline ? (
    <div className="relative my-4 rounded-lg bg-background/70 not-prose border border-border">
       <div className="flex items-center justify-between bg-muted rounded-t-lg px-4 py-2">
        <span className="text-xs font-sans text-foreground/80 uppercase">{language}</span>
        <div className='flex items-center gap-2'>
            <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground/60 hover:text-foreground"
            onClick={handleCopy}
            >
            {isCopied ? (
                <Check className="h-4 w-4 text-primary" />
            ) : (
                <Clipboard className="h-4 w-4" />
            )}
            </Button>
            <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground/60 hover:text-foreground"
            onClick={handleDownload}
            >
                <Download className="h-4 w-4" />
            </Button>
        </div>
      </div>
      <pre
        className="bg-transparent overflow-x-auto text-sm p-4"
        {...props}
      >
        <code>{children}</code>
      </pre>
    </div>
  ) : (
    <code className="bg-muted px-1.5 py-1 rounded-md text-primary text-sm" {...props}>
      {children}
    </code>
  );
};

export function FormattedContent({ content, id, photoDataUri }: { content: string, id?: string, photoDataUri?: string | null }) {
  return (
    <div id={id} className="prose prose-invert max-w-none text-base leading-7 relative">
        {photoDataUri && (
             <div className="absolute top-0 right-0 w-28 h-28">
                <Image 
                    src={photoDataUri} 
                    alt={'User photo'} 
                    width={112}
                    height={112}
                    className="rounded-full object-cover border-2 border-primary/50 shadow-lg"
                />
            </div>
        )}
      <div className="whitespace-pre-wrap">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: CodeBlock,
            ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-4 space-y-2" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-4 space-y-2" {...props} />,
            li: ({ node, ...props }) => <li className="mb-2" {...props} />,
            strong: ({ node, ...props }) => <strong className="font-semibold text-primary" {...props} />,
            h1: ({ node, ...props }) => <h1 className="text-3xl sm:text-4xl font-bold mb-6 mt-4" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-8 mb-4 border-b border-border pb-2" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-8 mb-4" {...props} />,
            h4: ({ node, ...props }) => <h4 className="text-lg font-semibold mt-6 mb-3" {...props} />,
            a: ({ node, ...props }) => <a className="text-primary hover:underline" {...props} />,
            p: ({ node, ...props }) => <div className="mb-4 last:mb-0" {...props} />
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
