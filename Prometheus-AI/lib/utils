import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { type DisplayMessage } from "@/components/features/student-chatbot";
import { type StudentChatbotOutput } from "@/ai/flows/student-chatbot-flow";

type Explanation = NonNullable<StudentChatbotOutput['explanation']>;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function downloadTxtFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


export async function downloadAsPdf(elementId: string, filename: string) {
  const content = document.getElementById(elementId);
  if (!content) {
    console.error(`Element with ID '${elementId}' not found for PDF download.`);
    return;
  }
  
  // Determine the background color from the computed style of the body
  const bodyBackgroundColor = window.getComputedStyle(document.body).backgroundColor;

  // Temporarily clone the node to modify styles for PDF rendering
  const clone = content.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = 'auto';
  clone.style.width = content.offsetWidth + 'px';
  document.body.appendChild(clone);

  const canvas = await html2canvas(clone, {
    scale: 2, 
    useCORS: true,
    backgroundColor: bodyBackgroundColor,
  });

  // Clean up the cloned node
  document.body.removeChild(clone);

  // Validate canvas dimensions
  if (canvas.height === 0 || canvas.width === 0) {
    console.error("Cannot generate PDF from an element with zero height or width.");
    return;
  }

  const imgData = canvas.toDataURL('image/jpeg', 1.0);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  
  const ratio = canvasWidth / canvasHeight;
  let imgWidth = pdfWidth;
  let imgHeight = imgWidth / ratio;
  
  // If the image is taller than the page, scale it down to fit the page height
  if (imgHeight > pdfHeight) {
    imgHeight = pdfHeight;
    imgWidth = imgHeight * ratio;
  }
  
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }
  
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export function downloadChatAsPdf(messages: DisplayMessage[], username: string) {
  const pdf = new jsPDF();
  let y = 10; // vertical position in mm

  const addText = (text: string, isBold = false) => {
    if (y > 280) { // check if new page is needed
      pdf.addPage();
      y = 10;
    }
    const splitText = pdf.splitTextToSize(text, 180); 
    pdf.setFont(undefined, isBold ? 'bold' : 'normal');
    pdf.text(splitText, 10, y);
    y += (splitText.length * 5) + (isBold ? 2 : 0);
  };
  
  const addSpace = (space = 5) => {
    y += space;
  }
  
  pdf.setFontSize(16);
  addText('Conversation with Prometheus AI', true);
  addSpace();

  pdf.setFontSize(10);

  messages.forEach(msg => {
    const role = msg.role === 'user' ? username : 'Prometheus AI';
    addText(`${role} (${msg.timestamp})`, true);

    if (typeof msg.content === 'object') {
        const explanation = msg.content as Explanation;
        addText(`Direct Answer: ${explanation.directAnswer}`);
        addText(`Explanation: ${explanation.detailedExplanation}`);
        addText(`Key Concepts:`);
        explanation.keyConcepts.forEach(c => addText(`  - ${c.name}: ${c.description}`));
        addText(`Applications: ${explanation.applications.join(', ')}`);
        addText(`Example: ${explanation.example}`);
        addText(`Closing: ${explanation.closingLine}`);
    } else {
        addText(msg.content);
    }
    
    addSpace(8);
  });

  pdf.save('prometheus-ai-chat.pdf');
}
