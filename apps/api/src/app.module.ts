import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CaptureModule } from './capture/capture.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    // Serves the Angular build (copied into dist/web at build time — see
    // render.yaml) from the same origin as the API, so the browser never
    // sees blurt-web and blurt-api as different sites. That's what makes
    // the session cookie work everywhere: Safari ITP, Chrome Incognito's
    // third-party cookie blocking, and installed iOS PWAs that otherwise
    // kick cross-origin navigations out to Safari mid-login.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'web'),
      exclude: ['/auth/{*path}', '/notes/{*path}', '/capture/{*path}'],
    }),
    UsersModule,
    AuthModule,
    CaptureModule,
  ],
})
export class AppModule {}
