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

        await this.log({ type: 'success', message: 'ok!' });

        const exp = await this.getVar('exp');
        await this.log(`2 ^ ${exp} = ${2 ** exp}`);

        await this.kill();
    }

    // Optional method
    async kill() {
        await this.log('killing...');
    }
};
