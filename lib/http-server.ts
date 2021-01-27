import path = require("path");
import fs = require("fs");
import { Server as HttpServer, globalAgent as globalAgentHttp, createServer as createHttpServer, IncomingHttpHeaders, ClientRequest } from 'http';
import { Server as HttpsServer, globalAgent as globalAgentHttps, createServer as createHttpsServer } from 'https';
import EventEmitter = require("events");
import crypto = require("crypto");
import { FlowUid } from '@aspectron/flow-uid';
import { AsyncQueue, AsyncQueueSubscriberMap } from '@aspectron/flow-async';
// import { NatsConnection } from "nats";
import { FlowLogger } from '@aspectron/flow-logger';
import { RouterConstructor, Router, TransportConstructor, Transport } from "@aspectron/flow-connection";
//import utils = require("./utils");
//import { HttpSocketRouter } from './socket-router';
import { SocketTransport } from "./transport";
import { HttpFrameworkConstructor, HttpFramework } from './framework';

// class FlowSocketServerGRPC extends FlowSocketServer {

// }

// TODO - see if we can match this to any pre-defined types...
export interface HttpRequest { [key: string] : any; }
export interface HttpResponse { [key: string] : any; }


export interface FlowHttpOptions {
	port:number;
	host?:string;
	ssl:boolean;
	maxHttpSockets?:number;
	framework?:HttpFrameworkConstructor<HttpFramework>;
	socketRouter?:RouterConstructor<Router>;
	socketTransport?:TransportConstructor<SocketTransport>;
}

 

// socket lifetime open->connect->[available]->disconnect->close
// open - socket open, not initialized
// connect - socket initialized and available for use
// disconnect - socket disconnected, socket state available
// close - socket states cleaned up
export class FlowHttp extends EventEmitter{

    readonly appFolder:string;
    //readonly pkg:Object;
	options:FlowHttpOptions;
//	config:FlowHttpConfig = { } as FlowHttpConfig;
	// private httpSessionSecret_!:string;
//	runtimeUID:string;
//	connectionRouter?:ConnectionRouter;

	server!:HttpServer|HttpsServer;
	framework!:HttpFramework;
	socketTransport?:SocketTransport;
	socketRouter?:Router;

	logger:FlowLogger = new FlowLogger('FlowHttp', { custom : ['http:cyan'] });
	log(...args:any[]) { this.logger.http(...args); }

	constructor(appFolder:string, options:FlowHttpOptions){
		super();
		this.options = Object.assign({}, options) as FlowHttpOptions;
		this.appFolder = appFolder;
		if(!options.framework)
			throw new Error(`FlowHttp::constructor() option 'framework' is required, must supply HttpFramework derived class`);
		this.framework = new options.framework(this);
console.log(options);
		if(options.socketRouter) {
			this.log('creating socketRouter');
			this.socketRouter = new options.socketRouter(this);
		}

		if(options.socketTransport) {
			this.log('creating socketTransport');
			this.socketTransport = new options.socketTransport({ flowHttp: this });
		}
		//this.pkg = require(path.join(this.appFolder, "package.json"));

	}

	async init(){
		await this._init();
	}
	async _init(){
		// this.initConfig();
		// if(this.config.certificates)
		// 	await this.initCertificates();
		await this.initHttp();
	}

	initHttp(){
		return new Promise<void>(async (resolve, reject)=>{
			const { options } = this;
			const {port, host, ssl} = options;


//			this.initExpressApp();
			await this.framework.init();
			// this.emit("app.init", {app:this.app});
			// this.emit("init::app", {app:this.app}); // deprecated
//			this.initStaticFiles();

			globalAgentHttp.maxSockets = options.maxHttpSockets || 1024;
			globalAgentHttps.maxSockets = options.maxHttpSockets || 1024;

			let CERTIFICATES = false;//ssl && this.certificates;

			let args = [ ]
			args.push(port);
			host && args.push(host);

			args.push((error:any)=>{
				if(error){
					console.error(`Unable to start HTTP(S) server on port ${port}  ${host?" host '"+host+"'":''}`);
					return reject(error);
				}

				this.log(`HTTP server listening on port ${(port+'').bold}  ${host?" host '"+host+"'":''}`);

				if (!CERTIFICATES)
					this.log(("WARNING - SSL is currently disabled"));

					this.emit('server.init', {server:this.server});
					this.emit('init::http-server', {server:this.server}); // deprecated
				resolve();
			})

			let server;
			if(CERTIFICATES){
				server = createHttpServer(CERTIFICATES, this.framework.getApp());
				//this._isSecureServer = true;
			}else{
				server = createHttpsServer(this.framework.getApp());
			}


			this.server = server;

			// ---

			// if(this.socketRouter) {
			// 	this.socketRouter.init({ server, path : this.config.websocketPath});
			// }

			if(this.socketTransport)
				await this.socketTransport.start();


//			await 

			/*
			if(this.config.websocketPath) {


				// 

				const ctx = { websocketMode : this.config.websocketMode };
				this.initSocketServer(ctx);

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
			}
			*/

			// @ts-ignore
			server.listen(...args);
			//server.listen.apply(server, args);

		});
	}

