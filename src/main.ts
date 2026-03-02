import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://192.168.5.53:4200',
      'http://192.168.1.79:4200',
      'http://10.196.126.11 7:4200',
      'https://paradise-parking-system.vercel.app',
      'https://www.paradise-parking-system.com'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
    
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`Server running on port ${port}`);
  console.log(`GraphQL endpoint: http://localhost:${port}/graphql`);
}

bootstrap();