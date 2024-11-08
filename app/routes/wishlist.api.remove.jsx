import { json } from "@remix-run/react";


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

