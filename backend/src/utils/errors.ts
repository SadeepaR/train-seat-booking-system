export class BookingConflictError extends Error {
  public statusCode = 409;
  public conflictingBooking?: any;

  constructor(message: string, conflictingBooking?: any) {
    super(message);
    this.name = 'BookingConflictError';
    this.conflictingBooking = conflictingBooking;
    Object.setPrototypeOf(this, BookingConflictError.prototype);
  }
}

export class ValidationError extends Error {
  public statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
