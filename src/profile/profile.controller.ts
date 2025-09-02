import { Controller, Get, Patch, Param, Post, Body, UseGuards, Req, ForbiddenException, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path, { extname } from 'path';
import { createReadStream } from 'fs';
import { join } from 'path';
import { Response } from 'express';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) { }

  // Get profile information 
  @UseGuards(JwtAuthGuard)
  @Get()
  async getProfile(@Req() req: any) {
    console.log('req.user:', req.user);
    const loggedInUserId = Number(req.user.id);
    console.log('Logged in user ID:', loggedInUserId);

    return this.profileService.getProfile(loggedInUserId);
  }

  // Update profile information
  @UseGuards(JwtAuthGuard)
  @Patch('update')
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto, @Req() req: any) {
    console.log('req.user:', req.user);
    const loggedInUserId = req.user.id;
    console.log('updateProfileDto:', updateProfileDto);

    return this.profileService.updateProfile({ ...updateProfileDto, id: loggedInUserId });
  }

  // Upload profile picture
  @UseGuards(JwtAuthGuard)
  @Post('upload-picture')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profile-pictures',
        filename: (req, file, callback) => {
          const user = (req as any).user;
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${user.id}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('Invalid file type. Only JPEG and PNG are allowed.'), false);
        }
      },
    }),
  )
  async uploadProfilePicture(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    console.log('Uploaded file:', file);
    const loggedInUserId = req.user.id;

    const filePath = `/uploads/profile-pictures/${file.filename}`;
    await this.profileService.updateProfilePicture(loggedInUserId, filePath);

    return { message: 'Profile picture uploaded successfully', filePath };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile-picture')
  async getProfilePicture(@Req() req: any, @Res() res: Response) {
    const loggedInUserId = req.user.id;

    const profilePicturePath = await this.profileService.getProfilePicturePath(loggedInUserId);
    if (!profilePicturePath) {
      throw new ForbiddenException('No profile picture found for this user.');
    }

    return profilePicturePath

  }

  // Upload CV
  @UseGuards(JwtAuthGuard)
  @Post('upload-cv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/cvs', // Directory for CV uploads
        filename: (req, file, callback) => {
          const user = (req as any).user;
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${user.id}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        console.log('File MIME type:', file.mimetype); // Log the MIME type
        const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          console.log('Invalid file type:', file.mimetype); // Log invalid file type
          callback(new Error('Invalid file type. Only PDF and Word documents are allowed.'), false);
        }
      },
    }),
  )
  async uploadCV(@UploadedFile() File: Express.Multer.File, @Req() req: any) {

    if (!File) {
      throw new Error('No file uploaded'); // Throw an error if no file is uploaded
    }
    console.log('Uploaded CV:', File);
    const loggedInUserId = req.user.id;

    const filePath = `/uploads/cvs/${File.filename}`;
    await this.profileService.updateCV(loggedInUserId, filePath);

    return { message: 'CV uploaded successfully', filePath };
  }

  // Download CV
  @UseGuards(JwtAuthGuard)
  @Get('download-cv')
  async downloadCV(@Req() req: any, @Res() res: Response) {
    const loggedInUserId = req.user.id;

    const cvPath = await this.profileService.getCVPath(loggedInUserId);
    if (!cvPath) {
      throw new Error('No CV found for this user.');
    }

    const fullPath = join(process.cwd(), cvPath);
    const fileStream = createReadStream(fullPath);

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename=${cvPath.split('/').pop()}`,
    });

    fileStream.pipe(res);
  }
}