import { IsArray, IsString } from 'class-validator';

export class ManageUsersDto {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}
