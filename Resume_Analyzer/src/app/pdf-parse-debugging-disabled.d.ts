declare module 'pdf-parse-debugging-disabled' {
  export default function pdfParse(buffer: Buffer): Promise<{
    text: string;
    nPages?: number;
    version?: string;
  }>;
}