export interface SystemRuntime {
	Transactions: {
		count: number;
		u_count: number;
	};
	System: {
		memory: {
			rss: number;
			heapTotal: number;
			heapUsed: number;
			external: number;
		};
		platform: string;
		cpuCount: number;
		freemem: number;
		cpuUsage: number;
	};
}

export type cpuStatus = {
	model: string;
	speed: number;
	times: {
		user: number;
		nice: number;
		sys: number;
		idle: number;
		irq: number;
	};
};
export type cpusStatus = cpuStatus[];
export type memStatus = {
	freeMem: number;
	totalmem: number;
};
export type systemStatus = {
	cpusStatus: cpusStatus;
	memStatus: memStatus;
};

export interface ExtendsSystemRuntime /* extends SystemRuntime*/ {
	ip: string;
	ping: number;
	port: number;
	webPort: number;
}
export type MiningMachine = {
	platform: string;
	hostname: string;
	cpus: cpusStatus;
	totalmen: number;
	ip: string;
	port: number;
	delegate_pwd: string;
	
};
