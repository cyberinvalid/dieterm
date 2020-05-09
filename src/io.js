import { join } from 'path';
import readline from 'readline';
import os from 'os';
import fileSystem from 'fs';
import v8 from 'v8';
import { uuid, LIBDIR, APPDATADIR } from './utils';

const fs = fileSystem.promises;

const LOGTYPE = {
    message: 'Message',
    error: '\x1b[31mError\x1b[0m',
    success: '\x1b[32mSuccess\x1b[0m'
};

export default class IO {
    session = uuid();
    logLocked = false;
    lnPoint = false;
    streamReadyStack = [];
    host = process.env.host || os.userInfo().username.toLowerCase();
    logDir = join(APPDATADIR, './dieterm/storage/logs/');
    fileDir = join(APPDATADIR, './dieterm/storage/files/');
    storageLink = join(APPDATADIR, './dieterm/storage/index.json');
    mDirs = [join(LIBDIR, '../modules/')];

    constructor(settings) {
        if(settings.host)
            this.host = settings.host;
        if(settings.storage) {
            this.logDir = join(settings.storage, './logs/');
            this.fileDir = join(settings.storage, './files/');
            this.storageLink = join(settings.storage, './index.json');
        }

        this.rl = readline.createInterface({
            input: settings.inputStream,
            output: settings.outputStream
        });
    }

    ln() {
        return new Promise(done => {
            this.rl.output.write('\n', done);
        });
    }

    question(q) {
        return new Promise(done => this.rl.question(q, answer => {
            this.rl.pause();
            done(answer);
        }));
    }

    errorLog(log, error) {
        log.type = 'error';
        Object.getOwnPropertyNames(error)
            .forEach(property => {
                if(property === 'stack')
                    log.stacktrace = error[property].split('\n    ');
                else
                    log[property] = error[property];
            });
    }

    logTime(timestamp) {
        const date = new Date(timestamp);

        return [
            (`0${date.getHours()}`).slice(-2),
            (`0${date.getMinutes()}`).slice(-2),
            (`0${date.getSeconds()}`).slice(-2)
        ].join(':');
    }

    async objectLog(log, object) {
        if(object.file) {
            object.path = `${this.fileDir}${uuid()}.bin`;
            await fs.writeFile(object.path, v8.serialize(object.file));
            delete object.file;
        }

        log.type = object.type || (object.message && 'message') || 'state';
        Object.assign(log, object);
    }

    async renderLog(log) {
        await this.streamReady();
        let string = '';

        if(!this.lnPoint) {
            string += '\n';
            this.lnPoint = true;
        }

        string += `    [${this.logTime(log.timestamp)}] ${LOGTYPE[log.type]}: ${log.message}\n`;

        await new Promise(done => {
            this.rl.output.write(string, done);
        });

        this.rl.emit('pause');
    }

    async log(...logs) {
        if(logs.length > 1) {
            await Promise.all(logs.map(log => this.log(log)));
            return;
        }

        const eLog = { timestamp: Date.now() };

        if(logs[0] instanceof Error)
            this.errorLog(eLog, logs[0]);
        else if(typeof logs[0] !== 'object') {
            eLog.type = 'message';
            eLog.message = logs[0].toString();
        } else
            await this.objectLog(eLog, logs[0]);

        if(this.db.log)
            await this.db.log.add(eLog);

        if(eLog.message && !eLog.isHidden)
            await this.renderLog(eLog);
    }

    async readLine(name = false, placeholder = false) {
        await this.streamReady();

        if(this.lnPoint) {
            await this.ln();
            this.lnPoint = false;
        }

        const promise = this.question(name || `${this.host}\x1b[30m\x1b[47m@\x1b[0mdie > `);

        if(placeholder)
            this.rl.write(placeholder);

        return Promise.resolve(promise);
    }

    async streamReady() {
        if(!this.logLocked)
            return;
        await new Promise(done => this.rl.once('pause', () => {
            this.logLocked = false;
            done();
        }));
        if(!this.logLocked)
            await this.streamReady();
        this.logLocked = true;
    }
}
