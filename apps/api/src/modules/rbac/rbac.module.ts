import { Global, Module } from "@nestjs/common";
import { RbacService } from "./rbac.service.js";
import { ScopeService } from "./scope.service.js";

@Global()
@Module({
  providers: [RbacService, ScopeService],
  exports: [RbacService, ScopeService],
})
export class RbacModule {}
