describe('Basic Tests', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const message = 'Hello World';
    expect(message).toContain('Hello');
    expect(message.length).toBe(11);
  });

  it('should handle array operations', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers).toHaveLength(5);
    expect(numbers[0]).toBe(1);
    expect(numbers[4]).toBe(5);
  });

  it('should handle object operations', () => {
    const obj = { name: 'Test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj).toHaveProperty('value');
    expect(obj.name).toBe('Test');
    expect(obj.value).toBe(42);
  });
});
