import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { Router, Transport, TransportOptions } from '@aspectron/flow-connection';
import { FlowHttp } from './http-server';

export interface SocketTransportOptions extends TransportOptions  {
    // conn_impl:any;
    // headers:string[];
    //httpServer:HttpServer|HttpsServer;
    flowHttp:FlowHttp;
}

export abstract class SocketTransport extends Transport  {

    //httpServer:Server;
    flowHttp:FlowHttp;
    // headers:string[];
    // conn_impl:any;
    // session:any;

    constructor(options:SocketTransportOptions) {
        super(options);
        //super(options);
        //this.httpServer = options.httpServer;
        this.flowHttp = options.flowHttp;
//        this.flowHttp.socketTransport = this;
        // if(options.router)
        //     this.router = options.router;
        // this.headers = options.headers;
        // this.conn_impl = options.conn_impl;
        // this.session = { token : null };
    }

//    init(flowHttp:FlowHttp) { this.flowHttp = flowHttp; }
    abstract start():Promise<void>;
    abstract stop():Promise<void>;
}



/*
const { ws, sockjs } = FlowHttp.modules;
if(ws) {
    ctx.ws = ws;
    this.io = new ws.Server({ server, path : this.config.websocketPath });
    this.initSocketHandler(ctx, this.config.websocketMode || FlowHttp.MODE.RPC);
}
else
if(sockjs) {
    ctx.sockjs = sockjs;
    // this.sockjs = sockjs;
    this.io = this.sockjs.listen(this.server, { prefix: websocketPath });
    this.initSocketHandler(ctx, this.config.websocketMode || FlowHttp.MODE.RPC);
}
*/