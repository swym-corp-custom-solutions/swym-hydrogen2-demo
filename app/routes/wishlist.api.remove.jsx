import { json, useLoaderData } from "@remix-run/react";
import { REG_ID, SESSION_ID } from "~/lib/swym/swymConstants";
import { CacheNone } from '@shopify/hydrogen';

export const loader = async ({ context }) => {
  
    const sessionId = context.session.get(SESSION_ID);
    const regId = context.session.get(REG_ID);
    
    if (!sessionId || !regId) {
        await context.swym.generateRegId();
    }
   
    const wishlist = await context.swym.fetchWishlist({cache:CacheNone()});
    return {wishlist};
};


export const action = async ({ request, context }) => {
  const formData = await request.formData();
  const productId = formData.get('productId');
  const variantId = formData.get('variantId');
  const productUrl = formData.get('productUrl');
  const listId = formData.get('listId');

  let data;
  try {
    data = await context.swym.removeFromWishlist(productId, variantId, productUrl, listId);
    return json({ data, success: true });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
};

