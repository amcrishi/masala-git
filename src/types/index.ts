export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface IProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
  stock: number;
  category: string;
  image: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IOrderProduct {
  product: string | IProduct;
  quantity: number;
  price: number;
}

export interface IOrder {
  _id: string;
  user: string | IUser;
  products: IOrderProduct[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type UserRole = 'admin' | 'technician' | 'user';
