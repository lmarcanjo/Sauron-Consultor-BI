import * as XLSX from "xlsx";
import { hashBuffer } from "./WorkbookMetadata";
import { WorkbookParser } from "./WorkbookParser";
import { WorkbookRepository, workbookRepository } from "./WorkbookRepository";
import { WorkbookCatalog, WorkbookParseOptions } from "./WorkbookTypes";

type BinaryWorkbookInput = ArrayBuffer | Uint8Array;

function normalizeBinaryInput(input: BinaryWorkbookInput): { bytes: Uint8Array; arrayBuffer: ArrayBuffer } {
  if (input instanceof ArrayBuffer) {
    const bytes = new Uint8Array(input);
    return { bytes, arrayBuffer: input };
  }

  const bytes = input;
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return { bytes, arrayBuffer };
}

export class WorkbookEngine {
  constructor(
    private readonly parser = new WorkbookParser(),
    private readonly repository: WorkbookRepository = workbookRepository,
  ) {}

  async catalogArrayBuffer(input: BinaryWorkbookInput, options: WorkbookParseOptions = {}): Promise<WorkbookCatalog> {
    const { bytes, arrayBuffer } = normalizeBinaryInput(input);
    const hash = options.hash || await hashBuffer(arrayBuffer);
    const workbook = XLSX.read(bytes, {
      type: "array",
      bookFiles: true,
      bookVBA: true,
      cellFormula: true,
      cellStyles: true,
      cellNF: true,
      cellDates: true,
      cellHTML: false,
      WTF: false,
    }) as XLSX.WorkBook & { files?: Record<string, any> };

    return this.parser.parse({
      workbook,
      files: workbook.files,
      options: {
        ...options,
        hash,
        sourceSizeBytes: options.sourceSizeBytes ?? bytes.byteLength,
      },
    });
  }

  async catalogFile(file: File, options: WorkbookParseOptions = {}): Promise<WorkbookCatalog> {
    const buffer = await file.arrayBuffer();
    return this.catalogArrayBuffer(buffer, {
      ...options,
      sourceName: options.sourceName || file.name,
      sourceSizeBytes: options.sourceSizeBytes ?? file.size,
    });
  }

  async catalogAndSaveArrayBuffer(input: BinaryWorkbookInput, options: WorkbookParseOptions = {}): Promise<WorkbookCatalog> {
    return this.repository.save(await this.catalogArrayBuffer(input, options));
  }

  async catalogAndSaveFile(file: File, options: WorkbookParseOptions = {}): Promise<WorkbookCatalog> {
    return this.repository.save(await this.catalogFile(file, options));
  }

  save(catalog: WorkbookCatalog): WorkbookCatalog {
    return this.repository.save(catalog);
  }

  get(id: string): WorkbookCatalog | null {
    return this.repository.get(id);
  }

  list(): WorkbookCatalog[] {
    return this.repository.list();
  }
}

export const workbookEngine = new WorkbookEngine();
