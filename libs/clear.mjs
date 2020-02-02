// import pkg from '../package.json';
import { LIBDIR } from './utils.mjs';
import fileSystem from 'fs';
import { join } from 'path';

const fs = fileSystem.promises;
let pkg = false;

export default function clear() {
    return new Promise(async done => {
        if(!pkg) pkg = JSON.parse(await fs.readFile(join(LIBDIR, '../package.json')));
        this.rl.output.write(`\x1b[2J\x1b[0f                                    ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄   
                                 ▄▀░░░░░░░░░░░░▄░░░░░░░▀▄  
                                 █░░▄░░░░▄░░░░░░░░░░░░░░█ 
                                 █░░░░░░░░░░░░▄█▄▄░░▄░░░█ ▄▄▄
                          ▄▄▄▄▄  █\x1b[34m░░░░░░\x1b[0m▀\x1b[34m░░░░\x1b[0m▀█░░▀▄\x1b[34m░░░░░\x1b[0m█▀▀░██   
                          ██▄▀██▄█\x1b[34m░░░\x1b[0m▄\x1b[34m░░░░░░░\x1b[0m██░░░░▀▀▀▀▀░░░░██     
                           ▀██▄▀██\x1b[34m░░░░░░░░\x1b[0m▀\x1b[34m░\x1b[0m██▀░░░░░░░░░░░░░▀██        
                             ▀████\x1b[31m░\x1b[0m▀\x1b[31m░░░░\x1b[0m▄\x1b[31m░░░\x1b[0m██░░░▄█░░░░▄░▄█░░██    
                                ▀█\x1b[31m░░░░\x1b[0m▄\x1b[31m░░░░░\x1b[0m██░\x1b[35m░░\x1b[0m░▄░░░▄░░▄░\x1b[35m░░\x1b[0m██   
                 ___  ________  ▄█▄\x1b[31m░░░░░░░░░░░\x1b[0m▀▄░░▀▀▀▀▀▀▀▀░░▄▀  
                / _ \\/  _/ __/ █▀▀█████████▀▀▀▀████████████▀   
               / // // // _/   ████▀  ███▀      ▀███  ▀██▀               
              /____/___/___/    _           __
             / /____ ______ _  (_)__  ___ _/ /
            / __/ -_) __/  ' \\/ / _ \\/ _ \`/ / 
            \\__/\\__/_/ /_/_/_/_/_//_/\\_,_/_/     v${pkg.version}\n\n\n`, done);
    });
}