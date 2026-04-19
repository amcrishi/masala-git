export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, message: 'Password is valid' };
}

export function validateProductData(data: {
  name?: string;
  price?: number;
  stock?: number;
  category?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Product name must be at least 2 characters');
  }
  if (data.price === undefined || data.price < 0) {
    errors.push('Price must be a positive number');
  }
  if (data.stock !== undefined && data.stock < 0) {
    errors.push('Stock cannot be negative');
  }
  if (!data.category || data.category.trim().length === 0) {
    errors.push('Category is required');
  }

  return { valid: errors.length === 0, errors };
}

export function validateOrderData(data: {
  products?: Array<{ product: string; quantity: number }>;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.products || data.products.length === 0) {
    errors.push('At least one product is required');
  }

  if (data.products) {
    data.products.forEach((item, index) => {
      if (!item.product) errors.push(`Product ID is required for item ${index + 1}`);
      if (!item.quantity || item.quantity < 1) errors.push(`Invalid quantity for item ${index + 1}`);
    });
  }

  if (!data.shippingAddress) {
    errors.push('Shipping address is required');
  } else {
    const addr = data.shippingAddress;
    if (!addr.street) errors.push('Street address is required');
    if (!addr.city) errors.push('City is required');
    if (!addr.state) errors.push('State is required');
    if (!addr.pincode || !/^\d{6}$/.test(addr.pincode)) errors.push('Valid 6-digit pincode is required');
    if (!addr.phone || !/^\d{10}$/.test(addr.phone)) errors.push('Valid 10-digit phone number is required');
  }

  return { valid: errors.length === 0, errors };
}
