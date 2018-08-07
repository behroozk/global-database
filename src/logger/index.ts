import Console from 'console';

import { LogLevel } from '../client/options.interface';

export class Logger {
    constructor(private logLevel: LogLevel, private timed: boolean) { }

    public log(...messages: any[]): void {
        if (this.logLevel === LogLevel.ALL) {
            this.addTimeIfNeeded(messages);
            Console.log(...messages);
        }
    }

    public error(...messages: any[]): void {
        if (this.logLevel === LogLevel.ALL || this.logLevel === LogLevel.ERROR) {
            this.addTimeIfNeeded(messages);
            Console.error(...messages);
        }
    }

    public warn(...messages: any[]): void {
        if (this.logLevel === LogLevel.ALL) {
            this.addTimeIfNeeded(messages);
            Console.warn(...messages);
        }
    }

    private addTimeIfNeeded(messages: any[]): void {
        if (this.timed) {
            messages.unshift(new Date());
        }
    }
}