	// initSocketServer(ctx) {
	// }

/*
	initSocketHandler(ctx, websocketMode) {
		//this.sockjs = sockjs;

		// let session = {
		// 	user : { token : null }
		// };

//		const jc = FlowHttp.modules.NATS?.JSONCodec?.();
		this.websockets = this.io.on('connection', async (conn_impl, req)=>{

			if(!conn_impl) {
				console.trace('invalid sockjs connection (null socket) - aborting');
				// console.log(arguments);
				return;
			}

			// let headers = null;
			// let remoteAddress = null;
			// let send_ = null;
            // let msgevent = null;
            
			if(ctx.ws) {
				headers = req.headers;
				remoteAddress = req.remoteAddress;
				send_ = conn_impl.send;
				msgevent = 'message';
			}
			else
			if(ctx.sockjs) {
				headers = conn_impl.headers;
				remoteAddress = conn_impl.remoteAddress;
				send_ = conn_impl.write;
				msgevent = 'data';
			}

console.log("CONN IMPL",conn_impl);
			//console.log(socket);
			let socket_is_alive = true;
			const ip:string = this.getIpFromHeaders(headers) || conn_impl.remoteAddress;
            //console.log(socket);
            const req:any = null;


            const options : SocketOptions = {
                ctx,
                conn_impl,
                ip,
            }

            const socket = new FlowSocket(options);

			// const socket = {
			// 	conn_impl,
			// 	id : conn_impl.id,
			// 	ip,
			// 	headers,
			// 	emit(...args) {
			// 		if(socket_is_alive)
			// 			send_.call(conn_impl, JSON.stringify(args));
			// 	},
			// 	publish(subject, data) {
			// 		if(socket_is_alive)
			// 			send_.call(conn_impl,JSON.stringify(['publish',{ subject, data }]));
			// 	},
			// 	on(...args) { conn_impl.on(...args); },
			// 	session : {
			// 		user : { token : null }
			// 	}
			// }



			if(ctx.ws) {
				socket.req = req;
			// 	socket.emit = (...args) => {
			// 		if(socket_is_alive)
			// 			conn_impl.send(JSON.stringify(args));
			// 	};

			// 	socket.publish = (subject, data) => {
			// 		if(socket_is_alive)
			// 			conn_impl.send(JSON.stringify(['publish',{ subject, data }]));
			// 	}
			 } 
			 else 
			 if(ctx.sockjs) {
				socket.req = conn_impl;
			 }


			// if(ctx.ws) {
			// 	socket.emit
			// }

			socket.on(msgevent, (data)=>{
				let [ event, msg ] = JSON.parse(data);
				console.log("SOCKET DATA:",event,msg);
				this.socketMessageHandler(socket, event, msg, ctx);
			})

			socket.emit('auth.getcookie');

			this.socketsOpen++;
			let rids = 0;
			this.websocketMap.set(socket.id, socket);
			if(!this.subscriptionMap.has(socket.id))
				this.subscriptionMap.set(socket.id, []);
			const subscriptions = this.subscriptionMap.get(socket.id);

			if(!this.pendingMap.has(socket.id))
				this.pendingMap.set(socket.id, new Map())
			const pending = this.pendingMap.get(socket.id);

			socket.on('close', () => {
				socket_is_alive = false;

				const msg = { socket, ip };//, socket.session };
				this.emit('socket.disconnect', msg);
				this.sockets.events.post('disconnect', msg);

				if(socket.session.user.token) {
					let socket_id_set = this.tokenToSocketMap.get(socket.session.user.token);
					if(socket_id_set) {
						socket_id_set.delete(socket.id);
						if(!socket_id_set.size)
							this.tokenToSocketMap.delete(socket.session.user.token);
					}
				}
				this.websocketMap.delete(socket.id);
				while(subscriptions.length) {
					const { token, subscription } = subscriptions.shift();
					subscriptionTokenMap.delete(token);
					subscription.unsubscribe();
					//this.nats.unsubscribe();
				}
				this.subscriptionMap.delete(socket.id);

				pending.forEach(cb=>{
					cb('disconnect');
				});

				pending.clear();

				this.emit('socket.close', msg);
				this.sockets.events.post('close', msg);

				this.socketsOpen--;
			});

			socket.emit('message', { subject : 'init' });
			this.emit("websocket.open", {socket});
			this.emit("socket.open", {socket});

		});
	}
*/
/*
	socketMessageHandler(socket, event, msg, ctx) {

		const jc = FlowHttp.modules.NATS?.JSONCodec?.();

		//console.log("+++++++++++++++++++++ EVENT",event,msg);
		if(event == 'auth.cookie') {
            // console.log("----------- auth:cookie");
            this.initSocketSession(socket, ctx)
		}
		else {
			if(websocketMode == 'RPC') {

			}
			else if(websocketMode == 'NATS')
			{

			}

		}

//		})

	}
*/

