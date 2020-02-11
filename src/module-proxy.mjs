class ModuleProxy {
    isKilled = false;
    lastUpdate = Date.now();
    rArgs = new Set([ '_', 'l', 'last' ]);
    firstCall = true;

    constructor(terminal, uuid, module) {
        this.terminal = terminal;
        this.uuid = uuid;

        return new Proxy(module, {
            get: this.get.bind(this),
            set: this.set.bind(this),
            deleteProperty: this.deleteProperty.bind(this)
        });
    }

    dbMethodProxy(name, method) {
        const proxy = this;

        return new Proxy(method, {
            apply(...args) {
                args[1] = proxy.terminal.db.storage;
                args[2][0] = `Options.${name.split("/")[0]}.${args[2][0]}`;

                return Reflect.apply(...args);
            }
        });
    }

    dbProxy(...args) {
        const proxy = this;
        const name = Reflect.get(args[0], 'name');

        return new Proxy(this.terminal.db.storage, {
            get(...args) {
                const method = Reflect.get(...args);
                if(typeof method==='function' && name) {
                    return proxy.dbMethodProxy(name, method);
                }
            }
        });
    }

    killProxy(...args) {
        const proxy = this;
        const name = Reflect.get(args[0], 'name');
        const method = Reflect.get(...args);

        return new Proxy(method || (() => {}), {
            async apply(...args) {
                const result = await Reflect.apply(...args);

                proxy.isKilled = true;
                proxy.terminal
                    .savedStates
                    .delete(name);
                
                return result;
            }
        })
    }

    defineObjectProxy(name, property, target) {
        if(!this.firstCall) {
            const properties = this.terminal
                .savedStates
                .get(name)
                .properties;

            if(!properties.has(target)) {
                return new Proxy(property, {
                    defineProperty(...args) {
                        properties.set(target, property);
        
                        return Reflect.defineProperty(...args);
                    }
                });
            }
        }

        return property;
    }

    applyMethodProxy(name, method, gArgs) {
        const proxy = this;

        return new Proxy(method, {
            async apply(...args) {
                try {
                    const state = proxy.terminal
                        .savedStates
                        .get(name);

                    if(proxy.firstCall) {
                        if(args[2][0].l || args[2][0].last && state) {
                            state.properties
                                .forEach((value, name) => Reflect.set(gArgs[0], name, value, gArgs[2]));
                            gArgs[1] = state.target;
                            args[0] = Reflect.get(...gArgs);
                            args[2] = Object.assign(state.params, [ { ...state.params[0], ...args[2][0] } ]);
                        }

                        proxy.terminal
                            .savedStates
                            .set(name, {
                                target: gArgs[1],
                                params: args[2],
                                properties: new Map()
                            });

                        proxy.firstCall = false;
                    } else {
                        Object.assign(state, {
                            target: gArgs[1],
                            params: args[2]
                        });
                    }
                    return await Reflect.apply(...args);
                } catch(error) {
                    if(!proxy.isKilled) {
                        gArgs[1] = 'kill';
                        const killMethod = Reflect.get(...gArgs);
                        if(killMethod) 
                            await Reflect.apply(killMethod, args[1], []);
                        proxy.isKilled = true;    
                    }

                    throw error;
                }
            }
        });
    }

    propertyProxy(...args) {
        const name = Reflect.get(args[0], 'name');
        if(this.isKilled)
            throw new Error(`Module \`${name}\` is already closed`);

        const property = Reflect.get(...args);

        if(typeof property==='function') {
            const stack = Reflect.get(args[0], 'stack', args[2]);
   
            if(stack && stack.has(args[1]) && name) {
                return this.applyMethodProxy(name, property, args);
            }
        } else if(typeof property==='object') {
            return this.defineObjectProxy(name, property, args[1]);
        }

        return property;
    }

    get(...args) {
        this.lastUpdate = Date.now();

        switch(args[1]) {
            case 'db':
                return this.dbProxy(...args);
            case 'kill':
                return this.killProxy(...args);
            default:
                return this.propertyProxy(...args);
        }
    }

    set(...args) {
        this.lastUpdate = Date.now();

        !this.firstCall && this.terminal
            .savedStates
            .get(Reflect.get(args[0], 'name'))
            .properties
            .set(args[1], args[2]);

        return Reflect.set(...args);
    }
    
    deleteProperty(...args) {
        this.lastUpdate = Date.now();

        !this.firstCall && this.terminal
            .savedStates
            .get(Reflect.get(args[0], 'name'))
            .properties
            .delete(args[1]);

        return Reflect.deleteProperty(...args);
    }
}

export default (terminal, uuid) => class {
    constructor() {
        return new ModuleProxy(terminal, uuid, this);
    }

    log(...args) {
        return terminal.log(...args);
    }

    find(...args) {
        return terminal.find(...args);
    }

    getVar(rVar, placeholder = '') {
        return terminal.readLine(`${(this.type||'module')}\x1b[30m\x1b[47m::\x1b[0m${this.name} > ${rVar}: `, placeholder)
    }

    async getObject(...array) {
        const rObject = {};
        for(let i=0;i<array.length;i++) {
            rObject[array[i]] = await this.getVar(array[i]);
        }
        return rObject;
    }
}