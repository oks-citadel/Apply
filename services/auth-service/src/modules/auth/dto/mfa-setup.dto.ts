import { ApiProperty } from '@nestjs/swagger';

export class MfaSetupResponseDto {
  @ApiProperty({
    description: 'MFA secret key',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret: string;

  @ApiProperty({
    description: 'QR code data URL for scanning with authenticator app',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  qrCode: string;

  @ApiProperty({
    description: 'OTP Auth URL',
    example: 'otpauth://totp/ApplyForUs:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ApplyForUs',
  })
  otpauthUrl: string;
}
