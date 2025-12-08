import { HttpException, HttpStatus } from '@nestjs/common';

export class StorageException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR) {
    super(message, status);
  }
}

export class FileUploadException extends StorageException {
  constructor(message: string = 'Failed to upload file') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class FileDownloadException extends StorageException {
  constructor(message: string = 'Failed to download file') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class FileDeleteException extends StorageException {
  constructor(message: string = 'Failed to delete file') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class FileNotFoundException extends StorageException {
  constructor(message: string = 'File not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class InvalidFileTypeException extends StorageException {
  constructor(message: string = 'Invalid file type') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class FileSizeExceededException extends StorageException {
  constructor(message: string = 'File size exceeds maximum allowed size') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class StorageConfigurationException extends StorageException {
  constructor(message: string = 'Storage service is not properly configured') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
