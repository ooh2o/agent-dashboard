/**
 * Tests for content sanitization utilities
 */

import {
  escapeHtml,
  sanitizeUrl,
  sanitizeMessageContent,
  sanitizeObject,
} from '../sanitize';

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtml('a & b')).toBe('a &amp; b');
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeHtml("'quoted'")).toBe('&#x27;quoted&#x27;');
  });

  it('should handle empty and null input', () => {
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null as unknown as string)).toBe('');
    expect(escapeHtml(undefined as unknown as string)).toBe('');
  });

  it('should not modify safe content', () => {
    expect(escapeHtml('Hello world')).toBe('Hello world');
    expect(escapeHtml('Numbers: 123')).toBe('Numbers: 123');
  });

  it('should escape all dangerous characters', () => {
    const dangerous = '<>&"\'/`=';
    const escaped = escapeHtml(dangerous);
    // Verify the original dangerous chars are escaped
    expect(escaped.indexOf('<')).toBe(-1);
    expect(escaped.indexOf('>')).toBe(-1);
    // Check the expected output
    expect(escaped).toBe('&lt;&gt;&amp;&quot;&#x27;&#x2F;&#x60;&#x3D;');
  });
});

describe('sanitizeUrl', () => {
  it('should allow safe URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('http://localhost:3000')).toBe('http://localhost:3000');
    expect(sanitizeUrl('/relative/path')).toBe('/relative/path');
  });

  it('should block javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
    expect(sanitizeUrl('  javascript:alert(1)  ')).toBe('');
  });

  it('should block data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    expect(sanitizeUrl('DATA:text/html,test')).toBe('');
  });

  it('should block vbscript: URLs', () => {
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
    expect(sanitizeUrl('VBSCRIPT:test')).toBe('');
  });

  it('should handle empty and null input', () => {
    expect(sanitizeUrl('')).toBe('');
    expect(sanitizeUrl(null as unknown as string)).toBe('');
    expect(sanitizeUrl(undefined as unknown as string)).toBe('');
  });
});

describe('sanitizeMessageContent', () => {
  it('should escape HTML in message content', () => {
    const content = 'Check out <script>alert("xss")</script> this!';
    const sanitized = sanitizeMessageContent(content);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('&lt;script&gt;');
  });

  it('should preserve newlines and whitespace', () => {
    const content = 'Line 1\nLine 2\n\nLine 4';
    const sanitized = sanitizeMessageContent(content);
    expect(sanitized).toBe(content); // Newlines should be preserved
  });

  it('should handle emoji and unicode', () => {
    const content = 'Hello 👋 World! 日本語';
    expect(sanitizeMessageContent(content)).toBe(content);
  });

  it('should handle empty content', () => {
    expect(sanitizeMessageContent('')).toBe('');
    expect(sanitizeMessageContent(null as unknown as string)).toBe('');
  });
});

describe('sanitizeObject', () => {
  it('should sanitize string properties', () => {
    const obj = {
      content: '<script>alert("xss")</script>',
      message: 'Safe message',
      count: 42,
    };

    const sanitized = sanitizeObject(obj);
    expect(sanitized.content).toContain('&lt;script&gt;');
    expect(sanitized.message).toBe('Safe message');
    expect(sanitized.count).toBe(42);
  });

  it('should recursively sanitize nested objects', () => {
    const obj = {
      user: {
        name: '<b>John</b>',
        message: 'Hello & welcome', // 'message' is in default keys
      },
    };

    const sanitized = sanitizeObject(obj);
    expect(sanitized.user.name).toBe('&lt;b&gt;John&lt;&#x2F;b&gt;');
    expect(sanitized.user.message).toBe('Hello &amp; welcome');
  });

  it('should sanitize arrays', () => {
    const obj = {
      messages: [
        { content: '<script>1</script>' },
        { content: '<script>2</script>' },
      ],
    };

    const sanitized = sanitizeObject(obj);
    expect(sanitized.messages[0].content).toContain('&lt;script&gt;');
    expect(sanitized.messages[1].content).toContain('&lt;script&gt;');
  });

  it('should only sanitize specified keys', () => {
    const obj = {
      content: '<b>bold</b>',
      html: '<b>bold</b>', // Not in default keys
    };

    const sanitized = sanitizeObject(obj, ['content']);
    expect(sanitized.content).toBe('&lt;b&gt;bold&lt;&#x2F;b&gt;');
    expect(sanitized.html).toBe('<b>bold</b>'); // Not sanitized
  });

  it('should handle null and undefined', () => {
    expect(sanitizeObject(null as unknown as Record<string, unknown>)).toBeNull();
    expect(sanitizeObject(undefined as unknown as Record<string, unknown>)).toBeUndefined();
  });
});
