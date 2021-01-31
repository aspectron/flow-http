import { HttpRequest } from './http-server';

export interface HttpSessionInfo {
	cookie:string;
	session:any;
}


export interface HttpFrameworkOptions {
//	type?:HttpFrameworkConstructor<HttpFramework>;
	staticFiles: [string,string][]|{[key:string]: string}|undefined; 
}

export abstract class HttpFramework { 
	abstract init():Promise<void>;

	abstract getApp():any;

	abstract getSession(cookie:string, req:HttpRequest):Promise<HttpSessionInfo>;
}

export type HttpFrameworkConstructor<T extends HttpFramework> = new (...args: any[]) => T;
//export type HttpFrameworkConstructorEx<T extends HttpFramework, K extends HttpFrameworkOptions> = new (...args: any[]) => T;

