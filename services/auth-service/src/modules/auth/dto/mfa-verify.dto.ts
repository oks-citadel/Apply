import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class MfaVerifyDto {
  @ApiProperty({
    description: 'MFA token from authenticator app',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'MFA token is required' })
  @Length(6, 6, { message: 'MFA token must be 6 digits' })
  token: string;
}
