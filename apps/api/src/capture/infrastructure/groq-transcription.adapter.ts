import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq, { toFile } from 'groq-sdk';
import { TranscriptionPort } from '../domain/transcription.port';

const WHISPER_MODEL = 'whisper-large-v3-turbo';

@Injectable()
export class GroqTranscriptionAdapter implements TranscriptionPort {
  private readonly client: Groq;

  constructor(configService: ConfigService) {
    this.client = new Groq({
      apiKey: configService.getOrThrow<string>('GROQ_API_KEY'),
    });
  }

  async transcribe(audio: Buffer, fileName: string): Promise<string> {
    const transcription = await this.client.audio.transcriptions.create({
      model: WHISPER_MODEL,
      file: await toFile(audio, fileName),
      language: 'es',
    });
    return transcription.text;
  }
}
