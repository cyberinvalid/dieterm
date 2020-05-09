import subarg from 'subarg';
import fileSystem from 'fs';
import { pathToFileURL } from 'url';
import { join } from 'path';
import IO from './io';
import DB from './db';
import clear from './clear';
import ModuleProxy from './module-proxy';
import { uuid, isValidUrl } from './utils';

const fs = fileSystem.promises;

export default class Terminal extends IO {
    allowed = new Map([
        ['clear', clear],
        ['exit', this.exit],
        ['use', this.use],
        ['flush', this.flush]
    ]);
    savedStates = new Map();

    constructor(settings = {}) {
        super({
            inputStream: process.stdin,
            outputStream: process.stdout,
            ...settings
        });

        if(settings.repo)
            this.mDirs.unshift(...settings.repo);
    }

    async promise() {
        await fs.mkdir(this.logDir, { recursive: true });
        await fs.mkdir(this.fileDir, { recursive: true });

        await this.loadDb();
        await clear.call(this);

        while(true) {
            try {
                const [isExit, result] = await this.get();

                if(isExit)
                    return result;
            } catch(errInternal) {
                await this.log(errInternal);
            }
        }
    }

    async loadDb() {
        const log = new DB(`${this.logDir}/log_${this.session}.json`, []);
        const storage = new DB(`${this.storageLink}`, {});
        await Promise.all([log, storage]);

        this.db = { log, storage };
    }

    async get() {
        const line = await this.readLine();
        const args = subarg(line.split(' '));

        if(!args._[0])
            return [];

        const method = this.allowed.get(args._[0]);

        if(method)
            return (await method.call(this, args) || []);

        throw new Error(`Method \`${args._[0]}\` not found`);
    }

    async flush() {
        await Promise.all([
            ...(await fs.readdir(this.logDir))
                .map(file =>
                    (file === `log_${this.session}.json` || fs.unlink(`${this.logDir}${file}`))),
            this.db.log.clear(),
            this.log('Logs have been updated')
        ]);
    }

    async use(options) {
        const module = new (await this.find(options._[1]))();

        return Promise.resolve(module.execute(options));
    }

    async find(module) {
        const notCache = uuid();

        for(const dir of this.mDirs) {
            const url = await this.isExist(dir, `${module}.js`) || await this.isExist(dir, `${module}/index.js`);
            if(url) {
                return (await import(`${url}?${notCache}`))
                    .default(ModuleProxy(this, notCache));
            }
        }

        throw new Error(`Module \`${module}\` not found`);
    }

    isExist(...path) {
        const curPath = isValidUrl(join(...path)) || join(...path);

        return new Promise(done => {
            fileSystem.exists(curPath, exist => {
                done(exist && pathToFileURL(curPath).href);
            });
        });
    }

    exit() {
        return [true];
    }

    then(...args) {
        const promise = this.promise();

        return promise.then.call(promise, ...args);
    }
}
