import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { resultSearchSchema, type ResultSearchInput } from "@erp/shared";
import { Public } from "../../common/decorators/public.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { PublicService } from "./public.service.js";

@Controller("public/results")
export class PublicResultsController {
  constructor(private readonly publicService: PublicService) {}

  @Public()
  @Get("published")
  listPublished() {
    return this.publicService.listPublished();
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("search")
  search(@Body(new ZodValidationPipe(resultSearchSchema)) body: ResultSearchInput) {
    return this.publicService.searchResult(body.enrollmentNumber, body.rollNumber);
  }
}
