import Coupon from '../models/coupon.model.js';
import Product from '../models/product.model.js';

export default async function applyCoupon(code, {userId, address, products, subtotal}){
  if (!String(code || '').trim()) return {code: '', discount: 0, total: subtotal };

  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase(), isActive: true});
  if (!coupon) throw new Error('Invalid or inactive coupon code.');
  const regions = coupon.regions.map((value)=> value.toLowerCase());
  const customerRegions = [address.country, address.state].map((value) => String(value || '').toLowerCase());
  if (
    regions.length&& !regions.some ((region)=>customerRegions.includes(region))) {
      throw new Error('This coupon is not avalibale for your account.');
    }
  
  if(coupon.users.length && !coupon.users.some((id) => String(id) === String(userId))){
     throw new Error('This coupon is not avalibale for your account.');
  }

  if(coupon.categories.length && !products.every((product) =>
    coupon.categories.some((id) => String(id) === String(product.category)))){
      throw new Error('This coupon does not appply to every product .');
    }
   
    const discount = Math.round(subtotal * coupon.discountPercent)/ 100;
    return {
      code : coupon.code,
      discountPercent: coupon.discountPercent,
      discount,
      total:Math.max(0, subtotal - discount),
    };
}