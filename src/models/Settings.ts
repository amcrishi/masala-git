import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettingsDocument extends Document {
  key: string;
  value: unknown;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

const Settings: Model<ISettingsDocument> =
  mongoose.models.Settings || mongoose.model<ISettingsDocument>('Settings', SettingsSchema);

export default Settings;
