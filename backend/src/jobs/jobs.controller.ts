import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Request, UseGuards,
} from '@nestjs/common';
import { JobsService }  from './jobs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard }   from '../common/guards/roles.guard';
import { Roles }        from '../common/decorators/roles.decorator';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // GET /api/jobs — todas las ofertas activas (público para candidatos)
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.jobsService.findAll();
  }

  // GET /api/jobs/my — ofertas de la empresa logueada
  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMine(@Request() req) {
    return this.jobsService.findByCompany(req.user.id);
  }

  // GET /api/jobs/:id — detalle de una oferta
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  // POST /api/jobs — crear oferta (empresa)
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: any, @Request() req) {
    return this.jobsService.create(req.user.id, body);
  }

  // PATCH /api/jobs/:id — editar oferta (empresa dueña)
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.jobsService.update(id, req.user.id, body);
  }

  // DELETE /api/jobs/:id/hard — eliminar oferta definitivamente (debe ir ANTES de /:id)
  @Delete(':id/hard')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.jobsService.remove(id, req.user.id);
  }

  // DELETE /api/jobs/:id — desactivar oferta (soft delete)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deactivate(@Param('id') id: string, @Request() req) {
    return this.jobsService.deactivate(id, req.user.id);
  }

  // GET /api/jobs/admin/all — todas las ofertas (activas e inactivas), solo admin
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  adminFindAll() {
    return this.jobsService.adminFindAll();
  }

  // DELETE /api/jobs/admin/:id — eliminar cualquier oferta, solo admin
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  adminRemove(@Param('id') id: string) {
    return this.jobsService.adminRemove(id);
  }
}