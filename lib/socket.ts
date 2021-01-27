import { ConnectionOptions, Connection } from '@aspectron/flow-connection';

export interface SocketOptions extends ConnectionOptions {
//    conn_impl:any;
//    headers:string[];
}

export abstract class Socket extends Connection {

    // headers:string[];
    // conn_impl:any;
    // session:any;

    constructor(options:SocketOptions) {
        super(options);
        // this.headers = options.headers;
        // this.conn_impl = options.conn_impl;
        // this.session = { token : null };
    }
}

