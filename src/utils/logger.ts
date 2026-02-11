import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export class Logger {
  private static log(level: 'INFO' | 'WARN' | 'ERROR', message: string, color: keyof typeof chalk) {
    const today = new Date().toISOString().slice(0, 10);
    const logDir = path.resolve(__dirname, '../../logs');
    const logFile = path.join(logDir, `${today}.log`);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    const location = this.getCallerLocation();
    const timestamp = new Date().toISOString();

    const readable = `${timestamp} - ${level}: [${location.relative}] - ${message}`;
    const withLink = `${readable}  (🔗 ${location.link})\n`;

    const colored = chalk[color as keyof typeof chalk] as (msg: string) => string;
    console.log(colored(readable));

    // Plain text log file
    fs.appendFileSync(logFile, withLink);
  }

  static info(message: string) {
    this.log('INFO', message, 'green');
  }

  static warn(message: string) {
    this.log('WARN', message, 'yellow');
  }

  static error(message: string) {
    this.log('ERROR', message, 'red');
  }

  private static getCallerLocation() {
    const stack = new Error().stack;
    if (!stack) return { link: '', relative: '' };

    const stackLines = stack.split('\n');
    const callerLine = stackLines[3] || '';

    const match = callerLine.match(/\((.*):(\d+):(\d+)\)/);
    const filePath = match?.[1] || '';
    const line = match?.[2] || '0';
    const column = match?.[3] || '0';

    const relative = path.relative(process.cwd(), `${filePath}:${line}:${column}`);
    const link = `file://${filePath}:${line}:${column}`;

    return { link, relative };
  }
}
