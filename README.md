# DIE Terminal

### Features

`DIE Terminal` is a back-end component written in pure JavaScript that helps write executable flexible modules quickly and easily

### Installation

```bash
npm install --save https://github.com/cyberinvalid/dieterm.git
```

### Requires

- if nodejs older than `13.6.0` needs start with the parameter  --experimental-modules
- also you can pass --experimental-json-modules

```bash
node --experimental-modules --experimental-json-modules ...
```

### Quick Start
```javascript
'use strict';
import Terminal from 'dieterm';

(async () => { 
    console.log(await new Terminal) 
})();
```
### Terminal Class

This is an initializing promise-like class with the following arguments:

| Argument | Default |
| ------ | ------ |
| inputStream #1 | `process.stdin` |
| outputStream #2 | `process.stdout` |
| host #3 | `false` |
| storage #4 | `false` |
| modules dirs (rest) | `[]` |

### Simple module example

Run the module
```bash
use test
```

Code

```javascript
export default Module => class Test extends Module {
  // Save state of the following methods
  stack = new Set(['execute', 'continue']);
  // Module name
  name = 'test';
  // Entry point
  async execute() {
    await this.log('execute');
    await this.continue({ ...(await this.getObject('param')), error: true });
  }
  // Some method with saved state
  async continue(params) {
    if(params.error)
      throw new Error('some uncaught error');
        
    /*
    *    To avoid this error, continue executing the code with --error=
    *    `use test --last --error=`
    * */
    await this.log({ type: 'success',  message: 'ok!' });
    const exp = await this.getVar('exp');
    await this.log(`2 ^ ${exp} = ${Math.pow(2, exp)}`);
    
    await this.kill();
  }
  // Optional method
  async kill() {
    await this.log('killing...')
  }
}
```