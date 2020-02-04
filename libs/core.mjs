/*
 *  Look at you, hacker. A pathetic creature of meat and bone, 
 *  panting and sweating as you run through my corridors. 
 *  How can you challenge a perfect, immortal machine?
 *                                                          SHODAN
 */

import IO from './io.mjs';
import DB from './db.mjs';
import clear from './clear.mjs';
import mProxy from './module-proxy.mjs';
import { uuid, isValidUrl } from './utils.mjs'
import subarg from 'subarg';
import fileSystem from 'fs';
import { pathToFileURL } from 'url';
import { join } from 'path';

const fs = fileSystem.promises;

export default class Terminal extends IO {
    allowed = new Map([
        [ 'clear', clear ], 
        [ 'exit', this.exit ], 
        [ 'use', this.use ], 
        [ 'flush', this.flush ]
    ]);
    savedStates = new Map();

    constructor(settings) {
        super(settings.inputStream || process.stdin, settings.outputStream || process.stdout, settings.host, settings.storage);

        if(settings.repo)
            this.mDirs.unshift(...settings.repo);

        this.promise = new Promise(async resolve => {
            await fs.mkdir(this.logDir, { recursive: true });
            await fs.mkdir(this.fileDir, { recursive: true });

            await this.loadDb();
            await clear.call(this);

            while(true) {
                try {
                    const [ isExit, result ] = await this.get();

                    if(isExit) {
                        resolve(result);
                        break;
                    }
                } catch(errInternal) {
                    await this.log(errInternal);
                }
            }
        });
    }

    async loadDb() {
        const log = new DB(`${this.logDir}/log_${this.session}.json`, []);
        const storage = new DB(`${this.storageLink}`, {});
        await Promise.all([ log, storage ]);

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
        else
            throw new Error(`Method \`${args._[0]}\` not found`);
    }

    async flush() {
        await Promise.all([
            ...(await fs.readdir(this.logDir))
                .map(file => (file==`log_${this.session}.json` || fs.unlink(`${this.logDir}${file}`))),
            this.db.log.clear(),
            this.log('Logs have been updated')
        ]); 
    }

    async use(options) {
        const module = new (await this.find(options._[1]));
        
        return await module.execute(options);
    }

    async find(module) {
        const notCache = uuid();

        for(let dir of this.mDirs) {
            const url = await this.isExist(dir, `${module}.mjs`) || await this.isExist(dir, `${module}/index.mjs`);
            if(url) {
                return (await import(`${url}?${notCache}`)).default(mProxy(this, notCache));
            }
        }

        throw new Error(`Module \`${module}\` not found`);
    }

    isExist(...path) {
        path = isValidUrl(join(...path)) || join(...path);

        return new Promise(done => {
            fileSystem.exists(path, exist => {
                done(exist && pathToFileURL(path).href || false)
            });
        });
    }

    exit() {
        return [ true ];
    }

    then(...args) {
        return this
            .promise
            .then
            .apply(this.promise, args);
    }
}