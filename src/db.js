import low from 'lowdb';
import FileAsync from 'lowdb/adapters/FileAsync';

export default class DataBase {
    ready = false;

    constructor(fileLink, defaultValue = {}) {
        this.adapter = new FileAsync(fileLink, { defaultValue });
    }

    async promise() {
        this.driver = await low(this.adapter);
        this.ready = true;
    }

    update(...args) {
        if(!this.ready)
            return;

        if(args.length === 3) {
            const fData = this.driver
                .get(args[0])
                .find(args[1]);

            return fData
                .assign(args[2])
                .write();
        }

        const fData = this.driver
            .find(args[0]);

        return fData.assign(args[1])
            .write();
    }

    remove(...args) {
        if(!this.ready)
            return;

        if(args.length === 2) {
            return this.driver
                .get(args[0])
                .remove(args[1])
                .write();
        }

        return this.driver
            .remove(args[0])
            .write();
    }

    clear(...args) {
        if(!this.ready)
            return;

        if(args.length) {
            return this.driver
                .set(args[0], [])
                .write();
        }

        return this.driver
            .remove({})
            .write();
    }

    getAll(...args) {
        if(!this.ready)
            return;

        if(args.length === 2) {
            return this.driver
                .get(args[0])
                .filter(args[1])
                .value();
        }

        return this.driver
            .filter(args[0])
            .value();
    }

    get(...args) {
        if(!this.ready)
            return;

        if(args.length === 2) {
            return this.driver
                .get(args[0])
                .findLast(args[1])
                .value();
        }

        return this.driver
            .findLast(args[0])
            .value();
    }

    add(...args) {
        if(!this.ready)
            return;

        if(args.length === 2) {
            return this.driver
                .get(args[0])
                .push(args[1])
                .write();
        }

        return this.driver
            .push(args[0])
            .write();
    }

    then(...args) {
        const promise = this.promise();
        return promise.then.call(promise, ...args);
    }
}
