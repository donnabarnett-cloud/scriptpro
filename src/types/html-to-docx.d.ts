declare module 'html-to-docx' {
  interface DocumentOptions {
    title?: string;
    margins?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    font?: string;
    fontSize?: number;
    orientation?: 'portrait' | 'landscape';
    pageSize?: {
      width?: number;
      height?: number;
    };
  }

  function HTMLtoDOCX(
    htmlString: string,
    headerHTMLString: string | null,
    documentOptions?: DocumentOptions,
    footerHTMLString?: string | null
  ): Promise<Blob>;

  export default HTMLtoDOCX;
}
