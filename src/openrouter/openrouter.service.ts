import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import csvParse from 'csv-parse';

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: this.configService.get<string>('OPENROUTER_API_KEY'),
      defaultHeaders: {
        'HTTP-Referer': this.configService.get<string>('SITE_URL') || '',
        'X-Title': this.configService.get<string>('SITE_NAME') || '',
      },
    });
  }

  async ask(message: any, model: string, fileContent?: string): Promise<string> {
    this.logger.log(`Sending request to OpenRouter API, model: ${model}, messages: ${message.length}, has file: ${!!fileContent}`);
    
    const systemMessage = {
      role: "system",
      content: "You are a chat assistant. I am sending you the last 20 messages from the user. Please respond to the latest message, taking into account the context of the previous messages."
    };

    let messagesForModel = [systemMessage, ...message];
    
    // Если есть содержимое файла, добавляем его в контекст
    if (fileContent) {
      this.logger.log(`Adding file content to request, content length: ${fileContent.length} characters`);
      const fileMessage = {
        role: "user",
        content: `Содержимое загруженного файла:\n\n${fileContent}\n\nПожалуйста, проанализируй этот файл и ответь на вопрос пользователя.`
      };
      messagesForModel.push(fileMessage);
    }
    
    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages: messagesForModel
      });

      const response = completion.choices[0].message?.content || '';
      this.logger.log(`Received response from OpenRouter API, model: ${model}, response length: ${response.length}`);
      
      return response;
    } catch (error) {
      this.logger.error(`Error calling OpenRouter API, model: ${model}:`, error);
      throw error;
    }
  }

  async processFile(fileBuffer: Buffer, mimeType: string): Promise<string> {
    this.logger.log(`Processing file with mime type: ${mimeType}, buffer size: ${fileBuffer.length} bytes`);
    
    try {
      let result: string;
      
      switch (mimeType) {
        case 'application/pdf':
          result = await this.extractPdfText(fileBuffer);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          result = await this.extractDocxText(fileBuffer);
          break;
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
          result = await this.extractPptxText(fileBuffer);
          break;
        case 'text/csv':
          result = await this.extractCsvText(fileBuffer);
          break;
        case 'text/plain':
          result = fileBuffer.toString('utf-8');
          break;
        default:
          throw new Error(`Неподдерживаемый тип файла: ${mimeType}`);
      }
      
      this.logger.log(`File processed successfully, mime type: ${mimeType}, extracted text length: ${result.length} characters`);
      return result;
    } catch (error) {
      this.logger.error(`Error processing file, mime type: ${mimeType}:`, error);
      throw new Error(`Ошибка при обработке файла: ${error.message}`);
    }
  }

  private async extractPdfText(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text || 'Текст не найден в PDF файле';
    } catch (error) {
      throw new Error(`Ошибка при извлечении текста из PDF: ${error.message}`);
    }
  }

  private async extractDocxText(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || 'Текст не найден в DOCX файле';
    } catch (error) {
      throw new Error(`Ошибка при извлечении текста из DOCX: ${error.message}`);
    }
  }

  private async extractPptxText(buffer: Buffer): Promise<string> {
    try {
      // Для PPTX используем mammoth с опцией для презентаций
      const result = await mammoth.extractRawText({ buffer });
      return result.value || 'Текст не найден в PPTX файле';
    } catch (error) {
      throw new Error(`Ошибка при извлечении текста из PPTX: ${error.message}`);
    }
  }

  private async extractCsvText(buffer: Buffer): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const text = buffer.toString('utf-8');
        csvParse.parse(text, {
          columns: true,
          skip_empty_lines: true
        }, (err, records) => {
          if (err) {
            reject(new Error(`Ошибка при парсинге CSV: ${err.message}`));
            return;
          }
          
          if (!records || records.length === 0) {
            resolve('CSV файл пуст или не содержит данных');
            return;
          }

          // Форматируем CSV в читаемый вид
          const formattedText = records.map((record: any, index: number) => {
            const rowText = Object.entries(record)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');
            return `Строка ${index + 1}: ${rowText}`;
          }).join('\n');

          resolve(formattedText);
        });
      });
    } catch (error) {
      throw new Error(`Ошибка при извлечении текста из CSV: ${error.message}`);
    }
  }
}
