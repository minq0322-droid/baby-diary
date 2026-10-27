type JsZipInstance = {
  file(path: string, content?: unknown): unknown;
  folder(path: string): unknown;
  generateAsync(options: { type: 'blob' }, onUpdate?: () => void): Promise<Blob>;
};

type JsZipConstructor = {
  new (): JsZipInstance;
  loadAsync(data: ArrayBuffer): Promise<{
    file(path: string): { async(type: 'string'): Promise<string> } | null;
  }>;
};

type PdfInstance = {
  addImage(image: HTMLCanvasElement, format: string, x: number, y: number, width: number, height: number): void;
  addPage(format?: number[] | string, orientation?: string): void;
  output(type: 'blob'): Blob;
};

type PdfConstructor = new (options: {
  unit: string;
  format: number[];
  orientation?: string;
  compress?: boolean;
}) => PdfInstance;

declare global {
  interface Window {
    JSZip?: JsZipConstructor;
    jspdf?: { jsPDF: PdfConstructor };
  }
}

let zipPromise: Promise<JsZipConstructor> | undefined;
let pdfPromise: Promise<PdfConstructor> | undefined;

function loadScript<T>(url: string, getGlobal: () => T | undefined, onLoading?: () => void): Promise<T> {
  const existing = getGlobal();
  if (existing) return Promise.resolve(existing);
  onLoading?.();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => {
      const value = getGlobal();
      if (value) resolve(value);
      else reject(new Error('내보내기 도구를 불러오지 못했어요.'));
    };
    script.onerror = () => {
      script.remove();
      reject(new Error('내보내기 도구를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.'));
    };
    document.head.appendChild(script);
  });
}

export function loadZip(onLoading?: () => void): Promise<JsZipConstructor> {
  if (__ARTIFACT__) {
    zipPromise ??= loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
      () => window.JSZip,
      onLoading,
    ).catch((error) => {
      zipPromise = undefined;
      throw error;
    });
    return zipPromise;
  }
  return import('jszip').then((module) => module.default as unknown as JsZipConstructor);
}

export function loadPdf(onLoading?: () => void): Promise<PdfConstructor> {
  if (__ARTIFACT__) {
    pdfPromise ??= loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      () => window.jspdf?.jsPDF,
      onLoading,
    ).catch((error) => {
      pdfPromise = undefined;
      throw error;
    });
    return pdfPromise;
  }
  return import('jspdf').then((module) => module.jsPDF as unknown as PdfConstructor);
}
