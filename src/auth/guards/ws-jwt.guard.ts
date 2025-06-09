import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = client.handshake.auth.token;

      if (!token) {
        throw new WsException('Unauthorized');
      }

      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      return true;
    } catch (err) {
      throw new WsException('Unauthorized');
    }
  }
}
