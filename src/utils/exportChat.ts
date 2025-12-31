import jsPDF from 'jspdf';
import { Message } from '@/types/chat';

export function exportToText(messages: Message[], title: string): void {
  let content = `Chat Export: ${title}\n`;
  content += `Exported on: ${new Date().toLocaleString()}\n`;
  content += '='.repeat(50) + '\n\n';

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? 'You' : 'AI';
    const time = msg.timestamp.toLocaleTimeString();
    content += `[${time}] ${role}:\n`;
    content += msg.content + '\n';
    if (msg.imageUrl) {
      content += `[Image: ${msg.imageUrl}]\n`;
    }
    content += '\n';
  });

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToPDF(messages: Message[], title: string): void {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let yPosition = 20;

  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margin, yPosition);
  yPosition += 10;

  // Date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(128, 128, 128);
  pdf.text(`Exported on: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 15;

  // Reset text color
  pdf.setTextColor(0, 0, 0);

  messages.forEach((msg) => {
    // Check if we need a new page
    if (yPosition > 270) {
      pdf.addPage();
      yPosition = 20;
    }

    const role = msg.role === 'user' ? 'You' : 'AI';
    const time = msg.timestamp.toLocaleTimeString();

    // Role header
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(msg.role === 'user' ? 0 : 59, msg.role === 'user' ? 122 : 130, msg.role === 'user' ? 204 : 246);
    pdf.text(`${role} (${time})`, margin, yPosition);
    yPosition += 6;

    // Message content
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    // Clean markdown for PDF
    const cleanContent = msg.content
      .replace(/```[\s\S]*?```/g, '[Code Block]')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    const lines = pdf.splitTextToSize(cleanContent, maxWidth);
    
    lines.forEach((line: string) => {
      if (yPosition > 280) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, margin, yPosition);
      yPosition += 5;
    });

    if (msg.imageUrl) {
      pdf.setTextColor(100, 100, 100);
      pdf.text('[Image attached]', margin, yPosition);
      yPosition += 5;
    }

    yPosition += 8;
  });

  pdf.save(`${title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`);
}
