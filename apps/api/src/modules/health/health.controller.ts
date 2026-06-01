import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'personal-newspaper-api',
      timestamp: new Date().toISOString(),
    };
  }
}

