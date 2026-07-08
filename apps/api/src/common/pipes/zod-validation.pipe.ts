import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodSchema } from "zod";

/** Validates and parses a request payload against a Zod schema.
 * Usage: `@Body(new ZodValidationPipe(loginRequestSchema)) body: LoginRequest` */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: result.error.flatten(),
      });
    }
    return result.data;
  }
}
