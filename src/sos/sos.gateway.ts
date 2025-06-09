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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SosGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Socket[]> = new Map();

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify token and get user ID
      const userId = await this.verifyToken(token);
      if (!userId) {
        client.disconnect();
        return;
      }

      // Store socket connection
      const userSockets = this.userSockets.get(userId) || [];
      userSockets.push(client);
      this.userSockets.set(userId, userSockets);

      // Join user's room
      client.join(`user:${userId}`);
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

  private async verifyToken(token: string): Promise<string | null> {
    // Implement token verification logic here
    // Return user ID if token is valid, null otherwise
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
    return null; // Placeholder
  }
}
