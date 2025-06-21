import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { AlertLocation } from './entities/alert-location.entity';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SosGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Socket[]> = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify token and get user ID
      const user = await this.jwtService.verify(token);
      if (!user) {
        client.disconnect();
        return;
      }

      // Store socket connection
      const userSockets = this.userSockets.get(user.id) || [];
      userSockets.push(client);
      this.userSockets.set(user.id, userSockets);

      // Join user's room
      client.join(`user:${user}`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Remove socket from user's connections
    for (const [userId, sockets] of this.userSockets.entries()) {
      const index = sockets.indexOf(client);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }
        break;
      }
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('subscribeToAlert')
  handleSubscribeToAlert(client: Socket, alertId: string) {
    client.join(`alert:${alertId}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('unsubscribeFromAlert')
  handleUnsubscribeFromAlert(client: Socket, alertId: string) {
    client.leave(`alert:${alertId}`);
  }

  notifyLocationUpdate(alertId: string, location: AlertLocation) {
    this.server.to(`alert:${alertId}`).emit('locationUpdate', {
      alertId,
      location,
    });
  }
}
