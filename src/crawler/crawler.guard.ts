import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class CrawlerGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const authHeader = request.headers['authentication'];

    console.log(authHeader);
    if (!authHeader) return false;
    const service_key = this.configService.get('CRAWLERS_SERVICE_KEY');

    return service_key === authHeader;
  }
}
