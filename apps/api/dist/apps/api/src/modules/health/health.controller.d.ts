import { HealthCheckResponse } from "../../../../../packages/shared-types";
export declare class HealthController {
    private startTime;
    getHealth(): {
        status: string;
        uptime: number;
        timestamp: string;
    };
    getReadiness(): HealthCheckResponse;
    getVersion(): {
        version: string;
        build: string;
        environment: string;
    };
}
