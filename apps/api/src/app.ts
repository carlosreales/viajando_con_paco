import 'reflect-metadata';
import { Body, Catch, Controller, ExceptionFilter, ArgumentsHost, Get, HttpException,
  Inject, Module, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, Request, Response } from 'express';
import { DomainError, Principal } from './pets/domain';
import { PetRepository } from './pets/repository';
import { PetsService } from './pets/service';

export interface IdentityResolver { resolve(request: Request): Promise<Principal | undefined> }
export const denyIdentity: IdentityResolver = { resolve: async () => undefined };
const IDENTITY = Symbol('IDENTITY');

@Catch()
class SafeErrors implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = error instanceof DomainError ? error.status :
      error instanceof HttpException ? error.getStatus() :
      (error as { status?: number })?.status === 413 ? 413 :
      (error as { type?: string })?.type === 'entity.parse.failed' ? 400 : 500;
    const code = error instanceof DomainError ? error.code :
      status === 401 ? 'UNAUTHENTICATED' : status === 400 ? 'INVALID_INPUT' :
      status === 413 ? 'BODY_TOO_LARGE' : status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR';
    response.status(status).json({ error: { code } });
  }
}
@Controller('v1/pets')
class PetsController {
  constructor(private readonly pets: PetsService, @Inject(IDENTITY) private readonly identity: IdentityResolver) {}
  private async principal(request: Request) {
    const principal = await this.identity.resolve(request);
    if (!principal) throw new UnauthorizedException();
    return principal;
  }
  @Get() async list(@Req() req: Request) {
    return { items: await this.pets.list(await this.principal(req)) };
  }
  @Post() async create(@Req() req: Request, @Body() body: unknown) {
    return this.pets.create(await this.principal(req), body);
  }
  @Get(':id') async find(@Req() req: Request, @Param('id') id: string) {
    return this.pets.find(await this.principal(req), id);
  }
}
@Controller('health')
class HealthController {
  @Get() health() { return { status: 'ok', identity: 'integration-pending' }; }
}
export async function createApp(repo: PetRepository, identity: IdentityResolver = denyIdentity, clock?: () => Date) {
  @Module({
    controllers: [HealthController, PetsController],
    providers: [
      { provide: PetsService, useValue: new PetsService(repo, clock) },
      { provide: IDENTITY, useValue: identity }
    ]
  })
  class AppModule {}
  const app = await NestFactory.create(AppModule, { logger: false, bodyParser: false });
  app.use(json({ limit: '16kb' }));
  app.use((_req: Request, res: Response, next: () => void) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.useGlobalFilters(new SafeErrors());
  app.enableShutdownHooks();
  return app;
}

