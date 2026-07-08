import { CanActivate, ExecutionContext } from "@nestjs/common";
export declare class TenantContextGuard implements CanActivate {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
