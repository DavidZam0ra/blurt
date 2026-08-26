import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(cookieParser());

  // WEB_ORIGIN is only set locally, where Angular's dev server (a
  // different origin/port) needs CORS to call this API. In production the
  // web app is served by this same process (see ServeStaticModule), so
  // there's no cross-origin caller to allow.
  const webOrigin = configService.get<string>('WEB_ORIGIN');
  if (webOrigin) {
    app.enableCors({ origin: webOrigin, credentials: true });
  }
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
