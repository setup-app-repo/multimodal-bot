import { Injectable, Logger } from '@nestjs/common';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

@Injectable()
export class AudioConversionService {
    private readonly logger = new Logger(AudioConversionService.name);

    async oggOpusToMp3(buffer: Buffer): Promise<Buffer> {
        const inputPath = join(tmpdir(), `${randomUUID()}.ogg`);
        const outputPath = join(tmpdir(), `${randomUUID()}.mp3`);
        await fs.writeFile(inputPath, buffer);

        try {
            await this.runFfmpeg([ '-y', '-i', inputPath, '-acodec', 'libmp3lame', '-ar', '44100', '-ac', '1', outputPath ]);
            const mp3 = await fs.readFile(outputPath);
            return mp3;
        } finally {
            try { await fs.unlink(inputPath); } catch {}
            try { await fs.unlink(outputPath); } catch {}
        }
    }

    async oggOpusToWav(buffer: Buffer): Promise<Buffer> {
        const inputPath = join(tmpdir(), `${randomUUID()}.ogg`);
        const outputPath = join(tmpdir(), `${randomUUID()}.wav`);
        await fs.writeFile(inputPath, buffer);

        try {
            await this.runFfmpeg([ '-y', '-i', inputPath, '-ar', '16000', '-ac', '1', outputPath ]);
            const wav = await fs.readFile(outputPath);
            return wav;
        } finally {
            try { await fs.unlink(inputPath); } catch {}
            try { await fs.unlink(outputPath); } catch {}
        }
    }

    private runFfmpeg(args: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const bin = (ffmpegPath as unknown as string) || 'ffmpeg';
            const child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
            let stderr = '';
            child.stderr.on('data', (d) => { stderr += d.toString(); });
            child.on('error', (err) => reject(err));
            child.on('close', (code) => {
                if (code === 0) return resolve();
                reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
            });
        });
    }
}


