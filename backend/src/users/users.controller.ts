import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** PATCH /api/users/me */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Request() req, @Body() body: any) {
    return this.usersService.update(req.user.id, body);
  }

  /** GET /api/users — solo admin */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }
}
