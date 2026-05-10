import {
  Controller, Get, Post, Patch,
  Body, Param, Request, UseGuards,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // POST /api/applications — candidato se postula
  @Post()
  @UseGuards(JwtAuthGuard)
  apply(@Body() body: { jobId: string; coverLetter?: string }, @Request() req) {
    return this.applicationsService.apply(req.user.id, body.jobId, body.coverLetter);
  }

  // GET /api/applications/my — mis postulaciones (candidato)
  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMine(@Request() req) {
    return this.applicationsService.findByCandidate(req.user.id);
  }

  // GET /api/applications/company — postulaciones recibidas (empresa)
  @Get('company')
  @UseGuards(JwtAuthGuard)
  findByCompany(@Request() req) {
    return this.applicationsService.findByCompany(req.user.id);
  }

  // GET /api/applications/job/:jobId — postulaciones de una oferta específica (empresa)
  @Get('job/:jobId')
  @UseGuards(JwtAuthGuard)
  findByJob(@Param('jobId') jobId: string, @Request() req) {
    return this.applicationsService.findByJob(jobId, req.user.id);
  }

  // GET /api/applications/check/:jobId — verificar si ya me postulé (candidato)
  @Get('check/:jobId')
  @UseGuards(JwtAuthGuard)
  check(@Param('jobId') jobId: string, @Request() req) {
    return this.applicationsService.hasApplied(req.user.id, jobId);
  }

  // PATCH /api/applications/:id/status — cambiar estado (empresa)
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
    @Request() req,
  ) {
    return this.applicationsService.updateStatus(id, req.user.id, body.status as any, body.notes);
  }
}
