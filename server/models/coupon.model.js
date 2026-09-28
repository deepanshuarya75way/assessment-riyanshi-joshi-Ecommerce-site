import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code:{type: String, required: true, unique: true, uppercase: true, trim: true},
  discountPercent:{type:Number, required:true, min:1, max:99},
  regions: [{type: String, trim: true}],
  categories: [{type: mongoose.Schema.Types.ObjectId, ref:'Category'}],
  users: [{type: mongoose.Schema.Types.ObjectId, ref:'User'}],
  isActive:{type:Boolean, default:true},
}, {timestamps:true});

export default mongoose.model('Coupon', couponSchema);