	// !!! ##############################
	// !!! ##############################
	// !!! ##############################


	// initExpressApp(){
	// 	let {config} = this;
	// 	let {express} = FlowHttp.modules;
	// 	if(typeof express!= 'function')
	// 		throw new Error("flow-http.FlowHttp requires express module.");
	// 	let app = express();
	// 	this.app = app;
	// 	let {xFrameOptions="SAMEORIGIN"} = config.http||{};
	// 	if(xFrameOptions){
	// 		app.use((req, res, next)=>{
	// 			if(req.url == "/" || req.url == "/index.html")
	// 				res.setHeader("X-Frame-Options", xFrameOptions);
	// 			next();
	// 		})
	// 	}
	// 	this.express = express;
	// 	this.initSession(app);
	// }

	// initStaticFiles(){
	// 	if(!this.config.staticFiles)
	// 		return
    //     let ServeStatic = this.express.static;
    //     let staticFiles = Array.isArray(this.config.staticFiles) ? this.config.staticFiles : Object.entries(this.config.staticFiles);
	// 	staticFiles.forEach(([dst, src])=>{
	// 		console.log('HTTP serving '+src.cyan.bold+' -> '+dst.cyan.bold);
	// 		this.app.use(src, ServeStatic(path.join(this.appFolder, dst)));
	// 	})
	// }

    
	initCertificates(){
		// if(this.verbose)
		// 	console.log('iris-app: loading certificates from ', this.appFolder+'/'+this.config.certificates);
		// if(this.certificates) {
		// 	console.error("Warning! initCertificates() is called twice!".redBG.bold);
		// 	return;
		// }
/*
		let {config} = this;
		let ca_chain;
		if(typeof(config.certificates) == 'string') {
			this.certificates = {
				key: fs.readFileSync(this.locateCertificateFile(config.certificates+'.key')).toString(),
				cert: fs.readFileSync(this.locateCertificateFile(config.certificates+'.crt')).toString(),
				ca: [ ]
			}
			ca_chain = config.certificates+'.ca';
		}else{
			this.certificates = {
				key: fs.readFileSync(this.locateCertificateFile(config.certificates.key)).toString(),
				cert: fs.readFileSync(this.locateCertificateFile(config.certificates.crt)).toString(),
				ca: [ ]
			}
			ca_chain = config.certificates.ca;
		}

		if(ca_chain) {
			let ca_chain_file = this.locateCertificateFile(ca_chain, true);

			if(ca_chain_file) {
				let cert = [ ]
				let chain = fs.readFileSync(ca_chain_file).toString().split('\n');
				chain.forEach(line=>{
					cert.push(line);
					if(line.match('/-END CERTIFICATE-/')) {
						this.certificates.ca.push(cert.join('\n'));
						cert = [ ]
					}
				})
			}
		}
*/		
    }
   

	locateCertificateFile(filename:string, ignore:boolean) {
		let file = path.join(this.appFolder, filename);
		let parts = file.split('.');
		parts.splice(parts.length-1, 0, '.local');
		let local = parts.join();
		if(fs.existsSync(local))
			return local;
		if(!ignore && !fs.existsSync(file)) {
			this.log("Unable to locate certificate file:", file);
			throw new Error("Unable to locate certificate file");
		}
		else if(ignore && !fs.existsSync(file))
			return null;

		return file;
    }
    

	// initSession(app){
	// 	let {session} = FlowHttp.modules;
	// 	let options = this.buildSessionOptions();
	// 	if(options && session){
	// 		this.sessionSecret = options.secret;
	// 		this.sessionKey = options.name;
	// 		if(!options.store)
	// 			options.store = new session.MemoryStore();
	// 		this.sessionStore = options.store;
	// 		options.cookie.httpOnly = false;
	// 		this.expressSession = session(options);
	// 		app.use(this.expressSession);
	// 		//this.log("sessionStore", this.sessionStore)
	// 	}
	// }


	getIpFromHeaders(headers:IncomingHttpHeaders): string {
		return (headers['x-real-ip'] || headers['x-client-ip']) as string;
	}

	// async shutdown() {
	// 	this.asyncSubscribers.shutdown();
	// 	this.sockets.events.shutdown();
	// }

}

// module.exports = FlowHttp
