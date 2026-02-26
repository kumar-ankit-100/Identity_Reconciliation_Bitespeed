import { identifySchema } from '../src/modules/contact/contact.schema';

describe('identifySchema', () => {
  it('should accept valid email and phoneNumber', () => {
    const result = identifySchema.safeParse({
      email: 'test@example.com',
      phoneNumber: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('should accept email only', () => {
    const result = identifySchema.safeParse({
      email: 'test@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('should accept phoneNumber only', () => {
    const result = identifySchema.safeParse({
      phoneNumber: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('should accept numeric phoneNumber and convert to string', () => {
    const result = identifySchema.safeParse({
      phoneNumber: 123456,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phoneNumber).toBe('123456');
    }
  });

  it('should reject when both email and phoneNumber are null', () => {
    const result = identifySchema.safeParse({
      email: null,
      phoneNumber: null,
    });
    expect(result.success).toBe(false);
  });

  it('should reject when body is empty', () => {
    const result = identifySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject invalid email format', () => {
    const result = identifySchema.safeParse({
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('should normalize email to lowercase', () => {
    const result = identifySchema.safeParse({
      email: 'TEST@Example.COM',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('should trim whitespace from email', () => {
    const result = identifySchema.safeParse({
      email: '  test@example.com  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });
});
