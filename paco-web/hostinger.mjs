import {startServer} from './server.mjs';

try{startServer();}
catch{console.error('CONFIGURATION_INVALID');process.exitCode=1;}
