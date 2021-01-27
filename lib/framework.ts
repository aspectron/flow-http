import { HttpRequest } from './http-server';

export interface HttpSessionInfo {
	cookie:string;
	session:any;
}


export interface HttpFrameworkOptions {
	staticFiles: [string,string][]|{[key:string]: string};
}

export abstract class HttpFramework { 
	abstract init():Promise<void>;

	abstract getApp():any;

	abstract getSession(cookie:string, req:HttpRequest):Promise<HttpSessionInfo>;
}

export type HttpFrameworkConstructor<T extends HttpFramework> = new (...args: any[]) => T;

