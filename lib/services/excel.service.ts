import * as XLSX from 'xlsx';
import { Result, success, error } from '@/lib/utils/result';

export interface ExcelImportConfig {
    headerMap: Record<string, string>;
    requiredFields: string[];
}

export class ExcelService {
    static async parseBuffer<T>(
        buffer: Buffer,
        config: ExcelImportConfig
    ): Promise<Result<T[]>> {
        try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

            if (rawData.length === 0) {
                return error('Файл пуст');
            }

            const mappedData: T[] = [];

            for (const row of rawData) {
                const item: Record<string, unknown> = {};

                // Map headers
                for (const [excelHeader, value] of Object.entries(row)) {
                    const dbField = config.headerMap[excelHeader];
                    if (dbField) {
                        item[dbField] = value;
                    }
                }

                // Validate required fields
                const missingFields = config.requiredFields.filter(f => !item[f]);
                if (missingFields.length > 0) {
                    continue; // Or collect errors
                }

                mappedData.push(item as T);
            }

            return success(mappedData);
        } catch (e) {
            console.error('Excel parse error:', e);
            return error('Ошибка при разборе файла');
        }
    }

    static generateBuffer(data: Record<string, unknown>[], sheetName: string = 'Data'): Buffer {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
}
