import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      callback(null, true);
    },
    credentials: true,
  },
  path: '/socket.io',
})
@Injectable()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('EventsGateway');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitSyncUpdate(data: { type: string; payload: any; storeId?: string }) {
    if (data.storeId) {
      this.server.to(`store_${data.storeId}`).emit('store_update', data);
    }
  }

  @SubscribeMessage('join_store')
  handleJoinStore(client: Socket, storeId: string) {
    const user = client.data.user;
    if (!user) throw new WsException('No autenticado');

    const allowed =
      user.role === 'admin' || user.role === 'super-admin' || (user.storeIds || []).includes(storeId);
    if (!allowed) throw new WsException('forbidden');

    client.join(`store_${storeId}`);
    this.logger.log(`User ${user.sub} joined store_${storeId}`);
    return { status: 'joined', room: `store_${storeId}` };
  }
}
