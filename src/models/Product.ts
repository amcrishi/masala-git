import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductDocument extends Document {
  name: string;
  description: string;
  price: number;
  mrp: number;
  stock: number;
  category: string;
  image: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    mrp: {
      type: Number,
      min: [0, 'MRP cannot be negative'],
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'whole-spices',
        'ground-spices',
        'blended-masala',
        'herbs',
        'seasoning',
        'organic',
        'premium',
        'combo-packs',
      ],
    },
    image: {
      type: String,
      default: '/images/default-product.jpg',
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 5,
        message: 'Maximum 5 images allowed',
      },
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ category: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

const Product: Model<IProductDocument> =
  mongoose.models.Product || mongoose.model<IProductDocument>('Product', ProductSchema);

export default Product;
